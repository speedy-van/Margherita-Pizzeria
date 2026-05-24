import type { OrderMode } from "@/lib/orders/types";

export type DiscountType = "percentage" | "fixed";

export interface PublicDiscount {
  id: string;
  code: string;
  title: string;
  description: string | null;
  type: DiscountType;
  value: number;
  minOrderPence: number;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  appliesToDelivery: boolean;
  appliesToCollection: boolean;
}

export interface AdminDiscount extends PublicDiscount {
  createdAt: string;
  updatedAt: string;
}

export interface ApplyDiscountInput {
  code: string;
  subtotalPence: number;
  orderType: OrderMode;
  now?: Date;
}

export type ApplyDiscountResult =
  | {
      ok: true;
      discount: PublicDiscount;
      discountPence: number;
    }
  | {
      ok: false;
      code:
        | "NOT_FOUND"
        | "INACTIVE"
        | "EXPIRED"
        | "NOT_STARTED"
        | "MIN_ORDER"
        | "WRONG_ORDER_TYPE";
      message: string;
    };
