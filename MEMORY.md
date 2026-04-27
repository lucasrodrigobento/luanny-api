# MEMORY.md — Luany

**Status**: ✅ MVP multi-tenant rodando localmente via Docker (2026-04-24)

**Repo**: `~/Projects/nota-fiscal-reconciliation/` (local)

---

## O que é

SaaS **multi-tenant** de reconciliação de notas fiscais. Cada empresa cliente configura duas integrações obrigatórias — QIVE e UAU — e o sistema identifica quais NFes recebidas no QIVE ainda não estão registradas no ERP UAU dessa empresa.

```
QIVE  →  todas as NFes recebidas pelos CNPJs da empresa
UAU   →  todos os processos de pagamento registrados
             ↓
        gap = NFes sem correspondência no UAU → ação do operador
```

---

## Onde está o quê

| Preciso de... | Arquivo |
|---|---|
| Stack + módulos + decisões técnicas | `docs/stack-e-modulos.md` |
| Comandos + acessos locais | `docs/ambiente-local.md` |
| Integrações QIVE e UAU | `docs/integracoes.md` |
| Lista de tenants conhecidos | `docs/tenants.md` |
| Endpoints da API | `docs/api-referencia.md` |
| Arquitetura completa | `docs/arquitetura-sistema-visao-geral.md` |
| Casos de uso | `docs/casos-de-uso-integracao-nfe-processo.md` |
| API QIVE | `docs/api-qive-referencia-endpoints.md` |
| API UAU | `docs/api-uau-referencia-endpoints.md` |
| Cenários de teste | `docs/cenarios-teste-integracao.md` |
| Referências visuais | `design-refs/` |

---

## Quick start

```bash
./bin/dev          # Subir ambiente (PostgreSQL + API + SPA)
./bin/seed         # Inserir dados de teste
./bin/test         # Rodar testes
```

**Acessos**:
- API: http://api.luany.local:8000
- SPA: http://app.luany.local:5173
- PostgreSQL: localhost:5433

**Tenants de teste**: localiza, vega

---

## Estado atual (2026-04-24)

### ✅ Implementado

- **TenantModule**: middleware + decorator @CurrentTenant()
- **ArquiveiModule**: busca NFes multi-tenant
- **UauModule**: busca processos multi-tenant
- **ConfiguracaoIntegracaoModule**: CRUD + test-connection
- **ReconciliacaoModule**: calcular gap por período
- **Infraestrutura**: Docker Compose + scripts bin/
- **Dados de teste**: 2 tenants (localiza + vega) com configs

### 📋 Próximos passos

1. **UI de configuração de integrações** (React + TanStack Query)
   - Tela CRUD de configs QIVE/UAU
   - Botão "Testar Conexão" inline
   - Validação de campos por tipo

2. **Cache de token UAU** (Redis ou in-memory)
   - TTL de 30 min por tenant
   - Renovação automática

3. **Suporte a NFSe** além de NFe
   - Endpoint `/v1/nfse/received` do QIVE
   - Matching de NFSe vs processos UAU

4. **Testes automatizados**
   - Jest + Supertest para endpoints
   - Cobertura mínima 80%

5. **Deploy**
   - Decisão pendente: Railway vs AWS/Oracle
   - Guia: `DEPLOY.md`

---

## Documentação completa

| Documento | Conteúdo |
|---|---|
| [README.md](README.md) | Visão geral + comandos |
| [DEPLOY.md](DEPLOY.md) | Guia de deploy Railway |
| [docs/](docs/) | Arquitetura, APIs, casos de uso, testes |

---

**Última atualização**: 2026-04-27
