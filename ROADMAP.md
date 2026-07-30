# Roadmap PhotoGo — Loja de Fotos de Fotógrafos

> Plataforma de marketplace fotográfico construída sobre Spree Commerce 6.0 (fork).
> Documento vivo. Cada fase tem entregáveis verificáveis, critérios de pronto e dependências.

---

## 🎯 Visão Geral

PhotoGo transforma o Spree Commerce em uma plataforma onde **fotógrafos vendem suas fotos** (digitais, impressas, licenciadas, sessões) e onde a **plataforma opera o marketplace** comissionando e repassando pagamentos automaticamente.

### Princípios
1. **Aproveitar o core do Spree** — reusar `Vendor`, `OrderGroup`, `PayoutProvider`, `PaymentSplit`, `Multi-Vendor Marketplace` 6.0
2. **Estender, nunca reescrever** — Spree base permanece intacto; mudanças vivem em módulos `photo_*`
3. **Sincronizar com upstream** — branch `local/integration` faz rebase semanal com Spree 6.0
4. **Modular** — cada fase adiciona um pacote isolado, removível se necessário
5. **Mobile-first** — SDK consumido por app React Native no futuro

### Stack Alvo
- **Backend:** Ruby 3.3+ on Rails 8 / Spree 6.0 / PostgreSQL 17 / Active Storage + S3
- **Frontend Storefront:** Next.js 16 + React 19 + TypeScript + Tailwind 4 + Base UI
- **Admin Dashboard:** `@spree/dashboard` (React) + extensões em `dashboard-core`
- **Search:** MeiliSearch com facets customizados (EXIF, fotógrafo, localização)
- **Pagamentos:** Stripe Connect Express (Express onboarding) + Stripe core gateway
- **SDK:** `packages/sdk` (TypeScript) → `PhotoGo SDK` (wrapper thin)
- **Mobile (futuro):** React Native + Expo, consumindo SDK

### Métricas de Sucesso do Roadmap
- **T1:** Plataforma funcional com 1 fotógrafo vendendo 1 foto via Stripe Connect
- **T2:** 10 fotógrafos onboard, R$10k GMV, 95% compras digitais
- **T3:** 100 fotógrafos, R$100k GMV/mês, operações B2B ativas
- **T4:** 1k+ fotógrafos, R$1M GMV/mês, app mobile publicado

---

## 📅 Cronograma Resumido

| Fase | Nome | Duração | Pré-requisito |
|---|---|---|---|
| **0** | Setup & Brand | 1-2 semanas | Docker, Node 22+, Ruby 3.3+ |
| **1** | Fundação Marketplace | 2-4 semanas | Fase 0 |
| **2** | Modelo de Produto Fotográfico | 3-4 semanas | Fase 1 |
| **3** | Entrega Digital & Licenciamento | 2-3 semanas | Fase 2 |
| **4** | Integrações Fotográficas | 3-4 semanas | Fase 3 |
| **5** | Discovery & Social | 2-3 semanas | Fase 4 |
| **6** | B2B & Licenciamento Avançado | 3-4 semanas | Fase 5 |

**Total estimado:** 16-24 semanas (4-6 meses) para MVP+ completo.

---

## 🟢 FASE 0 — Setup & Brand (1-2 semanas)

### Objetivos
Identidade PhotoGo, ambiente de dev funcional, storefront temático rodando com 1 mercado (BR).

### Entregáveis
- [ ] Renomear UI: Spree → PhotoGo (logo, favicon, copy, cores)
- [ ] Configurar 1 mercado (Brasil: BRL, PT-BR); pronta expansão para multi-mercado
- [ ] Storefront Next.js customizado: galerias grandes, lightbox, EXIF display
- [ ] Sandbox local: `npx create-spree-app@latest` + scripts PhotoGo
- [ ] CI/CD: GitHub Actions rodando build + tests + lint
- [ ] Repositório fork sincronizado com `spree/spree` upstream
- [ ] Documento `docs/BRAND.md` (paleta, tipografia, tom de voz)

### Customizações de Tema
| Componente | Mudança |
|---|---|
| Logo / Header | "PhotoGo" + slogan "O marketplace dos fotógrafos" |
| Paleta | Primária: `#1A1A1A` (preto fotográfico), Acento: `#FF6B35` (laranja sunset) |
| Tipografia | Headings: `Inter`, Body: `IBM Plex Sans`, Mono: `JetBrains Mono` |
| Hero | Galeria hero em grid masonry com 6-9 fotos |
| Cards | Hover: zoom suave, badge do fotógrafo, ícone de licença |
| Footer | Links: "Torne-se fotógrafo", "Sobre", "Política anti-pirataria" |

### Comandos Iniciais
```bash
# Clonar com subtree
git clone -b local/integration https://github.com/Stoltemberg/photogo.git
cd photogo/spree && pnpm install

# Setup sandbox
npx create-spree-app@latest photogo-sandbox
cd photogo-sandbox && spree dev

# Configurar mercado BR
spree markets create --name="Brasil" --currency=BRL --locale=pt-BR
```

### Critérios de Pronto
- [ ] `pnpm dev` boot completo em <2min
- [ ] Homepage renderiza com branding PhotoGo
- [ ] Catálogo tem pelo menos 3 fotos placeholder de categorias distintas
- [ ] Lighthouse score >90 (Performance, Accessibility, SEO)
- [ ] Sandbox em `console.photogo.com.br` (opcional)

### Riscos
- **R0.1:** Mudanças no upstream Spree 6.0 quebrarem customizações → **Mitigação:** branch dedicada, testes E2E
- **R0.2:** Build lento em Mac (Docker + Ruby) → **Mitigação:** cache pnpm, dev containers

---

## 🟢 FASE 1 — Fundação Marketplace (2-4 semanas)

### Objetivos
Aplicar o plano Multi-Vendor Marketplace 6.0 do Spree, configurar Stripe Connect, criar painel do fotógrafo.

### Entregáveis
- [ ] Migrations aplicadas: `Spree::Vendor`, `OrderGroup`, `PaymentSplit`, `CommissionLine`, `CommissionRate`, `CommissionRule`, `VendorTransfer`, `VendorPayout`
- [ ] Painel `/photographer/onboarding` reaproveitando `Spree::Invitation`
- [ ] Stripe Connect Express configurado (Express onboarding link)
- [ ] `PayoutProvider::StripeConnect` operacional (on-fulfillment transfers)
- [ ] Payout provider `system` (no-op, registro manual) para fallback
- [ ] Permission Set `PhotographerUser` (escopo: `vendor_id: user.vendor_ids`)
- [ ] Onboarding checklist core: ToS, perfil, billing, returns, ≥1 produto
- [ ] Admin Dashboard: lista de vendors, aprovação, payouts pendentes
- [ ] Webhooks Stripe: `account.updated`, `payout.paid`, `charge.refunded`
- [ ] Eventos publicados: `vendor.created/approved`, `order_group.completed`, `commission_line.created`

### Models Novos (migrations)
```ruby
# db/migrate/2026XXXX_spree_vendors.rb
class Spree::Vendor < Spree.base_class
  has_prefix_id :ven
  acts_as_paranoid
  publishes_lifecycle_events
  # ...vide plano 6.0-multi-vendor-marketplace.md
end

# Specialized para PhotoGo
module Photo
  class PhotographerProfile < Spree::Vendor
    belongs_to :vendor, class_name: 'Spree::Vendor', foreign_key: :id
    has_one_attached :portfolio_cover
    has_many_attached :portfolio_samples
    enum verification_status: { pending: 0, verified: 1, pro: 2, featured: 3 }
    enum specialty: { wedding: 0, landscape: 1, portrait: 2, street: 3,
                      fashion: 4, wildlife: 5, sport: 6, food: 7, fine_art: 8 }
  end
end
```

### Endpoints API
```ruby
# Store API
GET    /api/v3/store/photographers              # list (approved only)
GET    /api/v3/store/photographers/:slug        # profile
POST   /api/v3/store/photographer_applications  # self-serve onboarding (rate-limited)

# Admin API
GET    /api/v3/admin/photographers
POST   /api/v3/admin/photographers
PATCH  /api/v3/admin/photographers/:id
POST   /api/v3/admin/photographers/:id/approve
POST   /api/v3/admin/photographers/:id/suspend
GET    /api/v3/admin/photographers/:id/payouts
```

### Configuração Stripe Connect
```ruby
# config/initializers/spree_stripe_connect.rb
Spree::PayoutProvider::StripeConnect.configure do |c|
  c.platform_account_id = ENV.fetch('STRIPE_PLATFORM_ACCOUNT_ID')
  c.express_onboarding_url = ENV.fetch('STRIPE_EXPRESS_URL')
  c.application_fee_percent = 20.0  # default 20% comissão
  c.automatic_payouts_enabled = true
end
```

### Testes (TDD obrigatório)
- [ ] `spec/models/spree/vendor_spec.rb` — lifecycle, validações, slug uniqueness
- [ ] `spec/models/spree/order_group_spec.rb` — split, derived status
- [ ] `spec/services/spree/carts/complete_spec.rb` — multi-vendor split
- [ ] `spec/services/spree/commissions/resolve_rate_spec.rb` — rate resolution
- [ ] `spec/services/spree/payouts/stripe_connect_spec.rb` — Transfer creation
- [ ] `spec/system/photographer_onboarding_spec.rb` — application → approval → first sale
- [ ] `spec/system/payout_flow_spec.rb` — sale → commission → transfer → payout

### Critérios de Pronto
- [ ] 1 fotógrafo real consegue se cadastrar, ser aprovado, vender 1 produto, receber payout
- [ ] Vendor transfer visível no painel admin
- [ ] Webhook Stripe Connect recebido e persistido
- [ ] Taxa de comissão calculada corretamente (snapshot congelado)
- [ ] Split de carrinho multi-vendor funcional (carrinho misto → N ordens)

### Riscos
- **R1.1:** Stripe Connect onboarding rejeita fotógrafos do Brasil → **Mitigação:** suportar PIX via Stripe BR
- **R1.2:** Planos 6.0 ainda em draft upstream → **Mitigação:** cherry-pick commits conforme saem
- **R1.3:** KYC automated não cobre todos os países → **Mitigação:** revisão manual para casos duvidosos

---

## 🟢 FASE 2 — Modelo de Produto Fotográfico (3-4 semanas)

### Objetivos
Domínio específico de fotografia: tipos de produto, variantes de impressão, EXIF, custom fields.

### Entregáveis
- [ ] `Spree::ProductType` com values: `digital_photo`, `print`, `license`, `service`, `bundle`
- [ ] Variantes de impressão: tamanho × papel × moldura (matriz de variantes)
- [ ] Custom fields: EXIF (camera, lens, ISO, aperture, shutter, date_taken), location (GPS), model_release, property_release, ai_generated, resolution, color_space
- [ ] Asset pipeline: WebP/AVIF para web + RAW/TIFF/DNG original mantido
- [ ] Watermark automático para previews (proteção de propriedade)
- [ ] Bulk upload via drag-drop (até 100 fotos/processamento)
- [ ] Import via CSV de Adobe Lightroom/Adobe Bridge
- [ ] Catalogação: tags, categorias (Paisagem, Retrato, etc.), coleções

### Product Type Strategy
```ruby
# Enum mantido em Spree::Product
class Spree::Product < Spree.base_class
  enum product_type: {
    digital_photo: 'digital_photo',  # download imediato
    print: 'print',                  # impressão física
    license: 'license',               # licença de uso
    service: 'service',               # sessão agendada
    bundle: 'bundle'                  # pacote/álbum
  }

  # Custom fields específicos
  store_accessor :metadata, :camera_make, :camera_model, :lens_model,
                              :iso, :aperture, :shutter_speed, :focal_length,
                              :date_taken, :gps_latitude, :gps_longitude,
                              :location_name, :model_release_signed,
                              :property_release_signed, :ai_generated,
                              :resolution_width, :resolution_height, :dpi,
                              :color_space, :license_type  # personal|commercial|editorial
end
```

### Matriz de Variantes (Prints)
```ruby
# spec_helper.rb — dados de exemplo
PRINT_SIZES = %w[A4 A3 A2 A1 30x40 50x70 60x90 80x120].freeze
PAPER_TYPES = %w[matte glossy fine_art metallic canvas].freeze
FRAMES = %w[none white black natural_oak walnut].freeze

# Quando product_type = 'print', variantes são geradas automaticamente
# total = 8 × 5 × 4 = 160 variantes possíveis (vendor escolhe subset)
```

### Asset Pipeline
```ruby
# app/jobs/photo/process_upload_job.rb
class Photo::ProcessUploadJob < ApplicationJob
  def perform(asset_id)
    asset = Spree::Asset.find(asset_id)
    original = asset.file.download

    # Extract EXIF
    exif = ExifTool.new(original).to_hash
    asset.update!(exif_data: exif)

    # Generate derivatives
    ImageProcessing::Vips
      .source(original)
      .convert('webp')
      .resize_to_limit(2560, 2560)
      .save("#{asset.id}_preview.webp")

    # Watermark for browser preview
    WatermarkProcessor.new(asset).apply!  # ~1200px, semi-transparent logo

    # Store original as-is (master)
  end
end
```

### Bundle Editor (UI)
- [ ] Painel `/photographer/products/bundle/new`
- [ ] Drag and drop de fotos para o bundle
- [ ] Set pricing individual vs bundle
- [ ] Reuso de foto em múltiplos bundles (sem duplicar storage)

### Custom Fields Renderizados
- [ ] Card EXIF no PDP: ícone de câmera, lente, ISO, abertura, velocidade
- [ ] Mapa mini com localização GPS (quando autorizado)
- [ ] Badges: "Model Release Verified", "Property Release Verified", "AI Generated"
- [ ] Color space / DPI info técnico para buyers profissionais

### Testes
- [ ] `spec/models/spree/product_spec.rb` — product_type enum, custom fields
- [ ] `spec/jobs/photo/process_upload_job_spec.rb` — EXIF extraction, derivative generation
- [ ] `spec/system/photographer_upload_spec.rb` — drag-drop, CSV import
- [ ] `spec/system/print_variant_matrix_spec.rb` — geração automática de variantes

### Critérios de Pronto
- [ ] Fotógrafo consegue fazer upload de 1 foto com EXIF extraído automaticamente
- [ ] Foto aparece no storefront com galeria de previews
- [ ] Variantes de impressão funcionam (cliente escolhe tamanho + papel)
- [ ] Custom fields renderizados no PDP
- [ ] Watermark removível em fotos compradas (entrega original)

### Riscos
- **R2.1:** RAW files grandes (50MB+) impactam performance → **Mitigação:** background processing, S3 multipart
- **R2.2:** EXIF contém dados sensíveis (GPS do fotógrafo) → **Mitigação:** strip GPS by default, opt-in
- **R2.3:** Watermark pode ser burlado em screenshots → **Mitigação:** considerar bloqueio de screenshot JS (DRM-lite)

---

## 🟢 FASE 3 — Entrega Digital & Licenciamento (2-3 semanas)

### Objetivos
Entrega segura de fotos digitais, licenciamento, certificados de autenticidade.

### Entregáveis
- [ ] Gerador de links S3 pré-assinados (Spatie Laravel-style signed URLs)
- [ ] Limite de downloads + expiração configurável por fotógrafo
- [ ] Watermark com nome do comprador (burn-in) opcional para licenças
- [ ] Gerador de certificados PDF de licença (hash de autenticidade)
- [ ] Integração opcional com blockchain (Polygon) para prova de origem
- [ ] Email delivery com link único (template `Spree::PhotoDeliveryMailer`)
- [ ] Customer dashboard: minhas compras, downloads restantes, links expirados
- [ ] Anti-pirataria: rate limiting, fingerprinting básico, DMCA takedown flow

### Modelo de Entrega Digital
```ruby
# app/models/photo/digital_delivery.rb
class Photo::DigitalDelivery < Spree.base_class
  has_prefix_id :digdl
  belongs_to :order, class_name: 'Spree::Order'
  belongs_to :asset, class_name: 'Spree::Asset'
  belongs_to :license, class_name: 'Photo::License', optional: true

  # URL de download único
  has_many :download_links, class_name: 'Photo::DownloadLink', dependent: :destroy

  def generate_download_link!(ttl: 24.hours, max_downloads: 3)
    token = SecureRandom.urlsafe_base64(32)
    Photo::DownloadLink.create!(
      digital_delivery: self,
      token: token,
      expires_at: ttl.from_now,
      max_downloads: max_downloads,
      signed_url: signed_s3_url(token, expires_at: ttl.from_now)
    )
  end
end
```

### Certificado de Licença (PDF)
```ruby
# app/services/photo/license_certificate_generator.rb
class Photo::LicenseCertificateGenerator
  def generate(license)
    Prawn::Document.new do |pdf|
      pdf.text "PhotoGo License Certificate", size: 24, style: :bold
      pdf.text "Photo: #{license.product.name}"
      pdf.text "Photographer: #{license.vendor.name}"
      pdf.text "License Type: #{license.license_type}"
      pdf.text "Territory: #{license.territory}"
      pdf.text "Issued: #{license.created_at}"
      pdf.text "Hash: #{license.certificate_hash}"  # SHA-256 do arquivo + nonce
      pdf.image license.product.asset.original_url, fit: [400, 400]
      pdf.text "© #{Date.today.year} #{license.vendor.name}. All rights reserved."
    end.render
  end

  def certificate_hash
    Digest::SHA256.hexdigest("#{asset.file.checksum}:#{license.nonce}")
  end
end
```

### Tiers de Licenciamento
| Tier | Descrição | Preço médio |
|---|---|---|
| **Personal** | Uso pessoal, redes sociais, sem revenda | 1x base |
| **Commercial** | Sites comerciais, anúncios, marketing | 3x base |
| **Editorial** | Revistas, blogs, mídias jornalísticas | 2x base |
| **Exclusive** | Direitos exclusivos, sem revenda pelo fotógrafo | 10x base |
| **Extended** | Uso irrestrito, território mundial, prazo ilimitado | 5x base |

### Anti-Pirataria
- [ ] Rate limiting: 5 downloads/hora por usuário por IP
- [ ] Fingerprint do navegador (User-Agent + Accept)
- [ ] Email automático se detectar padrão anormal (bot)
- [ ] DMCA takedown form: `/copyright/dmca`
- [ ] Marca d'água forense invisível (esteganografia) opcional

### Testes
- [ ] `spec/services/photo/download_link_generator_spec.rb`
- [ ] `spec/services/photo/license_certificate_generator_spec.rb`
- [ ] `spec/system/digital_download_spec.rb` — compra → email → link → download
- [ ] `spec/system/license_expiry_spec.rb` — link expira após N downloads

### Critérios de Pronto
- [ ] Compra de foto digital → email chega em <1min com link
- [ ] Link funciona por 24h, máx 3 downloads
- [ ] Licença comercial gera PDF de certificado
- [ ] Stripe webhook de `charge.refunded` revoga downloads pendentes

### Riscos
- **R3.1:** Screenshots burlam DRM → **Mitigação:** aceitar o trade-off, foco em licenças B2B
- **R3.2:** S3 link vaza em emails → **Mitigação:** tokens únicos, log de IP/downloads
- **R3.3:** Blockchain opcional pode confundir usuários → **Mitigação:** posicionar como "Provenance Badge" opcional

---

## 🟢 FASE 4 — Integrações Fotográficas (3-4 semanas)

### Objetivos
Facilitar ingestão de portfólio e entrega para gráficas.

### Entregáveis
- [ ] Adobe Lightroom Plugin (Lua-based export)
- [ ] Adobe Bridge / Capture One Plugin
- [ ] API pública para ingestion em massa (autenticação OAuth)
- [ ] Integração Dropbox/Google Drive (pasta monitorada)
- [ ] Integração iCloud (sync nativo)
- [ ] Integração com gráficas parceiras: WhiteWall, Bay Photo, PrintLoja (mock primeiro)
- [ ] Mobile app preview: React Native inicial consumindo SDK
- [ ] Webhook outbound: `photo.delivered` → sistemas externos

### Lightroom Plugin (Lua)
```lua
-- Plugin for Adobe Lightroom
local LrHttp = require 'LrHttp'
local LrTasks = require 'LrTasks'

function uploadPhoto(photo)
  local file_path = photo:getRawMetadata('pathToRaw')
  LrHttp.postMultipart{
    url = 'https://api.photogo.com.br/api/v3/photographer/products',
    headers = { Authorization = 'Bearer ' .. getAuthToken() },
    files = { { name = 'asset', filePath = file_path } },
    fields = {
      name = photo:getFormattedMetadata('title'),
      product_type = 'digital_photo',
      price = photo:getFormattedMetadata('price'),
      exif = dumpExif(photo),
    },
  }
end
```

### API de Ingestion (OAuth)
```ruby
# POST /api/v3/photographer/bulk_upload
# Headers: Authorization: Bearer <oauth_token>
# Body: multipart/form-data com até 100 arquivos
# Retorna: { job_id, estimated_time, files: [...] }
class Api::V3::Photographer::BulkUploadController < Api::V3::BaseController
  def create
    authorize! :bulk_upload, Spree::Product
    job = Photo::BulkUploadJob.perform_later(
      vendor_id: current_vendor.id,
      files: params[:files],
      metadata: params[:metadata]&.permit!.to_h
    )
    render json: { job_id: job.job_id, status: 'queued' }
  end
end
```

### Integração Gráfica (Mock primeiro)
```ruby
# app/services/photo/print_fulfillment/white_wall.rb
class Photo::PrintFulfillment::WhiteWall < Photo::PrintFulfillment::Base
  def submit(order)
    client.post('/api/v1/orders', {
      image_url: order.product.preview_url,
      size: order.variant.options[:size],
      paper: order.variant.options[:paper],
      frame: order.variant.options[:frame],
      shipping_address: order.ship_address,
    })
  end

  def status(fulfillment_id)
    client.get("/api/v1/orders/#{fulfillment_id}")
  end
end
```

### Testes
- [ ] `spec/services/photo/print_fulfillment/white_wall_spec.rb`
- [ ] `spec/jobs/photo/bulk_upload_job_spec.rb`
- [ ] `spec/system/lightroom_integration_spec.rb` (com plugin mock)
- [ ] E2E: drop photo in Dropbox → aparece no painel PhotoGo

### Critérios de Pronto
- [ ] Bulk upload via API processa 100 fotos em <5min
- [ ] Plugin Lightroom exporta diretamente para PhotoGo
- [ ] Integração Dropbox monitora pasta e ingesta em <1min
- [ ] Pedido de impressão chega na gráfica parceira (sandbox)

### Riscos
- **R4.1:** APIs de gráficas mudam → **Mitigação:** STRATEGY pattern, fallback manual
- **R4.2:** Upload massivo bloqueia instâncias → **Mitigação:** S3 multipart + sidekiq batch
- **R4.3:** Lightroom plugin precisa de Adobe approval → **Mitigação:** versionar via Adobe App Exchange

---

## 🟢 FASE 5 — Discovery & Social (2-3 semanas)

### Objetivos
Fazer com que clientes encontrem fotos e fotógrafos de forma memorável.

### Entregáveis
- [ ] MeiliSearch com facets: photographer, location, EXIF (lente, ISO, abertura), color_space
- [ ] Map view: fotos georreferenciadas em mapa interativo (Leaflet/Mapbox)
- [ ] Coleções curadas (editoriais: "Paisagens do Brasil", "Retratos do Ano")
- [ ] Sistema de "favoritos" para clientes logados
- [ ] "Following" fotógrafos (feed de novos uploads)
- [ ] Recomendações simples: "Fotógrafos similares a X"
- [ ] Página `/trending` baseada em vendas/views recentes
- [ ] Compartilhamento social (Open Graph + cards visuais)

### MeiliSearch Indexing
```ruby
# app/models/spree/product.rb
after_save :enqueue_search_index

def enqueue_search_index
  Search::IndexProductJob.perform_later(id)
end

# app/jobs/search/index_product_job.rb
class Search::IndexProductJob < ApplicationJob
  def perform(product_id)
    product = Spree::Product.find(product_id)
    products_index.add_documents([{
      id: product.id,
      name: product.name,
      description: product.description,
      vendor_id: product.vendor_id,
      vendor_name: product.vendor.name,
      category: product.taxons.map(&:name),
      exif: {
        camera: product.metadata['camera_model'],
        lens: product.metadata['lens_model'],
        iso: product.metadata['iso'],
        aperture: product.metadata['aperture'],
      },
      location: product.metadata['location_name'],
      gps: [product.metadata['gps_latitude'], product.metadata['gps_longitude']],
      price: product.price,
      sales_count: product.sales_count,
      avg_rating: product.avg_rating,
      created_at: product.created_at.to_i,
    }])
  end
end
```

### Map View (Leaflet)
- [ ] `/map` endpoint: retorna fotos com GPS em raio X km do usuário
- [ ] Pin cluster, click expande → mini-card
- [ ] Filtro: data, fotógrafo, licença

### Coleções Curadas
- [ ] `Spree::Collection` (já planejado em 6.0-replace-taxons-with-categories.md)
- [ ] Editor de coleção: drag-drop, ordem manual, story-tell com textos
- [ ] Coleções sazonais: "Festival de Inverno 2026", "Olimpíadas"

### Favoritos & Following
- [ ] `Spree::Wishlist` (ou `Photo::Favorite`) — N:N Customer ↔ Product
- [ ] `Photo::Follow` — Customer follows Vendor; webhook events para "follow.vendor.uploaded"
- [ ] Activity feed: "Fotógrafo X que você segue adicionou 5 fotos"

### Testes
- [ ] `spec/system/search_spec.rb` — busca por EXIF facet
- [ ] `spec/system/map_view_spec.rb` — fotos próximas a coordenadas
- [ ] `spec/system/favorites_spec.rb` — favoritar, listar
- [ ] `spec/system/following_spec.rb` — follow, ver feed

### Critérios de Pronto
- [ ] Busca "lente 50mm f/1.4 + Brazil" retorna resultados relevantes
- [ ] Map view mostra 1k+ pinos de fotos da região
- [ ] Coleção curada "Paisagens do Brasil" tem 50+ fotos votadas pela equipe
- [ ] Following: usuário recebe notificação de novo upload

### Riscos
- **R5.1:** Map view pode expor localização de fotos restritas → **Mitigação:** ocultar GPS por default no map
- **R5.2:** Algoritmo de recomendação ruim → **Mitigação:** insights editoriais + "trending" simples
- **R5.3:** Performance do map com 10k pinos → **Mitigação:** clustering, página de bounds

---

## 🟢 FASE 6 — B2B & Licenciamento Avançado (3-4 semanas)

### Objetivos
Atender clientes B2B (agências, editoras, marcas) com fluxos wholesale, licenças editoriais, integrações CMS.

### Entregáveis
- [ ] Price Lists: empresas com desconto progressivo por volume (reusa Spree nativo)
- [ ] Customer Groups: segmentação B2B vs B2C
- [ ] Licenças editoriais com termos customizados (por território, prazo)
- [ ] API para integração com CMS (WordPress, Ghost, Webflow)
- [ ] Sales Channel B2B dedicado (gated storefront com `publishable_key`)
- [ ] Workflow de aprovação: requisições de uso especial
- [ ] Relatórios B2B: uso de licenças, expiração, renovações
- [ ] Integração com ERPs (SAP, Oracle, NetSuite) via CSV/API
- [ ] Carteira digital: API token para editoras comprarem via SDK

### Sales Channel B2B
```ruby
# Cada Customer Group tem um Channel dedicado
channel = Spree::Channel.create!(
  name: 'B2B Editorial',
  publishable_key: secure_random_token,
  default: false,
  storefront_access: :restricted,  # gated
  guest_checkout: false
)

# Restringe acesso via middleware
class B2bStorefrontMiddleware
  def call(env)
    token = extract_publishable_key(env)
    channel = Spree::Channel.find_by(publishable_key: token)
    return unauthorized unless channel&.b2b?
    # ... attach to env
  end
end
```

### API de Licenciamento Editorial
```ruby
# POST /api/v3/b2b/editorial_licenses
class Api::V3::B2b::EditorialLicensesController < Api::V3::BaseController
  def create
    license = Photo::EditorialLicense.create!(
      product_id: params[:product_id],
      customer_id: current_customer.id,
      publication_name: params[:publication_name],
      territory: params[:territory],  # ISO country codes
      run_start: params[:run_start],
      run_end: params[:run_end],
      category: params[:category],  # cover, interior, online
      custom_terms: params[:custom_terms]
    )
    render json: Photo::EditorialLicenseSerializer.new(license).serializable_hash
  end
end
```

### Integração CMS (WordPress)
- [ ] Plugin WordPress: "PhotoGo Embed" — busca + embed inline
- [ ] OAuth flow: editor autoriza, plugin posta no PhotoGo
- [ ] Custódia de licença: cópia de prova fica no CMS

### Carteira Digital (SDK)
```typescript
// packages/sdk/src/wallet.ts
class PhotoGoWallet {
  async purchase(productId: string, licenseType: 'personal' | 'commercial' | 'editorial') {
    const response = await this.client.post('/api/v3/b2b/wallet/purchase', {
      product_id: productId,
      license_type: licenseType,
    });
    return response.data.license;
  }

  async listLicenses() {
    const response = await this.client.get('/api/v3/b2b/wallet/licenses');
    return response.data.licenses;
  }

  async checkExpiry() {
    const licenses = await this.listLicenses();
    return licenses.filter(l => l.expires_at && new Date(l.expires_at) < new Date());
  }
}
```

### Testes
- [ ] `spec/services/spree/price_lists_spec.rb` — desconto progressivo
- [ ] `spec/system/b2b_checkout_spec.rb` — checkout gated
- [ ] `spec/system/editorial_license_spec.rb` — geração, expiração, renovação
- [ ] `spec/integration/wordpress_plugin_spec.rb` — OAuth flow
- [ ] `spec/sdk/wallet_spec.rb` — purchase, list, expiry

### Critérios de Pronto
- [ ] Agência pode se cadastrar como B2B, acessar canal gated
- [ ] Compra B2B com 50 fotos gera invoice mensal consolidado
- [ ] Licença editorial tem prazo, território, condições customizadas
- [ ] Plugin WordPress permite embed de fotos com licença automática

### Riscos
- **R6.1:** Clientes B2B exigem SLA contratual → **Mitigação:** tier Enterprise pago
- **R6.2:** Licenças editoriais têm termos jurídicos complexos → **Mitigação:** consulta com advogado, templates
- **R6.3:** Integrações ERP muitas → **Mitigação:** CSV + API REST como fallback

---

## 🔄 Estratégia de Sincronização Upstream

O Spree 6.0 ainda está em desenvolvimento. Manter o fork alinhado:

```bash
# weekly
git fetch upstream
git checkout local/integration
git rebase upstream/main
# resolve conflitos (vendor/, photo/, dashboard/)
git push fork local/integration

# cherry-pick de features que precisamos
git cherry-pick <commit-do-multivendor>
```

**Política:** Conflitos em `Photo::` packages são nossos; conflitos em `spree/core` devem ser discutidos antes de manter divergência.

---

## 📊 Backlog (Pós-MVP)

Funcionalidades identificadas mas fora do escopo das Fases 0-6:

| Feature | Prioridade | Esforço |
|---|---|---|
| **App Mobile React Native** | Alta | 6-8 semanas |
| **Assinaturas (Sessão Mensal)** | Média | 3 semanas |
| **AI Tagging automático** (AWS Rekognition) | Média | 2 semanas |
| **Marketplace de Workshops/Mentoria** | Baixa | 4 semanas |
| **White-label para Estúdios** | Baixa | 6+ semanas |
| **Print-on-Demand via API CTPG/Printloja** | Média | 2-3 semanas |
| **Integração com NFTs (Polygon)** | Baixa | 4 semanas |
| **CDN Global (CloudFront)** | Alta | 1 semana |
| **i18n: ES, EN, FR** | Média | 2-3 semanas |
| **Webhook Outbound v2** (reusa Spree 2.0) | Alta | 1 semana |
| **Advanced Analytics Dashboard** | Baixa | 4 semanas |
| **Stripe Billing para Subscription** | Média | 2 semanas |

---

## 📁 Estrutura de Pacotes Adicionada

```
spree/
├── spree/
│   └── core/
│       └── app/
│           └── models/
│               ├── spree/
│               │   ├── vendor.rb                    # reuso
│               │   ├── order_group.rb              # reuso
│               │   ├── payment_split.rb            # reuso
│               │   └── ...
│               └── photo/
│                   ├── photographer_profile.rb     # extensão de Vendor
│                   ├── bulk_upload_job.rb
│                   ├── process_upload_job.rb
│                   ├── digital_delivery.rb
│                   ├── download_link.rb
│                   ├── license.rb
│                   ├── editorial_license.rb
│                   ├── favorite.rb
│                   └── follow.rb
├── packages/
│   ├── sdk/                                        # base
│   ├── sdk-photogo/                                # novo: PhotoGo SDK
│   ├── storefront-photogo/                         # novo: tema fotografia
│   └── dashboard-photogo/                          # novo: extensões dashboard
└── docs/
    └── plans/
        ├── photogo-product-extension.md
        ├── photogo-delivery-system.md
        └── photogo-licensing-model.md
```

---

## 🧪 Estratégia de Testes

Cobertura mínima aceita: **85%** (core + photogo).

| Camada | Ferramenta | Cobertura |
|---|---|---|
| Unit (Models, Services) | RSpec | 90% |
| Controllers/API | RSpec + request specs | 85% |
| System (E2E) | RSpec + Capybara | 80% |
| Frontend (Storefront) | Vitest + Testing Library | 80% |
| Dashboard | Vitest | 80% |
| SDK | Vitest + integration tests | 90% |
| Performance | k6 (smoke) | N/A |

---

## 💰 Modelo de Receita

| Fonte | Detalhe | Estimativa |
|---|---|---|
| **Comissão marketplace** (default 20%) | Aplicada em cada venda | 70% da receita |
| **Assinatura Pro Photographer** | R$49/mês: 0% comissão, analytics | 15% |
| **Featured/Verification** | R$99 one-time + R$199/mês destaque | 10% |
| **Comissão de impressão** | 30% margem sobre gráficas | 5% |
| **B2B API Licensing** | R$499+/mês para agências/editoras | TBD |
| **Workshops/Mentoria** | Marketplace de cursos (futuro) | TBD |

---

## 📈 KPIs por Fase

| Fase | KPI | Meta |
|---|---|---|
| 0 | Tempo de boot local | <2min |
| 1 | Tempo de onboarding fotógrafo | <10min |
| 2 | Tempo de upload 1 foto | <30s |
| 3 | Tempo de delivery após pagamento | <1min |
| 4 | Bulk upload 100 fotos | <5min |
| 5 | Tempo de busca complexa | <500ms |
| 6 | SLA uptime B2B | 99.9% |

---

## 🛡️ Compliance & Legal

- [ ] **LGPD:** Consentimento explícito para uso de imagem, data export, anonymization
- [ ] **Model Release + Property Release:** Templates gerados automaticamente, e-signature
- [ ] **Omnibus Directive (EU):** PriceHistory 30-day, lowest_price_30d nativo no Spree 5.4+
- [ ] **DAC7 (EU):** Relatório de vendedores para tax authorities (se expandir para EU)
- [ ] **Anti-pirataria:** DMCA takedown process, watermarking visível/invisível
- [ ] **Fiscal:** Emissão de NF-e para fotógrafos PJ no Brasil (integção com sistema fiscal)

---

## 📝 Documentação a Criar

| Doc | Local | Quando |
|---|---|---|
| `BRAND.md` | `docs/` | Fase 0 |
| `photogo-product-extension.md` | `docs/plans/` | Fase 2 |
| `photogo-delivery-system.md` | `docs/plans/` | Fase 3 |
| `photogo-licensing-model.md` | `docs/plans/` | Fase 6 |
| `STYLEGUIDE.md` | `docs/` | Fase 0 |
| `CONTRIBUTING.md` | `docs/` | Fase 0 |
| `PHOTOGRAPHER_GUIDE.md` | `docs/user/` | Fase 1 |
| `API_REFERENCE.md` | `docs/` | Fase 1 (auto-gerada) |

---

## 🎯 Marcos Visíveis (Milestones)

| Marco | Data | Critério |
|---|---|---|
| **M0 — Brand Live** | Fim Fase 0 | Storefront PhotoGo acessível, 1 mercado |
| **M1 — First Sale** | Fim Fase 1 | 1 fotógrafo vende 1 foto via Stripe Connect |
| **M2 — 10 Photographers** | Fim Fase 2 | 10 vendedores onboard, R$10k GMV |
| **M3 — Digital Standard** | Fim Fase 3 | Entrega digital <1min, licenças PDF operacionais |
| **M4 — Bulk Ready** | Fim Fase 4 | Lightroom plugin funcional, 100 fotos/5min |
| **M5 — Discoverable** | Fim Fase 5 | Search + map + favorites operacionais |
| **M6 — B2B Launch** | Fim Fase 6 | Primeiro cliente B2B + integração CMS |

---

## 🚧 Decisões Abertas

1. **Pessoa Física vs PJ:** Apenas PJ para fotógrafos (com CNPJ) ou aceita PF com limite de saque?
2. **Curadoria:** Todos os fotógrafos aprovados ou com curadoria manual?
3. **Sub-mercado:** Nacional (BR) primeiro ou multi-mercado desde o início?
4. **Open Source:** Tornar PhotoGo open-source também ou manter fork proprietário?
5. **Mobile App:** React Native ou Flutter? (Spree SDK é TS-only)
6. **Blockchain:** Realmente vale a pena? Talvez só "Provenance Badge" opcional.

---

## ✨ Conclusão

Este roadmap aproveita **95% do que o Spree 6.0 já planejou** (multi-vendor marketplace, OrderGroup, PaymentSplit, Stripe Connect) e adiciona **5% de domínio fotográfico específico** (EXIF, prints, licenças, anti-pirataria). Fotógrafos têm painel nativo, recebem payouts automáticos, e clientes finais compram fotos com a mesma UX de um e-commerce moderno.

A **vantagem competitiva** vem de:
- Custo de licenciamento zero (BSD-3)
- Time-to-market reduzido (reuso de 95% do código)
- Escalabilidade nativa (Rails + Next.js + Postgres)
- Multi-tenant e multi-currency from day 1
- Customizações isoladas em pacotes `photo_*`, sincronizáveis com upstream

**Próximo passo:** Começar **Fase 0** (Setup & Brand) com foco no storefront temático e ambiente de dev funcional.

---

*Última atualização: 2026-07-30*
*Owner: Gabriel Stoltemberg*
*Mantido em: `/Users/gabriel/Desktop/PhotoGo/ROADMAP.md`*
