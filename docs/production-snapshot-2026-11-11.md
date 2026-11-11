# DS Garage — snapshot de produção (11/11/2026)

## Cloudflare Workers
- Mercado Livre: ds-garage-oauth
  - Versão anterior: 295 (0b9a9725-7beb-4d41-a83f-e542094db33d)
  - Versão atual: 296 (377fc079-b9fb-4c04-bee1-f0480ebc49b8)
  - Cron alinhado ao filtro interno: */20 * * * *
  - Inclui retry com backoff para HTTP 429 e 5xx do Mercado Livre.
  - A verificação de administrador agora falha fechada se ADMIN_TOKEN não estiver configurado.
- Shopee: ds-garage-shopee
  - Versão anterior: 64 (bcd16530-7202-42cc-8b6f-62466acabf5a)
  - Versão atual: 65 (d3c95ef8-b68d-40b1-a750-23b087c378b5)
  - Cron: 10,30,50 * * * *
  - A paginação só avança após o processamento da palavra-chave; se o envio WhatsApp falhar, a página permanece para nova tentativa.

Os códigos completos permanecem preservados no histórico nativo de versões do Cloudflare. Não houve alteração de bindings ou credenciais dos Workers.

## Render
- Serviço: ds-garage-scraper
- ID: srv-dadqs8n40ujc73ckdmv0
- Repositório: dsgarage168-gif/ds-garage-scraper
- Deploy atual: 3ec69c7aa9dc73001ded283a4321f0e8042f0a64 (live)
- Inclui endpoint GET /health e validação do formato do item_id MLB.
- O health check da plataforma Render continua sem configuração, pois a integração disponível não expõe atualização desse campo.

## GitHub
- Branch de manutenção criada nos dois repositórios: maintenance/2026-11-11-audit
- Snapshot do server.js anterior preservado em backups/2026-11-11/server.js no branch do scraper.
- O arquivo server.sj no repositório Mercado Livre é antigo e não representa o Worker de produção; não deve ser usado para deploy.
