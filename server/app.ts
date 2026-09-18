import express from "express";
import type { Request, Response } from "express";
import { generatePresentation, improvePresentation, aiAvailable, geminiAvailable, deepseekAvailable } from "./ai";
import {
  paymentConfigured,
  getProviders,
  initiatePayment,
  getTransactionStatus,
  getSubscription,
  activateSubscription,
  addExportCredit,
  consumeExportCredit,
  setPendingOrder,
  consumePendingOrder,
  getDailyRemaining,
  consumeDailySlides,
  type PaymentPlan,
} from "./payment";
import type { GenerationRequest, Slide, TypologyId } from "../src/types";

const app = express();
app.use(express.json({ limit: "30mb" }));

function fail(res: Response, status: number, message: string) {
  res.status(status).json({ error: message });
}

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({
    ok: true,
    ai: aiAvailable(),
    provider: deepseekAvailable() ? "deepseek" : geminiAvailable() ? "gemini" : "none",
    time: new Date().toISOString(),
  });
});

app.post("/api/generate-presentation", async (req: Request, res: Response) => {
  try {
    const body = req.body as Partial<GenerationRequest>;
    if (!body?.brief?.trim()) {
      return fail(res, 400, "Le champ 'brief' est requis.");
    }
    if (paymentConfigured()) {
      const sub = await getSubscription();
      if (!sub.active) {
        return fail(res, 402, "Abonnement requis pour générer avec l'IA (2500 FCFA/mois).");
      }
      const remaining = await getDailyRemaining();
      if (remaining <= 0) {
        return fail(res, 402, `Quota quotidien atteint (${sub.dailyLimit} diapositives IA par jour). Réessayez demain.`);
      }
      if (remaining < 3) {
        return fail(res, 402, `Quota insuffisant aujourd'hui (${remaining} diapositive(s) restante(s)).`);
      }
    }

    const request: GenerationRequest = {
      brief: body.brief.trim(),
      typology: (body.typology as TypologyId) || "pitch",
      slideCount: Math.max(3, Math.min(100, Number(body.slideCount) || 10)),
      language: body.language === "en" ? "en" : "fr",
      title: body.title?.trim() || undefined,
    };
    if (paymentConfigured()) {
      request.slideCount = Math.min(request.slideCount, await getDailyRemaining());
    }

    const result = await generatePresentation(request);
    if (paymentConfigured()) {
      await consumeDailySlides(result.slides.length);
    }
    const quota = paymentConfigured()
      ? { used: (await getSubscription()).dailyUsed, limit: (await getSubscription()).dailyLimit }
      : undefined;
    res.json({ slides: result.slides, source: result.source, model: result.model, image: result.image, quota });
  } catch (err) {
    console.error("[generate] erreur:", err);
    fail(res, 500, "Échec de la génération.");
  }
});

app.post("/api/improve-presentation", async (req: Request, res: Response) => {
  try {
    const body = req.body as { slides?: Slide[]; instruction?: string; typology?: TypologyId };
    if (!Array.isArray(body.slides) || body.slides.length === 0) {
      return fail(res, 400, "Le champ 'slides' est requis.");
    }
    const result = await improvePresentation(body.slides, body.instruction ?? "", body.typology ?? "pitch");
    res.json({ slides: result.slides, source: result.source, model: result.model });
  } catch (err) {
    console.error("[improve] erreur:", err);
    fail(res, 500, "Échec de l'amélioration.");
  }
});

app.get("/api/images", async (req: Request, res: Response) => {
  const query = String(req.query.query ?? "");
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key || !query) {
    return res.json({ image: null });
  }
  try {
    const url = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(query)}&orientation=landscape&w=1600`;
    const r = await fetch(url, { headers: { Authorization: `Client-ID ${key}` } });
    if (!r.ok) return res.json({ image: null });
    const data = (await r.json()) as any;
    res.json({ image: data?.urls?.regular ?? data?.urls?.full ?? null });
  } catch {
    res.json({ image: null });
  }
});

// --- Abonnement / Paiement NetWallet ------------------------------------------

app.get("/api/payment/subscription", async (_req: Request, res: Response) => {
  res.json(await getSubscription());
});

app.get("/api/payment/providers", async (_req: Request, res: Response) => {
  res.json({ providers: await getProviders() });
});

app.post("/api/payment/initiate", async (req: Request, res: Response) => {
  try {
    if (!paymentConfigured()) {
      return fail(res, 503, "Paiement non configuré (clés NetWallet absentes).");
    }
    const body = req.body as { phoneNumber?: string; methodProvider?: string; methodType?: string; plan?: PaymentPlan };
    const phone = String(body.phoneNumber ?? "").replace(/[^0-9+]/g, "");
    if (!phone) return fail(res, 400, "Le numéro de téléphone est requis.");
    const plan: PaymentPlan = body.plan === "export" ? "export" : "subscription";
    const result = await initiatePayment({
      phoneNumber: phone,
      methodProvider: body.methodProvider || "mtn_cm",
      methodType: body.methodType || "MOMO",
      plan,
    });
    await setPendingOrder(result.transactionId, plan);
    res.json(result);
  } catch (err) {
    console.error("[payment] initiate erreur:", err);
    fail(res, 500, (err as Error).message || "Échec du paiement.");
  }
});

app.post("/api/payment/status", async (req: Request, res: Response) => {
  try {
    const body = req.body as { transactionId?: string };
    if (!body.transactionId) return fail(res, 400, "transactionId requis.");
    const status = await getTransactionStatus(String(body.transactionId));
    if (status.status === "SUCCESS" || status.status === "SUCCESSFUL") {
      const plan = (await consumePendingOrder(String(body.transactionId))) ?? "subscription";
      let message: string;
      if (plan === "export") {
        await addExportCredit(String(body.transactionId));
        message = "Crédit d'export ajouté (250 FCFA).";
      } else {
        await activateSubscription(String(body.transactionId));
        message = "Abonnement activé (2500 FCFA).";
      }
      res.json({ status: status.status, message, subscription: await getSubscription() });
    } else {
      res.json({ status: status.status, message: status.message, subscription: await getSubscription() });
    }
  } catch (err) {
    console.error("[payment] status erreur:", err);
    fail(res, 500, (err as Error).message || "Échec du statut.");
  }
});

app.post("/api/payment/check-export", async (_req: Request, res: Response) => {
  const sub = await getSubscription();
  if (sub.active) return res.json({ allowed: true, via: "subscription" });
  if (sub.exportCredits > 0) return res.json({ allowed: true, via: "credit", credits: sub.exportCredits });
  res.json({ allowed: false, reason: "payment", exportPrice: sub.exportPrice });
});

app.post("/api/payment/consume-export", async (_req: Request, res: Response) => {
  const sub = await getSubscription();
  if (sub.active) return res.json({ ok: true, via: "subscription" });
  if (sub.exportCredits > 0) {
    await consumeExportCredit();
    return res.json({ ok: true, via: "credit" });
  }
  res.status(402).json({ ok: false, error: "Abonnement ou crédit d'export requis (250 FCFA)." });
});

export default app;
