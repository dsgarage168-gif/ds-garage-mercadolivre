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


## Resiliência e observabilidade (12/11/2026)

- Geração de link afiliado: backoff de 30s, 60s e 120s para respostas temporárias; respeita `Retry-After` até 120s.
- W-API: até 3 tentativas somente para HTTP 429; respeita `Retry-After` e registra status/corpo de erro limitado, sem registrar credenciais.
- Erros da execução registram etapa e mensagem legível.
- Cloudflare Observability: logs persistentes, invocations habilitadas, amostragem de 100% e query strings redigidas.
- O cron de produção permanece `*/20 * * * *`; nenhum agendamento foi alterado.
