import { createRequire } from "node:module";
import type { ExpressRouterOptions, Plan, CheckoutParams, WebhookPayload } from "../types/index.js";

interface RouterDeps {
  plans: Plan[];
  createCheckout: (params: CheckoutParams) => Promise<string>;
  verifyWebhook: (rawBody: string, signature: string) => boolean;
  handleWebhook: (payload: WebhookPayload) => Promise<{ dispatched: string | null; skipped: boolean }>;
}

export function createExpressRouter(deps: RouterDeps, options: ExpressRouterOptions): unknown {
  const require = createRequire(import.meta.url);

  let expressModule: {
    Router: () => {
      get: (path: string, ...handlers: Function[]) => void;
      post: (path: string, ...handlers: Function[]) => void;
    };
    raw: (opts: { type: string }) => Function;
  };

  try {
    expressModule = require("express") as typeof expressModule;
  } catch {
    throw new Error(
      "express is required for createExpressRouter. Install it: pnpm add express"
    );
  }

  const router = expressModule.Router();

  const plansHandler = (_req: unknown, res: { json: (body: unknown) => void }) => {
    res.json({ success: true, data: { plans: deps.plans } });
  };

  const checkoutHandler = async (
    req: { query: Record<string, string | undefined> },
    res: { status: (code: number) => { json: (body: unknown) => void }; json: (body: unknown) => void },
    next: (err?: unknown) => void
  ) => {
    try {
      const variantId = req.query.variantId;
      if (!variantId) {
        res.status(400).json({ success: false, error: "Query parameter variantId is required" });
        return;
      }

      const url = await deps.createCheckout({
        variantId,
        email: options.getUserEmail(req),
        userId: options.getUserId(req),
      });

      res.json({ success: true, data: { checkoutUrl: url } });
    } catch (err) {
      next(err);
    }
  };

  const webhookHandler = async (
    req: { headers: Record<string, string | undefined>; body: unknown },
    res: { status: (code: number) => { json: (body: unknown) => void }; json: (body: unknown) => void },
    next: (err?: unknown) => void
  ) => {
    try {
      const signature = req.headers["x-signature"];
      const rawBody = typeof req.body === "string"
        ? req.body
        : Buffer.isBuffer(req.body)
          ? (req.body as Buffer).toString("utf-8")
          : undefined;

      if (!signature || !rawBody) {
        res.status(400).json({ success: false, error: "Missing webhook signature or body" });
        return;
      }

      if (!deps.verifyWebhook(rawBody, signature)) {
        res.status(401).json({ success: false, error: "Invalid webhook signature" });
        return;
      }

      const payload: WebhookPayload = typeof req.body === "string"
        ? JSON.parse(req.body) as WebhookPayload
        : req.body as WebhookPayload;
      await deps.handleWebhook(payload);

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  };

  if (options.requireAuth) {
    router.get("/plans", options.requireAuth, plansHandler);
    router.get("/checkout", options.requireAuth, checkoutHandler);
  } else {
    router.get("/plans", plansHandler);
    router.get("/checkout", checkoutHandler);
  }

  router.post("/webhook", expressModule.raw({ type: "application/json" }), webhookHandler);

  return router;
}
