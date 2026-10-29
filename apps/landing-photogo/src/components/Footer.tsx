import { Camera } from "lucide-react";

// Links sociais ocultos por enquanto — reativar quando houver contas oficiais:
// import { Github, Instagram, Twitter } from "lucide-react";
// <a href="https://github.com/..." aria-label="GitHub"> <Github .../> </a>
// <a href="https://instagram.com/..." aria-label="Instagram"> <Instagram .../> </a>
// <a href="https://twitter.com/..." aria-label="Twitter"> <Twitter .../> </a>

// Links do footer — apenas âncoras internas que realmente existem na página.
// Links externos para páginas inexíveis (about, blog, careers, privacy,
// onboarding, guide, license, help, dmca, contact, roadmap) foram removidos.
const sections = [
  {
    title: "Produto",
    links: [
      { href: "#features", label: "Recursos" },
      { href: "#pricing", label: "Planos" },
      { href: "#early-access", label: "Acesso antecipado" },
    ],
  },
  {
    title: "Navegação",
    links: [
      { href: "#photographers", label: "Para Fotógrafos" },
      { href: "#buyers", label: "Para Compradores" },
      { href: "#faq", label: "FAQ" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-ink-900/5 bg-ink-50 dark:border-paper-100/5 dark:bg-ink-900">
      <div className="container-wide py-16">
        <div className="grid gap-12 lg:grid-cols-6">
          <div className="lg:col-span-4">
            <a href="#" className="flex items-center gap-2 font-mono text-lg font-semibold tracking-tight">
              <Camera className="h-6 w-6 text-sunset-500" strokeWidth={1.75} />
              <span>PhotoGo</span>
            </a>
            <p className="mt-4 max-w-md text-sm text-ink-600 dark:text-paper-200">
              O marketplace brasileiro dos fotógrafos. Venda fotos digitais, impressas e licenciadas.
            </p>
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
          <p>© {new Date().getFullYear()} PhotoGo. Todos os direitos reservados.</p>
          <p className="font-mono">
            Made with <span className="text-sunset-500">♥</span> in Brazil
          </p>
        </div>
      </div>
    </footer>
  );
}
