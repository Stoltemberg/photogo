import {
  BadgeCheck,
  Camera,
  CreditCard,
  Download,
  ImageIcon,
  Layers,
  MapPin,
  Shield,
  Users,
} from "lucide-react";

const features = {
  photographers: [
    {
      icon: Camera,
      title: "Upload em massa",
      description:
        "Drag-drop de 100 fotos de uma vez. Extraímos EXIF, criamos previews WebP, mantemos o RAW original.",
    },
    {
      icon: CreditCard,
      title: "Repasses automáticos",
      description:
        "Stripe Connect Express. Você recebe Pix/transferência direto. Comissão da plataforma descontada na hora.",
    },
    {
      icon: Shield,
      title: "Licenças profissionais",
      description:
        "Personal, comercial, editorial, exclusive. PDFs de certificado com hash de autenticidade.",
    },
    {
      icon: BadgeCheck,
      title: "Selo Verified Pro",
      description:
        "Verificação KYC + verificação de portfólio. Mais visibilidade, mais vendas.",
    },
    {
      icon: Layers,
      title: "Pacotes e álbuns",
      description:
        "Crie bundles temáticos (Casamento, Paisagens, etc). Preço único, entrega por ZIP ou impressões.",
    },
    {
      icon: Users,
      title: "Painel completo",
      description:
        "Métricas em tempo real, payouts agendados, mensagens de clientes. Tudo em um lugar.",
    },
  ],
  buyers: [
    {
      icon: ImageIcon,
      title: "Galeria curada",
      description:
        "Busca por lente, ISO, abertura, localização GPS. Encontre a foto exata que precisa.",
    },
    {
      icon: Download,
      title: "Entrega instantânea",
      description:
        "Compra de foto digital → link seguro em <1min. Original em RAW, JPG ou TIFF.",
    },
    {
      icon: MapPin,
      title: "Mapa interativo",
      description:
        "Veja fotos georreferenciadas. Encontre imagens de lugares específicos do mundo.",
    },
  ],
};

export function Features() {
  return (
    <section id="features" className="border-t border-ink-900/5 py-20 dark:border-paper-100/5 sm:py-32">
      <div className="container-wide">
        <div className="mx-auto max-w-2xl text-center">
          <span className="badge mb-6">Recursos</span>
          <h2 className="text-balance font-mono text-4xl font-semibold tracking-tight sm:text-5xl">
            Tudo que um fotógrafo
            <br />
            <span className="text-sunset-500">precisa para vender</span>
          </h2>
          <p className="mt-4 text-pretty text-lg text-ink-600 dark:text-paper-200">
            Construído sobre Spree Commerce 6.0 — open-source, self-hosted, sem royalties.
          </p>
        </div>

        <div id="photographers" className="mt-20">
          <h3 className="font-mono text-2xl font-semibold tracking-tight">
            Para Fotógrafos
          </h3>
          <p className="mt-2 text-ink-600 dark:text-paper-200">
            Da primeira foto ao payout — tudo otimizado.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.photographers.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>

        <div id="buyers" className="mt-20">
          <h3 className="font-mono text-2xl font-semibold tracking-tight">
            Para Compradores
          </h3>
          <p className="mt-2 text-ink-600 dark:text-paper-200">
            Encontre a foto certa em segundos.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.buyers.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-ink-900/5 bg-paper-50 p-6 transition hover:border-sunset-500/20 hover:shadow-lg dark:border-paper-100/5 dark:bg-ink-900 dark:hover:border-sunset-500/20">
      <div className="inline-flex rounded-lg bg-sunset-500/10 p-2.5 text-sunset-500 transition group-hover:bg-sunset-500/15">
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </div>
      <h4 className="mt-4 font-mono text-lg font-semibold tracking-tight">{title}</h4>
      <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-paper-200">
        {description}
      </p>
    </div>
  );
}
