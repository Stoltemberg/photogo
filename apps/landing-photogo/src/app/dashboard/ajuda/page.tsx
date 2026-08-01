'use client'

import { useState } from 'react'
import { ChevronDown, Mail, MessageCircle, HelpCircle, ExternalLink } from 'lucide-react'

const faqs = [
  {
    q: 'Como faço para enviar minhas fotos?',
    a: 'Vá em "Meu Portfólio" no menu lateral e clique em "Enviar foto". Selecione o arquivo, adicione título, descrição, preço e categoria. A foto aparecerá automaticamente no seu portfólio público.',
  },
  {
    q: 'Qual a comissão do PhotoGo por venda?',
    a: 'A comissão varia conforme seu plano: Free (6%), Pro (4,5%) e Studio (2%). Você pode fazer upgrade a qualquer momento na página "Assinatura".',
  },
  {
    q: 'Como recebo meus pagamentos?',
    a: 'Os pagamentos são processados via Mercado Pago. Você recebe os repasses diretamente na conta cadastrada. O prazo de repasse é de D+2 para Pix e D+30 para cartão.',
  },
  {
    q: 'Posso vender a mesma fotocom diferentes licenças?',
    a: 'Sim! Cada foto pode ser vendida com 5 tipos de licença: Pessoal, Editorial, Comercial, Estendida e Exclusiva. O preço é multiplicado conforme a licença escolhida pelo comprador.',
  },
  {
    q: 'Preciso de CNPJ para vender fotos?',
    a: 'Não. Como Pessoa Física (PF), você pode vender fotos usando seu CPF. Se já tiver MEI ou PJ, o cadastro é opcional e permite emitir notas fiscais.',
  },
  {
    q: 'Como funciona o certificado de autenticidade?',
    a: 'Cada foto vendida acompanha um certificado PDF com hash SHA-256 de proveniência, garantindo a autenticidade e originalidade da imagem.',
  },
  {
    q: 'Posso excluir uma foto do portfólio?',
    a: 'Sim. Em "Meu Portfólio", passe o mouse sobre a foto e clique no ícone de lixeira. A foto será removida imediatamente do seu portfólio.',
  },
  {
    q: 'Como altero meu plano?',
    a: 'Vá em "Assinatura" no menu lateral e escolha o plano desejado. O plano Free é gratuito. Pro e Studio são cobrados mensalmente via cartão ou Pix.',
  },
]

export default function AjudaPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const supportChannels = [
    {
      icon: Mail,
      title: 'Email',
      desc: 'suporte@photogo.com.br',
      href: 'mailto:suporte@photogo.com.br',
      action: 'Enviar email',
    },
    {
      icon: MessageCircle,
      title: 'WhatsApp',
      desc: 'Segunda a sexta, 9h-18h',
      href: 'https://wa.me/5511999999999',
      action: 'Abrir WhatsApp',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-mono text-2xl font-semibold text-ink-900 dark:text-paper-50">
          Ajuda & Suporte
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Encontre respostas e fale com nossa equipe
        </p>
      </div>

      {/* Support channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {supportChannels.map(({ icon: Icon, title, desc, href, action }) => (
          <a
            key={title}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-ink-900/5 bg-paper-50 p-5 hover:border-sunset-500/30 transition dark:border-paper-100/5 dark:bg-ink-900"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-sunset-500/10 flex items-center justify-center">
                <Icon className="h-6 w-6 text-sunset-500" />
              </div>
              <div className="flex-1">
                <p className="font-mono font-semibold text-ink-900 dark:text-paper-50">{title}</p>
                <p className="text-sm text-ink-500">{desc}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-ink-300 group-hover:text-sunset-500" />
            </div>
            <p className="mt-3 text-sm text-sunset-500 font-medium">{action}</p>
          </a>
        ))}
      </div>

      {/* FAQ */}
      <div className="rounded-2xl border border-ink-900/5 bg-paper-50 p-6 dark:border-paper-100/5 dark:bg-ink-900">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="h-5 w-5 text-ink-400" />
          <h3 className="font-mono text-lg font-semibold text-ink-900 dark:text-paper-50">
            Perguntas frequentes
          </h3>
        </div>
        <div className="space-y-2">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-ink-900/5 overflow-hidden dark:border-paper-100/5"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-ink-50 dark:hover:bg-ink-800"
              >
                <span className="text-sm font-medium text-ink-900 dark:text-paper-50">
                  {faq.q}
                </span>
                <ChevronDown
                  className={`h-4 w-4 flex-shrink-0 text-ink-400 transition-transform ${
                    openFaq === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 pt-1 text-sm text-ink-600 dark:text-paper-200">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Links úteis */}
      <div className="rounded-2xl border border-ink-900/5 bg-paper-50 p-6 dark:border-paper-100/5 dark:bg-ink-900">
        <h3 className="font-mono text-lg font-semibold text-ink-900 dark:text-paper-50 mb-4">
          Links úteis
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href="/termos" className="flex items-center gap-2 rounded-xl border border-ink-900/10 px-4 py-3 text-sm text-ink-700 hover:bg-ink-50 dark:border-paper-100/10 dark:text-paper-200 dark:hover:bg-ink-800">
            <ExternalLink className="h-4 w-4 text-ink-400" />
            Termos de Uso
          </a>
          <a href="/privacidade" className="flex items-center gap-2 rounded-xl border border-ink-900/10 px-4 py-3 text-sm text-ink-700 hover:bg-ink-50 dark:border-paper-100/10 dark:text-paper-200 dark:hover:bg-ink-800">
            <ExternalLink className="h-4 w-4 text-ink-400" />
            Política de Privacidade
          </a>
          <a href="/guias" className="flex items-center gap-2 rounded-xl border border-ink-900/10 px-4 py-3 text-sm text-ink-700 hover:bg-ink-50 dark:border-paper-100/10 dark:text-paper-200 dark:hover:bg-ink-800">
            <ExternalLink className="h-4 w-4 text-ink-400" />
            Guias de Fotografia
          </a>
          <a href="/vender" className="flex items-center gap-2 rounded-xl border border-ink-900/10 px-4 py-3 text-sm text-ink-700 hover:bg-ink-50 dark:border-paper-100/10 dark:text-paper-200 dark:hover:bg-ink-800">
            <ExternalLink className="h-4 w-4 text-ink-400" />
            Como vender mais
          </a>
        </div>
      </div>
    </div>
  )
}