# Ambiente Local — Luany

## Comandos disponíveis

```bash
./bin/dev          # Subir ambiente (PostgreSQL + API + SPA)
./bin/stop         # Parar ambiente
./bin/logs [api]   # Ver logs (padrão: api, opções: app, postgres)
./bin/psql         # Conectar no PostgreSQL
./bin/seed         # Inserir dados de teste (tenants localiza + vega)
./bin/test         # Rodar testes de integração da API
./bin/reset        # Resetar banco de dados (APAGA TUDO)
./bin/setup-hosts  # Configurar /etc/hosts (sudo necessário)
```

---

## Acessos

- **API**: http://api.luany.local:8000
- **SPA**: http://app.luany.local:5173
- **PostgreSQL**: localhost:5433 (postgres/postgres)
- **Tenant Localiza**: http://localiza.luany.local:8000
- **Tenant Vega**: http://vega.luany.local:8000

---

## Multi-tenancy

### Desenvolvimento (header)

```bash
curl -H "X-Tenant-Slug: localiza" http://api.luany.local:8000/configuracoes
```

### Produção (subdomínio)

```bash
curl http://localiza.luany.local:8000/configuracoes
```

---

## Dados de teste

Após rodar `./bin/seed`:

- **2 tenants**: localiza (a0000000...0001) + vega (a0000000...0002)
- **4 configs**: 2 QIVE + 2 UAU (credenciais demo)

---

## Secrets e configurações

| O que | Onde |
|---|---|
| Credenciais QIVE e UAU por tenant | Banco de dados PostgreSQL (tabela `tenant_configs`, campo JSONB `config`) |
| Variáveis de ambiente da API | `nota-fiscal-api/.env` (gitignored) |
| Configuração Docker Compose | `docker-compose.yml` |

**⚠️ Importante**: Credenciais sensíveis nunca devem ser commitadas. Use `.env` local e configure variáveis de ambiente em produção via dashboard (Railway/AWS).

---

**Última atualização**: 2026-04-24
