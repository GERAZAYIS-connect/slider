import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { getServerDir } from "./dir";
import { storeGet, storeSet } from "./store";

// ---------------------------------------------------------------------------
// Intégration NetWallet Pay (https://netwalletpay.com)
// Abonnement mensuel "manuel" : un paiement réussi = 30 jours d'accès.
// ---------------------------------------------------------------------------

const BASE_URL = "https://netwalletpay.com";
const PRICE_XAF = Number(process.env.SUBSCRIPTION_PRICE_XAF) || 2500;
const EXPORT_PRICE_XAF = Number(process.env.EXPORT_PRICE_XAF) || 250;
const SUBSCRIPTION_DAYS = Number(process.env.SUBSCRIPTION_DAYS) || 30;
const DAILY_SLIDE_LIMIT = Number(process.env.DAILY_SLIDE_LIMIT) || 15;

export type PaymentPlan = "subscription" | "export";

// Recharge .env à chaque lecture de config (idem ai.ts) : permet d'ajouter
// les clés NetWallet sans redémarrer le serveur.
function reloadEnv(): void {
  try {
    process.loadEnvFile?.(path.resolve(getServerDir(), "../.env"));
  } catch {
    /* .env absent : on ignore */
  }
}

function dataDir(): string {
  const dir = process.env.SLIDER_DATA_DIR || path.join(os.homedir(), ".slider");
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch {
    /* ignore */
  }
  return dir;
}

interface NetwalletConfig {
  primaryKey: string;
  secondaryKey: string;
  email: string;
  hashEnabled: boolean;
}

function config(): NetwalletConfig {
  reloadEnv();
  const env = {
    primaryKey: process.env.NETWALLET_PRIMARY_KEY?.trim() ?? "",
    secondaryKey: process.env.NETWALLET_SECONDARY_KEY?.trim() ?? "",
    email: process.env.NETWALLET_EMAIL?.trim() ?? "",
    hashEnabled: (process.env.NETWALLET_HASH_ENABLED ?? "").toLowerCase() === "true",
  };
  try {
    const cfgPath = path.join(dataDir(), "config.json");
    if (fs.existsSync(cfgPath)) {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
      return {
        primaryKey: env.primaryKey || cfg.netwalletPrimaryKey || "",
        secondaryKey: env.secondaryKey || cfg.netwalletSecondaryKey || "",
        email: env.email || cfg.netwalletEmail || "",
        hashEnabled: env.hashEnabled || !!cfg.netwalletHashEnabled,
      };
    }
  } catch {
    /* ignore */
  }
  return { primaryKey: env.primaryKey, secondaryKey: env.secondaryKey, email: env.email, hashEnabled: env.hashEnabled };
}

export function paymentConfigured(): boolean {
  const c = config();
  return !!c.primaryKey && !!c.email;
}

// --- Token -------------------------------------------------------------------

let tokenCache: { token: string; expiresAt: number } | null = null;

// Fetch avec timeout + retries sur les erreurs réseau transitoires.
async function fetchNetwallet(url: string, options: RequestInit, label: string): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(url, { ...options, signal: ctrl.signal });
      clearTimeout(timer);
      return res;
    } catch (err) {
      lastErr = err;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
    }
  }
  console.error(`[payment] échec réseau Netwallet (${label}):`, lastErr);
  throw new Error(`Impossible de joindre NetWallet (${label}) — vérifiez votre connexion internet et réessayez.`);
}

async function getAccessToken(): Promise<string> {
  const c = config();
  if (tokenCache && tokenCache.expiresAt > Date.now() + 60_000) return tokenCache.token;
  const body = new URLSearchParams({
    primary_key: c.primaryKey,
    email: c.email,
    grant_type: "primary_key",
  });
  const res = await fetchNetwallet(
    `${BASE_URL}/api/v1/token`,
    { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() },
    "authentification"
  );
  if (!res.ok) throw new Error(`Échec d'authentification Netwallet (${res.status})`);
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("Aucun token Netwallet retourné");
  tokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 900) * 1000 };
  return tokenCache.token;
}

export function computeHash(payload: string): string {
  return crypto.createHash("sha256").update(payload).digest("hex");
}

// --- Messages d'erreur explicites ---------------------------------------------

const ERROR_BY_CODE: Record<string, string> = {
  "4000": "La transaction a échoué — vérifiez que le numéro Mobile Money est valide, actif et que le solde est suffisant.",
  "4001": "Informations du destinataire invalides.",
  "4002": "Hash invalide — vérifiez la configuration du hash côté marchand.",
  "4003": "Solde insuffisant pour effectuer le paiement.",
  "4004": "Devise non supportée.",
  "4005": "Numéro de téléphone invalide.",
  "4006": "Commande déjà existante — réessayez.",
  "4007": "Informations de la commande invalides.",
  "4008": "Méthode non supportée.",
  "4009": "Transaction annulée par l'utilisateur.",
  "4010": "Méthode de paiement non supportée.",
  "5000": "NetWallet rencontre un problème temporaire — réessayez dans quelques instants.",
};

function netwalletErrorMessage(data: unknown, httpStatus: number): string {
  const d = (data ?? {}) as Record<string, unknown>;
  const code = String(d.errorCode ?? d.code ?? d.statusCode ?? "").trim();
  if (code && ERROR_BY_CODE[code]) return ERROR_BY_CODE[code];

  const msg = String(d.message ?? "").toLowerCase();
  if (/(balance|not enough|sufficient|solde)/.test(msg)) return "Solde insuffisant pour effectuer le paiement.";
  if (/(phone|number)/.test(msg)) return "Numéro de téléphone invalide.";
  if (/hash/.test(msg)) return "Hash invalide — vérifiez la configuration du hash côté marchand.";
  if (/order/.test(msg)) return "Informations de la commande invalides — vérifiez les paramètres.";
  if (/currency/.test(msg)) return "Devise non supportée.";
  if (/duplicate/.test(msg)) return "Commande déjà existante — réessayez.";
  if (/method/.test(msg)) return "Méthode de paiement non supportée.";
  if (/receiver/.test(msg)) return "Informations du destinataire invalides.";

  if (d.message) return String(d.message);
  return `Échec du paiement (${httpStatus}).`;
}

// --- Paiement ----------------------------------------------------------------

export interface Provider {
  id: string;
  name: string;
  methodType: string;
}

const DEFAULT_PROVIDERS: Provider[] = [
  { id: "mtn_cm", name: "MTN Mobile Money", methodType: "MOMO" },
  { id: "orange_cm", name: "Orange Money", methodType: "ORANGE_MONEY" },
  { id: "netwallet_cm", name: "Netwallet Pay", methodType: "NETWALLET_PAY" },
];

export async function getProviders(): Promise<Provider[]> {
  try {
    const token = await getAccessToken();
    const res = await fetchNetwallet(
      `${BASE_URL}/api/v1/lookup/get-providers/collection/MOBILE_MONEY/CM`,
      { headers: { Authorization: `Bearer ${token}` } },
      "récupération des opérateurs"
    );
    if (!res.ok) return DEFAULT_PROVIDERS;
    const data = (await res.json()) as { data?: { id: string; name: string }[] };
    // On ne propose que les opérateurs Mobile Money (MTN / Orange), cohérents
    // avec Method=MOBILE_MONEY utilisé par initiatePayment.
    const list = (data.data ?? []).filter((p) => /mtn|orange/i.test(p.id));
    const merged = list.map((p) => ({
      id: p.id,
      name: p.name,
      methodType: /orange/i.test(p.id) ? "ORANGE_MONEY" : "MOMO",
    }));
    return merged.length ? merged : DEFAULT_PROVIDERS;
  } catch {
    return DEFAULT_PROVIDERS;
  }
}

export async function initiatePayment(opts: {
  phoneNumber: string;
  methodProvider: string;
  methodType: string;
  plan?: PaymentPlan;
}): Promise<{ transactionId: string; orderId: string; amount: number; plan: PaymentPlan }> {
  const c = config();
  const token = await getAccessToken();
  const orderId = `SLIDER${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const plan: PaymentPlan = opts.plan ?? "subscription";
  const amount = plan === "subscription" ? PRICE_XAF : EXPORT_PRICE_XAF;

  const body: Record<string, unknown> = {
    CurrencyCode: "XAF",
    OrderID: orderId,
    Amount: amount,
    Method: "MOBILE_MONEY",
    MethodType: opts.methodType,
    CountryCode: "CM",
    MethodProvider: opts.methodProvider,
    PhoneNumber: opts.phoneNumber,
    Description: plan === "subscription" ? "Abonnement mensuel Slider" : "Export Slider (à l'acte)",
  };

  // Hash : UNIQUEMENT si le "hashing" est explicitement activé côté marchand.
  if (c.hashEnabled) {
    const hashInput = `COLLECTION_MOBILE_MONEY_${opts.methodProvider}_${orderId}_${c.secondaryKey}`;
    body.Hash = computeHash(hashInput);
  }

  const res = await fetchNetwallet(
    `${BASE_URL}/api/v1/global/collection/request-payment`,
    { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) },
    "demande de paiement"
  );
  const data = (await res.json()) as { statusCode?: number; data?: unknown; message?: string };
  if (!res.ok || (data.statusCode !== undefined && data.statusCode !== 200)) {
    throw new Error(netwalletErrorMessage(data, res.status));
  }
  return { transactionId: String(data.data), orderId, amount, plan };
}

export async function getTransactionStatus(transactionId: string): Promise<{
  status: string;
  amount?: number;
  orderId?: string;
  message?: string;
}> {
  const token = await getAccessToken();
  const res = await fetchNetwallet(
    `${BASE_URL}/api/v1/global/transaction-status/${encodeURIComponent(transactionId)}`,
    { headers: { Authorization: `Bearer ${token}` } },
    "vérification du statut"
  );
  const data = (await res.json()) as { data?: { status?: string; amount?: number; orderId?: string } };
  if (!res.ok) throw new Error(netwalletErrorMessage(data, res.status));

  const status = (data.data?.status ?? "UNKNOWN").toUpperCase();
  let message: string | undefined;
  if (status === "FAILED") message = "Le paiement a échoué (solde insuffisant ou refusé).";
  else if (status === "CANCELLED" || status === "CANCELED") message = "Paiement annulé.";
  else if (status === "TIMEOUT") message = "Délai dépassé : la demande n'a pas été validée à temps.";

  return { status, amount: data.data?.amount, orderId: data.data?.orderId, message };
}

// --- Stockage de l'abonnement / usage ---------------------------------------

export interface Subscription {
  active: boolean;
  expiresAt: number;
  lastTransactionId?: string;
  exportCredits: number;
  pendingOrders: Record<string, PaymentPlan>;
  daily: { date: string; slides: number };
}

const SUB_KEY = "subscription";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultSubscription(): Subscription {
  return {
    active: false,
    expiresAt: 0,
    exportCredits: 0,
    pendingOrders: {},
    daily: { date: todayStr(), slides: 0 },
  };
}

async function readSubscription(): Promise<Subscription> {
  const parsed = await storeGet<Partial<Subscription>>(SUB_KEY, {});
  const def = defaultSubscription();
  const daily = parsed.daily && parsed.daily.date === todayStr() ? parsed.daily : def.daily;
  return {
    ...def,
    ...parsed,
    exportCredits: typeof parsed.exportCredits === "number" ? parsed.exportCredits : 0,
    pendingOrders: parsed.pendingOrders ?? {},
    daily,
  };
}

async function writeSubscription(sub: Subscription): Promise<void> {
  await storeSet(SUB_KEY, sub);
}

export async function getSubscription(): Promise<
  Subscription & { price: number; exportPrice: number; currency: string; configured: boolean; dailyLimit: number; dailyUsed: number }
> {
  const sub = await readSubscription();
  const active = sub.active && sub.expiresAt > Date.now();
  return {
    ...sub,
    active,
    price: PRICE_XAF,
    exportPrice: EXPORT_PRICE_XAF,
    currency: "XAF",
    configured: paymentConfigured(),
    dailyLimit: DAILY_SLIDE_LIMIT,
    dailyUsed: sub.daily.slides,
  };
}

export async function activateSubscription(transactionId?: string): Promise<Subscription> {
  const sub = await readSubscription();
  sub.active = true;
  sub.expiresAt = Date.now() + SUBSCRIPTION_DAYS * 24 * 60 * 60 * 1000;
  sub.lastTransactionId = transactionId;
  await writeSubscription(sub);
  return sub;
}

export async function addExportCredit(transactionId?: string): Promise<Subscription> {
  const sub = await readSubscription();
  sub.exportCredits += 1;
  sub.lastTransactionId = transactionId;
  await writeSubscription(sub);
  return sub;
}

export async function consumeExportCredit(): Promise<boolean> {
  const sub = await readSubscription();
  if (sub.exportCredits > 0) {
    sub.exportCredits -= 1;
    await writeSubscription(sub);
    return true;
  }
  return false;
}

export async function setPendingOrder(transactionId: string, plan: PaymentPlan): Promise<void> {
  const sub = await readSubscription();
  sub.pendingOrders[transactionId] = plan;
  await writeSubscription(sub);
}

export async function consumePendingOrder(transactionId: string): Promise<PaymentPlan | null> {
  const sub = await readSubscription();
  const plan = sub.pendingOrders[transactionId] ?? null;
  delete sub.pendingOrders[transactionId];
  await writeSubscription(sub);
  return plan;
}

// --- Quota quotidien de génération IA ----------------------------------------

export async function getDailyRemaining(): Promise<number> {
  const sub = await readSubscription();
  return Math.max(0, DAILY_SLIDE_LIMIT - sub.daily.slides);
}

export async function consumeDailySlides(n: number): Promise<number> {
  const sub = await readSubscription();
  sub.daily = { date: todayStr(), slides: sub.daily.slides + n };
  await writeSubscription(sub);
  return Math.max(0, DAILY_SLIDE_LIMIT - sub.daily.slides);
}
