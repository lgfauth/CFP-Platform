# Proposal

## Why

O projeto ainda não oferece um fluxo completo para palestrantes enviarem propostas ao Call for Papers. Esta mudança introduz uma jornada acessível no frontend e uma API validada, mantendo o formato da proposta único por meio do contrato compartilhado `SpeakerDTO`.

## What Changes

- Adicionar a capacidade de submissão de palestras, com formulário acessível e feedback para carga, sucesso e erro.
- Implementar o frontend em `apps/frontend` com Angular 21, componentes standalone e estado gerenciado por Signals.
- Implementar no NestJS em `apps/api` um endpoint que receba o payload por `@Body()` e o valide estritamente com `class-validator`.
- Fazer frontend e backend consumirem `SpeakerDTO`, exportado pela biblioteca `shared-types`.
- Garantir bloqueio do envio enquanto o formulário estiver inválido ou uma submissão estiver em andamento.
- Adicionar testes unitários com Jest para o frontend e para rejeições HTTP 400 de payloads inválidos no backend.
- **BREAKING** Reorganizar os aplicativos atualmente em `frontend/` e `api/` para `apps/frontend/` e `apps/api/`, atualizando as referências Nx e demais caminhos do workspace.
- **BREAKING** Alinhar a aplicação Angular existente, atualmente na versão 22, ao requisito Angular 21 e substituir o runner de testes unitários atual do frontend por Jest.

## Capabilities

### New Capabilities

- `speaker-submission`: submissão de propostas de palestras por palestrantes, incluindo formulário acessível, estado reativo, contrato compartilhado e validação do payload na API.

### Modified Capabilities

- None.

## Impact

- Aplicações Nx `frontend` e `api`, incluindo seus arquivos de configuração, imports, proxies e alvos de build, serve e test.
- Biblioteca `shared-types` e seu contrato público `SpeakerDTO`.
- Bootstrap do NestJS, para habilitar transformação e validação global estrita, e módulo/controlador/serviço de submissão.
- Tela raiz do Angular e configuração de HTTP; os componentes novos deverão permanecer standalone.
- Dependências Angular, Jest e NestJS, incluindo `class-validator` e `class-transformer`.
- Testes unitários Jest em frontend e backend e comandos Nx usados para validá-los.
