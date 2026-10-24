import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { getJson, money, postJson, toAbsoluteUrl } from "../api";
import { Button, Card, EmptyState, Field, Icon, ScreenHeader } from "../components/ui";
import { isEmail, orderAttemptKey } from "../lib/customer-data";
import { useCustomerApp } from "../state/CustomerContext";
import { colors, radii, spacing, typography } from "../theme";
import type { AddressValidation, CollectionSlotsResponse, CreateOrderResponse, DiscountResult, OrderMode, PaymentMethod, PublicOrder } from "../types";
import { ErrorMessage, PriceRow, PromotionCard, ShopNotice, deliveryEstimate, isActivePromotion, screenStyles } from "./ScreenParts";
import { cartFingerprint, clearPendingCheckout, createPendingCheckout, isClosedCheckout, isPaidCheckout, loadPendingCheckout, savePendingCheckout, type PendingCheckout } from "./pending-checkout";

export function CheckoutScreen() {
  const { cart, settings, subtotalPence, navigate, clearCart, rememberOrder } = useCustomerApp();
  const [mode, setMode] = useState<OrderMode>("delivery");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("stripe_card");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [validatedAddress, setValidatedAddress] = useState<AddressValidation | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [checkingAddress, setCheckingAddress] = useState(false);
  const [collectionTime, setCollectionTime] = useState("asap");
  const [collectionSlots, setCollectionSlots] = useState<CollectionSlotsResponse["slots"]>([]);
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<{ value: DiscountResult; context: string; expiresAt?: string | null } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCode, setApplyingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<CreateOrderResponse | null>(null);
  const [openingPayment, setOpeningPayment] = useState(false);
  const [pendingCheckout, setPendingCheckout] = useState<PendingCheckout | null>(null);
  const [checkpointLoading, setCheckpointLoading] = useState(true);
  const [checkpointError, setCheckpointError] = useState(false);
  const addressRequestRef = useRef(0);
  const couponRequestRef = useRef(0);
  const submitLockRef = useRef(false);
  const attemptKeyRef = useRef<string | null>(null);
  const mountedRef = useRef(true);
  const cartRef = useRef(cart);
  const verifyingPaymentRef = useRef(false);
  const cartItems = useMemo(() => cart.map((line) => ({ menuItemId: line.item.id, quantity: line.quantity })), [cart]);
  const cartContext = useMemo(() => JSON.stringify({ mode, items: cart.map((line) => [line.item.id, line.quantity, line.item.pricePence]) }), [cart, mode]);
  const activeCartContextRef = useRef(cartContext);
  const activeCoupon = coupon?.context === cartContext && (!coupon.expiresAt || Date.parse(coupon.expiresAt) > Date.now()) && (coupon.value.code !== "PIZZA15" || !settings.pizzaPromotion || isActivePromotion(settings.pizzaPromotion)) ? coupon.value : null;
  const deliveryFee = mode === "delivery" ? deliveryEstimate(settings, validatedAddress?.withinRadius ? validatedAddress.milesFromRestaurant : undefined) : 0;
  const discountPence = Math.min(subtotalPence, Math.max(0, activeCoupon?.discountPence || 0));
  const total = subtotalPence + deliveryFee - discountPence;
  const orderingOpen = settings.shopStatus.isOpen && settings.ordering.acceptingOnlineOrders && (mode === "delivery" ? settings.ordering.deliveryOpen : settings.ordering.collectionOpen);
  const belowMinimum = mode === "delivery" && subtotalPence < settings.ordering.minDeliveryOrderPence;
  const contactValid = name.trim().length >= 2 && isEmail(email) && phone.replace(/\D/g, "").length >= 7;
  const ready = Boolean(cart.length && orderingOpen && contactValid && !belowMinimum && (mode === "collection" ? collectionTime : validatedAddress?.withinRadius));

  useEffect(() => { cartRef.current = cart; }, [cart]);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const verifySavedPayment = useCallback(async (pending: PendingCheckout, reportPending = false) => {
    if (verifyingPaymentRef.current) return;
    verifyingPaymentRef.current = true;
    try {
      const order = await getJson<PublicOrder>(`/api/orders/${encodeURIComponent(pending.orderId)}`);
      if (!mountedRef.current) return;
      const paid = isPaidCheckout(pending, order);
      const closed = isClosedCheckout(pending, order);
      if (!paid && !closed) {
        if (reportPending) setError("Payment is still pending. Continue with the existing secure link. If the link has expired, please call us with your order reference so we can resolve it safely.");
        return;
      }
      const removed = await clearPendingCheckout(pending.orderId, AsyncStorage);
      if (!mountedRef.current || !removed) return;
      if (paid && cartFingerprint(cartRef.current) === pending.cartFingerprint) clearCart();
      setPendingCheckout(null);
      setCreatedOrder(null);
      rememberOrder(order.id);
      if (paid) navigate("track");
      else setError("Your previous order is closed. Your bag is still here and you can start a fresh checkout.");
    } catch {
      if (mountedRef.current) setError("We couldn't check the latest payment status. Your existing payment link is saved below; please use it instead of placing another order.");
    } finally { verifyingPaymentRef.current = false; }
  }, [clearCart, navigate, rememberOrder]);

  const restoreSavedCheckout = useCallback(async () => {
    setCheckpointLoading(true);
    setCheckpointError(false);
    try {
      const pending = await loadPendingCheckout(AsyncStorage);
      if (!mountedRef.current) return;
      if (pending) {
        setPendingCheckout(pending);
        setCreatedOrder({ orderId: pending.orderId, reference: pending.reference, checkoutUrl: pending.checkoutUrl, paymentRequired: true });
        rememberOrder(pending.orderId);
        await verifySavedPayment(pending);
      }
    } catch {
      if (mountedRef.current) { setCheckpointError(true); setError("We couldn't check your saved payment. Please try again before starting a new order."); }
    } finally { if (mountedRef.current) setCheckpointLoading(false); }
  }, [rememberOrder, verifySavedPayment]);

  useEffect(() => { void restoreSavedCheckout(); }, [restoreSavedCheckout]);
  useEffect(() => {
    if (!pendingCheckout || checkpointLoading) return;
    const check = () => { if (AppState.currentState === "active" || AppState.currentState == null) void verifySavedPayment(pendingCheckout); };
    const subscription = AppState.addEventListener("change", (state) => { if (state === "active") check(); });
    const timer = setInterval(check, 20_000);
    return () => { subscription.remove(); clearInterval(timer); };
  }, [pendingCheckout, checkpointLoading, verifySavedPayment]);

  useEffect(() => {
    let cancelled = false;
    void getJson<CollectionSlotsResponse>("/api/customer/collection-slots").then((data) => { if (!cancelled) setCollectionSlots(data.slots || []); }).catch(() => { /* ASAP remains a valid collection option. */ });
    return () => { cancelled = true; addressRequestRef.current += 1; couponRequestRef.current += 1; };
  }, []);

  useEffect(() => {
    activeCartContextRef.current = cartContext;
    couponRequestRef.current += 1;
    setApplyingCode(false);
    setCouponError(null);
  }, [cartContext]);

  const orderFingerprint = JSON.stringify({ cartContext, name, email, phone, address: validatedAddress?.address, mode, paymentMethod, collectionTime, discount: activeCoupon?.code });
  useEffect(() => { attemptKeyRef.current = null; }, [orderFingerprint]);

  async function checkAddress() {
    if (checkingAddress || submitting) return;
    if (address.trim().length < 5) { setAddressError("Add your house number, street and postcode first."); return; }
    const request = ++addressRequestRef.current;
    setCheckingAddress(true);
    setAddressError(null);
    try {
      const result = await postJson<AddressValidation>("/api/validate-address", { address: address.trim() });
      if (request !== addressRequestRef.current) return;
      setValidatedAddress(result);
      setAddress(result.address);
      if (!result.withinRadius) setAddressError(result.message);
    } catch (cause) {
      if (request !== addressRequestRef.current) return;
      setValidatedAddress(null);
      setAddressError(cause instanceof Error ? cause.message : "We couldn't check that address. Please try again.");
    } finally { if (request === addressRequestRef.current) setCheckingAddress(false); }
  }

  async function applyCode(requestedCode = code) {
    if (applyingCode || submitting) return;
    const normalised = requestedCode.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,40}$/.test(normalised)) { setCouponError("Enter a valid discount code."); return; }
    const context = cartContext;
    const request = ++couponRequestRef.current;
    setApplyingCode(true);
    setCouponError(null);
    setCode(normalised);
    try {
      const result = await postJson<DiscountResult>("/api/discounts/apply", { code: normalised, orderType: mode, subtotalPence, cartItems });
      if (request !== couponRequestRef.current || context !== activeCartContextRef.current) return;
      setCoupon({ value: result, context, expiresAt: result.code === settings.pizzaPromotion?.code ? settings.pizzaPromotion.endsAt : null });
    } catch (cause) {
      if (request !== couponRequestRef.current || context !== activeCartContextRef.current) return;
      setCoupon(null);
      setCouponError(cause instanceof Error ? cause.message : "We couldn't apply this code.");
    } finally { if (request === couponRequestRef.current) setApplyingCode(false); }
  }

  async function openPayment(order: CreateOrderResponse) {
    setOpeningPayment(true);
    setError(null);
    try {
      const pending = pendingCheckout?.orderId === order.orderId ? pendingCheckout : createPendingCheckout(order, cart);
      setPendingCheckout(pending);
      // Save before opening Stripe so tab changes and app restarts resume the
      // same payment instead of creating a second order.
      await savePendingCheckout(pending, AsyncStorage);
      const paymentUrl = toAbsoluteUrl(pending.checkoutUrl);
      if (!paymentUrl || !/^https:\/\//i.test(paymentUrl)) throw new Error("The payment link is unavailable.");
      await Linking.openURL(paymentUrl);
    } catch (cause) { setError(cause instanceof Error ? `${cause.message} Your existing order is kept here. Try the same payment link again below.` : "We couldn't open your payment page. Try the same payment link again below."); }
    finally { setOpeningPayment(false); }
  }

  async function submitOrder() {
    if (submitLockRef.current || submitting || createdOrder || checkpointLoading || checkpointError || pendingCheckout) return;
    setError(null);
    if (!ready) { setError(!orderingOpen ? settings.shopStatus.message || "Online ordering is paused right now." : belowMinimum ? `Minimum delivery order is ${money(settings.ordering.minDeliveryOrderPence)}.` : !contactValid ? "Add your name, valid email and phone number." : "Check your delivery address before continuing."); return; }
    submitLockRef.current = true;
    setSubmitting(true);
    const idempotencyKey = attemptKeyRef.current || orderAttemptKey();
    attemptKeyRef.current = idempotencyKey;
    try {
      const order = await postJson<CreateOrderResponse>("/api/orders/create", {
        idempotencyKey,
        type: mode,
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        paymentMethod,
        cartItems,
        ...(mode === "delivery" && validatedAddress ? { deliveryAddress: validatedAddress.address, deliveryLat: validatedAddress.lat, deliveryLng: validatedAddress.lng } : { collectionTime }),
        ...(activeCoupon ? { discountCode: activeCoupon.code } : {}),
      });
      rememberOrder(order.orderId);
      setCreatedOrder(order);
      if (order.paymentRequired) await openPayment(order);
      else { clearCart(); navigate("track"); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "We couldn't place your order. Please try again."); }
    finally { submitLockRef.current = false; setSubmitting(false); }
  }

  if (checkpointLoading || checkpointError) return <View style={screenStyles.screen}><ScreenHeader eyebrow="YOUR CHECKOUT" title={checkpointLoading ? "Just checking your bag…" : "Let's check your saved payment."} description="Checking for an existing payment keeps your order safe when you return." /><Card style={screenStyles.card}><ErrorMessage message={error} /><Button label={checkpointLoading ? "Checking saved checkout" : "Try again"} loading={checkpointLoading} onPress={() => void restoreSavedCheckout()} /><Button label="Back to your bag" variant="ghost" onPress={() => navigate("cart")} /></Card></View>;
  if (createdOrder?.paymentRequired) return <View style={screenStyles.screen}><ScreenHeader eyebrow="ONE LAST STEP" title="Your pizza is nearly on its way." description={`Order ${createdOrder.reference || ""} is waiting for payment.`} /><Card style={screenStyles.card}><Icon name="card-outline" size={36} color={colors.text} /><Text style={screenStyles.body}>Complete your secure card payment in the payment page. Your bag is saved while you finish.</Text><ErrorMessage message={error} /><Button label="Open secure payment" icon="open-outline" onPress={() => void openPayment(createdOrder)} loading={openingPayment} /><Button label="Check payment status" variant="secondary" onPress={() => { if (pendingCheckout) void verifySavedPayment(pendingCheckout, true); }} /><Button label="Track this order" variant="ghost" onPress={() => navigate("track")} /><Button label="Need a hand? Call us" variant="ghost" icon="call-outline" onPress={() => void Linking.openURL(`tel:${settings.restaurant.phoneTel}`).catch(() => setError(`Please call ${settings.restaurant.phone}.`))} /></Card></View>;
  if (!cart.length) return <EmptyState icon="bag-outline" title="Something delicious first?" message="Add your favourites from the menu, then come back to checkout." actionLabel="Explore the menu" onAction={() => navigate("menu")} />;

  return (
    <View style={screenStyles.screen}>
      <ScreenHeader eyebrow="FRESH FOOD, A FEW TAPS AWAY" title="Let's make it yours." description="Choose how to get your order. We'll take care of the cooking." />
      <ShopNotice settings={settings} />
      <Card style={screenStyles.card}>
        <Text style={styles.stepTitle}>01  Delivery or collection</Text>
        <View style={styles.segments}>{([{ value: "delivery" as const, label: "Delivery", icon: "bicycle-outline" as const }, { value: "collection" as const, label: "Collection", icon: "bag-handle-outline" as const }]).map((option) => <Pressable key={option.value} accessibilityRole="button" accessibilityState={{ selected: mode === option.value, disabled: submitting }} disabled={submitting} onPress={() => setMode(option.value)} style={[styles.segment, mode === option.value && styles.segmentActive]}><Icon name={option.icon} size={21} color={colors.text} /><Text style={styles.segmentLabel}>{option.label}</Text><Text style={styles.segmentCaption}>{option.value === "collection" ? "Pick up for free" : `Within ${settings.ordering.deliveryRadiusMiles} miles`}</Text></Pressable>)}</View>
        {mode === "delivery" ? <>
          <Field label="Delivery address" placeholder="House number, street and postcode" value={address} multiline autoComplete="street-address" editable={!submitting} onChangeText={(value) => { addressRequestRef.current += 1; setCheckingAddress(false); setAddress(value); setValidatedAddress(null); setAddressError(null); }} />
          <Button label={validatedAddress?.withinRadius ? "Check address again" : "Check delivery address"} icon="location-outline" variant="secondary" onPress={() => void checkAddress()} loading={checkingAddress} disabled={submitting} />
          {validatedAddress?.withinRadius ? <View style={styles.addressSuccess}><Icon name="checkmark-circle" size={19} color={colors.success} /><Text style={styles.successText}>We deliver here · {money(deliveryFee)} delivery</Text></View> : null}
          <ErrorMessage message={addressError} />
          {belowMinimum ? <Text style={styles.helper}>Delivery orders start at {money(settings.ordering.minDeliveryOrderPence)} before delivery and discount. Add {money(settings.ordering.minDeliveryOrderPence - subtotalPence)} more or choose free collection.</Text> : null}
        </> : <>
          <View style={styles.collectionAddress}><Icon name="location-outline" size={21} color={colors.text} /><Text style={styles.helper}>{settings.restaurant.address}</Text></View>
          <Text style={styles.fieldLabel}>When would you like it?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeSlots}>{[{ id: "asap", time: "asap" }, ...collectionSlots.filter((slot) => slot.time !== "asap")].map((slot) => <Pressable key={slot.id} accessibilityRole="button" accessibilityState={{ selected: collectionTime === slot.time }} disabled={submitting} onPress={() => setCollectionTime(slot.time)} style={[styles.timeSlot, collectionTime === slot.time && styles.timeSlotActive]}><Text style={styles.timeText}>{slot.time === "asap" ? "As soon as possible" : slot.time}</Text></Pressable>)}</ScrollView>
          <Text style={styles.helper}>Usually ready in around {settings.ordering.prepTimeMinutes} minutes. We&apos;ll confirm after accepting your order.</Text>
        </>}
      </Card>
      <Card style={screenStyles.card}>
        <Text style={styles.stepTitle}>02  Your details</Text>
        <Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" autoComplete="name" editable={!submitting} />
        <Field label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" autoComplete="email" editable={!submitting} />
        <Field label="Phone number" value={phone} onChangeText={setPhone} placeholder="Your mobile number" keyboardType="phone-pad" autoComplete="tel" editable={!submitting} />
        <Text style={styles.helper}>For your order confirmation and updates from our team.</Text>
      </Card>
      <Card style={screenStyles.card}>
        <Text style={styles.stepTitle}>03  Payment</Text>
        <View style={styles.paymentOptions}>{([{ value: "stripe_card" as const, label: "Pay by card", caption: "Secure online payment", icon: "card-outline" as const }, { value: "cash_on_delivery" as const, label: "Pay cash", caption: mode === "delivery" ? "When your order arrives" : "When you collect", icon: "cash-outline" as const }]).map((option) => <Pressable key={option.value} accessibilityRole="radio" accessibilityState={{ checked: paymentMethod === option.value, disabled: submitting }} disabled={submitting} onPress={() => setPaymentMethod(option.value)} style={[styles.paymentOption, paymentMethod === option.value && styles.paymentActive]}><Icon name={option.icon} size={24} color={colors.text} /><View style={{ flex: 1, gap: 4 }}><Text style={styles.fieldLabel}>{option.label}</Text><Text style={styles.helper}>{option.caption}</Text></View><Icon name={paymentMethod === option.value ? "radio-button-on" : "radio-button-off"} size={22} color={colors.text} /></Pressable>)}</View>
      </Card>
      {activeCoupon ? <Card style={styles.appliedCoupon}><View style={screenStyles.row}><Icon name="checkmark-circle" size={23} color={colors.success} /><View style={{ flex: 1 }}><Text style={screenStyles.strong}>{activeCoupon.code} applied</Text><Text style={screenStyles.small}>You&apos;re saving {money(discountPence)} on this order.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Remove discount code" disabled={submitting} onPress={() => setCoupon(null)} hitSlop={10}><Icon name="close" size={21} color={colors.textMuted} /></Pressable></View></Card> : <View style={{ gap: spacing.md }}>
        <PromotionCard promotion={settings.pizzaPromotion} actionLabel={`Apply ${settings.pizzaPromotion?.code || "PIZZA15"}`} onPress={() => void applyCode(settings.pizzaPromotion?.code || "PIZZA15")} loading={applyingCode} disabled={submitting} />
        <View style={styles.couponRow}><View style={{ flex: 1 }}><Field label="Discount code" value={code} onChangeText={(value) => { setCode(value); setCouponError(null); }} placeholder="Enter your code" autoCapitalize="characters" autoCorrect={false} maxLength={40} editable={!submitting && !applyingCode} onSubmitEditing={() => void applyCode()} /></View><Button label="Apply" variant="secondary" onPress={() => void applyCode()} loading={applyingCode} disabled={submitting || !code.trim()} /></View>
        {coupon && coupon.context !== cartContext ? <Text style={styles.helper}>Your order changed. Apply the code again to update your saving.</Text> : null}
        <ErrorMessage message={couponError} />
      </View>}
      <Card style={screenStyles.card}><Text style={styles.stepTitle}>Your order total</Text><PriceRow label={`${cart.reduce((count, line) => count + line.quantity, 0)} items`} amount={money(subtotalPence)} /><PriceRow label={mode === "delivery" ? validatedAddress?.withinRadius ? "Delivery" : "Delivery estimate" : "Collection"} amount={mode === "delivery" ? money(deliveryFee) : "Free"} />{discountPence ? <PriceRow label={`Discount (${activeCoupon?.code})`} amount={`−${money(discountPence)}`} saving /> : null}<PriceRow label="Total" amount={money(total)} total /><Text style={styles.helper}>Your total is checked again before your order is placed.</Text></Card>
      <ErrorMessage message={error} />
      {!ready && !submitting ? <Text style={styles.helper}>{!orderingOpen ? "Online checkout is paused right now. You can keep preparing your bag." : belowMinimum ? `Add more items for delivery or choose free collection.` : !contactValid ? "Complete your contact details to continue." : "Check your delivery address to continue."}</Text> : null}
      <Button label={paymentMethod === "stripe_card" ? `Pay ${money(total)} by card` : `Place order · ${money(total)}`} icon={paymentMethod === "stripe_card" ? "lock-closed-outline" : "checkmark"} loading={submitting} disabled={!ready || applyingCode || checkingAddress} onPress={() => void submitOrder()} />
      <Button label="Back to your bag" variant="ghost" onPress={() => navigate("cart")} disabled={submitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  stepTitle: { color: colors.text, fontFamily: typography.semibold, fontSize: 17, lineHeight: 24 },
  segments: { flexDirection: "row", gap: spacing.sm },
  segment: { flex: 1, minHeight: 108, justifyContent: "center", alignItems: "center", gap: 7, padding: spacing.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md },
  segmentActive: { backgroundColor: colors.surfaceMuted, borderColor: colors.primary, borderWidth: 2, padding: spacing.md - 1 },
  segmentLabel: { color: colors.text, fontFamily: typography.semibold, fontSize: 15 },
  segmentCaption: { color: colors.textMuted, fontFamily: typography.body, fontSize: 10 },
  fieldLabel: { color: colors.text, fontFamily: typography.semibold, fontSize: 14 },
  helper: { color: colors.textMuted, fontFamily: typography.body, fontSize: 12, lineHeight: 19, flexShrink: 1 },
  addressSuccess: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  successText: { color: colors.success, fontFamily: typography.medium, fontSize: 12 },
  collectionAddress: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  timeSlots: { flexDirection: "row", gap: spacing.sm },
  timeSlot: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingHorizontal: spacing.lg, minHeight: 44, justifyContent: "center" },
  timeSlotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  timeText: { color: colors.text, fontFamily: typography.medium, fontSize: 12 },
  paymentOptions: { gap: spacing.sm },
  paymentOption: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.lg },
  paymentActive: { backgroundColor: colors.surfaceMuted, borderColor: colors.primary },
  couponRow: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm },
  appliedCoupon: { backgroundColor: colors.surfaceMuted, borderColor: colors.primary },
});
