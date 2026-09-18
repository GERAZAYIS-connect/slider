import type { GenerationRequest, Slide, TypologyId } from "../types";

export type AiSource = "gemini" | "deepseek" | "template";

export interface GenerateResult {
  slides: Slide[];
  source: AiSource;
  model?: string;
  image?: string;
}

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any).error || `Erreur ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function apiGenerate(request: GenerationRequest): Promise<GenerateResult> {
  return post<GenerateResult>("/api/generate-presentation", request);
}

export async function apiImprove(
  slides: Slide[],
  instruction: string,
  typology: TypologyId
): Promise<GenerateResult> {
  return post<GenerateResult>("/api/improve-presentation", { slides, instruction, typology });
}

export async function apiHealth(): Promise<{ ok: boolean; ai: boolean; provider?: string }> {
  const res = await fetch("/api/health");
  return res.json();
}

export function aiSourceLabel(result: GenerateResult): string | null {
  if (result.source === "gemini") return result.model ?? "Gemini";
  if (result.source === "deepseek") return result.model ?? "DeepSeek";
  return null;
}

// --- Abonnement / Paiement ---------------------------------------------------

export interface SubscriptionInfo {
  active: boolean;
  expiresAt: number;
  lastTransactionId?: string;
  price: number;
  exportPrice: number;
  currency: string;
  configured: boolean;
  exportCredits: number;
  dailyLimit: number;
  dailyUsed: number;
}

export interface PaymentProvider {
  id: string;
  name: string;
  methodType: string;
}

export async function apiSubscription(): Promise<SubscriptionInfo> {
  const res = await fetch("/api/payment/subscription");
  if (!res.ok) throw new Error("Impossible de récupérer l'abonnement");
  return res.json();
}

export async function apiPaymentProviders(): Promise<PaymentProvider[]> {
  const res = await fetch("/api/payment/providers");
  if (!res.ok) return [];
  const data = await res.json();
  return data.providers ?? [];
}

export async function apiPaymentInitiate(input: {
  phoneNumber: string;
  methodProvider: string;
  methodType: string;
  plan?: "subscription" | "export";
}): Promise<{ transactionId: string; orderId: string; amount: number; plan: string }> {
  return post("/api/payment/initiate", input);
}

export async function apiPaymentStatus(transactionId: string): Promise<{
  status: string;
  message?: string;
  subscription: SubscriptionInfo;
}> {
  return post("/api/payment/status", { transactionId });
}

export async function apiPaymentCheckExport(): Promise<{
  allowed: boolean;
  via?: string;
  credits?: number;
  reason?: string;
  exportPrice?: number;
}> {
  return post("/api/payment/check-export", {});
}

export async function apiPaymentConsumeExport(): Promise<{ ok: boolean; via?: string; error?: string }> {
  const res = await fetch("/api/payment/consume-export", { method: "POST" });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as any).error || `Erreur ${res.status}`);
  }
  return res.json();
}
