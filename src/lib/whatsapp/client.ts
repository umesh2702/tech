export interface WhatsAppMessageOptions {
  to: string;
  text: string;
}

export interface WhatsAppTemplateOptions {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: any[];
}

const getBaseUrl = () => {
  const version = process.env.WHATSAPP_API_VERSION || "v21.0";
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!phoneId) {
    throw new Error("WHATSAPP_PHONE_NUMBER_ID is not configured");
  }
  return `https://graph.facebook.com/${version}/${phoneId}`;
};

const getHeaders = () => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) {
    throw new Error("WHATSAPP_ACCESS_TOKEN is not configured");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json; charset=utf-8",
  };
};

export async function sendWhatsAppMessage({ to, text }: WhatsAppMessageOptions) {
  try {
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        preview_url: true,
        body: text,
      },
    };

    console.log("Meta Payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(`${getBaseUrl()}/messages`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("Meta Response:", JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error("WhatsApp API Error:", JSON.stringify(data, null, 2));
      throw new Error(JSON.stringify({
        message: data.error?.message || "Failed to send WhatsApp message",
        rawResponse: data,
        payloadSent: payload,
        status: response.status
      }));
    }

    return { ...data, payloadSent: payload, status: response.status };
  } catch (error) {
    console.error("sendWhatsAppMessage failed:", error);
    throw error;
  }
}

export async function sendWhatsAppTemplate({
  to,
  templateName,
  languageCode = "en_US",
  components = [],
}: WhatsAppTemplateOptions) {
  try {
    const response = await fetch(`${getBaseUrl()}/messages`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
          components,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("WhatsApp Template Error:", JSON.stringify(data, null, 2));
      throw new Error(data.error?.message || "Failed to send WhatsApp template");
    }

    return data;
  } catch (error) {
    console.error("sendWhatsAppTemplate failed:", error);
    throw error;
  }
}
