import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "R$ 0",
    period: "/mês",
    commission: "6% por venda",
    description: "Para começar a vender.",
    features: [
      "Comissão de 6% por venda",
      "Pagamentos via Stripe Connect",
      "Catálogo ilimitado",
      "Painel do fotógrafo",
      "Suporte por email",
    ],
    cta: "Começar grátis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "R$ 16,90",
    period: "/mês",
    commission: "4,5% por venda",
    description: "Para quem vende todo mês.",
    features: [
      "Comissão reduzida: 4,5%",
      "Badge Verified Pro",
      "Analytics avançado",
      "Cupons de desconto",
      "Destaque em buscas",
      "Suporte prioritário",
    ],
    cta: "Quero ser Pro",
    highlighted: true,
  },
  {
    name: "Studio",
    price: "R$ 49,90",
    period: "/mês",
    commission: "2% por venda",
    description: "Para estúdios e agências.",
    features: [
      "Comissão de 2%",
      "White-label opcional",
      "Acesso à API REST (integre com seu CMS, ERP, app)",
      "Onboarding dedicado",
      "Garantia de 99,9% de uptime mensal",
      "Suporte via telefone",
    ],
    cta: "Quero o Studio",
    highlighted: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-t border-ink-900/5 py-20 dark:border-paper-100/5 sm:py-32">
      <div className="container-wide">
        <div className="mx-auto max-w-2xl text-center">
          <span className="badge mb-6">Planos</span>
          <h2 className="text-balance font-mono text-4xl font-semibold tracking-tight sm:text-5xl">
            Comece grátis.
            <br />
            <span className="text-sunset-500">Cresça quando precisar.</span>
          </h2>
          <p className="mt-4 text-pretty text-lg text-ink-600 dark:text-paper-200">
            Sem surpresas. Cancele quando quiser. Repasses instantâneos via Stripe Connect.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-3xl border p-8 transition ${
                plan.highlighted
                  ? "border-sunset-500 bg-gradient-to-br from-sunset-500/5 to-transparent shadow-xl"
                  : "border-ink-900/5 bg-paper-50 dark:border-paper-100/5 dark:bg-ink-900"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sunset-500 px-3 py-1 text-xs font-medium text-white shadow-md">
                  Mais popular
                </span>
              )}

              <div>
                <h3 className="font-mono text-2xl font-semibold tracking-tight">{plan.name}</h3>
                <p className="mt-2 text-sm text-ink-600 dark:text-paper-200">{plan.description}</p>
              </div>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="font-mono text-5xl font-semibold tracking-tight">{plan.price}</span>
                <span className="text-sm text-ink-600 dark:text-paper-200">{plan.period}</span>
              </div>

              <ul className="mt-8 space-y-3 text-sm">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check
                      className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                        plan.highlighted ? "text-sunset-500" : "text-green-500"
                      }`}
                      strokeWidth={2.5}
                    />
                    <span className="text-ink-700 dark:text-paper-100">{feature}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#early-access"
                className={`mt-10 w-full ${
                  plan.highlighted ? "btn-primary" : "btn-secondary"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
