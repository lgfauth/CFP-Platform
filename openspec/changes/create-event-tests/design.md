# Design

## Context

Veja `proposal.md` (Why). Os requisitos estão em `specs/e2e-testing`, `specs/speaker-submission` e `specs/event-registration`.

Estado atual relevante:

- **`frontend-e2e/`:** foi gerado para Playwright e tem `playwright.config.mts`, `src/example.spec.ts` e um `project.json` sem targets, porque eles são inferidos por plugin.
- **Plugins no `nx.json`:** o `nx.json` registra o `@nx/playwright/plugin` com `targetName: "e2e"`. O `@nx/cypress/plugin`, recém-adicionado, também usa `targetName: "e2e"`.
- **Pacotes:** `cypress@16` e `@nx/cypress@24.0.6` estão instalados. O binário do Cypress ainda não foi baixado (não existe `~/.cache/Cypress`).
- **Servidores:**
  - `frontend:serve` (dev server Angular na porta 4200) é o único alvo com `proxyConfig` para `/api` → `http://localhost:3000`, e já declara `dependsOn: ["api:serve"]`.
  - `frontend:serve-static` não tem proxy, então as chamadas à API falham nele.
- **API:** guarda palestras e eventos só em memória, sem endpoint de limpeza. Registros de execuções anteriores continuam lá enquanto a API estiver no ar.
- **Formulários:** nos dois, o botão de envio fica `disabled` enquanto o formulário é inválido, e o `<form>` escuta `(submit)`.
  - Formulário de evento: o `submit()` marca todos os campos como tocados quando o formulário é inválido.
  - Formulário de palestra: o `submit()` só retorna, sem marcar os campos.
- **Seletores estáveis já existentes:**
  - campos de palestra: `#speaker-name`, `#speaker-email`, `#talk-title`, `#speaker-is-gde`;
  - campos de evento: `#event-name`, `#event-address`, `#event-date`;
  - mensagens de campo: `#<campo>-error`, com a classe `.cfp-field-error`;
  - formulário e botão: `form.cfp-form` e `button.cfp-button-primary`;
  - mensagem de sucesso: `.cfp-message-success`;
  - seções do Dashboard: `#speakers-section` e `#events-section`.

## Goals / Non-Goals

**Goals:**
- `nx e2e frontend-e2e` roda os specs Cypress de ponta a ponta: sobe o frontend e a API sozinho, sem passo manual.
- Os specs são determinísticos com uma API que já tenha dados, e com qualquer data de execução.
- O código da aplicação muda o mínimo possível: só o `submit()` do formulário de palestra.

**Non-Goals:**
- Novos atributos `data-cy` / `data-testid`. Os `id`s e classes atuais bastam e atendem à diretriz de seletores convencionais.
- Comandos customizados do Cypress (`Cypress.Commands.add`). As poucas repetições ficam em funções locais do próprio spec, para que a sintaxe vista no teste continue sendo `cy.get` / `cy.contains` / `should`.
- Rodar em vários navegadores. Fica o navegador padrão do Cypress (Electron headless).

## Decisions

### D1. Cypress no mesmo projeto, configurado à mão

O que muda:
- Remover `playwright.config.mts` e `src/example.spec.ts`.
- Criar `frontend-e2e/cypress.config.ts` com o `nxE2EPreset` de `@nx/cypress/plugins/cypress-preset`, usando `cypressDir: 'src'`.
- Estrutura do Cypress:
  - specs em `src/e2e/*.cy.ts`;
  - suporte em `src/support/e2e.ts`;
  - fixtures em `src/fixtures/`, se precisar.

O preset recebe:
- `baseUrl: 'http://localhost:4200'`;
- `webServerCommands: { default: 'npx nx run frontend:serve' }`;
- `ciWebServerCommand: 'npx nx run frontend:serve'`.

Por que o CI também usa `serve`: o `serve-static` não tem proxy para a API, então os testes de sucesso não funcionariam com ele.

- **Alternativa: gerador `nx g @nx/cypress:configuration --project=frontend-e2e`.** Gera praticamente o mesmo arquivo, mas pode mexer em `project.json` e `tsconfig` de formas que precisaríamos desfazer, já que o projeto não foi criado por ele. Escrever à mão são poucos arquivos, e o resultado é previsível. Se o gerador for usado, a saída deve ser revisada contra esta decisão.
- **Alternativa: projeto novo `frontend-cypress-e2e`.** Rejeitada, porque o usuário pediu para manter o projeto e o nome `frontend-e2e`.

### D2. Só um plugin E2E no `nx.json`

- Remover a entrada `@nx/playwright/plugin` e manter `@nx/cypress/plugin` com `targetName: "e2e"`. Assim, `nx e2e frontend-e2e` aponta sem ambiguidade para o Cypress.
- Trocar `generators["@nx/angular:application"].e2eTestRunner` para `"cypress"`, para manter o workspace coerente.
- `@nx/playwright` e `@playwright/test` saem do `package.json`, porque nada mais os usa. A única outra referência a Playwright é uma recomendação de extensão em `.vscode/extensions.json`, que também sai.
- **Alternativa: manter os dois plugins com targets diferentes.** Rejeitada pelo usuário (opção 2).

### D3. TypeScript do `frontend-e2e`

`tsconfig.json` passa a:
- usar `types: ["cypress", "node"]`;
- incluir `cypress.config.ts` e `src/**/*.ts`;
- deixar de incluir `playwright.config.mts`.

O `tsconfig.base.json` usa `module: esnext` e `moduleResolution: bundler`, o que o carregador de config do Cypress aceita. Os specs não importam `@cfp-platform/shared-types`, para não depender da resolução de `paths` dentro do bundler do Cypress.

### D4. Tentativa de envio inválido com `cy.get('form.cfp-form').submit()`

- O botão desabilitado não pode ser clicado: `cy.click()` falha num elemento `disabled`, e `{ force: true }` não dispara o `submit` nativo.
- O `.submit()` do Cypress dispara o evento `submit` no `<form>`. Isso equivale a pressionar Enter num campo e aciona o handler `(submit)` do Angular.
- O teste também confere `button.cfp-button-primary` com `should('be.disabled')`.
- **Alternativa: tocar cada campo com `.focus().blur()`.** Mostra as mensagens sem submeter, mas não atende à diretriz de "submeter o formulário vazio".

### D5. Ajuste no `CfpSubmissionComponent.submit()`

Quando `!isValid()`, o componente passa a marcar `touched` com `{ name: true, email: true, talkTitle: true }` antes de retornar, igual ao `CfpEventComponent`. Se só houver um envio em andamento (`isSubmitting()`), ele continua retornando sem mexer nos campos.

Um teste unitário novo, em `cfp-submission.spec.ts`, cobre:
- submissão vazia → as três mensagens aparecem e o serviço não é chamado.

### D6. Dados únicos por execução

- Cada spec de sucesso gera um sufixo com `Date.now()` e o usa em título, nome e email da palestra (`e2e-<sufixo>@example.com`), e em nome e endereço do evento.
- No Dashboard, a linha é localizada pelo texto único, com `cy.contains('#events-section tbody tr', nomeUnico)`, e as demais células são conferidas dentro dela.
- Isso tolera dados antigos na API sem precisar de um endpoint de limpeza.
- **Alternativa: reiniciar a API entre execuções.** Fica fora do controle do spec e deixa a execução mais lenta.

### D7. Datas calculadas no fuso local do teste

- **Data futura:** hoje + 30 dias, calculada com `Date` local no spec e formatada como `YYYY-MM-DD` para `.type()`. O valor esperado no Dashboard é a mesma data em `DD/MM/AAAA`.
- **Data passada:** um valor fixo, `2020-01-01`.
- O Cypress aceita `.type('YYYY-MM-DD')` em `input[type=date]` e dispara `input`/`change`, que o componente escuta.
- O atributo `min` não impede o valor digitado. Por isso a mensagem "Escolha uma data a partir de amanhã." aparece.

### D8. Navegação até o Dashboard

Depois do cadastro, o spec aciona o link "Dashboard" do menu principal, com `cy.contains('nav.cfp-nav a', 'Dashboard').click()`. Isso exercita o fluxo como um usuário faria e garante que a listagem é recarregada, já que o Dashboard busca os dados ao iniciar.

## Risks / Trade-offs

- **[O binário do Cypress não está instalado]** → `npx cypress install` como passo explícito nas tasks. Em CI, o cache `~/.cache/Cypress` precisa ser preservado.
- **[A primeira compilação do dev server Angular é lenta e o Cypress expira esperando]** → o preset do Nx aguarda o `baseUrl` responder antes de rodar os specs. Se não bastar, aumentar o timeout da espera do servidor no preset.
- **[A API não fica pronta junto com o frontend]** → `frontend:serve` já depende de `api:serve`. Além disso, o teste de sucesso usa o `timeout` padrão das asserções (4s) para a mensagem de sucesso, e pode aumentá-lo localmente se a primeira requisição for lenta.
- **[Teste rodando perto da meia-noite]** → a data futura de +30 dias e a data passada fixa ficam longe da fronteira "amanhã". Só a conversão para `DD/MM/AAAA` depende do fuso, e ela é calculada com o mesmo `Date` local.
- **[A mudança no formulário de palestra altera a UX]** → o efeito visível é só mostrar erros quando o usuário pressiona Enter num formulário inválido, o que já acontece no formulário de evento. O texto e a associação ARIA das mensagens não mudam.
- **[Remover o Playwright quebra quem usava `nx e2e frontend-e2e` com ele]** → o único spec existente é o exemplo gerado, que nem passa. Não há uso real a preservar.

## Migration Plan

1. Remover o plugin, os arquivos e as dependências do Playwright. Configurar o Cypress (D1–D3) e instalar o binário.
2. Aplicar o ajuste do formulário de palestra (D5) com o teste unitário.
3. Escrever os specs e rodar `nx e2e frontend-e2e` localmente.

Rollback: reverter o commit. O Playwright volta junto com o `package-lock.json`.
