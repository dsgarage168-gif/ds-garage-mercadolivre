# Mercado Livre — Cloudflare Worker

Este diretório versiona o Worker `ds-garage-oauth` publicado no Cloudflare.

## Fonte de produção

- `worker.js`: código integral extraído da versão 299 ativa em 12/11/2026 (6.336 linhas).
- `worker.js.backup-partial-2026-11-12`: cópia preservada do snapshot parcial anterior à sincronização.
- A sincronização altera somente o repositório GitHub; não publica nem modifica o Worker em produção.

## Agendamento

O cron de produção permanece:

```cron
*/20 * * * *
```

O cron do Worker Shopee permanece separado em `10,30,50 * * * *`.

## Bindings esperados

KV:
- `DS_GARAGE_TOKENS`
- `ENVIADOS`

Variáveis/secrets:
- `ADMIN_TOKEN`
- `ML_CLIENT_ID`
- `ML_CLIENT_SECRET`
- `ML_REDIRECT_URI`
- `WAPI_ALERT_PHONE`
- `WAPI_GROUP_ID`
- `WAPI_INSTANCE_ID`
- `WAPI_TOKEN`

Não incluir valores de credenciais, telefones, IDs de grupos ou tokens no repositório. Antes de qualquer deploy futuro, conferir os bindings e a configuração diretamente no Cloudflare.
