# Tasks

## 1. Trocar o executor do `frontend-e2e` de Playwright para Cypress

- [x] 1.1 Remover o Playwright do workspace (design D2):
  - excluir `frontend-e2e/playwright.config.mts` e `frontend-e2e/src/example.spec.ts`;
  - tirar a entrada `@nx/playwright/plugin` de `nx.json`;
  - mudar `generators["@nx/angular:application"].e2eTestRunner` para `"cypress"`;
  - desinstalar `@nx/playwright` e `@playwright/test` com `npm uninstall`;
  - remover a recomendação de extensão Playwright de `.vscode/extensions.json`.

  Verificar com `grep -rn playwright --exclude-dir=node_modules --exclude-dir=dist --exclude=package-lock.json .`, que não deve retornar nada.
- [x] 1.2 Criar `frontend-e2e/cypress.config.ts` com `nxE2EPreset(__filename, { cypressDir: 'src', webServerCommands: { default: 'npx nx run frontend:serve' }, ciWebServerCommand: 'npx nx run frontend:serve' })` e `baseUrl: 'http://localhost:4200'` (design D1).
  - Criar `frontend-e2e/src/support/e2e.ts`, vazio exceto por um comentário, e a pasta `src/e2e/`.
  - Manter `frontend-e2e/project.json` com `name: "frontend-e2e"` e `implicitDependencies: ["frontend"]`.
- [x] 1.3 Ajustar `frontend-e2e/tsconfig.json` (design D3):
  - `types: ["cypress", "node"]`;
  - incluir `cypress.config.ts` e `src/**/*.ts`;
  - deixar de incluir `playwright.config.mts`.
- [x] 1.4 Instalar o binário com `npx cypress install` e conferir com `npx cypress verify`.
  - Verificar com `npx nx show project frontend-e2e --json` que o target `e2e` é inferido pelo `@nx/cypress/plugin`.
  - Verificar também que existem `open-cypress` e `e2e-ci`, e que nenhum target vem do Playwright.

## 2. Envio inválido de palestra revela todos os erros

- [x] 2.1 Em `apps/frontend/src/app/cfp-submission/cfp-submission.ts`, fazer `submit()` marcar `touched` como `{ name: true, email: true, talkTitle: true }` quando `!isValid()`, antes de retornar. Se só houver um envio em andamento, continuar retornando sem mexer nos campos (design D5).
- [x] 2.2 Adicionar a `cfp-submission.spec.ts` dois casos, cobrindo os cenários do delta `speaker-submission`, e verificar com `npx nx test frontend`:
  - disparar `submit` no `<form>` vazio exibe "Informe seu nome.", "Informe seu email." e "Informe o título da palestra.", com `aria-invalid="true"` nos três campos, sem chamar o serviço;
  - com nome preenchido e email `invalido`, só Email e Título exibem erro, com a mensagem "Informe um email válido.".
- [x] 2.3 Conferir que o `cfp-event.spec.ts` já cobre os cenários do delta `event-registration`: envio vazio revela os três erros e envio com data passada exibe só o erro de data, sem chamar o serviço. Adicionar os casos que faltarem e verificar com `npx nx test frontend`.

## 3. Specs E2E de sucesso

- [x] 3.1 Criar `frontend-e2e/src/e2e/speaker-submission.cy.ts` com o teste de sucesso (spec `e2e-testing`, requisito "Cadastro de palestra é coberto de ponta a ponta"):
  - `cy.visit('/palestras/nova')`;
  - preencher `#speaker-name`, `#speaker-email` e `#talk-title` com valores sufixados por `Date.now()`;
  - conferir que `button.cfp-button-primary` está habilitado e clicar nele;
  - conferir `.cfp-message-success` com "Proposta enviada com sucesso. Obrigado por contribuir!";
  - acionar `cy.contains('nav.cfp-nav a', 'Dashboard')`;
  - conferir que `cy.contains('#speakers-section tbody tr', tituloUnico)` contém o nome e o email.

  Verificar com `npx nx e2e frontend-e2e --spec src/e2e/speaker-submission.cy.ts`.
- [x] 3.2 Criar `frontend-e2e/src/e2e/event-registration.cy.ts` com o teste de sucesso (requisito "Cadastro de evento é coberto de ponta a ponta"):
  - `cy.visit('/eventos/novo')`;
  - preencher `#event-name` e `#event-address` com valores únicos;
  - digitar em `#event-date` a data de hoje + 30 dias em `YYYY-MM-DD`, calculada no fuso local (design D7);
  - enviar e conferir "Evento cadastrado com sucesso.";
  - ir ao Dashboard pelo menu;
  - conferir que a linha de `#events-section tbody tr` com o nome único contém o endereço e a data em `DD/MM/AAAA`.

  Verificar com `npx nx e2e frontend-e2e --spec src/e2e/event-registration.cy.ts`.

## 4. Specs E2E de erro

- [x] 4.1 Em `speaker-submission.cy.ts`, adicionar o teste de validação progressiva (requisito "Mensagens de validação da palestra são cobertas"), usando `cy.get('form.cfp-form').submit()` a cada passo (design D4):
  1. Formulário vazio: conferir as três mensagens em `#speaker-name-error`, `#speaker-email-error` e `#talk-title-error`.
  2. Nome preenchido: o erro do nome some (`should('not.exist')`).
  3. Email `email-invalido`: aparece "Informe um email válido.".
  4. Email válido: resta apenas "Informe o título da palestra.".

  A cada passo, conferir que `button.cfp-button-primary` está desabilitado e que `.cfp-message-success` não existe. Verificar com `npx nx e2e frontend-e2e --spec src/e2e/speaker-submission.cy.ts`.
- [x] 4.2 Em `event-registration.cy.ts`, adicionar o teste de validação progressiva (requisito "Mensagens de validação do evento são cobertas"):
  1. Formulário vazio: conferir "Informe o nome do evento.", "Informe o endereço do evento." e "Informe a data do evento.".
  2. Nome preenchido: o erro do nome some.
  3. Endereço preenchido: o erro do endereço some.
  4. Data `2020-01-01`: aparece "Escolha uma data a partir de amanhã.".

  A cada passo, conferir o botão desabilitado e a ausência de sucesso. Verificar com `npx nx e2e frontend-e2e --spec src/e2e/event-registration.cy.ts`.
- [x] 4.3 Revisar os dois specs contra a "regra de ouro" (requisito "Testes usam apenas a sintaxe tradicional do Cypress"). Verificar com `grep -n "import" frontend-e2e/src -r` que nenhum spec ou arquivo de suporte importa pacote além do próprio Cypress.

## 5. Integração

- [x] 5.1 Com nenhum servidor no ar, rodar `npx nx e2e frontend-e2e` e confirmar que frontend e API sobem sozinhos e que os quatro testes passam.
  - Rodar de novo sem reiniciar a API, para confirmar que os dados da execução anterior não causam falha nem falso positivo.
  - Por fim, rodar `npx nx test frontend` e `npx nx run-many -t serve -p api frontend` para conferir que a aplicação continua subindo normalmente.
- [x] 5.2 Rodar `openspec validate create-event-tests --strict` e confirmar que passa.

## Workflow follow-up

- Arquivar a change com `/openspec-archive-change` depois da revisão.
