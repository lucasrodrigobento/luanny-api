# Tenants — Luany

## Tenants conhecidos

| Tenant | Domínio (local) | UAU Base URL | Status |
|---|---|---|---|
| localiza | localiza.luany.local | http://189.5.131.86:8082/uauAPITESTE/api/v1.0 | ✅ funcionando |
| vega | vega.luany.local | http://168.194.255.168:8080/uauAPI/api/v1.0 | ✅ funcionando |
| vegatrinus | vegatrinus.cvcrm.com.br | http://168.194.255.168:8080/uauAPI/api/v1.0 | planejado |

### IDs dos tenants de teste

- **localiza**: `a0000000-0000-0000-0000-000000000001`
- **vega**: `a0000000-0000-0000-0000-000000000002`

---

## QIVE (Arquivei)

Todos os tenants usam `https://api.arquivei.com.br` (produção).

Cada um tem seu próprio par **API ID / API Key** e lista de **CNPJs** monitorados.

---

## Adicionar novo tenant

1. Criar registro na tabela `tenants` (slug, nome)
2. Configurar integrações via `POST /configuracoes`:
   - Config QIVE (API ID + API Key + CNPJs)
   - Config UAU (Base URL + credentials)
3. Testar conexões: `POST /configuracoes/:id/test-connection`
4. Se produção com subdomínio: configurar DNS apontando para o servidor

---

**Última atualização**: 2026-04-27
