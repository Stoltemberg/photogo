"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

const questions = [
  {
    q: "Como funcionam os repasses?",
    a: "Usamos Stripe Connect Express. Você cadastra sua conta, compartilha dados bancários uma vez. A cada venda, descontamos a comissão da plataforma e o restante cai direto na sua conta em até 1 dia útil.",
  },
  {
    q: "Preciso ser PJ?",
    a: "Não obrigatoriamente. Aceitamos PF com CPF/MEI. Para vendas acima de R$ 32k/ano, recomendamos CNPJ por questão fiscal. Oferecemos templates de NF-e para PJ.",
  },
  {
    q: "Posso vender fotos de qualquer tipo?",
    a: "Sim — digitais, impressas, sessões, licenças. Para fotos com pessoas, exigimos Model Release assinado. Para locais privados, Property Release.",
  },
  {
    q: "Qual a diferença entre os planos?",
    a: "Free: 6% de comissão por venda. Pro (R$16,90/mês): 4,5% de comissão + badge Verified Pro + destaque em buscas. Studio (R$49,90/mês): 2% de comissão + white-label + API + SLA 99,9%.",
  },
  {
    q: "E se eu cancelar minha conta?",
    a: "Suas fotos ficam disponíveis para downloads por mais 30 dias (cumpra obrigações com clientes). Após isso, são removidas. Histórico de vendas fica disponível para fins fiscais por 5 anos.",
  },
  {
    q: "Vocês dão suporte a RAW?",
    a: "Sim. Mantemos seu RAW original (DNG, CR2, NEF, ARW, RAF) intacto. Compradores podem baixar RAW, JPG ou TIFF. Você escolhe o que oferece.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-ink-900/5 py-20 dark:border-paper-100/5 sm:py-32">
      <div className="container-narrow">
        <div className="mx-auto max-w-2xl text-center">
          <span className="badge mb-6">FAQ</span>
          <h2 className="text-balance font-mono text-4xl font-semibold tracking-tight sm:text-5xl">
            Perguntas frequentes
          </h2>
        </div>

        <div className="mt-12 divide-y divide-ink-900/5 dark:divide-paper-100/5">
          {questions.map((item, idx) => (
            <div key={item.q}>
              <button
                type="button"
                onClick={() => setOpen(open === idx ? null : idx)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left transition hover:text-sunset-500"
                aria-expanded={open === idx}
              >
                <span className="font-mono text-lg font-medium">{item.q}</span>
                <ChevronDown
                  className={`h-5 w-5 flex-shrink-0 transition-transform ${
                    open === idx ? "rotate-180 text-sunset-500" : ""
                  }`}
                  strokeWidth={1.75}
                />
              </button>
              {open === idx && (
                <p className="pb-5 text-ink-600 dark:text-paper-200">{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
