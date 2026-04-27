# Integrações — Luany

## Integrações obrigatórias por tenant

Cada tenant precisa configurar **ambas** para o sistema funcionar:

| Integração | O que fornece | Credenciais necessárias |
|---|---|---|
| **QIVE** | NFes recebidas pelos CNPJs da empresa | Base URL + API ID + API Key + lista de CNPJs |
| **UAU** | Processos de pagamento do ERP | Base URL + Integration Token + Login + Senha + Site |

---

## QIVE (Arquivei)

**Base URL**: `https://api.arquivei.com.br` (produção)

Cada tenant tem seu próprio par **API ID / API Key** e lista de **CNPJs** monitorados.

### Configuração exemplo

```json
{
  "tipo": "qive",
  "config": {
    "baseUrl": "https://api.arquivei.com.br",
    "apiId": "xxx",
    "apiKey": "yyy",
    "cnpjs": ["12345678000199"]
  }
}
```

### Endpoints utilizados

- `GET /v1/nfe/received` — NFes recebidas
- `GET /v1/nfse/received` — NFSe recebidas (futuro)

**Documentação completa**: `docs/api-qive-referencia-endpoints.md`

---

## UAU (ERP)

Cada tenant tem sua própria **instância UAU** com credenciais específicas.

### Configuração exemplo

```json
{
  "tipo": "uau",
  "config": {
    "baseUrl": "http://189.5.131.86:8082/uauAPITESTE/api/v1.0",
    "integrationToken": "xxx",
    "login": "usuario",
    "senha": "senha",
    "site": "SITE_01"
  }
}
```

### Endpoints utilizados

- `POST /Login` — Autenticação
- `GET /Processo/Listar` — Processos de pagamento

**Documentação completa**: `docs/api-uau-referencia-endpoints.md`

---

## Teste de conexão

Endpoint disponível para validar credenciais:

```bash
POST /configuracoes/:id/test-connection
```

Retorna:
- `200 OK` — Conexão bem-sucedida
- `400 Bad Request` — Credenciais inválidas
- `500 Internal Server Error` — Erro na API externa

---

**Última atualização**: 2026-04-24
