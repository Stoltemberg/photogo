# PhotoGo Landing

Landing page estática do **PhotoGo** construído sobre [Next.js 15](https://nextjs.org/).

Esta é a **página de marketing** (Fase 0 do [Roadmap PhotoGo](../../ROADMAP.md)) —
uma vitrine atualizável para apresentar o posicionamento, recursos e Early Access
enquanto o marketplace real (Spree 6.0) é customizado.

## Stack

- **Next.js 15** (App Router) + **React 19**
- **TypeScript** strict
- **Tailwind CSS 3** com paleta customizada (ink / sunset / paper)
- **Lucide React** para ícones
- **Vercel** para deploy e preview por PR

## Paleta

| Cor | Hex | Uso |
|---|---|---|
| `ink.950` | `#0A0A0A` | Background dark mode |
| `ink.900` | `#121212` | Backgrounds secundários |
| `paper.50` | `#FAFAFA` | Background light mode |
| `sunset.500` | `#FF6B35` | Acento principal (laranja "sunset") |
| `sunset.600` | `#E5541A` | Hover/acento forte |

## Comandos

```bash
# Instalar dependências (a partir do root do monorepo)
pnpm install

# Dev local
pnpm --filter @photogo/landing dev          # roda na porta 3000

# Build
pnpm --filter @photogo/landing build

# Typecheck
pnpm --filter @photogo/landing typecheck
```

## Estrutura

```
src/
├── app/
│   ├── layout.tsx        # Root layout, fonts, theme bootstrap
│   └── page.tsx          # Home page (compõe as seções)
├── components/
│   ├── Header.tsx        # Navbar sticky com theme toggle
│   ├── Hero.tsx          # Hero + masonry preview
│   ├── Features.tsx      # Seção de recursos (photographers + buyers)
│   ├── HowItWorks.tsx    # 3 passos
│   ├── Pricing.tsx       # 3 planos (Free, Pro, Studio)
│   ├── FAQ.tsx           # Accordion de perguntas
│   ├── CTA.tsx           # Form de early access
│   └── Footer.tsx        # Footer 6-coluna
└── styles/
    └── globals.css       # Tailwind + classes utilitárias
```

## Deploy

Configurado em `vercel.json` (root do monorepo).

- **Production:** push em `main` → https://photogo.com.br
- **Preview:** qualquer branch/PR → URL de preview única

## Próximos passos (Fase 0)

- [ ] Configurar domínio customizado (photogo.com.br)
- [ ] Adicionar Open Graph cards gerados via `next/og`
- [ ] Integrar com Loops/Resend para captura de emails
- [ ] Adicionar analytics (Plausible ou Umami)
- [ ] I18n (PT-BR + EN) via `next-intl`
