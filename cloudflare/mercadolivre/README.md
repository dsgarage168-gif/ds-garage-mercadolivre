# Mercado Livre — Cloudflare Worker

Este diretório guarda uma cópia versionada do Worker `ds-garage-oauth` publicado no Cloudflare em 11/11/2026.

## Arquivo de origem

- `worker.js`: código extraído da versão publicada.
- O único ajuste nesta cópia de repositório é a retirada do número de telefone de alerta que estava escrito diretamente no código. Ele foi substituído por `env.WAPI_ALERT_PHONE`. O Worker de produção não foi alterado por esta sincronização.

## Agendamento de produção

```cron
*/20 * * * *
```

O cron do Worker Shopee permanece separado em `10,30,50 * * * *`, mantendo a alternância planejada.

## Bindings e variáveis esperadas

KV:
- `DS_GARAGE_TOKENS`
- `ENVIADOS`

Secrets/vars:
- `ADMIN_TOKEN`
- `ML_CLIENT_ID`
- `ML_CLIENT_SECRET`
- `ML_REDIRECT_URI`
- `WAPI_TOKEN`
- `WAPI_GROUP_ID`
- `WAPI_INSTANCE_ID`
- `WAPI_ALERT_PHONE` (variável usada no lugar do número de alerta removido desta cópia)

**Importante:** esta cópia é um snapshot seguro para versionamento, não um pacote pronto para deploy. Antes de publicar qualquer alteração a partir dela, confira os bindings, secrets, compatibilidade e configurações diretamente no Cloudflare. Não coloque tokens ou identificadores privados no GitHub.
