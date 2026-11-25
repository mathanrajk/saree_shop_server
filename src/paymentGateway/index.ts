import { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } from "#/util/variable";
import Razorpay from "razorpay";

export * from "./phonepe";

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

export { razorpay };
export default razorpay;
