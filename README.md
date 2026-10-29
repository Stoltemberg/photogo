# PhotoGo Plataforma

> **O marketplace dos fotógrafos.** Construído sobre [Spree Commerce 6.0](https://spreecommerce.org).

PhotoGo transforma o Spree Commerce em uma plataforma onde fotógrafos vendem fotos
(digitais, impressas, licenciadas, sessões) e a plataforma opera o marketplace comissionando
e repassando pagamentos automaticamente via Stripe Connect.

## 📦 Estrutura do Monorepo

```
photogo/
├── apps/
│   └── landing-photogo/          # Next.js 15 — landing page (Fase 0)
├── packages/                      # Pacotes Spree (sdk, dashboard, cli, ...)
│   ├── cli/                       # @spree/cli
│   ├── sdk/                       # @spree/sdk (TypeScript)
│   ├── dashboard/                 # @spree/dashboard (React admin)
│   └── ...
├── spree/                         # Backend Rails — Spree 6.0
│   ├── api/
│   ├── core/
│   ├── admin/
│   └── emails/
├── docs/
│   └── plans/                     # Planos e decisões arquiteturais
├── ROADMAP.md                     # Roadmap PhotoGo (Fases 0-6)
└── vercel.json                    # Config de deploy Vercel
```

## 🚀 Quickstart

```bash
# 1. Instalar dependências
pnpm install

# 2. Rodar a landing page localmente
pnpm dev:landing

# 3. Build de produção
pnpm build:landing
```

A landing fica disponível em `http://localhost:3000`.

## 📐 Roadmap

Veja [ROADMAP.md](./ROADMAP.md) para o plano completo de transformação.

| Fase | Nome | Status |
|---|---|---|
| 0 | Setup & Brand | 🟢 Em andamento |
| 1 | Fundação Marketplace | ⚪ Planejado |
| 2 | Modelo de Produto Fotográfico | ⚪ Planejado |
| 3 | Entrega Digital & Licenciamento | ⚪ Planejado |
| 4 | Integrações Fotográficas | ⚪ Planejado |
| 5 | Discovery & Social | ⚪ Planejado |
| 6 | B2B & Licenciamento Avançado | ⚪ Planejado |

## 🏗️ Arquitetura

- **Backend:** Ruby 3.3+ on Rails 8 + Spree 6.0 + PostgreSQL 17
- **Frontend Admin:** `@spree/dashboard` (React 19 + Tailwind 4 + Base UI)
- **Frontend Storefront:** customizado em `apps/landing-photogo` (próximo: Fase 1)
- **Search:** MeiliSearch com facets customizados (EXIF, fotógrafo, GPS)
- **Pagamentos:** Stripe Connect Express
- **Deploy:** Vercel (landing) + Docker/Rails (backend)

## 🔄 Sincronização com Upstream

PhotoGo é um fork de [spree/spree](https://github.com/spree/spree). Manter alinhado:

```bash
# Atualizar com upstream
git fetch upstream
git checkout local/integration
git rebase upstream/main
git push fork local/integration
```

## 📜 Licença

**PhotoGo** herda a [BSD-3-Clause](https://opensource.org/licenses/BSD-3-Clause) do Spree Commerce.
Código customizado PhotoGo também liberado sob BSD-3-Clause.

## 🤝 Contribuindo

Issues e PRs no [fork Stoltemberg/photogo](https://github.com/Stoltemberg/photogo).
Mudanças no core Spree devem ir upstream em [spree/spree](https://github.com/spree/spree).

## 📚 Documentação

- [ROADMAP.md](./ROADMAP.md) — Plano de transformação completo
- [Spree docs](https://spreecommerce.org/docs/) — Documentação base
- [docs/plans/](./docs/plans/) — Planos arquiteturais (6.0 multi-vendor marketplace, etc.)
