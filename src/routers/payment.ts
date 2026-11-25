import {
  payment_gateway,
  verify_payment,
  phonepe_create_order,
  phonepe_check_status,
  phonepe_callback,
  get_payment_methods,
} from "#/controller/payment";
import { Router } from "express";

const router = Router();

// Gateway availability status
router.get("/methods", get_payment_methods);

// Razorpay routes
router.post("/create", payment_gateway);
router.post("/verify", verify_payment);

// PhonePe routes
router.post("/phonepe/create", phonepe_create_order);
router.post("/phonepe/verify", phonepe_check_status);
router.get("/phonepe/status/:merchantOrderId", phonepe_check_status);
router.post("/phonepe/callback", phonepe_callback);

export default router;
