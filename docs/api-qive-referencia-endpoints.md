# Referência de Endpoints — QIVE (ex-Arquivei)

QIVE é a plataforma de gestão de documentos fiscais eletrônicos (anteriormente Arquivei). A API fornece acesso programático às NFes recebidas pelos CNPJs cadastrados.

## Ambientes

| Ambiente | Base URL | Quando usar |
|---|---|---|
| Produção | `https://api.arquivei.com.br` | Dados reais — CNPJs cadastrados da empresa |
| Sandbox | `https://sandbox-api.arquivei.com.br` | Desenvolvimento e testes locais |

A variável `ARQUIVEI_BASE_URL` no `.env` controla qual ambiente está ativo.

## Autenticação

Todos os endpoints requerem dois headers fixos:

```
X-API-ID:  <id-da-aplicacao>
X-API-KEY: <chave-secreta>
```

Cada ambiente (produção e sandbox) possui um par de credenciais distinto. As chaves são fixas por aplicação — não expiram. Geradas no painel QIVE ou via conta de integração.

Conta do portal: `Sheila.alvarenga@techprice.com.br` — senha no gerenciador de senhas do time.

## Endpoint 1 — Buscar NFes Recebidas

```
GET https://api.arquivei.com.br/v1/nfe/received
```

### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `cnpj[]` | string | sim | CNPJ da empresa (apenas dígitos). Suporta múltiplos: `cnpj[]=XXXX&cnpj[]=YYYY` |
| `created_at[from]` | string | sim | Data inicial — formato `YYYY-MM-DD` |
| `created_at[to]` | string | sim | Data final — formato `YYYY-MM-DD` |
| `limit` | number | não | Máximo de registros por resposta (padrão: 50) |
| `format_type` | string | não | Formato da resposta — usar `"json"` |

### Headers

```
X-API-ID: {ARQUIVEI_API_ID}
X-API-KEY: {ARQUIVEI_API_KEY}
Content-Type: application/json
```

### Exemplo de Requisição

```
GET https://api.arquivei.com.br/v1/nfe/received
    ?cnpj[]=12345678000190
    &created_at[from]=2025-01-01
    &created_at[to]=2025-01-31
    &limit=50
    &format_type=json
```

### Response 200 — Sucesso

```json
{
  "data": [
    {
      "access_key": "35250112345678000190550010000123451234567890",
      "xml": {
        "NFe": {
          "infNFe": {
            "@attributes": {
              "Id": "NFe35250112345678000190550010000123451234567890"
            },
            "ide": {
              "nNF": "12345",
              "dhEmi": "2025-01-15T10:30:00-03:00",
              "mod": "55"
            },
            "emit": {
              "CNPJ": "12345678000190",
              "xNome": "EMPRESA EMITENTE LTDA",
              "xFant": "NOME FANTASIA"
            },
            "dest": {
              "CNPJ": "98765432000111"
            },
            "total": {
              "ICMSTot": {
                "vNF": "1500.00",
                "vProd": "1500.00"
              }
            }
          }
        }
      }
    }
  ]
}
```

### Response 401 — Credenciais Inválidas

```json
{
  "error": {
    "message": "Unauthorized"
  }
}
```

### Response 400 — Parâmetros Inválidos

```json
{
  "error": {
    "message": "Invalid date format"
  }
}
```

## Mapeamento de Campos para o Frontend

O `ArquiveiService` extrai os seguintes campos do XML aninhado:

| Campo frontend | Origem no XML |
|---|---|
| `id` | `access_key` ou `infNFe.@attributes.Id` sem prefixo "NFe" |
| `numero` | `infNFe.ide.nNF` |
| `dataEmissao` | `infNFe.ide.dhEmi` (convertido para `YYYY-MM-DD`) |
| `valor` | `infNFe.total.ICMSTot.vNF` |
| `valorServicos` | `infNFe.total.ICMSTot.vProd` |
| `prestadorServico` | `infNFe.emit.xNome` ou `xFant` |
| `cnpj` | `infNFe.dest.CNPJ` ou `infNFe.emit.CNPJ` |

## Endpoints Adicionais (Não Implementados)

A API QIVE disponibiliza outros endpoints na v1 (documentados em https://developers.qive.com.br/):

| Endpoint | Descrição | Documentação |
|---|---|---|
| `GET /v1/nfe/sent` | NFes emitidas pela empresa | — |
| `GET /v1/nfse/received` | NFSes recebidas | https://developers.qive.com.br/docs/get/v1/nfse/received |
| `GET /v1/cte` | Conhecimentos de Transporte Eletrônico | — |

Manual em PDF do endpoint NFSe: https://developers.qive.com.br/docs/get/v1/nfse/received/manual/pdf

Sandbox interativo para testar chamadas: https://developers.qive.com.br/sandbox

## Rate Limits e Timeouts

| Parâmetro | Valor atual | Recomendado |
|---|---|---|
| Timeout | 20.000 ms | 20.000 ms |
| Registros por request | 50 | 50 (padrão) |
| Max redirects | 5 | 5 |
| Retry em erro 5xx | não implementado | 3x com backoff exponencial |

## Paginação

A API QIVE usa paginação via `limit`. Para volumes maiores que 50 NFes, é necessário implementar cursor-based pagination:

```
GET /v1/nfe/received?limit=50&page_token={cursor_da_resposta_anterior}
```

O campo `page_token` é retornado na resposta quando há mais registros disponíveis. **Não implementado no projeto atual.**

## Variáveis de Ambiente

```env
ARQUIVEI_BASE_URL=https://api.arquivei.com.br   # ou sandbox
ARQUIVEI_API_ID=<id-da-aplicacao-qive>
ARQUIVEI_API_KEY=<chave-secreta-qive>
```

Gerenciadas em `nota-fiscal-api/.env`. Template em `nota-fiscal-api/.env.example`.

**Atenção**: `ARQUIVEI_BASE_URL` está atualmente hardcoded em `arquivei.service.ts`. Pendente mover para variável de ambiente (ver MEMORY.md).
