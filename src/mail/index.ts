import { BrevoClient } from '@getbrevo/brevo';
import {
  SHOP_NAME as DEFAULT_SHOP_NAME,
  SHOP_EMAIL as DEFAULT_SHOP_EMAIL,
  BREVO_API_KEY,
} from '#/util/variable';

/*
// ============================================================================
// LEGACY SIB-API-V3-SDK SNIPPET (AS REQUESTED):
// ============================================================================
// const SibApiV3Sdk = require('sib-api-v3-sdk');
// const defaultClient = SibApiV3Sdk.ApiClient.instance;
// const apiKey = defaultClient.authentications['api-key'];
// apiKey.apiKey = process.env.BREVO_API_KEY;
// const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
*/

/*
// ============================================================================
// NODEMAILER TRANSPORT (COMMENTED OUT AS REQUESTED)
// ============================================================================
// import nodemailer, { SendMailOptions } from 'nodemailer';
// export const transport = nodemailer.createTransport({
//   host: process.env.SMTP_HOST || "sandbox.smtp.mailtrap.io",
//   port: Number(process.env.SMTP_PORT) || 2525,
//   auth: {
//     user: process.env.SMTP_USER || "0aacc0c8a46273",
//     pass: process.env.SMTP_PASS || "7382cddbbb7e7a"
//   }
// });
*/

// ============================================================================
// SHOP CONFIGURATION - CHANGE SHOP NAME AND DETAILS HERE ANYTIME
// ============================================================================
export let SHOP_NAME = DEFAULT_SHOP_NAME || process.env.SHOP_NAME || "Appu Sarees";
export let SHOP_EMAIL = DEFAULT_SHOP_EMAIL || process.env.SHOP_EMAIL || "kmathan301@gmail.com";
export let SHOP_TAGLINE = process.env.SHOP_TAGLINE || "Order Invoice & Purchase Bill";

/**
 * Helper to update the shop name dynamically at runtime anytime
 */
export const setShopName = (newName: string) => {
  SHOP_NAME = newName;
};

/**
 * Helper to update the shop email dynamically at runtime anytime
 */
export const setShopEmail = (newEmail: string) => {
  SHOP_EMAIL = newEmail;
};

export interface IOrderProductDetail {
  _id?: string;
  title?: string;
  price?: number;
  offer?: boolean;
  newPrice?: number;
  images?: { publicId?: string; url?: string };
  tag?: string;
  description?: string;
}

export interface IOrderItemData {
  product?: IOrderProductDetail | string | any;
  title?: string;
  price?: number;
  quantity: number;
}

export interface IOrderEmailData {
  shopName?: string;
  shopEmail?: string;
  _id?: string | any;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  pinCode?: string;
  payment?: boolean | string;
  totalAmount?: number;
  products?: IOrderItemData[];
  status?: string;
  delivery_status?: string;
  createdAt?: string | Date;
}

const buildBillHtml = (orderData?: IOrderEmailData): string => {
  const currentShopName = orderData?.shopName || SHOP_NAME;
  const customerName = orderData?.name || "Valued Customer";
  const email = orderData?.email || "customer@example.com";
  const phone = orderData?.phone || "N/A";
  const address = orderData?.address || "N/A";
  const pinCode = orderData?.pinCode || "";
  const orderId = orderData?._id ? String(orderData._id) : "ORD-" + Math.floor(100000 + Math.random() * 900000);
  
  const createdDate = orderData?.createdAt ? new Date(orderData.createdAt) : new Date();
  const formattedDate = createdDate.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isPaid = typeof orderData?.payment === "boolean"
    ? orderData.payment
    : String(orderData?.payment).toLowerCase() === "true" || String(orderData?.payment).toLowerCase() === "paid";
  const paymentBadge = isPaid ? "Paid" : "Cash On Delivery";
  const paymentMethodText = isPaid ? "Online Payment (Paid)" : "Cash On Delivery (COD)";

  const items = Array.isArray(orderData?.products) && orderData.products.length > 0
    ? orderData.products
    : [
        {
          quantity: 1,
          title: "Traditional Silk Saree",
          price: Number(orderData?.totalAmount) || 1499,
        },
      ];

  let computedSubtotal = 0;

  const tableRows = items.map((item, index) => {
    const prodObj = (item.product && typeof item.product === "object") ? item.product : null;
    const title = prodObj?.title || item.title || (typeof item.product === "string" ? `Product (${item.product})` : `Item #${index + 1}`);
    const imageUrl = prodObj?.images?.url;
    const tag = prodObj?.tag;

    const unitPrice = prodObj?.offer && prodObj?.newPrice ? prodObj.newPrice : (prodObj?.price ?? item.price ?? 0);
    const quantity = item.quantity || 1;
    const lineTotal = unitPrice * quantity;
    computedSubtotal += lineTotal;

    const rowBg = index % 2 === 0 ? "#ffffff" : "#f9fafb";

    return `
      <tr style="background-color: ${rowBg}; border-bottom: 1px solid #e5e7eb;">
        <td class="table-cell-mobile" align="center" style="padding: 12px 8px; font-size: 13px; color: #6b7280;">${index + 1}</td>
        <td class="table-cell-mobile" align="left" style="padding: 12px 10px; font-size: 14px; color: #111827;">
          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
            <tr>
              ${imageUrl ? `
                <td style="padding-right: 10px; vertical-align: middle;">
                  <img class="product-img" src="${imageUrl}" alt="${title}" width="40" height="40" style="border-radius: 6px; object-fit: cover; border: 1px solid #e5e7eb; display: block;" />
                </td>
              ` : ""}
              <td style="vertical-align: middle;">
                <div style="font-weight: 600; color: #111827; line-height: 1.3;">${title}</div>
                ${tag ? `<span style="display: inline-block; margin-top: 3px; font-size: 10px; font-weight: 600; text-transform: uppercase; padding: 2px 6px; background-color: #e0e7ff; color: #3730a3; border-radius: 4px;">${tag}</span>` : ""}
              </td>
            </tr>
          </table>
        </td>
        <td class="table-cell-mobile price-cell" align="right" style="padding: 12px 10px; font-size: 13px; font-weight: 500; color: #374151; white-space: nowrap;">₹${unitPrice.toLocaleString("en-IN")}</td>
        <td class="table-cell-mobile qty-cell" align="center" style="padding: 12px 6px; font-size: 13px; color: #374151;">${quantity}</td>
        <td class="table-cell-mobile total-cell" align="right" style="padding: 12px 10px; font-size: 14px; font-weight: 600; color: #111827; white-space: nowrap;">₹${lineTotal.toLocaleString("en-IN")}</td>
      </tr>
    `;
  }).join("");

  const grandTotal = orderData?.totalAmount ?? (computedSubtotal || 0);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>${currentShopName} - Invoice #${orderId}</title>
  <style>
    /* Reset & base */
    body {
      margin: 0;
      padding: 0;
      background-color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      color: #1f2937;
    }

    /* Mobile Responsive Styles */
    @media only screen and (max-width: 600px) {
      .outer-wrapper {
        padding: 10px 4px !important;
      }
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
        border-radius: 8px !important;
      }
      .header-cell {
        padding: 20px 16px !important;
      }
      .header-title {
        font-size: 20px !important;
      }
      .badge-cell {
        display: block !important;
        width: 100% !important;
        text-align: left !important;
        margin-top: 10px !important;
      }
      .meta-cell {
        padding: 12px 16px !important;
      }
      .meta-table td {
        display: block !important;
        width: 100% !important;
        text-align: left !important;
        padding: 2px 0 !important;
      }
      .content-cell {
        padding: 16px 14px !important;
      }
      .col-stack {
        display: block !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      .col-spacer {
        display: block !important;
        width: 100% !important;
        height: 12px !important;
      }
      .totals-spacer {
        display: none !important;
        width: 0 !important;
      }
      .totals-wrapper {
        width: 100% !important;
      }
      .table-cell-mobile {
        padding: 8px 6px !important;
        font-size: 12px !important;
      }
      .price-cell, .total-cell {
        font-size: 12px !important;
      }
      .product-img {
        width: 32px !important;
        height: 32px !important;
      }
      .footer-cell {
        padding: 20px 16px !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6;">
    <tr>
      <td class="outer-wrapper" align="center" style="padding: 30px 10px;">
        <!-- Main Invoice Container -->
        <table class="email-container" role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 650px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e5e7eb;">
          
          <!-- Header Banner -->
          <tr>
            <td class="header-cell" style="background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%); background-color: #4f46e5; padding: 28px 32px; text-align: left; color: #ffffff;">
              <table width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="col-stack" style="vertical-align: middle;">
                    <h1 class="header-title" style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; color: #ffffff;">${currentShopName}</h1>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #e0e7ff;">${SHOP_TAGLINE}</p>
                  </td>
                  <td class="col-stack badge-cell" align="right" style="vertical-align: middle;">
                    <span style="background-color: rgba(255, 255, 255, 0.2); color: #ffffff; font-size: 11px; font-weight: 600; padding: 6px 12px; border-radius: 9999px; display: inline-block; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${paymentBadge}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Meta Bar (Order ID and Date) -->
          <tr>
            <td class="meta-cell" style="background-color: #f9fafb; padding: 14px 32px; border-bottom: 1px solid #e5e7eb;">
              <table class="meta-table" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="font-size: 13px; color: #4b5563;">
                    <strong style="color: #111827;">Order ID:</strong> #${orderId}
                  </td>
                  <td align="right" style="font-size: 13px; color: #4b5563;">
                    <strong style="color: #111827;">Date:</strong> ${formattedDate}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Customer and Delivery Details (Mobile stacked) -->
          <tr>
            <td class="content-cell" style="padding: 22px 32px 16px 32px;">
              <table width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="col-stack" width="48%" style="vertical-align: top; background-color: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #f3f4f6;">
                    <h3 style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; font-weight: 700;">Customer Details</h3>
                    <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #111827;">${customerName}</p>
                    <p style="margin: 0 0 4px 0; font-size: 13px; color: #4b5563;">${email}</p>
                    <p style="margin: 0; font-size: 13px; color: #4b5563;">Phone: ${phone}</p>
                  </td>
                  <td class="col-spacer" width="4%">&nbsp;</td>
                  <td class="col-stack" width="48%" style="vertical-align: top; background-color: #f9fafb; padding: 16px; border-radius: 8px; border: 1px solid #f3f4f6;">
                    <h3 style="margin: 0 0 8px 0; font-size: 11px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px; font-weight: 700;">Shipping &amp; Payment</h3>
                    <p style="margin: 0 0 4px 0; font-size: 13px; color: #374151; line-height: 1.4;">${address}</p>
                    ${pinCode ? `<p style="margin: 0 0 4px 0; font-size: 13px; color: #4b5563;">Pin Code: <strong>${pinCode}</strong></p>` : ""}
                    <p style="margin: 0; font-size: 13px; color: #4b5563;">Payment: <strong>${paymentMethodText}</strong></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Product Bill Table -->
          <tr>
            <td class="content-cell" style="padding: 14px 32px;">
              <h2 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600; color: #111827;">Order Bill Summary</h2>
              <div style="width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;">
                <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; min-width: 290px;">
                  <thead>
                    <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                      <th class="table-cell-mobile" align="center" style="padding: 10px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; width: 32px; letter-spacing: 0.5px;">#</th>
                      <th class="table-cell-mobile" align="left" style="padding: 10px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; letter-spacing: 0.5px;">Item Details</th>
                      <th class="table-cell-mobile" align="right" style="padding: 10px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; width: 75px; letter-spacing: 0.5px;">Price</th>
                      <th class="table-cell-mobile" align="center" style="padding: 10px 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; width: 35px; letter-spacing: 0.5px;">Qty</th>
                      <th class="table-cell-mobile" align="right" style="padding: 10px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; color: #475569; width: 80px; letter-spacing: 0.5px;">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${tableRows}
                  </tbody>
                </table>
              </div>
            </td>
          </tr>

          <!-- Calculation / Grand Total Section (Mobile Responsive) -->
          <tr>
            <td class="content-cell" style="padding: 0 32px 24px 32px;">
              <table width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="totals-spacer" width="40%">&nbsp;</td>
                  <td class="totals-wrapper" width="60%">
                    <table width="100%" cellspacing="0" cellpadding="6" style="border-collapse: collapse;">
                      <tr>
                        <td align="left" style="font-size: 13px; color: #6b7280;">Subtotal:</td>
                        <td align="right" style="font-size: 13px; font-weight: 500; color: #111827;">₹${computedSubtotal.toLocaleString("en-IN")}</td>
                      </tr>
                      <tr>
                        <td align="left" style="font-size: 13px; color: #6b7280;">Delivery Charges:</td>
                        <td align="right" style="font-size: 13px; font-weight: 600; color: #059669;">FREE</td>
                      </tr>
                      <tr style="border-top: 2px solid #e5e7eb; border-bottom: 2px solid #e5e7eb; background-color: #f8fafc;">
                        <td align="left" style="padding: 10px 8px; font-size: 15px; font-weight: 700; color: #111827;">Bill Amount:</td>
                        <td align="right" style="padding: 10px 8px; font-size: 17px; font-weight: 700; color: #4f46e5;">₹${grandTotal.toLocaleString("en-IN")}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Note -->
          <tr>
            <td class="footer-cell" style="background-color: #f9fafb; padding: 22px 32px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 13px; line-height: 1.5;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #374151;">Thank you for shopping with ${currentShopName}!</p>
              <p style="margin: 0 0 8px 0; font-size: 12px;">We have received your order and are preparing it for delivery.</p>
              <p style="margin: 0; font-size: 12px; color: #9ca3af;">This is an electronically generated bill. For any questions, please contact our support team.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

const buildBillText = (orderData?: IOrderEmailData): string => {
  const currentShopName = orderData?.shopName || SHOP_NAME;
  const customerName = orderData?.name || "Valued Customer";
  const email = orderData?.email || "customer@example.com";
  const phone = orderData?.phone || "N/A";
  const address = orderData?.address || "N/A";
  const pinCode = orderData?.pinCode || "";
  const orderId = orderData?._id ? String(orderData._id) : "ORD-" + Math.floor(100000 + Math.random() * 900000);
  const createdDate = orderData?.createdAt ? new Date(orderData.createdAt) : new Date();

  const isPaid = typeof orderData?.payment === "boolean"
    ? orderData.payment
    : String(orderData?.payment).toLowerCase() === "true" || String(orderData?.payment).toLowerCase() === "paid";
  const paymentMethodText = isPaid ? "Online Payment (Paid)" : "Cash On Delivery (COD)";

  const items = Array.isArray(orderData?.products) && orderData.products.length > 0
    ? orderData.products
    : [
        {
          quantity: 1,
          title: "Traditional Silk Saree",
          price: Number(orderData?.totalAmount) || 1499,
        },
      ];

  let computedSubtotal = 0;
  const itemsText = items.map((item, index) => {
    const prodObj = (item.product && typeof item.product === "object") ? item.product : null;
    const title = prodObj?.title || item.title || (typeof item.product === "string" ? `Product (${item.product})` : `Item #${index + 1}`);
    const unitPrice = prodObj?.offer && prodObj?.newPrice ? prodObj.newPrice : (prodObj?.price ?? item.price ?? 0);
    const quantity = item.quantity || 1;
    const lineTotal = unitPrice * quantity;
    computedSubtotal += lineTotal;

    return `${index + 1}. ${title} | Qty: ${quantity} x ₹${unitPrice} = ₹${lineTotal}`;
  }).join("\n");

  const grandTotal = orderData?.totalAmount ?? (computedSubtotal || 0);

  return `
==================================================
        ${currentShopName.toUpperCase()} - ORDER BILL
==================================================
Order ID: #${orderId}
Date: ${createdDate.toLocaleString()}
Customer: ${customerName}
Email: ${email}
Phone: ${phone}
Address: ${address} ${pinCode ? `(Pin: ${pinCode})` : ""}
Payment: ${paymentMethodText}

--------------------------------------------------
ITEMS ORDERED:
--------------------------------------------------
${itemsText}

--------------------------------------------------
Subtotal: ₹${computedSubtotal}
Delivery: FREE
Grand Total: ₹${grandTotal}
==================================================
Thank you for shopping with ${currentShopName}!
`;
};

export const generateMail = async (orderData?: IOrderEmailData) => {
  const currentShopName = orderData?.shopName || SHOP_NAME;
  const currentShopEmail = orderData?.shopEmail || SHOP_EMAIL;
  const recipientEmail = orderData?.email || "customer@example.com";
  const customerName = orderData?.name || "Customer";
  const orderId = orderData?._id ? String(orderData._id) : "ORD-" + Math.floor(100000 + Math.random() * 900000);

  const html = buildBillHtml(orderData);
  const text = buildBillText(orderData);

  try {
    /*
    // ------------------------------------------------------------------------
    // NODEMAILER SENDING (COMMENTED OUT AS REQUESTED)
    // ------------------------------------------------------------------------
    const mailOptions: SendMailOptions = {
      from: `"${currentShopName}" <${currentShopEmail}>`,
      to: recipientEmail,
      subject: `${currentShopName} - Order Confirmation & Bill #${orderId}`,
      text: text,
      html: html,
    };

    if (currentShopEmail) {
      mailOptions.cc = currentShopEmail;
    }

    const info = await transport.sendMail(mailOptions);
    console.log("Order confirmation email sent to %s (CC: %s), messageId: %s", recipientEmail, currentShopEmail, info.messageId);
    return info;
    */

    // ------------------------------------------------------------------------
    // BREVO API SENDING
    // ------------------------------------------------------------------------
    const apiKey = BREVO_API_KEY || process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.warn(
        "[Brevo] Warning: BREVO_API_KEY is not set in .env. Email was skipped."
      );
      return null;
    }

    const brevo = new BrevoClient({ apiKey });

    const sendSmtpEmail: any = {
      sender: {
        name: currentShopName,
        email: currentShopEmail,
      },
      to: [
        {
          email: recipientEmail,
          name: customerName,
        },
      ],
      subject: `${currentShopName} - Order Confirmation & Bill #${orderId}`,
      htmlContent: html,
      textContent: text,
    };

    // CC the shop owner so they also receive a confirmation copy
    if (currentShopEmail && currentShopEmail !== recipientEmail) {
      sendSmtpEmail.cc = [
        {
          email: currentShopEmail,
          name: currentShopName,
        },
      ];
    }

    const data = await brevo.transactionalEmails.sendTransacEmail(sendSmtpEmail);
    console.log("Brevo API called successfully. Returned data:", data);
    return data;
  } catch (error) {
    console.error("Error sending order email via Brevo:", error);
    return null;
  }
};
