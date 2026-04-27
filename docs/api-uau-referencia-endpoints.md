# Referência de Endpoints — UAU (Globaltec)

UAU é o ERP da Globaltec utilizado para gestão de processos de pagamento, contratos e notas fiscais de obras e empreendimentos. A integração ocorre via API REST proprietária.

## Autenticação

O UAU usa autenticação em dois níveis:

**Nível 1 — Token de Integração** (`X-INTEGRATION-Authorization`)
- Token fixo fornecido pela Globaltec no setup da integração
- Enviado em **todos** os requests
- Formato: JWE (JSON Web Encryption) — algoritmo `dir`, encriptação `A128CBC-HS256`
- Não expira durante a vigência do contrato de integração

**Nível 2 — Token de Autenticação** (`Authorization`)
- Gerado via endpoint `/Autenticador/AutenticarUsuario` usando credenciais de usuário
- Enviado apenas em endpoints de negócio (ProcessoPagamento)
- Validade: duração da sessão UAU (estimado: 30 minutos)
- Atualmente re-gerado a cada request (sem cache) — ver pendências em MEMORY.md

## Ambientes

| Empresa | Ambiente | URL Base | Observação |
|---|---|---|---|
| LOCALIZA | Teste | `http://189.5.131.86:8082/uauAPITESTE/api/v1.0` | em uso atualmente |
| VEGA | Produção | `http://168.194.255.168:8080/uauAPI/api/v1.0` | confirmado por Lucas (Anyelton, 17/02/2026) |

Swagger LOCALIZA (teste): `http://189.5.131.86:8082/uauAPITESTE/swagger/ui/index`  
Swagger VEGA (produção): `http://168.194.255.168/uauAPI/swagger/ui/index`

---

## Endpoint 1 — Autenticar Usuário

```
POST {UAU_BASE_AUTH}
POST /api/v1.0/Autenticador/AutenticarUsuario
```

### Headers

```
Content-Type: application/json
X-INTEGRATION-Authorization: {UAU_INTEGRATION_TOKEN}
```

### Request Body

```json
{
  "login": "tester",
  "senha": "senha-do-usuario",
  "UsuarioUAUSite": "tester"
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `login` | string | Login do usuário UAU de integração |
| `senha` | string | Senha do usuário |
| `UsuarioUAUSite` | string | Contexto/site do usuário no UAU |

### Response 200 — Sucesso

```json
{
  "Authorization": "Bearer eyJhbGciOi..."
}
```

O token retornado é usado como header `Authorization` nos endpoints de negócio. O serviço tenta os campos `Authorization`, depois `token`, e como fallback usa o valor direto da resposta.

### Response de Erro

```json
{
  "message": "Usuário ou senha inválidos"
}
```

**Timeout**: 20.000 ms

---

## Endpoint 2 — Consultar Processos de Pagamento

```
POST {UAU_BASE_PROCESSO}
POST /api/v1.0/ProcessoPagamento/ConsultarProcessos
```

### Headers

```
Content-Type: application/json
X-INTEGRATION-Authorization: {UAU_INTEGRATION_TOKEN}
Authorization: {authToken obtido em AutenticarUsuario}
```

### Request Body

```json
{
  "EmpresaObraPeriodo": {
    "EmpresaObra": [
      {
        "Empresa": 225,
        "Obra": "004"
      }
    ],
    "PeriodoInicial": "2025-01-01",
    "PeriodoFinal": "2025-01-31"
  }
}
```

| Campo | Tipo | Descrição |
|---|---|---|
| `EmpresaObra[].Empresa` | number | Código numérico da empresa |
| `EmpresaObra[].Obra` | string | Código da obra |
| `PeriodoInicial` | string | Data inicial — formato `YYYY-MM-DD` |
| `PeriodoFinal` | string | Data final — formato `YYYY-MM-DD` |

### Response 200 — Sucesso

O UAU retorna um array de processos. Cada processo pode conter uma lista de parcelas:

```json
[
  {
    "NumeroProcesso": 383,
    "Empresa": 1,
    "DescrEmpresa": "EMPRESA VEGA",
    "Obra": "LOREB",
    "DescrObra": "Empreendimento Lorem Ipusm",
    "NomeFornecedor": "FORNECEDOR EXEMPLO LTDA",
    "CnpjFornecedor": "12345678000190",
    "CodigoFornecedor": 1042,
    "Parcelas": [
      {
        "Nominal": "FORNECEDOR EXEMPLO LTDA",
        "Valor": 15000.00,
        "ValorTotalDocumentoFiscal": 15000.00,
        "DataVencimento": "2025-01-20",
        "DataPagamento": null,
        "HistoricoLancamentoContabil": "Parcela 1 - Contrato 001"
      }
    ]
  }
]
```

### Mapeamento para `ProcessDetails` (Frontend)

| Campo frontend | Origem UAU |
|---|---|
| `processo` | `NumeroProcesso` |
| `empresa` | `Empresa` |
| `descrEmpresa` | `DescrEmpresa` |
| `obra` | `Obra` |
| `descrObra` | `DescrObra` |
| `chequeNominal` | `Parcelas[0].Nominal` |
| `valorAPagar` | `Parcelas[0].Valor` |
| `valorDocFiscal` | `Parcelas[0].ValorTotalDocumentoFiscal` |
| `fornecedor` | `NomeFornecedor` |
| `cnpjFornecedor` | `CnpjFornecedor` |
| `codigoFornecedor` | `CodigoFornecedor` |
| `dataVencimento` | `Parcelas[0].DataVencimento` |
| `dataPagamento` | `Parcelas[0].DataPagamento` |
| `historico` | `Parcelas[0].HistoricoLancamentoContabil` |

**Nota**: apenas a primeira parcela (`Parcelas[0]`) é utilizada atualmente. Processos com múltiplas parcelas precisam de tratamento específico.

**Timeout**: 30.000 ms

---

## Endpoint 3 — Gerar Nota Fiscal no Processo

```
POST {UAU_BASE_GERAR_NF}
POST /api/v1.0/ProcessoPagamento/GerarNotaFiscal
```

### Headers

```
Content-Type: application/json
X-INTEGRATION-Authorization: {UAU_INTEGRATION_TOKEN}
Authorization: {authToken obtido em AutenticarUsuario}
```

### Request Body

```json
{
  "Empresa": 1,
  "Obra": "LOREB",
  "NumeroProcesso": 383,
  "Parcela": null,
  "TipoNF": 0,
  "Especie": "NF",
  "Serie": "1",
  "NFEletronica": true,
  "ChaveNfe": null,
  "NumeroNotaFiscal": "12345",
  "CodigoRemetente": 1042,
  "DataEmissao": "2025-01-15",
  "DataDeEmissaoMaiorQueCadastro": true,
  "DataEntrada": "2025-01-15",
  "DataDeEntradaMaiorQueCadastro": true,
  "ModeloNF": "2",
  "VincularADescontos": true
}
```

### Campos do Request

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `Empresa` | number | sim | Código numérico da empresa |
| `Obra` | string | sim | Código da obra |
| `NumeroProcesso` | number | sim | Número do processo de pagamento |
| `Parcela` | number \| null | não | Número da parcela (null = todas) |
| `TipoNF` | 0 \| 1 | sim | 0 = Estadual (Produto), 1 = Municipal (Serviço) |
| `Especie` | string | sim | `NF`, `CT`, `RE`, `OU`, `CF` |
| `Serie` | string | sim | Série da nota fiscal |
| `NFEletronica` | boolean | sim | Indica se é NF-e |
| `ChaveNfe` | string \| null | não | Chave de acesso da NF-e (44 dígitos) |
| `NumeroNotaFiscal` | string | sim | Número da nota fiscal |
| `CodigoRemetente` | number | sim | Código interno do fornecedor/remetente no UAU |
| `DataEmissao` | string | sim | Data de emissão — formato `YYYY-MM-DD` |
| `DataDeEmissaoMaiorQueCadastro` | boolean | sim | Permite data de emissão posterior ao cadastro |
| `DataEntrada` | string | sim | Data de entrada — formato `YYYY-MM-DD` |
| `DataDeEntradaMaiorQueCadastro` | boolean | sim | Permite data de entrada posterior ao cadastro |
| `ModeloNF` | string \| null | condicional | Código interno do modelo (obrigatório para NF, CT, CF) |
| `ArqNotaFiscal` | string \| null | não | Nome do arquivo da nota fiscal |
| `CaminhoOrigemArquivoLocal` | string \| null | não | Caminho local do arquivo |
| `CaminhoDestinoArquivo` | string \| null | não | Caminho de destino no servidor UAU |
| `NomeArquivo` | string \| null | não | Nome do arquivo no destino |
| `CopiarArquivo` | boolean \| null | não | Indica se deve copiar o arquivo |
| `VincularADescontos` | boolean \| null | não | Vincular NFe a descontos do processo |

### Response 200 — Sucesso

```json
{
  "sucesso": true,
  "mensagem": "Nota Fiscal gerada com sucesso.",
  "numeroNF": "12345"
}
```

### Response de Erro

O UAU pode retornar erros em formatos distintos:

```json
{ "Mensagem": "Processo não encontrado." }
{ "Descricao": "Fornecedor inválido." }
{ "Detalhe": "Data de emissão anterior ao período fiscal." }
```

O `UauService` tenta extrair a mensagem na ordem: `Mensagem` → `Descricao` → `Detalhe` → `err.message`.

**Timeout**: 30.000 ms

---

## Modelos de Nota Fiscal (Tabela Interna UAU)

O UAU usa **códigos internos** (campo `ModeloNF`), diferentes dos códigos fiscais oficiais.

| Código Interno | Descrição no UAU | Código Fiscal Oficial |
|---|---|---|
| 1 | NOTA FISCAL | 1 |
| 2 | NOTA FISCAL ELETRÔNICA | 55 |
| 3 | NOTA FISCAL | 1-A |
| 4 | NOTA FISCAL DE VENDA A CONSUMIDOR | 2 |
| 5 | NF-e - NOTA FISCAL ELETRÔNICA | NF-e |
| 6 | NOTA FISCAL DE CONSUMIDOR ELETRÔNICA | 65 |
| 7 | NOTA FISCAL/CONTA ENERGIA ELÉTRICA | 6 |
| 8 | CT - TRANSPORTE | 57 |
| 9 | NOTA FISCAL DE FATURA | 9 |
| 10 | NOTA FISCAL ELETRÔNICA DE SERVIÇO | 3 |
| 11 | DARF | 11 |

**Nota**: empresas VEGA e LOCALIZA usam a mesma tabela de modelos atualmente.

---

## Espécies de Nota Fiscal

| Código | Descrição |
|---|---|
| `NF` | Nota Fiscal |
| `CT` | Conhecimento de Transporte |
| `RE` | Recibo |
| `OU` | Outros |
| `CF` | Cupom Fiscal |

---

## Fluxo de Autenticação Completo

```
Request de negócio (ex: ConsultarProcessos)
        │
        ▼
UauService.autenticarUsuario()
        │
        ├── POST /Autenticador/AutenticarUsuario
        │       Headers: X-INTEGRATION-Authorization
        │       Body: { login, senha, UsuarioUAUSite }
        │       Response: { Authorization: "Bearer ..." }
        │
        ▼
UauService.consultarProcessos()
        │
        └── POST /ProcessoPagamento/ConsultarProcessos
                Headers: X-INTEGRATION-Authorization
                         Authorization: {token acima}
                Body: { EmpresaObraPeriodo: {...} }
```

---

## Variáveis de Ambiente

```env
UAU_BASE_AUTH=http://{host}:{porta}/uauAPI/api/v1.0/Autenticador/AutenticarUsuario
UAU_BASE_PROCESSO=http://{host}:{porta}/uauAPI/api/v1.0/ProcessoPagamento/ConsultarProcessos
UAU_BASE_GERAR_NF=http://{host}:{porta}/uauAPI/api/v1.0/ProcessoPagamento/GerarNotaFiscal
UAU_EMPRESA=LOCALIZA
UAU_INTEGRATION_TOKEN=<token-jwe-fornecido-pela-globaltec>
UAU_LOGIN=<usuario-integracao>
UAU_SENHA=<senha-usuario>
UAU_SITE=<site-usuario>
```

Template completo em `nota-fiscal-api/.env.example`.

---

## Timeouts e Limites

| Operação | Timeout | Observações |
|---|---|---|
| Autenticação | 20.000 ms | Sempre antes de ops de negócio |
| ConsultarProcessos | 30.000 ms | Pode retornar muitos registros em períodos longos |
| GerarNotaFiscal | 30.000 ms | UAU processa sincronamente |

---

## Erros Comuns e Tratamento

| Situação | Status HTTP | Mensagem esperada |
|---|---|---|
| IntegrationToken inválido | 401 | "Unauthorized" |
| Usuário/senha incorretos | 401/403 | "Usuário ou senha inválidos" |
| Processo não encontrado | 400 | `Mensagem` do UAU |
| Fornecedor não cadastrado | 400 | `Descricao` do UAU |
| Período fiscal encerrado | 400 | `Detalhe` do UAU |
| Servidor UAU indisponível | 500 / timeout | Tratado como 500 no gateway |
