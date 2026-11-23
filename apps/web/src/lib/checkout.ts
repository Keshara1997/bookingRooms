import { apiRequest } from "./api";

export type OnlineProvider = "STRIPE" | "PAYHERE";

export interface OnlineCheckoutResult {
  checkoutUrl: string;
  formFields?: Record<string, string> | null;
}

export async function startReservationOnlineCheckout(
  reservationId: string,
  options: {
    provider: OnlineProvider;
    customerCity: string;
    origin?: string;
  },
): Promise<OnlineCheckoutResult> {
  const origin =
    options.origin ??
    (typeof window !== "undefined" ? window.location.origin : "");

  const webhookPath =
    options.provider === "STRIPE"
      ? "/payments/webhooks/stripe"
      : "/payments/webhooks/payhere";

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/v1$/, "") ??
    "http://localhost:3000";

  return apiRequest<OnlineCheckoutResult>(
    `/reservations/${reservationId}/payments/online-checkout`,
    {
      method: "POST",
      body: JSON.stringify({
        provider: options.provider,
        customerCity: options.customerCity.trim(),
        returnUrl: `${origin}/dashboard/reservations/${reservationId}`,
        cancelUrl: `${origin}/dashboard/reservations/${reservationId}`,
        notifyUrl: `${apiBase}/api/v1${webhookPath}`,
      }),
    },
  );
}

export function submitPayHereCheckout(
  checkoutUrl: string,
  formFields: Record<string, string>,
) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = checkoutUrl;
  form.style.display = "none";

  for (const [name, value] of Object.entries(formFields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}

export async function redirectForOnlineCheckout(
  result: OnlineCheckoutResult,
) {
  if (
    result.formFields &&
    Object.keys(result.formFields).length > 0 &&
    result.checkoutUrl
  ) {
    submitPayHereCheckout(result.checkoutUrl, result.formFields);
    return;
  }

  if (result.checkoutUrl) {
    window.location.href = result.checkoutUrl;
  }
}