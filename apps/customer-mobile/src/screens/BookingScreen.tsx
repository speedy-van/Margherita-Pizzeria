import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";

import { getJson, money, postJson, toAbsoluteUrl } from "../api";
import { Button, Card, Field, Icon } from "../components/ui";
import { isEmail, todayIso } from "../lib/customer-data";
import { useCustomerApp } from "../state/CustomerContext";
import { colors, radii, spacing, typography } from "../theme";
import type { BookingAvailability, BookingResponse } from "../types";

type BookingReceipt = {
  booking: BookingResponse;
  date: string;
  time: string;
  covers: number;
  email: string;
};

function readableDate(value: string, short = false): string {
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-GB", short
    ? { weekday: "short", day: "numeric", month: "short" }
    : { weekday: "long", day: "numeric", month: "long" });
}

function dateError(value: string): string | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "Use YYYY-MM-DD, for example 2026-11-01.";
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime()) || parsed.getFullYear() !== Number(value.slice(0, 4))
    || parsed.getMonth() + 1 !== Number(value.slice(5, 7)) || parsed.getDate() !== Number(value.slice(8, 10))) {
    return "Choose a valid calendar date.";
  }
  if (value < todayIso()) return "Choose today or a future date.";
  if (value > todayIso(90)) return "Choose a date within the next 90 days.";
  return undefined;
}

export function BookingScreen() {
  const { settings } = useCustomerApp();
  const [date, setDate] = useState(() => todayIso());
  const [covers, setCovers] = useState(2);
  const [timeSlot, setTimeSlot] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [payDeposit, setPayDeposit] = useState(false);
  const [availability, setAvailability] = useState<BookingAvailability | null>(null);
  const [loading, setLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [receipt, setReceipt] = useState<BookingReceipt | null>(null);
  const submitting = useRef(false);
  const upcomingDates = useMemo(() => Array.from({ length: 7 }, (_, index) => todayIso(index)), []);
  const invalidDate = dateError(date);
  const liveAvailability = availability?.date === date && availability.covers === covers ? availability : null;
  const slots = liveAvailability?.slots.filter((slot) => slot.active) ?? [];
  const selectedSlot = slots.find((slot) => slot.time === timeSlot && slot.available);
  const depositEnabled = liveAvailability?.depositEnabled === true && liveAvailability.depositAmountPence > 0;

  useEffect(() => {
    let current = true;
    const controller = new AbortController();
    setAvailability(null);
    setTimeSlot("");
    setAvailabilityError(null);
    if (invalidDate || receipt) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const timeout = setTimeout(() => {
      void getJson<BookingAvailability>(`/api/bookings/availability?date=${encodeURIComponent(date)}&covers=${covers}`, { signal: controller.signal })
        .then((result) => {
          if (current) setAvailability(result);
        })
        .catch((error: unknown) => {
          if (current) setAvailabilityError(error instanceof Error ? error.message : "We couldn't check tables. Please try again.");
        })
        .finally(() => { if (current) setLoading(false); });
    }, 250);
    return () => { current = false; clearTimeout(timeout); controller.abort(); };
  }, [date, covers, invalidDate, refresh, receipt]);

  const changeDate = (value: string) => {
    setDate(value);
    setTimeSlot("");
    setMessage(null);
  };

  const openPayment = async (checkoutUrl: string) => {
    const url = toAbsoluteUrl(checkoutUrl);
    if (!url || !/^https:\/\//i.test(url)) {
      setMessage("Your booking was saved, but its payment link is unavailable. Please call us with your reference.");
      return;
    }
    try {
      await Linking.openURL(url);
    } catch {
      setMessage("Your booking was saved. Tap Continue to payment to open the payment page again.");
    }
  };

  const submitBooking = async () => {
    if (submitting.current) return;
    const nextErrors: Record<string, string> = {};
    if (invalidDate) nextErrors.date = invalidDate;
    if (!selectedSlot || loading) nextErrors.time = "Choose an available time for your party.";
    if (name.trim().length < 2) nextErrors.name = "Enter your full name.";
    if (!isEmail(email)) nextErrors.email = "Enter a valid email address.";
    if (phone.replace(/\D/g, "").length < 7) nextErrors.phone = "Enter a valid phone number.";
    setErrors(nextErrors);
    setMessage(null);
    if (Object.keys(nextErrors).length) return;
    submitting.current = true;
    setBusy(true);
    try {
      const booking = await postJson<BookingResponse>("/api/bookings/create", {
        date,
        timeSlot,
        covers,
        customerName: name.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        payDeposit: depositEnabled && payDeposit,
      });
      setReceipt({ booking, date, time: timeSlot, covers, email: email.trim() });
      if (booking.checkoutUrl) await openPayment(booking.checkoutUrl);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Your booking could not be sent. Please try again.");
      setRefresh((value) => value + 1);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  if (receipt) {
    return (
      <View style={styles.screen}>
        <View style={styles.successHero}>
          <View style={styles.successMark}><Icon name="checkmark" size={32} /></View>
          <Text style={styles.eyebrow}>SEE YOU AT MARGHERITA</Text>
          <Text accessibilityRole="header" style={styles.title}>Your table request is in.</Text>
          <Text style={styles.body}>
            {receipt.booking.paymentRequired
              ? "Finish your deposit payment in the secure payment page. We'll email you once payment is confirmed."
              : `We've sent your booking details to ${receipt.email}. Keep your reference handy.`}
          </Text>
        </View>
        <Card>
          <Text style={styles.sectionTitle}>Booking details</Text>
          <View style={styles.detailRow}><Text style={styles.muted}>Reference</Text><Text selectable style={styles.value}>{receipt.booking.reference || receipt.booking.bookingId}</Text></View>
          <View style={styles.detailRow}><Text style={styles.muted}>Date</Text><Text style={styles.value}>{readableDate(receipt.date, true)}</Text></View>
          <View style={styles.detailRow}><Text style={styles.muted}>Time</Text><Text style={styles.value}>{receipt.time}</Text></View>
          <View style={styles.detailRow}><Text style={styles.muted}>Guests</Text><Text style={styles.value}>{receipt.covers} {receipt.covers === 1 ? "guest" : "guests"}</Text></View>
          <View style={styles.divider} />
          <Text style={styles.body}>{settings.restaurant.address}</Text>
        </Card>
        {message ? <Text accessibilityLiveRegion="polite" style={styles.errorText}>{message}</Text> : null}
        {receipt.booking.paymentRequired && receipt.booking.checkoutUrl ? (
          <Button label="Continue to payment" onPress={() => { void openPayment(receipt.booking.checkoutUrl!); }} />
        ) : null}
        <Button label="Call the restaurant" icon="call-outline" variant="secondary" onPress={() => {
          void Linking.openURL(`tel:${settings.restaurant.phoneTel}`).catch(() => setMessage(`Please call ${settings.restaurant.phone}.`));
        }} />
        <Button label="Make another booking" variant="ghost" onPress={() => {
          setReceipt(null); setMessage(null); setErrors({}); setTimeSlot(""); setRefresh((value) => value + 1);
        }} />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>A SEAT AT OUR TABLE</Text>
        <Text accessibilityRole="header" style={styles.title}>Good pizza.{"\n"}Better company.</Text>
        <Text style={styles.body}>Book your spot at Alexandra Parade. Fresh sourdough, straight from the stone oven.</Text>
        <View style={styles.heroPill}><Icon name="restaurant-outline" size={14} /><Text style={styles.pillText}>{settings.restaurant.tablesCount} cosy tables · Dennistoun</Text></View>
      </View>

      <Card>
        <View style={styles.sectionHeader}><Text style={styles.step}>01</Text><Text style={styles.sectionTitle}>When are you joining us?</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRail}>
          {upcomingDates.map((value, index) => {
            const selected = date === value;
            const parsed = new Date(`${value}T12:00:00`);
            return (
              <Pressable key={value} accessibilityRole="button" accessibilityLabel={readableDate(value)}
                accessibilityState={{ selected, disabled: busy }} disabled={busy} onPress={() => changeDate(value)}
                style={({ pressed }) => [styles.dateChip, selected && styles.chipSelected, pressed && styles.pressed]}>
                <Text style={styles.dateWeekday}>{index === 0 ? "Today" : parsed.toLocaleDateString("en-GB", { weekday: "short" })}</Text>
                <Text style={styles.dateNumber}>{parsed.getDate()}</Text>
                <Text style={styles.dateMonth}>{parsed.toLocaleDateString("en-GB", { month: "short" })}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        <Field label="Or choose another date" value={date} onChangeText={changeDate} placeholder="YYYY-MM-DD"
          autoCapitalize="none" keyboardType="numbers-and-punctuation" maxLength={10} editable={!busy}
          error={date.length === 10 ? invalidDate : errors.date} />
        <View style={styles.guestsRow}>
          <View style={styles.flex}><Text style={styles.label}>Party size</Text><Text style={styles.muted}>Up to 12 guests</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Remove one guest" accessibilityState={{ disabled: covers <= 1 || busy }}
            disabled={covers <= 1 || busy} onPress={() => { setCovers((value) => value - 1); setTimeSlot(""); }}
            style={({ pressed }) => [styles.stepperButton, (covers <= 1 || busy) && styles.disabled, pressed && styles.pressed]}>
            <Icon name="remove" size={20} />
          </Pressable>
          <Text accessibilityLiveRegion="polite" style={styles.guestCount}>{covers}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Add one guest" accessibilityState={{ disabled: covers >= 12 || busy }}
            disabled={covers >= 12 || busy} onPress={() => { setCovers((value) => value + 1); setTimeSlot(""); }}
            style={({ pressed }) => [styles.stepperButton, (covers >= 12 || busy) && styles.disabled, pressed && styles.pressed]}>
            <Icon name="add" size={20} />
          </Pressable>
        </View>
        <View style={styles.divider} />
        <Text style={styles.label}>Available times</Text>
        {loading ? (
          <View accessibilityLiveRegion="polite" style={styles.loadingRow}><ActivityIndicator color={colors.text} /><Text style={styles.muted}>Checking tables…</Text></View>
        ) : availabilityError ? (
          <View style={styles.feedback}><Text accessibilityLiveRegion="polite" style={styles.errorText}>{availabilityError}</Text><Button label="Try again" variant="secondary" onPress={() => setRefresh((value) => value + 1)} /></View>
        ) : invalidDate ? (
          <Text style={styles.muted}>Choose a valid date to see available tables.</Text>
        ) : slots.length && slots.some((slot) => slot.available) ? (
          <View style={styles.slots}>
            {slots.map((slot) => (
              <Pressable key={slot.time} accessibilityRole="button" accessibilityLabel={`${slot.time}${slot.available ? " available" : " fully booked"}`}
                accessibilityState={{ selected: timeSlot === slot.time, disabled: !slot.available || busy }} disabled={!slot.available || busy}
                onPress={() => { setTimeSlot(slot.time); setErrors((value) => ({ ...value, time: "" })); }}
                style={({ pressed }) => [styles.timeChip, timeSlot === slot.time && styles.chipSelected, !slot.available && styles.disabled, pressed && styles.pressed]}>
                <Text style={styles.timeText}>{slot.time}</Text>
                <Text style={styles.timeHint}>{slot.available ? "Available" : "Full"}</Text>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptySlots}><Text style={styles.label}>No tables for this time</Text><Text style={styles.muted}>Try a different date or party size, or call us and we’ll help.</Text></View>
        )}
        {errors.time ? <Text accessibilityLiveRegion="polite" style={styles.errorText}>{errors.time}</Text> : null}
      </Card>

      <Card>
        <View style={styles.sectionHeader}><Text style={styles.step}>02</Text><Text style={styles.sectionTitle}>Your details</Text></View>
        <Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" autoComplete="name" textContentType="name" maxLength={160} editable={!busy} error={errors.name} />
        <Field label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" maxLength={255} editable={!busy} error={errors.email} />
        <Field label="Phone number" value={phone} onChangeText={setPhone} placeholder="Your mobile number" keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" maxLength={40} editable={!busy} error={errors.phone} />
        <Text style={styles.small}>We’ll use these details to send your confirmation and contact you about your booking.</Text>
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Your visit</Text>
        <Text style={styles.visitDate}>{readableDate(date)}</Text>
        <Text style={styles.body}>{covers} {covers === 1 ? "guest" : "guests"}{selectedSlot ? ` · ${timeSlot}` : " · Choose a time above"}</Text>
        {depositEnabled ? (
          <View style={styles.depositRow}>
            <View style={styles.flex}><Text style={styles.label}>Pay {money(liveAvailability.depositAmountPence)} deposit</Text><Text style={styles.small}>Optional. Secure payment opens after you send your request.</Text></View>
            <Switch accessibilityLabel={`Pay ${money(liveAvailability.depositAmountPence)} deposit now`} value={payDeposit} onValueChange={setPayDeposit} disabled={busy} trackColor={{ false: colors.border, true: colors.primary }} thumbColor={colors.white} />
          </View>
        ) : liveAvailability ? <Text style={styles.small}>No deposit required.</Text> : null}
        {message ? <Text accessibilityLiveRegion="polite" style={styles.errorText}>{message}</Text> : null}
        <Button label={depositEnabled && payDeposit ? `Pay ${money(liveAvailability.depositAmountPence)} & request table` : "Request a table"}
          onPress={() => { void submitBooking(); }} disabled={busy || loading || !selectedSlot} loading={busy} />
        <Text style={styles.small}>Availability is checked again when you send your request.</Text>
      </Card>
      <Text style={styles.footer}>{settings.restaurant.address}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { gap: spacing.xl },
  hero: { backgroundColor: colors.surfaceMuted, borderRadius: radii.lg, padding: spacing.xl, gap: spacing.md },
  successHero: { alignItems: "center", paddingVertical: spacing.xl, gap: spacing.md },
  successMark: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
  eyebrow: { color: colors.textMuted, fontFamily: typography.semibold, fontSize: 10, letterSpacing: 1.8 },
  title: { color: colors.text, fontFamily: typography.heading, fontSize: 33, lineHeight: 40 },
  body: { color: colors.text, fontFamily: typography.body, fontSize: 14, lineHeight: 22 },
  heroPill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: spacing.sm, borderRadius: radii.pill, backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.xs },
  pillText: { color: colors.text, fontFamily: typography.medium, fontSize: 11 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  sectionTitle: { color: colors.text, fontFamily: typography.semibold, fontSize: 17, flexShrink: 1 },
  step: { color: colors.textMuted, fontFamily: typography.medium, fontSize: 11, letterSpacing: 1 },
  dateRail: { gap: spacing.sm, paddingVertical: spacing.xs },
  dateChip: { alignItems: "center", minWidth: 65, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, borderRadius: radii.md, borderColor: colors.border, borderWidth: 1, backgroundColor: colors.surface },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  dateWeekday: { color: colors.text, fontFamily: typography.medium, fontSize: 11 },
  dateNumber: { color: colors.text, fontFamily: typography.semibold, fontSize: 22, marginVertical: spacing.xs },
  dateMonth: { color: colors.textMuted, fontFamily: typography.body, fontSize: 11 },
  guestsRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xs },
  flex: { flex: 1, gap: spacing.xs },
  label: { color: colors.text, fontFamily: typography.semibold, fontSize: 13 },
  muted: { color: colors.textMuted, fontFamily: typography.body, fontSize: 13, lineHeight: 20 },
  stepperButton: { alignItems: "center", justifyContent: "center", width: 44, height: 44, backgroundColor: colors.surfaceMuted, borderRadius: radii.pill },
  guestCount: { minWidth: 24, textAlign: "center", color: colors.text, fontFamily: typography.semibold, fontSize: 16 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  loadingRow: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: spacing.md },
  slots: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  timeChip: { minWidth: 85, flexGrow: 1, alignItems: "center", justifyContent: "center", gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radii.sm, backgroundColor: colors.surface },
  timeText: { color: colors.text, fontFamily: typography.semibold, fontSize: 15 },
  timeHint: { color: colors.textMuted, fontFamily: typography.body, fontSize: 10 },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.7 },
  feedback: { gap: spacing.md },
  errorText: { color: colors.danger, fontFamily: typography.medium, fontSize: 13, lineHeight: 20 },
  emptySlots: { padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.surfaceMuted, borderRadius: radii.sm },
  small: { color: colors.textMuted, fontFamily: typography.body, fontSize: 11, lineHeight: 18 },
  visitDate: { color: colors.text, fontFamily: typography.heading, fontSize: 23 },
  depositRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.lg, marginTop: spacing.xs },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.lg },
  value: { color: colors.text, fontFamily: typography.semibold, fontSize: 13, textAlign: "right", flexShrink: 1, maxWidth: "70%" },
  footer: { color: colors.textMuted, fontFamily: typography.body, fontSize: 11, lineHeight: 18, textAlign: "center", paddingHorizontal: spacing.lg },
});
