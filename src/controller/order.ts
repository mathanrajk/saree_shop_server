import { generateMail } from "#/mail";
import {
  Order,
  ORDER_STATUS,
  DELIVERY_STATUS,
  OrderStatus,
  DeliveryStatus,
} from "#/model/order";
import { Product } from "#/model/product";
import user from "#/model/user";
import { errorHandle, ErrorType } from "#/util/errorHandling";
import { RequestHandler } from "express";
import mongoose from "mongoose";

interface NormalisedOrderItem {
  product: string;
  quantity: number;
}

/**
 * Checks stock for every line item.
 *
 * Products created before the `stock` field existed have no value in the
 * database. Mongoose hydrates those as the schema default (0), which used to
 * reject perfectly valid orders *after* the customer had already paid.
 * Reading with `.lean()` keeps the raw value, so a missing `stock` is treated
 * as "not tracked" instead of "out of stock".
 */
const collectShortages = async (items: NormalisedOrderItem[]) => {
  const shortages: { title: string; stock: number; quantity: number }[] = [];

  for (const item of items) {
    const prod: any = await Product.findById(item.product).lean();
    if (!prod) {
      return { missingProduct: item.product, shortages };
    }
    if (typeof prod.stock === "number" && prod.stock < item.quantity) {
      shortages.push({
        title: prod.title,
        stock: prod.stock,
        quantity: item.quantity,
      });
    }
  }

  return { missingProduct: null, shortages };
};

export const create_order: RequestHandler = async (req, res) => {
  try {
    const ownerId = req.user?.userId || req.user?.firebaseUid || req.body.ownerId;
    const {
      name,
      email,
      phone,
      address,
      pinCode,
      payment,
      totalAmount,
      products,
      razorpayOrderId,
      razorpayPaymentId,
      phonepeOrderId,
      phonepeTransactionId,
      paymentGateway,
    } = req.body;

    if (!ownerId) {
      const { message, status } = errorHandle(ErrorType.Unauthorized, "User");
      return res.status(status).json({ message });
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "No products in order" });
    }

    // Normalise line items so bad payloads fail with a clear message instead
    // of a Mongoose CastError / silent server error.
    const items: NormalisedOrderItem[] = products.map((item: any) => ({
      product: String(item?.product ?? ""),
      quantity: Math.max(1, Math.round(Number(item?.quantity) || 1)),
    }));

    const invalidItem = items.find((item) => !mongoose.isValidObjectId(item.product));
    if (invalidItem) {
      return res.status(400).json({
        message: `Invalid product id in order: ${invalidItem.product || "(empty)"}`,
      });
    }

    // Idempotency: a retry must not create a second order for the same payment.
    if (razorpayPaymentId) {
      const existing = await Order.findOne({ razorpayPaymentId });
      if (existing) {
        return res.json({ Order: existing, duplicate: true });
      }
    }
    if (phonepeTransactionId) {
      const existing = await Order.findOne({ phonepeTransactionId });
      if (existing) {
        return res.json({ Order: existing, duplicate: true });
      }
    }

    // 1. Check stock availability for all products before creating the order
    const { missingProduct, shortages } = await collectShortages(items);

    if (missingProduct) {
      return res.status(404).json({ message: `Product not found: ${missingProduct}` });
    }

    if (shortages.length > 0 && !payment) {
      const first = shortages[0];
      if (first) {
        return res.status(400).json({
          message: `Insufficient stock for "${first.title}". Only ${first.stock} items left in stock.`,
        });
      }
    }

    if (shortages.length > 0 && payment) {
      // The customer has already paid. Never lose a paid order because of a
      // stock mismatch - save it and flag it for manual fulfilment.
      console.warn(
        "[orders/create] Paid order saved with insufficient stock:",
        JSON.stringify(shortages)
      );
    }

    // 2. Create the order
    const order = await Order.create({
      ownerId,
      name,
      email,
      phone,
      address,
      pinCode,
      payment,
      totalAmount,
      products: items,
      razorpayOrderId,
      razorpayPaymentId,
      phonepeOrderId,
      phonepeTransactionId,
      paymentGateway:
        paymentGateway || (phonepeOrderId ? "phonepe" : "razorpay"),
    });

    // 3. Decrement stock, clamped at 0 so legacy docs never go negative
    try {
      await Promise.all(
        items.map(async (item) => {
          const prod: any = await Product.findById(item.product).lean();
          // Untracked stock (legacy products without the field) is left alone.
          if (!prod || typeof prod.stock !== "number") return;
          await Product.findByIdAndUpdate(item.product, {
            stock: Math.max(0, prod.stock - item.quantity),
          });
        })
      );
    } catch (stockError) {
      // The order is already saved - never fail the request over bookkeeping.
      console.error("[orders/create] stock update failed:", stockError);
    }

    // 4. Update user's OrderIds and clear their cart
    try {
      const userFilter = mongoose.isValidObjectId(ownerId)
        ? { _id: ownerId }
        : { firebaseUid: ownerId };
      await user.findOneAndUpdate(userFilter, {
        $push: { OrderIds: order._id },
        $set: { cart: [] },
      });
    } catch (userError) {
      console.error("[orders/create] user cart update failed:", userError);
    }

    const populatedOrder = await order.populate("products.product");
    try {
      await generateMail(populatedOrder);
      console.log(
        `[orders/create] Order confirmation email sent to customer (${populatedOrder.email}) and CC to shop owner`
      );
    } catch (mailError) {
      console.error("Failed to send order email:", mailError);
    }

    return res.json({ Order: order });
  } catch (error: any) {
    console.error("[orders/create] failed:", error);
    return res.status(500).json({
      message: error?.message || "Could not save the order. Please contact support.",
    });
  }
};

export const getAll_order: RequestHandler = async (req, res) => {
  const orders = await Order.find().populate("products.product");
  return res.json({ Order: orders });
};
export const getId_order: RequestHandler = async (req, res) => {
  const orderId = req.params.orderId;
  if (!mongoose.isValidObjectId(orderId)) {
    const { message, status } = errorHandle(ErrorType.Id, "orderId");
    return res.status(status).json({ message });
  }
  const order = await Order.findById({ _id: orderId });
  return res.json({ Order: order });
};

export const getUser_order: RequestHandler = async (req, res) => {
  const userId = (req.user?.userId || req.user?.firebaseUid || req.params.userId) as string;
  if (!userId || !mongoose.isValidObjectId(userId)) {
    const { message, status } = errorHandle(ErrorType.Id, "userId");
    return res.status(status).json({ message });
  }
  const order = await user.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(userId) },
    },
    {
      $unwind: "$OrderIds",
    },
    {
      $lookup: {
        from: "orders",
        localField: "OrderIds",
        foreignField: "_id",
        as: "order_details",
      },
    },
    {
      $unwind: "$order_details",
    },
    {
      $lookup: {
        from: "products",
        localField: "order_details.products.product",
        foreignField: "_id",
        as: "product_details",
      },
    },
    {
      $project: {
        _id: "$order_details._id",
        totalAmount: "$order_details.totalAmount",
        payment: "$order_details.payment",
        status: "$order_details.status",
        delivery_status: "$order_details.delivery_status",
        address: "$order_details.address",
        pinCode: "$order_details.pinCode",
        createdAt: "$order_details.createdAt",
        products: {
          $map: {
            input: "$order_details.products",
            as: "item",
            in: {
              quantity: "$$item.quantity",
              product: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: "$product_details",
                      as: "p",
                      cond: { $eq: ["$$p._id", "$$item.product"] },
                    },
                  },
                  0,
                ],
              },
            },
          },
        },
      },
    },
  ]);

  return res.json({ Order: order });
};

export const update_order: RequestHandler = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    if (!mongoose.isValidObjectId(orderId)) {
      const { message, status } = errorHandle(ErrorType.Id, "orderId");
      return res.status(status).json({ message });
    }

    const { status, delivery_status } = req.body;
    const updateFields: {
      status?: OrderStatus;
      delivery_status?: DeliveryStatus;
    } = {};

    if (status !== undefined) {
      if (!ORDER_STATUS.includes(status)) {
        return res.status(400).json({
          message: `Invalid status. Allowed values: ${ORDER_STATUS.join(", ")}`,
        });
      }
      updateFields.status = status;
    }

    if (delivery_status !== undefined) {
      if (!DELIVERY_STATUS.includes(delivery_status)) {
        return res.status(400).json({
          message: `Invalid delivery_status. Allowed values: ${DELIVERY_STATUS.join(", ")}`,
        });
      }
      updateFields.delivery_status = delivery_status;
    }

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({
        message:
          "No valid fields provided. Only status and delivery_status can be updated.",
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate("products.product");

    if (!updatedOrder) {
      const { message, status: errStatus } = errorHandle(
        ErrorType.NotFound,
        "Order"
      );
      return res.status(errStatus).json({ message });
    }

    return res.json({
      message: "Order updated successfully",
      Order: updatedOrder,
    });
  } catch (error: any) {
    console.error("update_order error:", error);
    return res.status(500).json({
      message: error?.message || "Failed to update order",
    });
  }
};