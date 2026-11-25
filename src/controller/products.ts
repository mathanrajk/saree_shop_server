import cloudinary from "#/cloudinary";
import { Product } from "#/model/product";
import user from "#/model/user";
import { errorHandle, ErrorType } from "#/util/errorHandling";
import { RequestHandler } from "express";
import mongoose from "mongoose";
export const create_Product: RequestHandler = async (req, res) => {
  try {
    const { title, description, price, tag, offer, newPrice, stock, dressType, images } = req.body;
    const product = new Product({
      title,
      description,
      price: Number(price),
      tag,
      offer: offer === true || offer === "true",
      newPrice: newPrice !== undefined && newPrice !== "" ? Number(newPrice) : 0,
      stock: stock !== undefined ? Number(stock) : 0,
      dressType: dressType || "saree",
    });

    if (images && images.filepath) {
      const imagesRes = await cloudinary.uploader.upload(images.filepath, {
        width: 300,
        height: 300,
        crop: "fill",
      });
      product.images = {
        url: imagesRes.secure_url,
        publicId: imagesRes.public_id,
      };
    }
    await product.save();
    return res.json({ upload: true, product });
  } catch (error: any) {
    console.error("Error creating product:", error);
    return res.status(500).json({ error: error.message || "Failed to create product" });
  }
};
export const update_Product: RequestHandler = async (req, res) => {
  try {
    const { title, description, price, tag, offer, newPrice, stock, dressType, images } = req.body;
    const productId = req.params.productId;
    if (!mongoose.isValidObjectId(productId)) {
      const { message, status } = errorHandle(ErrorType.Id, "owner");
      return res.status(status).json({ message });
    }
    const product = await Product.findOneAndUpdate(
      { _id: productId },
      {
        title,
        description,
        ...(price !== undefined ? { price: Number(price) } : {}),
        tag,
        offer: offer === true || offer === "true",
        newPrice: newPrice !== undefined && newPrice !== "" ? Number(newPrice) : 0,
        ...(stock !== undefined ? { stock: Number(stock) } : {}),
        ...(dressType ? { dressType } : {}),
      },
      { new: true }
    );
    if (!product) return res.status(404).json({ error: "Record not found" });

    if (images && images.filepath) {
      if (product?.images?.publicId) {
        await cloudinary.uploader.destroy(product?.images?.publicId);
      }
      const imagesRes = await cloudinary.uploader.upload(images.filepath, {
        width: 300,
        height: 300,
        crop: "fill",
      });
      product.images = {
        url: imagesRes.secure_url,
        publicId: imagesRes.public_id,
      };
      await product.save();
    }
    return res.json({ upload: true, product });
  } catch (error: any) {
    console.error("Error updating product:", error);
    return res.status(500).json({ error: error.message || "Failed to update product" });
  }
};

export const delete_Product: RequestHandler = async (req, res) => {
  const productId = req.params.productId;
  if (!mongoose.isValidObjectId(productId)) {
    const { message, status } = errorHandle(ErrorType.Id, "productId");
    return res.status(status).json({ message });
  }
  await Product.deleteOne({ _id: productId });
  return res.json({ message: "Product deleted" });
};
export const getID_Product: RequestHandler = async (req, res) => {
  const productId = req.params.productId;
  if (!mongoose.isValidObjectId(productId)) {
    const { message, status } = errorHandle(ErrorType.Id, "productId");
    return res.status(status).json({ message });
  }
  // `.lean()` keeps a missing `stock` field missing instead of hydrating the
  // schema default (0). Products created before stock tracking are therefore
  // reported as untracked rather than "out of stock".
  const product = await Product.findById(productId).lean();
  return res.json({ product: product });
};
export const addCart_Product: RequestHandler = async (req, res) => {
  const productId = req.params.productId;
  const ownerId = req.user?.userId || req.user?.firebaseUid || req.body?.ownerId;
  const { quantity = 1 } = req.body;

  if (!productId || !mongoose.isValidObjectId(productId)) {
    const { message, status } = errorHandle(ErrorType.Id, "productId");
    return res.status(status).json({ message });
  }

  if (!ownerId) {
    const { message, status } = errorHandle(ErrorType.Required, "ownerId");
    return res.status(status).json({ message });
  }

  const product = await Product.findById(productId);
  if (!product) {
    const { message, status } = errorHandle(ErrorType.NotFound, "Product");
    return res.status(status).json({ message });
  }

  let userData = null;
  if (mongoose.isValidObjectId(ownerId)) {
    userData = await user.findById(ownerId);
  }
  if (!userData) {
    userData = await user.findOne({ firebaseUid: ownerId });
  }

  if (!userData) {
    const { message, status } = errorHandle(ErrorType.NotFound, "User");
    return res.status(status).json({ message });
  }

  const isAlreadyInCart = userData.cart?.some(
    (item) => item.product.toString() === productId,
  );

  if (isAlreadyInCart) {
    await user.findByIdAndUpdate(userData._id, {
      $pull: { cart: { product: product._id } },
    });
    return res.json({ message: "removed from cart" });
  }

  await user.findByIdAndUpdate(userData._id, {
    $push: {
      cart: {
        product: product._id,
        quantity: Math.max(1, Number(quantity) || 1),
      },
    },
  });

  return res.json({ message: "added into cart" });
};

export const getAll_Product: RequestHandler = async (req, res) => {
  const { dressType, tag } = req.query;
  const filter: any = {};
  if (dressType) filter.dressType = dressType;
  if (tag) filter.tag = tag;
  const all_Product = await Product.find(filter).lean();
  return res.json({ Product: all_Product });
};

export const isCart_Product: RequestHandler = async (req, res) => {
  const productId = req.params.productId;
  const ownerId = req.user?.userId || req.user?.firebaseUid || req.body?.ownerId;
  if (!productId || !mongoose.isValidObjectId(productId)) {
    const { message, status } = errorHandle(ErrorType.Id, "productId");
    return res.status(status).json({ message });
  }
  if (!ownerId) {
    const { message, status } = errorHandle(ErrorType.Required, "ownerId");
    return res.status(status).json({ message });
  }

  let userData = null;
  if (mongoose.isValidObjectId(ownerId)) {
    userData = await user.findById(ownerId);
  }
  if (!userData) {
    userData = await user.findOne({ firebaseUid: ownerId });
  }

  if (!userData) {
    const { message, status } = errorHandle(ErrorType.NotFound, "User");
    return res.status(status).json({ message });
  }
  const inCart =
    userData.cart?.some((item) => item.product.toString() === productId) ?? false;

  return res.json({ inCart });
};

export const getAll_Cart_Product: RequestHandler = async (req, res) => {
  const ownerId = req.user?.userId || req.user?.firebaseUid || req.body?.ownerId;

  if (!ownerId) {
    const { message, status } = errorHandle(ErrorType.Unauthorized, "User");
    return res.status(status).json({ message });
  }

  const matchFilter = mongoose.isValidObjectId(ownerId)
    ? { _id: new mongoose.Types.ObjectId(ownerId) }
    : { firebaseUid: ownerId };

  const cartProduct = await user.aggregate([
    { $match: matchFilter },
    { $unwind: "$cart" },
    {
      $lookup: {
        from: "products",
        localField: "cart.product",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $project: {
        _id: 0,
        product: "$product",
        quantity: "$cart.quantity",
      },
    },
  ]);

  return res.json({ carts: cartProduct });
};

export const updateQuantity_Product: RequestHandler = async (req, res) => {
  const productId = req.params.productId as string;
  const ownerId = req.user?.userId || req.user?.firebaseUid || req.body?.ownerId;
  const { quantity } = req.body;

  if (!productId || !mongoose.isValidObjectId(productId)) {
    const { message, status } = errorHandle(ErrorType.Id, "productId");
    return res.status(status).json({ message });
  }

  if (!ownerId) {
    const { message, status } = errorHandle(ErrorType.Required, "ownerId");
    return res.status(status).json({ message });
  }

  if (quantity === undefined || quantity === null || isNaN(Number(quantity))) {
    const { message, status } = errorHandle(ErrorType.Required, "quantity");
    return res.status(status).json({ message });
  }

  const numQuantity = Number(quantity);
  const userFilter = mongoose.isValidObjectId(ownerId)
    ? { _id: ownerId }
    : { firebaseUid: ownerId };

  // If quantity is 0 or negative, remove the product from cart
  if (numQuantity <= 0) {
    const updatedUser = await user.findOneAndUpdate(
      userFilter,
      {
        $pull: { cart: { product: new mongoose.Types.ObjectId(productId) } },
      },
      { new: true }
    );

    if (!updatedUser) {
      const { message, status } = errorHandle(ErrorType.NotFound, "User");
      return res.status(status).json({ message });
    }

    return res.json({ message: "Product removed from cart", cart: updatedUser.cart });
  }

  // Update existing cart item quantity using positional operator $
  const filter = mongoose.isValidObjectId(ownerId)
    ? { _id: ownerId, "cart.product": new mongoose.Types.ObjectId(productId) }
    : { firebaseUid: ownerId, "cart.product": new mongoose.Types.ObjectId(productId) };

  const updatedUser = await user.findOneAndUpdate(
    filter,
    { $set: { "cart.$.quantity": numQuantity } },
    { new: true }
  );

  if (!updatedUser) {
    const userExists = await user.findOne(userFilter);
    if (!userExists) {
      const { message, status } = errorHandle(ErrorType.NotFound, "User");
      return res.status(status).json({ message });
    }
    return res.status(404).json({ message: "Product not found in cart" });
  }

  return res.json({
    message: "Cart quantity updated successfully",
    cart: updatedUser.cart,
  });
};

export const latest_Product: RequestHandler = async (req, res) => {
  try {
    const all_Product = await Product.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.json({ Product: all_Product });
  } catch (error: any) {
    console.error("latest_Product error:", error);
    return res
      .status(500)
      .json({ error: error.message || "Failed to fetch latest products" });
  }
};
