import { createWebhook, deleteWebhook, listWebhooks, getWebhook, updateWebhook } from "@lemonsqueezy/lemonsqueezy.js";
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

    listWebhooks: async () => {
      const response = await withRetry(() => listWebhooks({ filter: { storeId } }), "listWebhooks");
      if (response.error) throw new Error(`Failed to list webhooks: ${response.error.message}`);
      return (response.data?.data ?? []).map((w: any) => ({
        id: w.id,
        url: w.attributes.url as string,
        events: w.attributes.events as string[],
        createdAt: w.attributes.created_at as string,
      }));
    },

    getWebhook: async (webhookId: string) => {
      const response = await withRetry(() => getWebhook(webhookId), "getWebhook");
      if (response.error) throw new Error(`Failed to get webhook: ${response.error.message}`);
      const w = response.data?.data;
      if (!w) return null;
      return {
        id: w.id,
        url: w.attributes.url as string,
        events: w.attributes.events as string[],
        createdAt: w.attributes.created_at as string,
      };
    },

    updateWebhook: async (webhookId: string, url?: string, events?: string[]) => {
      const response = await withRetry(
        () => updateWebhook(webhookId, { url: url ?? "", events: events as any ?? [] }),
        "updateWebhook"
      );
      if (response.error) throw new Error(`Failed to update webhook: ${response.error.message}`);
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
