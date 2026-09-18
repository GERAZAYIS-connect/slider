import { useEffect, useState } from "react";
import { Lock, Loader2, ArrowRight, CheckCircle2, Smartphone, ShieldCheck, CalendarClock, Download } from "lucide-react";
import { useToast } from "./Toast";
import {
  apiPaymentInitiate,
  apiPaymentStatus,
  apiPaymentProviders,
  type PaymentProvider,
} from "../lib/api";

const DEFAULT_PROVIDERS: PaymentProvider[] = [
  { id: "mtn_cm", name: "MTN Mobile Money", methodType: "MOMO" },
  { id: "orange_cm", name: "Orange Money", methodType: "ORANGE_MONEY" },
];

function validationInstruction(provider: PaymentProvider) {
  if (provider.id.startsWith("orange")) {
    return {
      title: "Validez le paiement Orange Money",
      steps: [
        "Un message USSD s'affiche sur votre téléphone.",
        "Saisissez votre code secret Orange Money.",
        "Validez pour confirmer le paiement.",
      ],
    };
  }
  return {
    title: "Validez le paiement MTN MoMo",
    steps: [
      "Un message USSD MTN s'affiche sur votre téléphone.",
      "Saisissez votre code PIN MoMo.",
      "Validez pour confirmer le paiement.",
    ],
  };
}

type Plan = "subscription" | "export";

interface PaywallProps {
  price: number;
  exportPrice: number;
  defaultPlan?: Plan;
  onSuccess: () => void;
}

export function Paywall({ price, exportPrice, defaultPlan = "subscription", onSuccess }: PaywallProps) {
  const { push } = useToast();
  const [plan, setPlan] = useState<Plan>(defaultPlan);
  const [providers, setProviders] = useState<PaymentProvider[]>(DEFAULT_PROVIDERS);
  const [provider, setProvider] = useState(DEFAULT_PROVIDERS[0]);
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "paying" | "pending" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiPaymentProviders()
      .then((p) => {
        if (p.length) {
          setProviders(p);
          setProvider(p[0]);
        }
      })
      .catch(() => {});
  }, []);

  const amount = plan === "subscription" ? price : exportPrice;
  const instruction = validationInstruction(provider);

  const pay = async () => {
    const clean = phone.replace(/[^0-9+]/g, "");
    if (clean.length < 9) {
      setError("Entrez un numéro de téléphone valide.");
      return;
    }
    setError(null);
    setState("paying");
    try {
      const res = await apiPaymentInitiate({
        phoneNumber: clean,
        methodProvider: provider.id,
        methodType: provider.methodType,
        plan,
      });
      setState("pending");
      poll(res.transactionId);
    } catch (err) {
      setError((err as Error).message);
      setState("idle");
    }
  };

  const poll = async (transactionId: string) => {
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      try {
        const res = await apiPaymentStatus(transactionId);
        if (res.status === "SUCCESS" || res.status === "SUCCESSFUL") {
          setState("success");
          push(plan === "subscription" ? "Paiement confirmé — abonnement activé." : "Paiement confirmé — crédit d'export ajouté.", "success");
          setTimeout(onSuccess, 1200);
          return;
        }
        if (res.status === "FAILED" || res.status === "CANCELLED" || res.status === "CANCELED" || res.status === "TIMEOUT" || res.status === "EXPIRED") {
          setError(res.message || "Paiement non abouti. Réessayez.");
          setState("idle");
          return;
        }
      } catch {
        /* continue polling */
      }
    }
    setError("Délai de confirmation dépassé. Vérifiez le paiement puis réessayez.");
    setState("idle");
  };

  return (
    <div className="app-shell flex items-center justify-center overflow-y-auto bg-paper p-4 text-ink">
      <div className="w-full max-w-md border border-ink bg-paper shadow-hard">
        <div className="border-b border-ink bg-ink p-5 text-paper">
          <div className="flex items-center gap-2.5">
            <div className="h-4 w-4 bg-blue" />
            <span className="text-sm font-extrabold uppercase tracking-widest">Slider</span>
          </div>
          <h1 className="mt-4 text-2xl font-extrabold leading-tight">
            Choisissez votre <em className="italic text-blue-light">formule</em>
          </h1>
          <p className="mt-2 text-sm text-paper/70">Débloquez la génération IA et les exports de présentations.</p>
        </div>

        <div className="p-5">
          {/* Sélecteur de formule */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPlan("subscription")}
              className={`flex flex-col items-start gap-1 border p-3 text-left transition ${
                plan === "subscription" ? "border-blue bg-blue/5" : "border-ink/20 hover:border-ink"
              }`}
            >
              <CalendarClock className="h-5 w-5 text-blue" />
              <span className="text-sm font-bold">Abonnement</span>
              <span className="text-xs text-grey">{price.toLocaleString("fr-FR")} FCFA / mois</span>
              <span className="text-[11px] text-grey">15 diapos IA / jour</span>
            </button>
            <button
              onClick={() => setPlan("export")}
              className={`flex flex-col items-start gap-1 border p-3 text-left transition ${
                plan === "export" ? "border-blue bg-blue/5" : "border-ink/20 hover:border-ink"
              }`}
            >
              <Download className="h-5 w-5 text-blue" />
              <span className="text-sm font-bold">À l'acte</span>
              <span className="text-xs text-grey">{exportPrice.toLocaleString("fr-FR")} FCFA / export</span>
              <span className="text-[11px] text-grey">Sans abonnement</span>
            </button>
          </div>

          {state === "pending" ? (
            <div className="mt-5 border border-ink bg-ink p-5 text-center text-paper">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-light" />
              <p className="mt-3 text-sm font-semibold">Confirmez le paiement sur votre téléphone…</p>
              <p className="mt-1 text-xs text-paper/60">Validez la demande Mobile Money envoyée au {phone}</p>
            </div>
          ) : state === "success" ? (
            <div className="mt-5 border border-ink p-5 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-500" />
              <p className="mt-2 text-sm font-semibold">
                {plan === "subscription" ? "Abonnement activé !" : "Crédit d'export ajouté !"}
              </p>
            </div>
          ) : (
            <>
              <div className="mt-5">
                <div className="label">Opérateur</div>
                <div className="grid grid-cols-2 gap-2">
                  {providers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setProvider(p)}
                      className={`flex items-center justify-center gap-2 border p-3 text-sm font-semibold transition ${
                        provider.id === p.id ? "border-blue bg-blue/5" : "border-ink/20 hover:border-ink"
                      }`}
                    >
                      <Smartphone className="h-4 w-4 text-blue" />
                      {p.name.replace(" Mobile Money", "").replace(" Money", "")}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <label className="label">Numéro de téléphone</label>
                <input
                  className="input"
                  inputMode="tel"
                  placeholder="Ex. 6 90 00 00 00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {error && <p className="mt-3 text-sm text-[#D64545]">{error}</p>}

              <button onClick={pay} disabled={state === "paying"} className="btn btn-primary mt-5 w-full px-5 py-3 text-base disabled:opacity-60">
                {state === "paying" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                {state === "paying" ? "Initialisation…" : `Payer ${amount.toLocaleString("fr-FR")} FCFA`}
                <ArrowRight className="h-4 w-4" />
              </button>

              <p className="mt-4 flex items-start gap-2 text-xs text-grey">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue" />
                Paiement sécurisé via NetWallet. Abonnement valable 30 jours ; export à l'acte sans engagement.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
