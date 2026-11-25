import razorpay, {
  createPhonePeOrder,
  checkPhonePeOrderStatus,
  validatePhonePeCallback,
  isPhonePeConfigured,
} from "#/paymentGateway";
import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from "#/util/variable";
import crypto from "crypto";
import { RequestHandler } from "express";

export const get_payment_methods: RequestHandler = async (_req, res) => {
  res.json({
    razorpay: Boolean(RAZORPAY_KEY_ID),
    phonepe: isPhonePeConfigured(),
  });
};

/* -------------------------------------------------------------------------- */
/*                               Razorpay Routes                              */
/* -------------------------------------------------------------------------- */

export const payment_gateway: RequestHandler = async (req, res) => {
  try {
    const { amount } = req.body;
    const numericAmount = Number(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "Invalid payment amount" });
    }

    // Convert rupees to paise (e.g. 500 INR -> 50000 paise)
    const amountInPaise = Math.round(numericAmount * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: "rcpt_" + Date.now(),
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      paymentMethod: order.method,
      note: order.notes,
      keyId: RAZORPAY_KEY_ID,
      gateway: "razorpay",
    });
  } catch (err: any) {
    console.error("payment_gateway error:", err);
    res.status(500).json({
      error:
        err?.error?.description || err?.message || "Could not create order",
    });
  }
};

export const verify_payment: RequestHandler = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: "Missing required payment verification parameters",
      });
    }

    const expected = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const valid =
      expected.length === razorpay_signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expected),
        Buffer.from(razorpay_signature)
      );

    if (valid) {
      return res.json({
        success: true,
        message: "Payment verified successfully",
      });
    }

    return res.status(400).json({ success: false, error: "Invalid signature" });
  } catch (err) {
    console.error("verify_payment error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Payment verification failed" });
  }
};



export const phonepe_create_order: RequestHandler = async (req, res) => {
  try {
    const { amount, redirectUrl, mobileNumber, message } = req.body;
    const numericAmount = Number(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "Invalid payment amount" });
    }

    // Convert rupees to paise (e.g. 500 INR -> 50000 paise)
    const amountInPaise = Math.round(numericAmount * 100);
    const merchantOrderId =
      req.body.merchantOrderId ||
      `MT_${Date.now()}_${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

    const phonePeOrder = await createPhonePeOrder({
      merchantOrderId,
      amountInPaise,
      redirectUrl,
      phoneNumber: mobileNumber,
      message: message || "Order Payment",
    });

    return res.json({
      success: true,
      orderId: phonePeOrder.orderId,
      merchantOrderId,
      state: phonePeOrder.state,
      redirectUrl: phonePeOrder.redirectUrl,
      expireAt: phonePeOrder.expireAt,
      amount: amountInPaise,
      gateway: "phonepe",
    });
  } catch (err: any) {
    console.error("phonepe_create_order error:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to create PhonePe payment order",
    });
  }
};

export const phonepe_check_status: RequestHandler = async (req, res) => {
  try {
    const merchantOrderId =
      req.params.merchantOrderId ||
      req.body.merchantOrderId ||
      (req.query.merchantOrderId as string);

    if (!merchantOrderId) {
      return res.status(400).json({
        success: false,
        error: "Missing required parameter: merchantOrderId",
      });
    }

    const status = await checkPhonePeOrderStatus(merchantOrderId);
    const isCompleted =
      status.state === "COMPLETED" || status.state === "PAYMENT_SUCCESS";

    return res.json({
      success: isCompleted,
      state: status.state,
      orderId: status.orderId,
      merchantOrderId: status.merchantOrderId || merchantOrderId,
      amount: status.amount,
      payableAmount: status.payableAmount,
      feeAmount: status.feeAmount,
      paymentDetails: status.paymentDetails,
      errorCode: status.errorCode,
      detailedErrorCode: status.detailedErrorCode,
    });
  } catch (err: any) {
    console.error("phonepe_check_status error:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Failed to check PhonePe payment status",
    });
  }
};

export const phonepe_callback: RequestHandler = async (req, res) => {
  try {
    const authorization = (req.headers["authorization"] ||
      req.headers["x-verify"] ||
      "") as string;
    const rawBody =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body);

    if (authorization) {
      try {
        const callback = validatePhonePeCallback(authorization, rawBody);
        return res.json({ success: true, callback });
      } catch (valErr: any) {
        console.warn("PhonePe callback validation warning:", valErr?.message);
      }
    }

    return res.json({ success: true, message: "Callback received" });
  } catch (err: any) {
    console.error("phonepe_callback error:", err);
    return res.status(500).json({ success: false, error: err?.message });
  }
};
