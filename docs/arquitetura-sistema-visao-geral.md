# Arquitetura do Sistema — Luany

## Propósito

O Luany é um SaaS de reconciliação de notas fiscais eletrônicas. Para cada empresa cliente (tenant), o sistema cruza duas fontes de dados:

- **QIVE**: todas as NFes recebidas pelos CNPJs da empresa
- **UAU**: todos os processos de pagamento registrados no ERP

O resultado é o **gap**: NFes que existem no QIVE mas não estão cadastradas/vinculadas no UAU. O operador visualiza esse gap e age sobre ele — vinculando uma NFe existente a um processo, ou gerando uma nova NFe diretamente no UAU.

## Multi-Tenant

O sistema é multi-tenant. Cada empresa cliente:

- Acessa via subdomínio próprio: `{slug}.luany.com.br`
- Configura suas credenciais QIVE e UAU pela tela de integrações
- Tem seus dados isolados no banco de dados

Não há limite de tenants. Nenhuma credencial de empresa fica no `.env` — tudo no banco.

---

## Visão de Sistema

```
                     localiza.luany.com.br
                     vega.luany.com.br
                     {n}.luany.com.br
                            │
                            ▼
              ┌─────────────────────────┐
              │      nota-fiscal-app    │  React 19 + Vite  :5173
              │   Painel do operador    │
              └────────────┬────────────┘
                           │ HTTP
                           ▼
              ┌─────────────────────────┐
              │     nota-fiscal-api     │  NestJS 11  :8000
              │  1. resolve tenant      │
              │  2. carrega config DB   │
              │  3. chama QIVE + UAU    │
              │  4. calcula gap         │
              └────┬──────────────┬─────┘
                   │              │
          ┌────────┘              └────────┐
          │ HTTPS                          │ HTTP
          ▼                               ▼
    ┌──────────┐              ┌────────────────────────┐
    │   QIVE   │              │     UAU (Globaltec)    │
    │          │              │  URL configurada por   │
    │ API ID   │              │  tenant no banco       │
    │ API Key  │              │  ex: LOCALIZA, VEGA... │
    │ (tenant) │              └────────────────────────┘
    └──────────┘

              ┌─────────────────────────┐
              │      PostgreSQL         │
              │   tenants               │
              │   tenant_configs        │  QIVE + UAU por tenant
              └─────────────────────────┘
```

---

## Fluxo Completo — Reconciliação

```
1. Operador acessa {slug}.luany.com.br
        │
        ▼
2. API resolve tenant pelo subdomínio
   → carrega tenant_config (QIVE + UAU) do banco
        │
        ▼
3. Operador seleciona: empresa UAU, obras, período
        │
        ▼
4. Operador aciona "Reconciliar"
        │
        ├──────────────────────────────────────────┐
        │                                          │
        ▼                                          ▼
5a. Busca NFes no QIVE                    5b. Busca processos no UAU
    GET /v1/nfe/received                      POST /ProcessoPagamento/ConsultarProcessos
    cnpj[] = CNPJs do tenant                  empresa/obras selecionadas
    período selecionado                        período selecionado
    usando: qiveApiId + qiveApiKey            usando: uauBaseUrl + token + login + senha
        │                                          │
        └──────────────┬───────────────────────────┘
                       │
                       ▼
6. Motor de reconciliação (ReconciliacaoService.calcularGap)
   Matching por: chave NF-e (44 dígitos) OU número NF + CNPJ emitente
   NFe vinculada  = encontrou processo UAU com docFiscal/chave correspondente
   NFe pendente   = sem correspondência em nenhum processo UAU
                       │
                       ▼
7. Frontend exibe resultado:
   ┌─────────────────────────────────────┐
   │  Pendentes (ação necessária)        │  → Vincular a processo OU Gerar NF no UAU
   │  Vinculadas (informativo)           │
   │  Resumo: total / valor pendente     │
   └─────────────────────────────────────┘
```

---

## Fluxo — Configuração de Integrações (por Tenant)

```
1. Tenant acessa {slug}.luany.com.br → Configurações → Integrações
        │
        ├── Configurar QIVE
        │     Campos: Base URL, API ID, API Key, CNPJs monitorados
        │     Ação: "Testar Conexão" → valida credenciais com QIVE
        │     Salvar → grava em tenant_configs (criptografado)
        │
        └── Configurar UAU
              Campos: Base URL, Integration Token, Login, Senha, Site, Autenticação via AD
              Ação: "Testar Conexão" → autentica no UAU e valida
              Salvar → grava em tenant_configs (criptografado)
```

Referência de UI: `design-refs/tela-configuracao-integracoes/`

---

## Módulos do Backend

### TenantModule (a criar)

Middleware que intercepta toda requisição, extrai o slug do subdomínio e injeta o tenant + suas configurações no contexto do request.

```
Request: localiza.luany.com.br/reconciliacao/gap
  → extrai slug: "localiza"
  → carrega Tenant + TenantConfig do banco
  → injeta no request como tenant ativo
```

Em desenvolvimento local: header `X-Tenant-Slug: localiza` simula o subdomínio.

### ConfiguracaoIntegracaoModule — `/configuracao` (a criar)

Gerencia as configurações QIVE e UAU de cada tenant.

```
GET  /configuracao/integracoes         → status de cada integração (configurada/não configurada)
PUT  /configuracao/qive                → salva config QIVE do tenant
PUT  /configuracao/uau                 → salva config UAU do tenant
POST /configuracao/qive/testar         → valida credenciais QIVE (GET /v1/nfe/received com limit=1)
POST /configuracao/uau/testar          → autentica no UAU e valida token
```

### ArquiveiModule — `/arquivei` (refatorar)

Consulta NFes via QIVE usando as credenciais do tenant ativo. Suporta múltiplos CNPJs por request.

```
GET /arquivei/notas-fiscais?startDate=&endDate=
  → usa tenant.qiveBaseUrl, tenant.qiveApiId, tenant.qiveApiKey
  → cnpj[] = todos os CNPJs configurados do tenant
  → retorna NotaFiscal[]
```

### UauModule — `/uau` (refatorar)

Opera no UAU usando URL e credenciais do tenant ativo.

```
POST /uau/consultar-processos          → body: { obra, periodoInicial, periodoFinal }
POST /uau/gerar-nota-fiscal            → body: GerarNotaFiscalRequest
POST /uau/modelos-nota                 → retorna modelos disponíveis

UauService:
  autenticarUsuario(tenantUauConfig)   → POST {uauBaseUrl}/Autenticador/AutenticarUsuario
  consultarProcessos(config, params)   → POST {uauBaseUrl}/ProcessoPagamento/ConsultarProcessos
  gerarNotaFiscal(config, payload)     → POST {uauBaseUrl}/ProcessoPagamento/GerarNotaFiscal
```

### ReconciliacaoModule — `/reconciliacao` (a criar)

Núcleo do produto.

```
POST /reconciliacao/gap
  Body: { obras: string[], periodoInicial: string, periodoFinal: string }

ReconciliacaoService.calcularGap(tenant, filtros):
  1. ArquiveiService.fetchNotasFiscais(tenant)       → nfesQive[]
  2. UauService.consultarProcessos(tenant, filtros)  → processosUau[]
  3. diffEngine(nfesQive, processosUau)
       para cada NFe do QIVE:
         busca processo UAU com chaveNFe matching OU (numeroNF + cnpjEmitente) matching
         encontrou → vinculada
         não encontrou → pendente
  4. retorna { pendentes[], vinculadas[], resumo }
```

---

## Modelo de Dados

### tenants

```sql
id           UUID PRIMARY KEY
slug         VARCHAR UNIQUE    -- "localiza", "vega"
nome         VARCHAR           -- "LOCALIZA IMOVEIS LTDA"
dominio      VARCHAR           -- "localiza.luany.com.br"
ativo        BOOLEAN
criado_em    TIMESTAMPTZ
```

### tenant_configs

Uma linha por tenant (contém QIVE e UAU juntos — ambos sempre obrigatórios).

```sql
id           UUID PRIMARY KEY
tenant_id    UUID REFERENCES tenants(id)

-- QIVE
qive_base_url   VARCHAR   -- https://api.arquivei.com.br
qive_api_id     TEXT      -- criptografado
qive_api_key    TEXT      -- criptografado
qive_cnpjs      TEXT[]    -- CNPJs monitorados (ex: {"03306164000130"})

-- UAU
uau_base_url           VARCHAR   -- http://189.5.131.86:8082/uauAPITESTE/api/v1.0
uau_integration_token  TEXT      -- criptografado (JWE Globaltec)
uau_login              VARCHAR
uau_senha              TEXT      -- criptografado
uau_site               VARCHAR
uau_autenticacao_ad    BOOLEAN   -- campo observado na tela de integração Trinus

atualizado_em   TIMESTAMPTZ
```

**Regra**: credenciais sensíveis (`qive_api_id`, `qive_api_key`, `uau_integration_token`, `uau_senha`) são criptografadas em repouso (AES-256 via `pgcrypto` ou camada de aplicação).

---

## Contratos de API Internos

### `POST /reconciliacao/gap`
```
Headers: Authorization: Bearer {jwt}   [identifica tenant]
Body:    { obras: string[], periodoInicial: string, periodoFinal: string }

Response 200:
{
  pendentes:  NotaFiscal[],
  vinculadas: NotaFiscal[],
  resumo: {
    totalQive:      number,
    totalVinculadas: number,
    totalPendentes:  number,
    valorPendente:   number
  }
}
```

### `PUT /configuracao/qive`
```
Body: { baseUrl, apiId, apiKey, cnpjs: string[] }
Response 200: { configurado: true }
```

### `PUT /configuracao/uau`
```
Body: { baseUrl, integrationToken, login, senha, site, autenticacaoAd?: boolean }
Response 200: { configurado: true }
```

### `POST /configuracao/qive/testar`
```
Response 200: { ok: true, totalNfes: number }
Response 400: { ok: false, erro: string }
```

### `POST /configuracao/uau/testar`
```
Response 200: { ok: true, usuario: string }
Response 400: { ok: false, erro: string }
```

### `GET /arquivei/notas-fiscais`
```
Query: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
       [cnpjs vêm da config do tenant — não passados pelo frontend]
Response 200: NotaFiscal[]
```

### `POST /uau/consultar-processos`
```
Body: { obra: string, periodoInicial: string, periodoFinal: string }
      [URL e credenciais UAU vêm da config do tenant]
Response 200: ProcessDetails[]
```

### `POST /uau/gerar-nota-fiscal`
```
Body: GerarNotaFiscalRequest (sem campo empresa — vem do tenant)
Response 200: { sucesso: boolean, mensagem: string, numeroNF?: string }
```

---

## Variáveis de Ambiente

Apenas infraestrutura — zero credenciais de tenant:

| Variável | Descrição |
|---|---|
| `PORT` | Porta do servidor (padrão: 8000) |
| `APP_ENV` | desenvolvimento / homologacao / producao |
| `DATABASE_URL` | String de conexão PostgreSQL |
| `JWT_SECRET` | Segredo para assinar tokens JWT |
| `JWT_EXPIRES_IN` | TTL dos tokens (ex: `8h`) |
| `APP_BASE_DOMAIN` | Domínio base para resolver tenant (ex: `luany.com.br`) |
| `QIVE_TIMEOUT_MS` | Timeout padrão chamadas QIVE (padrão: 20000) |
| `UAU_TIMEOUT_MS` | Timeout padrão chamadas UAU (padrão: 30000) |
| `UAU_AUTH_TIMEOUT_MS` | Timeout autenticação UAU (padrão: 20000) |

Template: `nota-fiscal-api/.env.example`

---

## Decisões Arquiteturais

### ADR-001 — Configuração de integração no banco, não no `.env`

**Decisão**: credenciais QIVE e UAU de cada empresa ficam no banco de dados.  
**Motivação**: o sistema suporta N tenants. Variável de env por empresa não escala e não permite autoatendimento pelo cliente.

### ADR-002 — Tenant resolvido pelo subdomínio

**Decisão**: `localiza.luany.com.br` → slug `localiza` → carrega config do banco.  
**Dev local**: header `X-Tenant-Slug` simula o subdomínio.

### ADR-003 — Ambas as integrações são obrigatórias por tenant

**Decisão**: QIVE e UAU devem estar configurados para o sistema funcionar. Sem uma das duas, a reconciliação não pode ser executada.  
**UI**: tela de configuração exibe status de cada integração (configurada / não configurada / erro de conexão).

### ADR-004 — CNPJs monitorados configurados por tenant, não passados pelo frontend

**Decisão**: os CNPJs ficam no `tenant_configs.qive_cnpjs`. O frontend não passa CNPJs na chamada — o backend usa os CNPJs da config do tenant.  
**Motivação**: o frontend não deve conhecer os CNPJs internos da empresa. O operador configura uma vez, o sistema usa sempre.

### ADR-005 — Motor de reconciliação centralizado no backend

**Decisão**: o cálculo do gap (diff NFes QIVE vs processos UAU) ocorre exclusivamente no backend.  
**Motivação**: volume de dados pode ser grande; lógica de negócio testável e auditável em um único lugar.

### ADR-006 — Credenciais criptografadas em repouso

**Decisão**: `qive_api_id`, `qive_api_key`, `uau_integration_token`, `uau_senha` são criptografados antes de persistir.  
**Motivação**: banco comprometido não expõe credenciais dos clientes.

### ADR-007 — Cache de token UAU por tenant

**Decisão** (planejada): token UAU cacheado em memória por tenant-slug com TTL de 30 min.  
**Motivação**: `AutenticarUsuario` é chamado a cada request atualmente — latência desnecessária.

---

## Tecnologias

| Camada | Tecnologia | Versão |
|---|---|---|
| Backend | NestJS | 11.x |
| Backend | TypeScript | 5.7 |
| Banco de dados | PostgreSQL | 15+ |
| Frontend | React | 19.x |
| Frontend | TypeScript | 5.9 |
| Frontend | Vite | 7.x |
| Runtime | Node.js | 22.x |
