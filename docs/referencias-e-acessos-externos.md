# Referências e Acessos Externos — Projeto Luany

Links de documentação, portais, ferramentas e ambientes externos utilizados no projeto. Nenhuma credencial real deve ser armazenada aqui — usar gerenciador de senhas do time.

## QIVE (ex-Arquivei)

| Recurso | URL |
|---|---|
| Portal (web) | https://app.arquivei.com.br/dashboard/new |
| Documentação da API | https://developers.qive.com.br/ |
| Endpoint NFe recebidas | https://developers.qive.com.br/docs/get/v1/nfe/received |
| Endpoint NFSe recebidas | https://developers.qive.com.br/docs/get/v1/nfse/received |
| PDF manual NFSe | https://developers.qive.com.br/docs/get/v1/nfse/received/manual/pdf |
| Sandbox interativo | https://developers.qive.com.br/sandbox |
| Base URL produção | https://api.arquivei.com.br |
| Base URL sandbox | https://sandbox-api.arquivei.com.br |

### Conta de acesso ao portal

Conta: `Sheila.alvarenga@techprice.com.br`  
Senha: armazenada no gerenciador de senhas do time (não registrar aqui).

### Credenciais de API

Dois conjuntos existem — ambos armazenados exclusivamente no `.env`:

| Ambiente | Variável | Observação |
|---|---|---|
| Sandbox | `ARQUIVEI_API_ID` / `ARQUIVEI_API_KEY` | Para desenvolvimento/testes locais |
| Produção | `ARQUIVEI_API_ID` / `ARQUIVEI_API_KEY` | Conta vinculada a CNPJs reais da empresa |

Ver template em `nota-fiscal-api/.env.example`.

---

## UAU — ERP Globaltec

| Recurso | URL |
|---|---|
| Swagger LOCALIZA (teste) | http://189.5.131.86:8082/uauAPITESTE/swagger/ui/index |
| Swagger VEGA (produção) | http://168.194.255.168/uauAPI/swagger/ui/index |
| Swagger — ConsultarProcessos (VEGA) | http://168.194.255.168/uauAPI/swagger/ui/index#!/ProcessoPagamento/ProcessoPagamento_ConsultarProcessos |

### Ambientes UAU por Empresa

| Empresa | URL Base | Ambiente | Fonte |
|---|---|---|---|
| LOCALIZA IMOVEIS LTDA | http://189.5.131.86:8082/uauAPITESTE/api/v1.0 | Teste | WhatsApp Anyelton (17/02/2026) |
| VEGA | http://168.194.255.168:8080/uauAPI/api/v1.0 | Produção | Print tela integração vegatrinus.cvcrm.com.br |

Empresa e obra **não são fixos** — selecionados pelo operador em runtime na UI.

### Empresa LOCALIZA (referência para testes)

| Campo | Valor |
|---|---|
| Código empresa UAU | 1 |
| Razão social | LOCALIZA IMOVEIS LTDA |
| CNPJ | 03.306.164/0001-30 |
| Obra de referência | LOREB |

### Credenciais de usuário de integração

Conta: usuário `tester` do UAU  
Senha e token: armazenados exclusivamente no `.env` (ver template em `nota-fiscal-api/.env.example`).  
O token de integração (`UAU_INTEGRATION_TOKEN`) é um JWE fornecido pela Globaltec no setup da integração.

---

## Repositórios GitHub

| Repo | URL |
|---|---|
| Monorepo principal | https://github.com/lucasrodrigobento/luany |
| API (legado) | https://github.com/lucasrodrigobento/luanny-api |
| App (legado) | https://github.com/lucasrodrigobento/luanny-app |

---

## Ferramentas Utilizadas no Projeto

| Ferramenta | URL | Uso |
|---|---|---|
| Excalidraw | https://excalidraw.com/ | Diagramas de arquitetura |
| AdminLTE | https://adminlte.io/themes/v3/ | Referência de UI (avaliada, não adotada) |

---

## Gestão de Credenciais

**Regra**: nenhuma senha, API key ou token vai para qualquer arquivo versionado.

| Tipo | Onde armazenar |
|---|---|
| Credenciais de portal (logins web) | Gerenciador de senhas do time (Bitwarden, 1Password, etc.) |
| API keys e tokens | `nota-fiscal-api/.env` (não versionado) |
| Credenciais de banco (futuro) | `.env` ou secrets manager (AWS Secrets Manager, etc.) |
| Integration tokens (UAU) | `.env` (não versionado) |

O arquivo `.env` está coberto pelo `.gitignore` de ambos os projetos. O `.env.example` mostra a estrutura sem valores reais.
