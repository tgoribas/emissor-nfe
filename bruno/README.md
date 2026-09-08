# Coleção Bruno — Emissor NF-e Gateway

Coleção de testes da API para o [Bruno](https://www.usebruno.com/) (alternativa open-source ao Postman).

## Como importar

1. Abra o Bruno
2. **Open Collection** → selecione esta pasta (`bruno/`)
3. Selecione o ambiente **Local** (canto superior direito)

## Como rodar pela CLI

```bash
# com a API rodando (npm run start:dev)
cd bruno
npx @usebruno/cli run --env Local
```

## Autenticação

| Nível | Header | Endpoints | Origem da chave |
|---|---|---|---|
| Admin | `x-admin-key` | `/tenants` (criação/gestão) | `ADMIN_API_KEY` no `.env` do servidor |
| Tenant | `x-api-key` | Todos os demais | Retornada **uma única vez** na criação do tenant |

### Segredos

Nenhuma chave fica gravada nos arquivos `.bru` versionáveis:

- `adminKey` é lida de `process.env.ADMIN_API_KEY`, carregada do arquivo `bruno/.env`
  (**gitignorado** — copie `bruno/.env.example` para `bruno/.env` e preencha com o
  mesmo valor do `.env` do servidor).
- `apiKey` e `certificadoSenha` são declaradas em `vars:secret`: o Bruno guarda os
  valores fora do arquivo do ambiente. A `apiKey` é preenchida automaticamente pelo
  script de "Criar Tenant".

O tenant é derivado da API key no servidor — não existe mais header `x-tenant-id`.

## Fluxo de testes (encadeado automaticamente)

1. **Health Check** — status do serviço (público)
2. **Tenants** — criar tenant (admin) → salva `{{tenantId}}` e `{{apiKey}}`
3. **Emitentes** — criar emitente → salva `{{emitenteId}}` (+ testes de 401)
4. **Certificados** — upload do PFX (ver abaixo)
5. **Series Numeracao** — criar série 1 (modelo 55)
6. **NFe** — emitir NF-e → salva `{{notaFiscalId}}` e `{{chaveAcesso}}`
7. **Eventos Fiscais** — carta de correção / cancelamento
8. **SEFAZ** — status do webservice da UF do emitente
9. **Webhooks** — logs de notificação do tenant

## Certificado digital

Upload de certificado, emissão de NF-e e consulta SEFAZ exigem um certificado
A1 real. Converta para Base64 e preencha as variáveis do ambiente `Local`:

```bash
base64 -i certificado.pfx | tr -d '\n'
```

- `certificadoBase64` — conteúdo gerado acima
- `certificadoSenha` — senha do certificado
