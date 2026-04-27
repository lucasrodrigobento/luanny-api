# Stack e Módulos — Luany

## Stack

| Componente | Tecnologia | Porta |
|---|---|---|
| `nota-fiscal-api` | NestJS 11 + TypeORM + PostgreSQL | 8000 |
| `nota-fiscal-app` | React 19 + Vite | 5173 |
| PostgreSQL | banco de dados | 5433 (local) |

---

## Estado dos módulos (2026-04-24)

| Módulo | Estado | Detalhes |
|---|---|---|
| **TenantModule** | ✅ implementado | Middleware resolve tenant via `X-Tenant-Slug` (dev) ou subdomínio (prod). TenantService com getQiveConfig/getUauConfig. Decorator @CurrentTenant() |
| **ArquiveiModule** | ✅ refatorado | Multi-tenant completo. Recebe tenantId via @CurrentTenant() decorator |
| **UauModule** | ✅ refatorado | Multi-tenant completo. Recebe tenantId via @CurrentTenant() decorator |
| **ConfiguracaoIntegracaoModule** | ✅ implementado | CRUD de TenantConfig + endpoint POST /configuracoes/:id/test-connection |
| **ReconciliacaoModule** | ✅ implementado | POST /reconciliacao/calcular-gap — matching simples por chave_acesso |

---

## Decisões técnicas

- **TypeScript**: 5.7.3 com `strictPropertyInitialization: false` para TypeORM
- **Module system**: `module: "commonjs"` ao invés de `nodenext` (compatibilidade typeorm-ts-node-commonjs)
- **Migrations**: Criadas manualmente via SQL (TypeORM CLI com erro de decorators)
- **Docker mode**: Produção (`npm run start:prod`) ao invés de dev (evita problemas com volumes)
- **PostgreSQL porta**: 5433 (5432 já ocupada no host)

---

## Problemas resolvidos

1. **TypeScript decorators error**: Ajustado tsconfig.json para `commonjs` + adicionado `!` nas propriedades
2. **Migrations falhando**: Criadas tabelas manualmente via SQL
3. **Docker volume mounting**: Removido volume para evitar conflito com node_modules
4. **TypeORM data type error**: Removido `| null` do tipo (deixar apenas `nullable: true`)
5. **Porta PostgreSQL**: Mapeada para 5433 (conflito com instância local)

---

## Infraestrutura implementada (2026-04-24)

- Docker Compose: PostgreSQL (5433) + API (8000) + SPA (5173)
- Scripts de gerenciamento: `bin/dev`, `bin/stop`, `bin/logs`, `bin/seed`, `bin/test`
- /etc/hosts configurado: api.luany.local, localiza.luany.local, vega.luany.local
- Dockerfile multi-stage para API (builder + produção)
- Dockerfile + nginx para SPA

---

**Última atualização**: 2026-04-24
