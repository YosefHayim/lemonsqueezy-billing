import { createWebhook, deleteWebhook } from "@lemonsqueezy/lemonsqueezy.js";
import type { NewWebhook } from "@lemonsqueezy/lemonsqueezy.js";
import type { WebhookManagement } from "../types/index.js";
import { withRetry } from "./retry.js";

export function createWebhookManagement(storeId: string): WebhookManagement {
  return {
    createWebhook: async (url: string, events: string[], secret?: string): Promise<string> => {
      const webhookData: NewWebhook = {
        url,
        events: events as NewWebhook["events"],
        secret: secret ?? "",
      };
      const response = await withRetry(
        () => createWebhook(storeId, webhookData),
        "createWebhook"
      );

      if (response.error) {
        throw new Error(`Failed to create webhook: ${response.error.message}`);
      }

      if (!response.data?.data) {
        throw new Error("Webhook created but no data returned");
      }

      return response.data.data.id;
    },

    deleteWebhook: async (webhookId: string): Promise<void> => {
      const response = await withRetry(
        () => deleteWebhook(webhookId),
        "deleteWebhook"
      );

      if (response.error) {
        throw new Error(`Failed to delete webhook: ${response.error.message}`);
      }
    },
  };
}