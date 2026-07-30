import { Camera, Github, Instagram, Twitter } from "lucide-react";

const sections = [
  {
    title: "Produto",
    links: [
      { href: "#features", label: "Recursos" },
      { href: "#pricing", label: "Planos" },
      { href: "#early-access", label: "Acesso antecipado" },
      { href: "/roadmap", label: "Roadmap" },
    ],
  },
  {
    title: "Fotógrafos",
    links: [
      { href: "/photographers/onboarding", label: "Tornar-se fotógrafo" },
      { href: "/photographers/guide", label: "Guia do fotógrafo" },
      { href: "/photographers/license", label: "Modelos de licença" },
      { href: "/photographers/community", label: "Comunidade" },
    ],
  },
  {
    title: "Compradores",
    links: [
      { href: "/buyers/license", label: "Tipos de licença" },
      { href: "/buyers/help", label: "Central de ajuda" },
      { href: "/buyers/dmca", label: "DMCA / Anti-pirataria" },
      { href: "/buyers/contact", label: "Contato" },
    ],
  },
  {
    title: "Empresa",
    links: [
      { href: "/about", label: "Sobre" },
      { href: "/blog", label: "Blog" },
      { href: "/careers", label: "Carreiras" },
      { href: "/privacy", label: "Privacidade" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-ink-900/5 bg-ink-50 dark:border-paper-100/5 dark:bg-ink-900">
      <div className="container-wide py-16">
        <div className="grid gap-12 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <a href="#" className="flex items-center gap-2 font-mono text-lg font-semibold tracking-tight">
              <Camera className="h-6 w-6 text-sunset-500" strokeWidth={1.75} />
              <span>PhotoGo</span>
            </a>
            <p className="mt-4 max-w-xs text-sm text-ink-600 dark:text-paper-200">
              O marketplace brasileiro dos fotógrafos. Venda fotos digitais, impressas e licenciadas.
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="https://github.com/Stoltemberg/photogo"
                aria-label="GitHub"
                className="rounded-full border border-ink-900/10 p-2 text-ink-700 transition hover:bg-paper-100 dark:border-paper-100/10 dark:text-paper-200 dark:hover:bg-ink-800"
              >
                <Github className="h-4 w-4" strokeWidth={1.75} />
              </a>
              <a
                href="https://instagram.com"
                aria-label="Instagram"
                className="rounded-full border border-ink-900/10 p-2 text-ink-700 transition hover:bg-paper-100 dark:border-paper-100/10 dark:text-paper-200 dark:hover:bg-ink-800"
              >
                <Instagram className="h-4 w-4" strokeWidth={1.75} />
              </a>
              <a
                href="https://twitter.com"
                aria-label="Twitter"
                className="rounded-full border border-ink-900/10 p-2 text-ink-700 transition hover:bg-paper-100 dark:border-paper-100/10 dark:text-paper-200 dark:hover:bg-ink-800"
              >
                <Twitter className="h-4 w-4" strokeWidth={1.75} />
              </a>
            </div>
          </div>

          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="font-mono text-sm font-semibold tracking-tight">{section.title}</h4>
              <ul className="mt-4 space-y-3 text-sm">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-ink-600 transition hover:text-ink-900 dark:text-paper-200 dark:hover:text-paper-50"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ink-900/5 pt-8 text-xs text-ink-600 dark:border-paper-100/5 dark:text-paper-300 sm:flex-row">
          <p>© {new Date().getFullYear()} PhotoGo. Construído sobre Spree Commerce 6.0 (BSD-3-Clause).</p>
          <p className="font-mono">
            Made with <span className="text-sunset-500">♥</span> in Brazil
          </p>
        </div>
      </div>
    </footer>
  );
}
