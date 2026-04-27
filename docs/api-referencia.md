# API Referência — Luany

## Endpoints principais

### Configurações

```bash
# Listar configurações do tenant
GET /configuracoes

# Criar configuração QIVE/UAU
POST /configuracoes
{
  "tipo": "qive",
  "config": {
    "baseUrl": "https://api.arquivei.com.br",
    "apiId": "xxx",
    "apiKey": "yyy",
    "cnpjs": ["12345678000199"]
  }
}

# Buscar configuração específica
GET /configuracoes/:id

# Atualizar configuração
PATCH /configuracoes/:id

# Deletar configuração
DELETE /configuracoes/:id

# Testar conexão
POST /configuracoes/:id/test-connection
```

---

### Reconciliação

```bash
# Calcular gap (reconciliação)
POST /reconciliacao/calcular-gap
{
  "dataInicio": "2024-01-01",
  "dataFim": "2024-01-31"
}
```

**Resposta**: Lista de NFes do QIVE que não têm correspondência no UAU.

---

### Integrações

```bash
# Buscar NFes (QIVE)
GET /arquivei/notas-fiscais

# Buscar processos (UAU)
GET /uau/processos
```

---

## Autenticação multi-tenant

### Desenvolvimento (header)

```bash
curl -H "X-Tenant-Slug: localiza" http://api.luany.local:8000/configuracoes
```

### Produção (subdomínio)

```bash
curl http://localiza.luany.local:8000/configuracoes
```

O middleware resolve automaticamente o tenant e injeta via decorator `@CurrentTenant()`.

---

**Última atualização**: 2026-04-24
