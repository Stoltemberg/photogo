import { ArrowRight, Camera, Sparkles } from "lucide-react";

const heroPhotos = [
  { src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", alt: "Montanha ao amanhecer", category: "Paisagem" },
  { src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&q=80", alt: "Retrato feminino", category: "Retrato" },
  { src: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80", alt: "Casamento ao ar livre", category: "Casamento" },
  { src: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&q=80", alt: "Carro clássico", category: "Automotivo" },
  { src: "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&q=80", alt: "Gato", category: "Animais" },
  { src: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80", alt: "Cidade à noite", category: "Urbana" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-32">
      {/* Background gradient */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-b from-paper-50 via-paper-50 to-paper-100 dark:from-ink-950 dark:via-ink-950 dark:to-ink-900"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 -z-10 h-96 bg-gradient-to-b from-sunset-500/10 to-transparent dark:from-sunset-500/5"
      />

      <div className="container-wide">
        <div className="mx-auto max-w-3xl text-center">
          <span className="badge mb-6">
            <Sparkles className="h-3 w-3 text-sunset-500" />
            Construído sobre Spree Commerce 6.0
          </span>

          <h1 className="text-balance font-mono text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            O marketplace
            <br />
            <span className="text-sunset-500">dos fotógrafos</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-ink-600 dark:text-paper-200 sm:text-xl">
            Venda fotos digitais, impressas e licenciadas. Receba repasses automáticos via Stripe Connect. Sem lidar com gateways, sem dor de cabeça com licenças.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a href="#early-access" className="btn-primary">
              Quero vender minhas fotos
              <ArrowRight className="h-4 w-4" strokeWidth={2} />
            </a>
            <a href="#features" className="btn-secondary">
              <Camera className="h-4 w-4" strokeWidth={1.75} />
              Ver como funciona
            </a>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-ink-600 dark:text-paper-300">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Sem mensalidade para começar
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Repasses automáticos via Stripe
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Licenças profissionais
            </div>
          </div>
        </div>

        {/* Photo gallery preview */}
        <div className="relative mt-20 sm:mt-28">
          <div className="grid-masonry grid gap-4">
            {heroPhotos.map((photo, idx) => (
              <div
                key={photo.src}
                className={`group relative overflow-hidden rounded-2xl bg-ink-900 shadow-xl ring-1 ring-ink-900/5 transition hover:shadow-2xl dark:ring-paper-100/5 ${
                  idx === 0 ? "row-span-2" : idx === 3 ? "row-span-2" : ""
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 transition group-hover:opacity-100">
                  <span className="text-xs font-medium text-white">{photo.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
