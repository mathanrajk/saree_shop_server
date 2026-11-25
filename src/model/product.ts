import { Model, model, Schema } from "mongoose";
import { DressType, IDressTypes, ITags, Tags } from "#/util/tags_Product";

export interface IProductDocument {
  title: string;
  description: string;
  price: number;
  images?: { publicId: string; url: string };
  tag: Tags;
  offer: boolean;
  stock: number;
  dressType: DressType;
  newPrice?: number;
}

const productSchema = new Schema<IProductDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    dressType: {
      type: String,
      enum: IDressTypes,
      default: "saree",
    },
    images: {
      _id: false,
      publicId: { type: String },
      url: { type: String },
    },
    tag: {
      type: String,
      enum: ITags,
      default: "new",
    },
    offer: {
      type: Boolean,
      default: false,
    },
    newPrice: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

export const Product: Model<IProductDocument> = model<IProductDocument>(
  "Product",
  productSchema,
);
