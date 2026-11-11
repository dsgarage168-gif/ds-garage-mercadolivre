# DS Garage — snapshot de produção (11/11/2026)

## Cloudflare Workers
- Mercado Livre: ds-garage-oauth
  - Versão ativa observada: 295
  - Versão ID: 0b9a9725-7beb-4d41-a83f-e542094db33d
  - Cron: */10 * * * *
  - O código ativo contém uma trava interna que limita a execução a minutos UTC divisíveis por 20.
  - Histórico Cloudflare observado: 295 versões.
- Shopee: ds-garage-shopee
  - Versão ativa observada: 64
  - Versão ID: bcd16530-7202-42cc-8b6f-62466acabf5a
  - Cron: 10,30,50 * * * *
  - Histórico Cloudflare observado: 64 versões.

Os códigos completos e as versões implantadas permanecem preservados no histórico nativo de versões do Cloudflare. Não foi feita alteração em produção nesta etapa.

## Render
- Serviço: ds-garage-scraper
- ID: srv-dadqs8n40ujc73ckdmv0
- Repositório: dsgarage168-gif/ds-garage-scraper
- Branch: main
- Deploy automático: habilitado para commits
- Health check: não configurado no momento do snapshot
- O código atual foi copiado para backups/2026-11-11/server.js nesta branch de manutenção.
