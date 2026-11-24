# Proposal

## Why

Os dois formulários de cadastro, de palestra e de evento, são cobertos só por testes unitários. Nenhum teste percorre o fluxo real no navegador: preencher o formulário, enviar para a API e ver o registro no Dashboard. O projeto `frontend-e2e` existe, mas está configurado para Playwright e tem apenas o exemplo gerado, que nem passa (procura um `h1` "Welcome"). Esta mudança troca o executor desse projeto para Cypress e cria testes E2E tradicionais para os cadastros, cobrindo o envio bem-sucedido e as mensagens de validação.

## What Changes

- **Projeto `frontend-e2e` passa a usar Cypress (BREAKING para o executor E2E):**
  - o nome do projeto continua `frontend-e2e`, assim como o target `e2e`;
  - saem `playwright.config.mts`, `src/example.spec.ts` e o registro do `@nx/playwright/plugin` no `nx.json`, que disputa o target `e2e` com o `@nx/cypress/plugin`;
  - entram `cypress.config.ts` e os arquivos de suporte do Cypress;
  - o `tsconfig.json` passa a usar os tipos do Cypress;
  - os testes sobem a aplicação com `frontend:serve`, porque é o único alvo que tem o proxy de `/api` e que inicia a API junto (`dependsOn: api:serve`).
- **Testes de sucesso:**
  - em `/palestras/nova` e em `/eventos/novo`, preencher os campos obrigatórios usando seletores CSS convencionais (`id`, `name` ou `class`) e enviar;
  - conferir a mensagem de sucesso;
  - abrir o Dashboard e conferir que o novo registro aparece na tabela correspondente ("Palestras submetidas" ou "Eventos cadastrados");
  - cada execução usa valores únicos, para que um registro antigo, ainda guardado na memória da API, não produza um falso positivo.
- **Testes de erro, para cada formulário:**
  - enviar o formulário vazio e conferir a mensagem de cada campo obrigatório;
  - preencher um campo por vez e enviar de novo, conferindo que a mensagem daquele campo some e as outras continuam;
  - repetir até cobrir todas as mensagens, incluindo as de valor inválido: "Informe um email válido." na palestra e "Escolha uma data a partir de amanhã." no evento.
  - Em todas as tentativas inválidas, nada é enviado à API e o botão de envio continua desabilitado.
- **Frontend: o envio inválido de palestra passa a revelar os erros.**
  - Hoje o formulário de evento marca todos os campos como tocados quando recebe um envio inválido, mas o de palestra simplesmente ignora esse envio.
  - O formulário de palestra passa a se comportar como o de evento.
  - Sem isso, "enviar o formulário vazio" não mostra nenhuma mensagem na página de palestra.
- **Restrições dos testes:**
  - os testes usam somente a API tradicional do Cypress (`cy.visit`, `cy.get`, `cy.contains`, `.type`, `.click`, `.submit`, `.should`);
  - não usam bibliotecas externas, de IA ou de seletores (por exemplo Testing Library);
  - como o botão de envio fica desabilitado enquanto o formulário é inválido, a tentativa de envio inválido é feita com `cy.get('form').submit()`, que dispara o evento `submit` do formulário.

## Capabilities

### New Capabilities
- `e2e-testing`: o conjunto de testes E2E do frontend no navegador. Cobre:
  - o executor (Cypress, no projeto `frontend-e2e`);
  - como a aplicação e a API são iniciadas para os testes;
  - as convenções de seletor e de sintaxe;
  - os fluxos de cadastro que precisam estar cobertos, com envio bem-sucedido e validação de cada mensagem.

### Modified Capabilities
- `speaker-submission`: novo requisito. Uma tentativa de envio com o formulário inválido não chama a API e mostra a mensagem de erro de todos os campos inválidos, inclusive os que o usuário ainda não visitou.
- `event-registration`: o mesmo requisito, registrado explicitamente. O formulário de evento já se comporta assim, mas a spec atual só descreve o erro que aparece ao sair do campo, e os testes E2E dependem desse comportamento.

## Impact

- **`frontend-e2e/`:**
  - remoção da configuração e do exemplo do Playwright;
  - novos `cypress.config.ts` e `src/support/`, e novos specs em `src/e2e/` (`*.cy.ts`) para o cadastro de palestra e o de evento;
  - `project.json` e `tsconfig.json` ajustados, mantendo `name: frontend-e2e` e `implicitDependencies: ["frontend"]`.
- **`nx.json`:**
  - sai o `@nx/playwright/plugin`;
  - o `@nx/cypress/plugin`, já adicionado, mantém o target `e2e`;
  - o gerador padrão `@nx/angular:application` passa a usar `e2eTestRunner: "cypress"`.
- **Dependências:** `cypress` e `@nx/cypress` já estão no `package.json`. `@playwright/test` e `@nx/playwright` podem ser removidos se nada mais os usar.
- **Frontend (`apps/frontend`):**
  - `CfpSubmissionComponent.submit()` passa a marcar todos os campos como tocados quando o formulário é inválido;
  - novo teste unitário cobrindo esse caso;
  - nenhuma mudança de template, de seletor ou de texto de mensagem.
- **API:** nenhuma mudança. Os testes de sucesso dependem da API em execução, iniciada pelo `frontend:serve`.
- **Fora de escopo:**
  - testes E2E do Dashboard isolado (estados de carregamento, vazio e falha, com interceptação de rede);
  - testes da navegação pelo menu;
  - testes de acessibilidade automatizados;
  - execução em CI;
  - bibliotecas auxiliares de teste ou de IA.
