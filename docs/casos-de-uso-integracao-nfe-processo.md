# Casos de Uso — Luany

O sistema tem dois fluxos principais: **configuração** (cada tenant configura suas integrações) e **operação** (reconciliação + ações sobre o gap).

## Atores

| Ator | Descrição |
|---|---|
| Operador Financeiro | Usuário que executa reconciliações e age sobre NFes pendentes |
| Administrador | Usuário que configura as integrações QIVE e UAU do tenant |
| QIVE | API externa — fornece NFes recebidas pelos CNPJs da empresa |
| UAU (Globaltec) | ERP interno — registra processos de pagamento e notas fiscais |

## Pré-condição global

Para qualquer operação funcionar, o tenant deve ter **ambas** as integrações configuradas:
- QIVE: Base URL + API ID + API Key + CNPJs monitorados
- UAU: Base URL + Integration Token + Login + Senha + Site

---

## UC-001 — Configurar Integração QIVE

**Ator**: Administrador  
**Status**: não implementado (placeholder em `views/Configuracoes.tsx`)

### Fluxo Principal

1. Administrador acessa Configurações → Integrações → QIVE
2. Preenche: Base URL, API ID, API Key, lista de CNPJs monitorados
3. Clica em "Testar Conexão"
4. Backend executa `GET /v1/nfe/received` com limit=1 usando as credenciais informadas
5. QIVE responde com sucesso → UI exibe "Conexão OK"
6. Administrador clica em "Salvar"
7. Backend grava config criptografada em `tenant_configs` para o tenant ativo

### Fluxos Alternativos

**A1 — Credenciais inválidas no teste**
- Passo 4: QIVE retorna 401
- UI exibe "Credenciais inválidas — verifique API ID e API Key"
- Não permite salvar com credenciais que falharam no teste

**A2 — Nenhum CNPJ informado**
- Passo 2: validação bloqueia o save — pelo menos um CNPJ é obrigatório

**A3 — Atualização de configuração existente**
- Fluxo idêntico — o save faz upsert em `tenant_configs`

### Campos

| Campo | Obrigatório | Exemplo |
|---|---|---|
| Base URL | sim | `https://api.arquivei.com.br` |
| API ID | sim | (fornecido pelo painel QIVE) |
| API Key | sim | (fornecido pelo painel QIVE) |
| CNPJs monitorados | sim (mínimo 1) | `03.306.164/0001-30` |

---

## UC-002 — Configurar Integração UAU

**Ator**: Administrador  
**Status**: não implementado  
**Referência de UI**: `design-refs/tela-configuracao-integracoes/`

### Fluxo Principal

1. Administrador acessa Configurações → Integrações → UAU
2. Preenche: URL base, Integration Token, Usuário, Senha, Site
3. Clica em "Testar Conexão"
4. Backend executa `POST /Autenticador/AutenticarUsuario` com as credenciais informadas
5. UAU retorna token de auth válido → UI exibe "Conexão OK, usuário autenticado"
6. Administrador clica em "Salvar"
7. Backend grava config criptografada em `tenant_configs`

### Fluxos Alternativos

**A1 — URL do UAU inacessível**
- Passo 4: timeout ou connection refused
- UI exibe "Não foi possível conectar à URL informada"

**A2 — Credenciais incorretas**
- Passo 4: UAU retorna 401/403
- UI exibe a mensagem de erro retornada pelo UAU

### Campos

| Campo | Obrigatório | Observação |
|---|---|---|
| Base URL | sim | Ex: `http://189.5.131.86:8082/uauAPITESTE/api/v1.0` |
| Integration Token | sim | JWE fornecido pela Globaltec |
| Usuário | sim | Conta de integração UAU |
| Senha | sim | — |
| Site | sim | Contexto do usuário no UAU |
| Autenticação via AD | não | Autenticação Active Directory (campo observado na tela Trinus) |

---

## UC-003 — Reconciliar NFes vs UAU (core)

**Ator**: Operador Financeiro  
**Sistemas**: QIVE + UAU  
**Status**: não implementado (motor de gap pendente)

### Pré-condições

- Ambas as integrações configuradas (UC-001 e UC-002)

### Fluxo Principal

1. Operador seleciona: obras UAU e período (data inicial / data final)
2. Operador aciona "Reconciliar"
3. Backend, em paralelo:
   - QIVE: `GET /v1/nfe/received` com todos os CNPJs do tenant e o período
   - UAU: `POST /ProcessoPagamento/ConsultarProcessos` com as obras e o período
4. Motor de reconciliação compara os dois conjuntos:
   - Para cada NFe do QIVE, procura processo UAU com `chaveNFe` correspondente (44 dígitos) OU (`numeroNF` + `cnpjEmitente`) correspondente
   - NFe encontrada em algum processo → **vinculada**
   - NFe sem correspondência → **pendente**
5. Backend retorna: `{ pendentes[], vinculadas[], resumo }`
6. Frontend exibe painel com:
   - Seção "Pendentes" em destaque — com ações disponíveis por NFe
   - Seção "Vinculadas" — informativo, collapsível
   - Resumo: total de NFes, quantidade pendente, valor total pendente

### Fluxos Alternativos

**A1 — QIVE indisponível**
- Passo 3: erro de conexão ou credenciais inválidas
- Reconciliação abortada com mensagem específica

**A2 — UAU indisponível ou falha de autenticação**
- Passo 3: erro de conexão ou auth falhou
- Reconciliação abortada com mensagem específica

**A3 — Nenhuma NFe pendente**
- Resultado: `pendentes = []` — UI exibe "Todas as notas estão sincronizadas"

**A4 — Nenhuma NFe no QIVE no período**
- Resultado: ambas as listas vazias — UI exibe "Nenhuma nota fiscal encontrada no QIVE para o período"

### Regras de Negócio

- CNPJs consultados no QIVE são os configurados pelo tenant — não passados pelo operador
- O matching usa chave de acesso NF-e (prioritária) ou número + CNPJ como fallback
- O resultado é snapshot do momento — uma nova reconciliação pode ter resultado diferente
- Paginação QIVE: se o tenant tiver mais de 50 NFes no período, o sistema deve paginar automaticamente

---

## UC-004 — Vincular NFe Existente a Processo UAU

**Ator**: Operador Financeiro  
**Status**: não implementado (mock no frontend)

### Pré-condições

- Reconciliação executada (UC-003)
- NFe identificada como pendente
- Processo UAU existente sem NFe vinculada

### Fluxo Principal

1. Operador identifica NFe pendente no painel
2. Seleciona o processo UAU correspondente no dropdown
3. Aciona "Vincular"
4. Backend extrai o XML completo da NFe (armazenado na resposta QIVE)
5. Backend chama endpoint UAU de vinculação com XML + chave NF-e
6. UAU registra o vínculo no processo
7. NFe migra da lista "Pendentes" para "Vinculadas" no frontend

### Implementação Pendente

Endpoint a criar: `POST /uau/vincular-nfe`
```
Body: { obra, numeroProcesso, xmlNFe, chaveNFe }
```

---

## UC-005 — Gerar Nova NFe no UAU

**Ator**: Operador Financeiro  
**Status**: implementado

### Pré-condições

- Reconciliação executada (UC-003)
- Processo UAU sem nenhuma NFe vinculada identificado

### Fluxo Principal

1. Operador clica em "Nova NF" no card do processo
2. Modal abre com dados pré-preenchidos (fornecedor, valor do processo)
3. Operador preenche: Tipo NF, Espécie, Série, Modelo, Número, Datas
4. Backend usa config UAU do tenant, autentica e chama `GerarNotaFiscal`
5. UAU registra a NFe vinculada ao processo
6. Processo marcado como resolvido no frontend

### Validações

| Campo | Regra |
|---|---|
| ModeloNF | Obrigatório para espécies NF, CT, CF |
| DataEntrada | Assume DataEmissao se não informada |
| CodigoRemetente | Pré-preenchido do processo; editável |
| VincularADescontos | Sempre `true` |

---

## UC-006 — Consultar NFes QIVE (isolado)

**Ator**: Operador Financeiro  
**Status**: implementado

Consulta direta ao QIVE sem reconciliação — útil para verificar notas de um período específico.

### Fluxo

1. Operador informa período (start / end)
2. Backend usa CNPJs do tenant + credenciais QIVE da config
3. Retorna lista de NFes com status `PENDING`

---

## UC-007 — Consultar Processos UAU (isolado)

**Ator**: Operador Financeiro  
**Status**: implementado

Consulta direta ao UAU sem reconciliação — útil para inspecionar processos.

### Fluxo

1. Operador seleciona obra e período
2. Backend autentica no UAU do tenant e consulta processos
3. Retorna lista de ProcessDetails

---

## Matriz de Cobertura

| Caso de Uso | Backend | Frontend | Testes |
|---|---|---|---|
| UC-001 Configurar QIVE | não implementado | placeholder | pendente |
| UC-002 Configurar UAU | não implementado | placeholder | pendente |
| UC-003 Reconciliar (core) | não implementado | não implementado | pendente |
| UC-004 Vincular NFe a Processo | não implementado | mock | pendente |
| UC-005 Gerar Nova NFe UAU | implementado | implementado | pendente |
| UC-006 Consultar NFes QIVE | implementado | implementado | pendente |
| UC-007 Consultar Processos UAU | implementado | implementado | pendente |
