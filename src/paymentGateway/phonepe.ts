import {
  StandardCheckoutClient,
  StandardCheckoutPayRequest,
  PrefillUserLoginDetails,
  Env,
  OrderStatusResponse,
  StandardCheckoutPayResponse,
  CallbackResponse,
} from "@phonepe-pg/pg-sdk-node";
import {
  PHONEPE_CLIENT_ID,
  PHONEPE_CLIENT_SECRET,
  PHONEPE_CLIENT_VERSION,
  PHONEPE_ENV,
  PHONEPE_REDIRECT_URL,
} from "#/util/variable";

let phonepeClientInstance: StandardCheckoutClient | null = null;

export const isPhonePeConfigured = (): boolean => {
  return Boolean(PHONEPE_CLIENT_ID && PHONEPE_CLIENT_SECRET);
};

export const getPhonePeClient = (): StandardCheckoutClient => {
  if (phonepeClientInstance) {
    return phonepeClientInstance;
  }

  if (!PHONEPE_CLIENT_ID || !PHONEPE_CLIENT_SECRET) {
    throw new Error(
      "PhonePe credentials (PHONEPE_CLIENT_ID / PHONEPE_CLIENT_SECRET) are not configured in environment variables."
    );
  }

  const env =
    PHONEPE_ENV?.toUpperCase() === "PRODUCTION"
      ? Env.PRODUCTION
      : Env.SANDBOX;

  const version = Number(PHONEPE_CLIENT_VERSION) || 1;

  phonepeClientInstance = StandardCheckoutClient.getInstance(
    PHONEPE_CLIENT_ID,
    PHONEPE_CLIENT_SECRET,
    version,
    env
  );

  return phonepeClientInstance;
};

export interface CreatePhonePeOrderParams {
  merchantOrderId: string;
  amountInPaise: number;
  redirectUrl?: string;
  phoneNumber?: string;
  message?: string;
}

export const createPhonePeOrder = async (
  params: CreatePhonePeOrderParams
): Promise<StandardCheckoutPayResponse> => {
  const client = getPhonePeClient();

  const redirectUrl = params.redirectUrl || PHONEPE_REDIRECT_URL;
  if (!redirectUrl) {
    throw new Error("Missing redirectUrl for PhonePe checkout.");
  }

  const builder = StandardCheckoutPayRequest.builder()
    .merchantOrderId(params.merchantOrderId)
    .amount(params.amountInPaise)
    .redirectUrl(redirectUrl);

  if (params.message) {
    builder.message(params.message);
  }

  if (params.phoneNumber) {
    const cleanPhone = params.phoneNumber.trim().replace(/\D/g, "");
    if (cleanPhone) {
      builder.prefillUserLoginDetails(
        PrefillUserLoginDetails.builder().phoneNumber(cleanPhone).build()
      );
    }
  }

  const payRequest = builder.build();
  return await client.pay(payRequest);
};

export const checkPhonePeOrderStatus = async (
  merchantOrderId: string,
  details = true
): Promise<OrderStatusResponse> => {
  const client = getPhonePeClient();
  return await client.getOrderStatus(merchantOrderId, details);
};

export const validatePhonePeCallback = (
  authorization: string,
  responseBody: string,
  username = "",
  password = ""
): CallbackResponse => {
  const client = getPhonePeClient();
  return client.validateCallback(
    username,
    password,
    authorization,
    responseBody
  );
};
