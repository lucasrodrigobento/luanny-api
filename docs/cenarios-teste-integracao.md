# Cenários de Teste — Integração NFe ↔ UAU

Cenários de teste para validação da integração entre QIVE e ERP UAU. Organizados por caso de uso, cobrindo happy path, edge cases e cenários de erro.

## Convenções

- **Dado**: pré-condição ou estado inicial
- **Quando**: ação executada
- **Então**: resultado esperado
- `[PASS]` / `[FAIL]` / `[PENDENTE]` — status de implementação do teste

---

## CT-001 — Consultar NFes Recebidas (UC-001)

### CT-001-01 — Busca bem-sucedida com resultados

**Dado** que as credenciais QIVE estão configuradas corretamente  
**E** o CNPJ `12345678000190` possui NFes recebidas entre `2025-01-01` e `2025-01-31`  
**Quando** o operador informa o CNPJ e o período e clica em "Buscar"  
**Então** a lista de NFes é exibida com `numero`, `prestadorServico`, `valor` e status `PENDING`

**Status**: `[PENDENTE]`

---

### CT-001-02 — Busca sem resultados no período

**Dado** que o CNPJ não possui NFes no período informado  
**Quando** o operador busca  
**Então** a lista de NFes fica vazia sem mensagem de erro

**Status**: `[PENDENTE]`

---

### CT-001-03 — CNPJ com formatação

**Dado** que o operador digita o CNPJ com máscara `12.345.678/0001-90`  
**Quando** o request chega ao backend  
**Então** o CNPJ é enviado à QIVE sem formatação: `12345678000190`

**Validar**: `cnpj.replace(/\D/g, '')` aplicado no `apiService.ts`

**Status**: `[PENDENTE]`

---

### CT-001-04 — Campos obrigatórios ausentes

**Dado** que o CNPJ está preenchido mas as datas estão vazias  
**Quando** o operador tenta clicar em "Buscar"  
**Então** o botão está desabilitado e nenhuma requisição é enviada

**Status**: `[PENDENTE]`

---

### CT-001-05 — Credenciais QIVE inválidas

**Dado** que `ARQUIVEI_API_ID` ou `ARQUIVEI_API_KEY` são inválidos  
**Quando** o backend consulta a QIVE  
**Então** a QIVE retorna 401  
**E** o backend propaga `HttpException` com status 401  
**E** o frontend exibe notificação de erro

**Status**: `[PENDENTE]`

---

### CT-001-06 — Timeout com QIVE

**Dado** que a QIVE não responde em 20 segundos  
**Quando** o backend tenta conectar  
**Então** o backend captura `ECONNABORTED` e lança `HttpException` 500  
**E** o frontend exibe mensagem de erro genérica

**Status**: `[PENDENTE]`

---

### CT-001-07 — Resposta com XML malformado

**Dado** que a QIVE retorna uma NFe com `infNFe` sem o campo `ide.nNF`  
**Quando** o `apiService.ts` mapeia a resposta  
**Então** o campo `numero` recebe `"N/A"` sem quebrar a renderização

**Status**: `[PENDENTE]`

---

## CT-002 — Consultar Processos UAU (UC-002)

### CT-002-01 — Busca bem-sucedida

**Dado** que as credenciais UAU estão configuradas  
**E** existem processos de pagamento para empresa `1`, obra `LOREB` no período  
**Quando** o operador informa os dados e clica em "Buscar"  
**Então** os cards de processo são exibidos com `chequeNominal`, `valorAPagar`, `valorDocFiscal`

**Status**: `[PENDENTE]`

---

### CT-002-02 — Falha de autenticação UAU

**Dado** que `UAU_LOGIN` ou `UAU_SENHA` são inválidos  
**Quando** o backend tenta autenticar  
**Então** o UAU retorna erro  
**E** o backend lança `HttpException` com mensagem `"Erro ao autenticar usuário UAU: ..."`  
**E** o frontend exibe a mensagem ao operador

**Status**: `[PENDENTE]`

---

### CT-002-03 — Token de integração inválido

**Dado** que `UAU_INTEGRATION_TOKEN` é inválido  
**Quando** o backend envia qualquer request ao UAU  
**Então** o UAU retorna 401  
**E** o backend propaga o status e mensagem corretos

**Status**: `[PENDENTE]`

---

### CT-002-04 — Processo sem parcelas

**Dado** que o UAU retorna um processo com `Parcelas: []`  
**Quando** o frontend renderiza o card  
**Então** `valorAPagar` e `valorDocFiscal` exibem `R$ 0,00` sem erro de runtime

**Validar**: `const parcela = Array.isArray(item.Parcelas) && item.Parcelas.length > 0 ? item.Parcelas[0] : null`

**Status**: `[PENDENTE]`

---

### CT-002-05 — Período sem processos

**Dado** que não há processos no período informado  
**Quando** o operador busca  
**Então** a coluna de processos fica vazia sem erro

**Status**: `[PENDENTE]`

---

### CT-002-06 — Resposta com formato inesperado (não array)

**Dado** que o UAU retorna um objeto em vez de array  
**Quando** o `searchProcessNumbers` processa a resposta  
**Então** lança `Error('Invalid response format from UAU API. Expected an array.')`  
**E** o frontend exibe a mensagem de erro

**Status**: `[PENDENTE]`

---

## CT-003 — Gerar Nova NF no UAU (UC-003)

### CT-003-01 — Geração bem-sucedida

**Dado** que todos os campos obrigatórios estão preenchidos corretamente  
**Quando** o operador submete o formulário "Nova NF"  
**Então** o UAU registra a NFe e retorna sucesso  
**E** o processo é marcado como `hasGeneratedNF = true` no frontend  
**E** notificação de sucesso é exibida  
**E** o modal fecha

**Status**: `[PENDENTE]`

---

### CT-003-02 — Validação: número da NF ausente

**Dado** que o campo `NumeroNotaFiscal` está vazio  
**Quando** o operador clica em "Gerar NF no UAU"  
**Então** a notificação `"Número da NF é obrigatório."` é exibida  
**E** nenhum request é enviado ao backend

**Status**: `[PENDENTE]`

---

### CT-003-03 — Validação: modelo obrigatório para espécie NF

**Dado** que a espécie selecionada é `NF` e o campo `ModeloNF` está vazio  
**Quando** o operador tenta submeter  
**Então** a notificação `"Modelo da NF é obrigatório para espécies NF, CT e CF."` é exibida

**Status**: `[PENDENTE]`

---

### CT-003-04 — Validação: modelo não obrigatório para espécie RE

**Dado** que a espécie selecionada é `RE` (Recibo) e o campo `ModeloNF` está vazio  
**Quando** o operador submete  
**Então** o request é enviado sem `ModeloNF` (campo omitido, não nulo)  
**E** o UAU aceita o payload

**Status**: `[PENDENTE]`

---

### CT-003-05 — UAU rejeita o payload

**Dado** que o `CodigoRemetente` não existe no UAU  
**Quando** o backend envia o request de geração  
**Então** o UAU retorna erro com campo `Mensagem` preenchido  
**E** o backend extrai e propaga a mensagem  
**E** o frontend exibe a mensagem do UAU  
**E** o processo não é marcado como `hasGeneratedNF`

**Status**: `[PENDENTE]`

---

### CT-003-06 — DataEntrada padrão para DataEmissao

**Dado** que o operador não preenche `DataEntrada`  
**Quando** o frontend monta o payload  
**Então** `DataEntrada` recebe o valor de `DataEmissao`

**Validar**: `DataEntrada: novaNFForm.DataEntrada || novaNFForm.DataEmissao`

**Status**: `[PENDENTE]`

---

### CT-003-07 — Código do remetente pré-preenchido

**Dado** que o processo possui `codigoFornecedor: 1042`  
**Quando** o operador abre o modal "Nova NF" para esse processo  
**Então** o campo `CodigoRemetente` já aparece preenchido com `"1042"`

**Status**: `[PENDENTE]`

---

## CT-004 — Vincular NFe Existente a Processo (UC-004)

### CT-004-01 — Seleção sem NFe escolhida

**Dado** que o operador não selecionou nenhuma NFe no dropdown do processo  
**Quando** clica em "Vincular & Sync"  
**Então** a notificação `"Selecione uma Nota Fiscal!"` é exibida  
**E** nenhuma ação é executada

**Status**: `[PENDENTE]`

---

### CT-004-02 — Mock de sync — sucesso simulado

**Dado** que o operador seleciona uma NFe e clica em "Vincular & Sync"  
**Quando** `syncToUau()` retorna sucesso (mock — 80% de chance)  
**Então** status da NFe muda de `SYNCING` para `SYNCED`  
**E** notificação de sucesso é exibida com o número do processo

**Status**: `[PENDENTE]` — teste do comportamento do mock

---

### CT-004-03 — Mock de sync — erro simulado

**Dado** que `syncToUau()` simula falha (20% de chance)  
**Então** status da NFe muda para `ERROR`  
**E** mensagem `"Error syncing NF: UAU API connection failed."` é exibida

**Status**: `[PENDENTE]` — teste do comportamento do mock

---

## CT-005 — Validações de Interface

### CT-005-01 — Máscara de CNPJ

| Entrada | Resultado esperado |
|---|---|
| `12345678000190` | `12.345.678/0001-90` |
| `123456780001` | `12.345.678/0001` (incompleto, sem traço) |
| `12abc345678000190xyz` | `12.345.678/0001-90` (ignora não-numéricos) |
| `123456789012345` | `12.345.678/0001-90` (limita a 14 dígitos) |

**Status**: `[PENDENTE]`

---

### CT-005-02 — Estado do botão de busca (NFes)

| CNPJ | Data Inicial | Data Final | Botão |
|---|---|---|---|
| preenchido | preenchida | preenchida | habilitado |
| vazio | preenchida | preenchida | desabilitado |
| preenchido | vazia | preenchida | desabilitado |
| preenchido | preenchida | vazia | desabilitado |

**Status**: `[PENDENTE]`

---

### CT-005-03 — Estado do botão de busca (Processos)

| Empresa | Obra | Data Inicial | Data Final | Botão |
|---|---|---|---|---|
| preenchida | preenchida | preenchida | preenchida | habilitado |
| vazia | preenchida | preenchida | preenchida | desabilitado |
| preenchida | vazia | preenchida | preenchida | desabilitado |

**Status**: `[PENDENTE]`

---

### CT-005-04 — Notificação auto-fecha em 3,5s

**Dado** que uma notificação foi exibida  
**Quando** 3,5 segundos se passam  
**Então** a notificação desaparece automaticamente

**Status**: `[PENDENTE]`

---

### CT-005-05 — Processo com `hasGeneratedNF = true` bloqueia ações

**Dado** que um processo foi marcado como `hasGeneratedNF = true`  
**Então** o select de NFes e o botão "Vincular & Sync" estão desabilitados  
**E** o botão "Nova NF" está desabilitado

**Status**: `[PENDENTE]`

---

## CT-006 — Backend — Endpoints de Contrato

### CT-006-01 — GET /arquivei/notas-fiscais sem parâmetros

```
GET /arquivei/notas-fiscais

Esperado: 400 Bad Request
Body: { "message": "Os parâmetros cnpj, startDate e endDate são obrigatórios." }
```

**Status**: `[PENDENTE]`

---

### CT-006-02 — GET /arquivei/notas-fiscais com parâmetros válidos

```
GET /arquivei/notas-fiscais?cnpj=12345678000190&startDate=2025-01-01&endDate=2025-01-31

Esperado: 200 OK
Body: NotaFiscal[] (array, pode ser vazio)
```

**Status**: `[PENDENTE]`

---

### CT-006-03 — POST /uau/consultar-processos com body válido

```
POST /uau/consultar-processos
Body: { "empresa": 1, "obra": "LOREB", "periodoInicial": "2025-01-01", "periodoFinal": "2025-01-31" }

Esperado: 200 OK
Body: ProcessDetails[] (array)
```

**Status**: `[PENDENTE]`

---

### CT-006-04 — POST /uau/gerar-nota-fiscal com payload mínimo válido

```
POST /uau/gerar-nota-fiscal
Body: {
  "Empresa": 1,
  "Obra": "LOREB",
  "NumeroProcesso": 383,
  "TipoNF": 0,
  "Especie": "NF",
  "Serie": "1",
  "NFEletronica": true,
  "NumeroNotaFiscal": "12345",
  "CodigoRemetente": 1042,
  "DataEmissao": "2025-01-15",
  "DataDeEmissaoMaiorQueCadastro": true,
  "DataEntrada": "2025-01-15",
  "DataDeEntradaMaiorQueCadastro": true,
  "ModeloNF": "2",
  "VincularADescontos": true
}

Esperado: 200 OK (ambiente UAU TESTE)
```

**Status**: `[PENDENTE]`

---

## Execução dos Testes

Os cenários acima devem ser formalizados como:

1. **Testes de integração no backend** — usando `@nestjs/testing` + `supertest`
2. **Testes de componente no frontend** — usando `@testing-library/react`
3. **Testes E2E** — usando Playwright ou Cypress sobre a aplicação completa

Configuração de testes já existe no `nota-fiscal-api/package.json` via `jest` e `test/jest-e2e.json`. O frontend não possui testes configurados ainda.
