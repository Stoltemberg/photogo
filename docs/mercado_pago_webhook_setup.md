# Mercado Pago Webhook Setup Guide

## Visão Geral

O PhotoGo usa **Split Payments 1:1** do Mercado Pago. O webhook notifica o backend sobre mudanças no status do pagamento para:
- Marcar pagamento como aprovado/rejeitado
- Completar ordem e gerar comissões
- Entregar downloads digitais
- Processar estornos/reembolsos

---

## Configuração no Dashboard Mercado Pago

### 1. Acesse o Dashboard
- Produção: https://www.mercadopago.com.br/developers
- Sandbox: https://sandbox.mercadopago.com.br/developers

### 2. Crie/Selecione a Aplicação
- Nome: `PhotoGo` (ou `PhotoGo Sandbox`)
- Plataforma: Web
- URLs de callback: configuradas no webhook

### 3. Configure o Webhook

**URL de produção:**
```
https://photogo-landing.vercel.app/api/v3/webhooks/mercado_pago
```

**URL de sandbox (dev):**
```
https://photogo-landing.vercel.app/api/v3/webhooks/mercado_pago
```
*Nota: O mesmo endpoint serve para ambos — o ambiente é detectado pelo gateway.*

**Eventos a assinar:**
- `payment.created` — Pagamento criado (início do fluxo)
- `payment.updated` — Status mudou (principal: approved, rejected, pending)
- `refund.created` — Estorno solicitado
- `chargeback.created` — Chargeback recebido

**Segredo do webhook (opcional mas recomendado):**
Gere um secret no dashboard e configure:
```
ENV['MERCADO_PAGO_WEBHOOK_SECRET'] = 'seu_secret_aqui'
```
Validação no controller: verifica `X-Signature` header.

### 4. Teste o Webhook

No dashboard do MP, use "Testar" → envia payload mock → verifica 200 OK.

Payload de exemplo (payment.updated):
```json
{
  "action": "payment.updated",
  "data": {
    "id": "1234567890"
  },
  "date_created": "2026-07-31T20:30:00.000-03:00",
  "user_id": "123456789",
  "api_version": "v1"
}
```

---

## Verificação no PhotoGo

### Endpoint
```
POST /api/v3/webhooks/mercado_pago
```

### Headers esperados
- `Content-Type: application/json`
- `X-Signature` (se secret configurado)

### Resposta
Sempre retorna `200 OK` com:
```json
{ "status": "ok" }
```
Ou se payload inválido:
```json
{ "status": "ignored", "reason": "missing action or payment_id" }
```

### Logs
Verifique nos logs do Rails:
```
[MercadoPago Webhook] Payment 1234567890 approved — order 123 completed
[MercadoPago Webhook] Payment 9876543210 rejected
[MercadoPago Webhook] Refund for payment 5555555555 — deliveries revoked
```

---

## Variáveis de Ambiente Necessárias

```bash
# Obrigatórias
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
MERCADO_PAGO_PUBLIC_KEY=APP_USR-...

# Opcionais
MERCADO_PAGO_SANDBOX=true
MERCADO_PAGO_APPLICATION_ID=123456789
MERCADO_PAGO_MARKETPLACE_FEE=1500
MERCADO_PAGO_WEBHOOK_SECRET=webhook_secret_aqui
```

---

## Troubleshooting

| Problema | Causa | Solução |
|---|---|---|
| Webhook não dispara | URL incorreta | Verifique URL no dashboard MP |
| 500 no webhook | Exception não tratada | Verifique logs Rails |
| Pagamento não aprova | Falta webhook ou falha MP | Teste manual no dashboard MP |
| Split não funciona | vendor sem `mercado_pago_account_id` | Configure no admin do vendedor |
| CORS error | Origin não permitido | Webhook não precisa de CORS (server-to-server) |

---

## Referências

- [MP Webhook Docs](https://www.mercadopago.com.br/developers/en/docs/your-integrations/webhooks)
- [Split Payments 1:1](https://www.mercadopago.com.br/developers/en/docs/split-payments/split-1-1/overview)
- [Checkout Pro](https://www.mercadopago.com.br/developers/en/docs/checkout-pro/overview)