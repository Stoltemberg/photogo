import type { Metadata } from 'next'
import Link from 'next/link'
import { Camera, ArrowLeft, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Política de Privacidade',
  description: 'Política de Privacidade do PhotoGo — como protegemos seus dados.',
}

const sections = [
  {
    title: '1. Dados que coletamos',
    body: 'Coletamos: (a) dados de cadastro — nome, email, CPF/CNPJ, telefone; (b) dados de pagamento — processados por Mercado Pago (não armazenamos números de cartão); (c) dados de uso — páginas visitadas, IP, dispositivo; (d) conteúdo — fotos e portfólio enviados.',
  },
  {
    title: '2. Como usamos seus dados',
    body: 'Usamos seus dados para: (a) operar a plataforma e processar transações; (b) emitir notas fiscais; (c) prevenir fraudes; (d) melhorar o produto; (e) enviar comunicações sobre o serviço. Nunca vendemos seus dados.',
  },
  {
    title: '3. Base legal (LGPD)',
    body: 'Tratamos seus dados conforme as bases legais da Lei Geral de Proteção de Dados: execução de contrato (vendas), cumprimento de obrigação legal (notas fiscais, retenção tributária), legítimo interesse (segurança), e consentimento (marketing).',
  },
  {
    title: '4. Compartilhamento',
    body: 'Compartilhamos dados apenas com: (a) processadores de pagamento (Mercado Pago); (b) fornecedores de infraestrutura (Vercel, AWS); (c) autoridades quando legalmente exigido. Exigimos que todos os processadores cumpram a LGPD.',
  },
  {
    title: '5. Cookies',
    body: 'Usamos cookies essenciais (autenticação, carrinho) e cookies analíticos (PostHog). Você pode desativar cookies analíticos nas configurações do seu navegador. Cookies são essenciais para o funcionamento da plataforma.',
  },
  {
    title: '6. Seus direitos (LGPD Art. 18)',
    body: 'Você tem direito a: (a) confirmar a existência de tratamento; (b) acessar seus dados; (c) corrigir dados incompletos; (d) anonimizar, bloquear ou eliminar dados desnecessários; (e) portabilidade; (f) revogar consentimento. Para exercer, contate privacidade@photogo.com.br.',
  },
  {
    title: '7. Retenção de dados',
    body: 'Mantemos seus dados enquanto sua conta estiver ativa. Após o encerramento, mantemos por 5 anos conforme exigências legais (fiscais e consumeristas). Fotos e portfólio são excluídos imediatamente após o encerramento.',
  },
  {
    title: '8. Segurança',
    body: 'Usamos criptografia TLS 1.3, hash SHA-256 para senhas (via Supabase Auth), e auditorias periódicas. Mesmo assim, nenhum sistema é 100% seguro. Em caso de incidente, notificaremos a ANPD e usuários afetados em até 72h.',
  },
  {
    title: '9. Transferência internacional',
    body: 'Alguns fornecedores (Vercel, AWS) podem processar dados fora do Brasil, sempre com cláusulas-padrão contratuais da LGPD. Dados armazenados no Brasil (Supabase) por padrão.',
  },
  {
    title: '10. Encarregado de dados (DPO)',
    body: 'Nosso encarregado pelo tratamento de dados pessoais é Gabriel Stoltemberg. Contato: dpo@photogo.com.br.',
  },
  {
    title: '11. Alterações nesta política',
    body: 'Esta política pode ser atualizada. Mudanças materiais serão comunicadas por email com 30 dias de antecedência. Uso continuado após o prazo constitui aceitação.',
  },
]

export default function PrivacidadePage() {
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
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sunset-500/10">
            <Shield className="h-6 w-6 text-sunset-500" />
          </div>
          <p className="mt-4 text-xs uppercase tracking-widest text-sunset-500 font-mono">Documento legal</p>
          <h1 className="mt-2 font-mono text-4xl font-semibold tracking-tight text-ink-900 dark:text-paper-50">
            Política de Privacidade
          </h1>
          <p className="mt-3 text-sm text-ink-500">
            Última atualização: janeiro de 2026 · Versão 1.0 · Conforme LGPD (Lei 13.709/2018)
          </p>
        </div>

        <div className="mt-12 space-y-10">
          {sections.map((section, idx) => (
            <section
              key={section.title}
              className="animate-page-enter"
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
            Dúvidas sobre privacidade?{' '}
            <a href="mailto:privacidade@photogo.com.br" className="text-sunset-500 hover:underline font-medium">
              privacidade@photogo.com.br
            </a>
            {' '}ou nosso DPO:{' '}
            <a href="mailto:dpo@photogo.com.br" className="text-sunset-500 hover:underline font-medium">
              dpo@photogo.com.br
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
