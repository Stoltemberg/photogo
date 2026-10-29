import type { Metadata } from 'next'
import Link from 'next/link'
import { Camera, ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description: 'Termos de uso do PhotoGo — marketplace brasileiro de fotografia.',
}

const sections = [
  {
    title: '1. Aceitação dos Termos',
    body: 'Ao acessar e usar o PhotoGo (photogo.com.br), você concorda em cumprir e estar vinculado aos seguintes Termos de Uso. Se você não concordar com estes termos, por favor, não utilize a plataforma.',
  },
  {
    title: '2. Cadastro e Conta',
    body: 'Para utilizar as funcionalidades de fotógrafo, é necessário criar uma conta com dados válidos. Você é responsável por manter a confidencialidade da sua senha e por todas as atividades que ocorrerem na sua conta. PhotoGo não se responsabiliza por perdas decorrentes do uso não autorizado da sua conta.',
  },
  {
    title: '3. Tipos de Conta',
    body: 'O PhotoGo aceita fotógrafos Pessoa Física (CPF), MEI (CNPJ MEI) e Pessoa Jurídica (CNPJ). Cada tipo possui regras fiscais próprias. Ao se cadastrar, você declara que as informações fornecidas são verdadeiras.',
  },
  {
    title: '4. Envio de Fotografias',
    body: 'Você declara ser o autor e titular de todos os direitos das fotografias enviadas. É proibido enviar fotos de terceiros sem autorização, fotos que violem direitos de imagem, propriedade intelectual, ou que contenham conteúdo ilegal, ofensivo ou discriminatório.',
  },
  {
    title: '5. Licenciamento',
    body: 'O PhotoGo oferece cinco tipos de licença: Pessoal, Editorial, Comercial, Estendida e Exclusiva. Cada licença possui regras específicas de uso. O fotógrafo mantém os direitos autorais; o comprador adquire apenas o direito de uso conforme a licença escolhida.',
  },
  {
    title: '6. Comissão e Pagamentos',
    body: 'O PhotoGo cobra uma comissão por venda conforme o plano do fotógrafo (Free 6%, Pro 4,5%, Studio 2%). Os pagamentos são processados via Mercado Pago. O prazo de repasse é D+2 para Pix e D+30 para cartão de crédito, após confirmação da entrega.',
  },
  {
    title: '7. Certificado de Autenticidade',
    body: 'Cada fotografia vendida recebe um certificado PDF com hash SHA-256 de proveniência. Este certificado garante a autenticidade da imagem e pode ser verificado por terceiros.',
  },
  {
    title: '8. Cancelamento e Reembolso',
    body: 'Compradores podem solicitar cancelamento em até 7 dias após a compra, conforme o Código de Defesa do Consumidor. Após o download da foto original, o reembolso não será processado.',
  },
  {
    title: '9. Suspensão e Encerramento',
    body: 'O PhotoGo pode suspender ou encerrar contas que violem estes termos. Em casos de fraude ou violação de direitos autorais, a conta será encerrada sem aviso prévio.',
  },
  {
    title: '10. Limitação de Responsabilidade',
    body: 'O PhotoGo não se responsabiliza por danos indiretos, lucros cessantes ou perdas decorrentes do uso ou impossibilidade de uso da plataforma. Nossa responsabilidade total limita-se ao valor pago pelo usuário nos últimos 12 meses.',
  },
  {
    title: '11. Alterações nos Termos',
    body: 'Estes Termos podem ser atualizados periodicamente. Notificaremos mudanças significativas por email e pela plataforma. O uso continuado após alterações constitui aceitação dos novos termos.',
  },
  {
    title: '12. Foro',
    body: 'Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer questões relativas a estes Termos, com renúncia expressa a qualquer outro, por mais privilegiado que seja.',
  },
]

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-paper-50 dark:bg-ink-950">
      <header className="border-b border-ink-900/5 dark:border-paper-100/5">
        <div className="container-wide flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-mono font-semibold text-ink-900 dark:text-paper-50">
            <Camera className="h-6 w-6 text-sunset-500" />
            PhotoGo
          </Link>
          <Link href="/" className="flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900 dark:hover:text-paper-200">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </div>
      </header>

      <main className="container-wide py-16 max-w-3xl">
        <div className="animate-page-enter">
          <p className="text-xs uppercase tracking-widest text-sunset-500 font-mono">Documento legal</p>
          <h1 className="mt-3 font-mono text-4xl font-semibold tracking-tight text-ink-900 dark:text-paper-50">
            Termos de Uso
          </h1>
          <p className="mt-3 text-sm text-ink-500">
            Última atualização: janeiro de 2026 · Versão 1.0
          </p>
        </div>

        <div className="prose prose-ink dark:prose-invert mt-12 max-w-none">
          {sections.map((section, idx) => (
            <section
              key={section.title}
              className="animate-page-enter mb-10"
              style={{ animationDelay: `${idx * 40}ms` }}
            >
              <h2 className="font-mono text-xl font-semibold text-ink-900 dark:text-paper-50">
                {section.title}
              </h2>
              <p className="mt-3 text-ink-600 dark:text-paper-200 leading-relaxed">
                {section.body}
              </p>
            </section>
          ))}
        </div>

        <div className="mt-16 rounded-2xl border border-ink-900/5 bg-ink-100/50 p-6 dark:border-paper-100/5 dark:bg-ink-900/50">
          <p className="text-sm text-ink-600 dark:text-paper-200">
            Dúvidas sobre os Termos de Uso? Entre em contato:{' '}
            <a href="mailto:juridico@photogo.com.br" className="text-sunset-500 hover:underline font-medium">
              juridico@photogo.com.br
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
