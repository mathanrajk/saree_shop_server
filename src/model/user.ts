import { Schema, model, Types } from "mongoose";

export interface ICartItem {
  product: Types.ObjectId;
  quantity: number;
}

export interface UserDocument {
  firebaseUid: string;
  name: string;
  email: string;
  emailVerified: boolean;
  photoURL?: string | undefined;
  OrderIds: Types.ObjectId[];
  cart: ICartItem[];
  token?: string[];
}

const cartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, default: 1, min: 1 },
  },
  { _id: false }
);

const UserSchema = new Schema<UserDocument>(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    photoURL: {
      type: String,
    },
    OrderIds: {
      type: [Schema.Types.ObjectId],
      ref: "Order",
      default: [],
    },
    cart: {
      type: [cartItemSchema],
      default: [],
    },
    token: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export default model<UserDocument>("User", UserSchema);