import { createCheckout as lsCreateCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import type { CheckoutParams } from "../types/index.js";
import { withRetry } from "./retry.js";

const DEFAULT_EXPIRES_IN_MS = 86_400_000;

function getExpiresAt(expiresInMs: number | null | undefined): string | undefined {
  if (expiresInMs === null) return undefined;
  const ms = expiresInMs ?? DEFAULT_EXPIRES_IN_MS;
  return new Date(Date.now() + ms).toISOString();
}

export function createCheckoutFactory(storeId: string, checkoutExpiresInMs?: number | null) {
  return async (params: CheckoutParams): Promise<string> => {
    const expiresAt = getExpiresAt(checkoutExpiresInMs);

    const response = await withRetry(
      () =>
        lsCreateCheckout(storeId, params.variantId, {
          checkoutData: {
            email: params.email,
            custom: { user_id: params.userId },
          },
          checkoutOptions: {
            embed: false,
            media: true,
            logo: true,
          },
          ...(expiresAt ? { expiresAt } : {}),
        }),
      "createCheckout"
    );

    if (response.error) {
      const lsError = response.error;
      const details = Array.isArray(lsError.cause)
        ? (lsError.cause as string[]).join("; ")
        : String(lsError.message ?? "Unknown checkout error");
      throw new Error(`Checkout failed: ${details}`);
    }

    if (!response.data) {
      throw new Error("Checkout session created but no data returned");
    }

    const url = response.data.data.attributes.url;
    if (!url) {
      throw new Error("Checkout session created but no URL returned");
    }

    return url;
  };
}
