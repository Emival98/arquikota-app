# ArquiKota

Monitor de manutenção contínua para projetos Next.js na Vercel. O ArquiKota lê um repositório público ou um cenário demo, compara dependências com o npm, aplica regras de manutenção e devolve um diagnóstico priorizado com correções prontas a aplicar.

![Painel do ArquiKota](docs/painel.png)

## O que faz

- Deteta dependências desatualizadas, Node em fim de vida, APIs depreciadas da Vercel/Supabase e práticas obsoletas.
- Explica o risco de ignorar cada alerta e apresenta um comando ou snippet de correção.
- Calcula um índice de saúde de 0 a 100 e mostra a evolução por leitura.
- Guarda o histórico de resoluções no Supabase, com fallback local explícito.
- Envia o resumo do diagnóstico por email através do EmailJS.
- Inclui um workflow de GitHub Actions com verificação semanal e manual.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Supabase · EmailJS · GitHub REST · npm registry · GitHub Actions · Vercel · Vitest

## Começar

Requisitos: Node.js 22 ou superior.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abrir `http://localhost:3000`.

### Variáveis de ambiente

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `SUPABASE_URL` | Sim, para persistência | URL do projeto Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim, para persistência | Chave server-only; nunca expor no browser. |
| `EMAILJS_SERVICE_ID` | Sim, para email | Serviço EmailJS. |
| `EMAILJS_TEMPLATE_ID` | Sim, para email | Template do relatório. |
| `EMAILJS_PUBLIC_KEY` | Sim, para email | Chave pública EmailJS. |
| `EMAILJS_PRIVATE_KEY` | Sim, para email | Chave privada, usada apenas no servidor. |
| `NEXT_PUBLIC_SITE_URL` | Não | URL pública usada nos emails. |
| `GITHUB_TOKEN` | Não | Aumenta o limite da API do GitHub. |

### Base de dados

Executar no **SQL Editor** do Supabase o ficheiro [`supabase/migrations/20261025000000_arquikota_resolutions.sql`](supabase/migrations/20261025000000_arquikota_resolutions.sql). A tabela tem RLS ativa e é acessível apenas pela service role do servidor.

Sem a migração, a aplicação continua a funcionar em modo local e indica o que falta.

### EmailJS

Ativar o acesso à API para aplicações não-browser em **Account → Security**. Criar um template com as variáveis `to_email`, `project_name`, `score`, `status`, `critical_count`, `high_count`, `total_alerts`, `top_alert`, `scanned_at` e `panel_url`. O campo **To Email** deve ser exatamente `{{to_email}}`.

## Scripts

```bash
npm run dev       # desenvolvimento
npm test          # 36 testes Vitest
npm run typecheck # TypeScript
npm run build     # build de produção
npm start         # servir o build
npm run scan:ci   # relatório de CI em maintenance-report.md
```

## Deploy na Vercel

1. Publicar o repositório no GitHub.
2. Importar na Vercel.
3. Configurar as variáveis de ambiente (incluindo as chaves privadas).
4. Aplicar a migração no Supabase.
5. Fazer deploy e testar o fluxo completo no domínio público.

## Documentação

A documentação completa está em [`docs/ArquiKota-Documentacao.md`](docs/ArquiKota-Documentacao.md), com versões Word e PDF na mesma pasta.

## Segurança

Repositórios públicos, apenas leitura. Validação de referências GitHub contra SSRF, limites de corpo, rate limiting e validação estrita dos pedidos. As chaves do Supabase (service role) e do EmailJS (privada) existem apenas no servidor.

## Limitações

O ArquiKota não substitui `npm audit`, testes de integração ou revisão humana. Observa dependências, configuração e práticas declaradas; não procura vulnerabilidades no código da aplicação.
