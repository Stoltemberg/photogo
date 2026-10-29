"use client";

import { ArrowRight, Upload, Wallet, Award } from "lucide-react";
import { FadeInSection } from "./FadeInSection";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Faça upload do seu portfólio",
    description:
      "Drag-drop de 100 fotos. Extraímos EXIF, criamos previews, organizamos por categorias.",
  },
  {
    number: "02",
    icon: Award,
    title: "Defina seus preços e licenças",
    description:
      "Personal, comercial, editorial. Pacotes, impressões. Você tem controle total.",
  },
  {
    number: "03",
    icon: Wallet,
    title: "Receba repasses automáticos",
    description:
      "Stripe Connect Express. Pix, transferência, no seu ritmo (semanal, mensal ou manual).",
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-ink-900/5 bg-ink-50 py-20 dark:border-paper-100/5 dark:bg-ink-900 sm:py-32">
      <div className="container-wide">
        <FadeInSection className="mx-auto max-w-2xl text-center">
          <span className="badge mb-6">Como funciona</span>
          <h2 className="text-balance font-mono text-4xl font-semibold tracking-tight sm:text-5xl">
            3 passos para começar
            <br />
            <span className="text-sunset-500">a vender hoje</span>
          </h2>
        </FadeInSection>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {steps.map((step, idx) => (
            <FadeInSection key={step.number} delay={`delay-${(idx + 1) * 100}`}>
              <div className="relative">
                {idx < steps.length - 1 && (
                  <div
                    aria-hidden
                    className="absolute left-1/2 top-16 hidden h-px w-full bg-gradient-to-r from-sunset-500/30 to-transparent lg:block"
                  />
                )}
                <div className="relative flex flex-col items-center text-center">
                  <div className="relative mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-sunset-500/10 text-sunset-500 transition hover:scale-110">
                    <step.icon className="h-9 w-9" strokeWidth={1.5} />
                    <span className="absolute -top-2 -right-2 rounded-full bg-ink-900 px-2 py-0.5 font-mono text-xs font-semibold text-paper-50 dark:bg-paper-50 dark:text-ink-900">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="font-mono text-xl font-semibold tracking-tight">{step.title}</h3>
                  <p className="mt-2 max-w-xs text-sm text-ink-600 dark:text-paper-200">
                    {step.description}
                  </p>
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>

        <FadeInSection className="mt-16 flex justify-center" delay="delay-300">
          <a href="#early-access" className="btn-primary">
            Começar agora
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </a>
        </FadeInSection>
      </div>
    </section>
  );
}
