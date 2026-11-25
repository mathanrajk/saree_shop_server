const clean = (val?: string) => (val || "").trim().replace(/^["']|["']$/g, "");

export const PORT = process.env.PORT as string;
export const MONGO_URL = process.env.MONGO_URL as string;
export const Cloud_Name = process.env.Cloud_Name as string;
export const Cloud_Api_Key = process.env.Cloud_Api_Key as string;
export const Cloud_Api_Secret = process.env.Cloud_Api_Secret as string;
export const SHOP_NAME = process.env.SHOP_NAME as string;
export const SHOP_EMAIL = clean(process.env.SHOP_EMAIL) || "orders@clothstore.com";
export const BREVO_API_KEY = clean(process.env.BREVO_API_KEY);
export const RAZORPAY_KEY_ID = clean(process.env.RAZORPAY_KEY_ID);
export const RAZORPAY_KEY_SECRET = clean(process.env.RAZORPAY_KEY_SECRET);
export const JWT_SECRET = (process.env.JWT_SECRET as string) || "your_jwt_secret_key";

export const PHONEPE_CLIENT_ID = clean(process.env.PHONEPE_CLIENT_ID);
export const PHONEPE_CLIENT_SECRET = clean(process.env.PHONEPE_CLIENT_SECRET);
export const PHONEPE_CLIENT_VERSION = clean(process.env.PHONEPE_CLIENT_VERSION) || "1";
export const PHONEPE_ENV = clean(process.env.PHONEPE_ENV) || "SANDBOX";
export const PHONEPE_REDIRECT_URL = clean(process.env.PHONEPE_REDIRECT_URL);





