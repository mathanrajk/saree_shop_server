import { Schema, model, Types } from "mongoose";

export const ORDER_STATUS = [
  "pending",
  "notStarted",
  "inProgress",
  "completed",
] as const;
export type OrderStatus = (typeof ORDER_STATUS)[number];

export const DELIVERY_STATUS = [
  "waiting",
  "shipping",
  "delivered",
] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUS)[number];

export interface IOrderItem {
  product: Types.ObjectId;
  quantity: number;
}

export interface IOrderDocument {
  ownerId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  pinCode: string;
  payment: boolean;
  totalAmount: number;
  products: IOrderItem[];
  status: OrderStatus;
  delivery_status: DeliveryStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  phonepeOrderId?: string;
  phonepeTransactionId?: string;
  paymentGateway?: string;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrderDocument>(
  {
    ownerId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    pinCode: { type: String, required: true, trim: true },
    payment: { type: Boolean, default: false },
    totalAmount: { type: Number, required: true, min: 0 },
    products: { type: [orderItemSchema], required: true },
    status: {
      type: String,
      enum: ORDER_STATUS,
      default: "notStarted",
    },
    delivery_status: {
      type: String,
      enum: DELIVERY_STATUS,
      default: "waiting",
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    phonepeOrderId: { type: String },
    phonepeTransactionId: { type: String },
    paymentGateway: { type: String, default: "razorpay" },
  },
  { timestamps: true }
);

export const Order = model<IOrderDocument>("Order", orderSchema);
