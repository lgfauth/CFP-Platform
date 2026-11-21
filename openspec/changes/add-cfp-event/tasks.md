# Tasks

## 1. Contrato e regra de data em `shared-types`

- [x] 1.1 Criar `shared-types/src/lib/event.dto.ts` com a interface `EventDTO` (`id`, `name`, `address` e `date`, todos `string`) e exportá-la em `src/index.ts`. Verificar com `npx nx build shared-types` e confirmar que `import { EventDTO } from '@cfp-platform/shared-types'` compila no frontend e na API (`npx tsc --noEmit -p apps/api/tsconfig.app.json`).
- [x] 1.2 Implementar no mesmo arquivo as funções puras `toIsoDate(date)` (dia local), `isValidIsoDate(value)`, `isFutureIsoDate(value, now?)` e `minFutureIsoDate(now?)`, conforme a decisão 2 do `design.md`. Criar `event.dto.spec.ts`, passando `now` fixo, e verificar com `npx nx test shared-types` que:
  - amanhã é aceito;
  - hoje e ontem são rejeitados;
  - `2027-02-30`, `2027-13-01`, `27-01-01`, `2027-01-01T10:00` e `''` são rejeitados;
  - `minFutureIsoDate` retorna o dia seguinte, inclusive em virada de mês e de ano (`2026-12-31` → `2027-01-01`).

## 2. API de eventos

- [x] 2.1 Criar `apps/api/src/app/event-registration.dto.ts` com `EventRegistrationDto implements EventDTO`:
  - `id`, `name` e `address` com `@IsString() @IsNotEmpty() @Matches(/\S/)`;
  - `date` com `@IsString()` e o decorator customizado `@IsFutureIsoDate()`, baseado em `isFutureIsoDate`, cuja mensagem menciona `date`.

  Verificar com `npx tsc --noEmit -p apps/api/tsconfig.app.json`.
- [x] 2.2 Criar `event.service.ts` (`EventService`) com um array privado. `registerEvent` grava e devolve uma cópia plana com exatamente os quatro campos, e `listEvents` devolve cópias na ordem de inserção. Criar `event.service.spec.ts` e verificar com `npx nx test api` que:
  - a lista começa vazia;
  - a cópia não tem campos extras nem protótipo diferente de `Object.prototype`;
  - a ordem é preservada;
  - alterar o array retornado não afeta o estado.
- [x] 2.3 Criar `event.controller.ts` (`EventController`, `@Controller('events')`) com `@Post()`, que recebe `EventRegistrationDto`, e `@Get()`. Registrar o controlador e o serviço no `AppModule`.
- [x] 2.4 Criar `event.controller.spec.ts` no molde de `cfp.controller.spec.ts`: uma nova aplicação via `configureApp` por teste, um spy em `registerEvent` e datas relativas montadas com `toIsoDate` no momento do teste. Verificar com `npx nx test api` que:
  - um evento válido com data de amanhã responde 201 e o mesmo `EventDTO`;
  - a ausência de cada campo responde 400, com mensagem contendo o nome do campo, sem chamar o serviço;
  - `name` ou `address` vazio ou em branco, campo não string e propriedade desconhecida respondem 400;
  - `date` igual a hoje, a ontem, `2027-02-30`, `2027-01-01T10:00:00Z` ou `01/02/2027` responde 400;
  - `GET /api/events` responde `[]` em uma aplicação nova e lista dois eventos aceitos na ordem de envio;
  - um cadastro rejeitado não é listado;
  - uma nova instância da aplicação lista `[]`;
  - cadastrar um evento não altera `GET /api/speakers`.
- [x] 2.5 Executar `npx nx test api` e `npx nx build api`, verificando que os testes existentes de palestras continuam passando e que o build conclui sem erros.

## 3. Estilos de campo compartilhados

- [x] 3.1 Mover de `cfp-submission.css` para `styles.css` os estilos de campo, com as classes globais `cfp-form`, `cfp-field` (rótulo e inputs `text`, `email` e `date`, foco e `aria-invalid`) e `cfp-field-error`. Usar somente tokens. Atualizar `cfp-submission.html` para usar essas classes, mantendo no CSS do componente apenas o checkbox de GDE e a área de feedback. Verificar que:
  - `npx nx test frontend` continua passando;
  - uma busca por `#[0-9a-fA-F]{3,6}` e `rgb(` em `cfp-submission.css` e nas novas regras de `styles.css` (fora de `:root`) não retorna nada;
  - `npx nx build frontend` não emite aviso de orçamento de estilo.

## 4. Formulário de cadastro de evento

- [x] 4.1 Criar `apps/frontend/src/app/event-registration.service.ts` (`EventRegistrationService`, `providedIn: 'root'`), com `register(event: EventDTO)`, que faz `POST /api/events`. Criar `event-registration.service.spec.ts` e verificar com `HttpTestingController` que a requisição usa método `POST`, URL `/api/events` e corpo igual ao `EventDTO`.
- [x] 4.2 Criar `apps/frontend/src/app/cfp-event/` com o `CfpEventComponent` standalone (`.ts`, `.html` e `.css`), conforme a decisão 5 do `design.md`. O componente tem:
  - signals de estado e de `touched`, e os `computed` `isValid`, `isSubmitting` e `canSubmit`;
  - `minDate = minFutureIsoDate()` ligado ao `[min]` do `<input type="date">`;
  - campos rotulados Nome, Endereço e Data com as classes `cfp-field`, `aria-invalid` e `aria-describedby` nos erros;
  - mensagens de erro em português;
  - botão "Cadastrar evento", que mostra "Cadastrando..." durante o envio;
  - feedback em `role="status"` e em `role="alert"`;
  - título "Cadastre um evento" no cartão `cfp-card`.

  Verificar com `npx nx build frontend`.
- [x] 4.3 Criar `cfp-event.spec.ts`, fixando o dia com `jest.useFakeTimers().setSystemTime(...)` e um mock de `EventRegistrationService`. Verificar com `npx nx test frontend` que:
  - o botão começa desabilitado;
  - o `min` do input de data é o dia seguinte;
  - ao sair de um campo vazio aparece a mensagem associada por `aria-describedby`, com `aria-invalid="true"`;
  - Nome ou Endereço só com espaços mantém o envio bloqueado;
  - Data de hoje ou passada mostra "Escolha uma data a partir de amanhã." e bloqueia o envio;
  - com dados válidos, o botão é habilitado;
  - no envio, o payload tem exatamente `id` (novo a cada envio), `name` e `address` com trim e `date`, e o botão fica desabilitado até a resposta;
  - em caso de sucesso, aparece a mensagem em `role="status"`;
  - em caso de erro, aparece a mensagem em `role="alert"` e é possível reenviar.

## 5. Eventos no Dashboard

- [x] 5.1 Implementar no `CfpDashboardComponent` o estado de eventos (`events`, `eventsStatus` e os `computed` `eventsLoading`, `eventsError` e `eventsEmpty`), com `GET /api/events` tipado como `EventDTO[]`, disparado na criação e cancelado com `takeUntilDestroyed`, independente do `GET /api/speakers`. Adicionar `formatEventDate`, que converte `YYYY-MM-DD` em `DD/MM/AAAA` por manipulação de string. Verificar com `npx tsc --noEmit -p apps/frontend/tsconfig.app.json`.
- [x] 5.2 Reestruturar `cfp-dashboard.html` conforme a decisão 8 do `design.md`:
  - `h1` "Dashboard";
  - `<section aria-labelledby>` "Palestras submetidas", com o conteúdo atual;
  - `<section aria-labelledby>` "Eventos cadastrados", com a tabela (`caption`, colunas Evento, Endereço e Data, `<time datetime>`) e os estados de carregamento (`aria-busy` e `role="status"`), vazio e erro (`role="alert"`).

  Verificar com `npx nx build frontend`, sem aviso de orçamento de estilo.
- [x] 5.3 Atualizar `cfp-dashboard.spec.ts` para responder às duas URLs, com um `afterEach` que trate `/api/events` pendente, e acrescentar casos para os eventos. Verificar com `npx nx test frontend` que:
  - o estado inicial de eventos é de carregamento, com `aria-busy="true"` e o texto anunciado;
  - eventos retornados aparecem como linhas com nome, endereço e data na ordem da API;
  - `2027-03-05` é exibido como `05/03/2027`, com `datetime="2027-03-05"`;
  - um array vazio mostra "Ainda não há eventos cadastrados.";
  - uma falha em `/api/events` mostra o alerta sem detalhes técnicos e sem tabela, enquanto as palestras continuam exibidas;
  - uma falha em `/api/speakers` não afeta a tabela de eventos;
  - as duas seções têm `h2` e estão identificadas por `aria-labelledby`.

## 6. Menu principal e novas rotas

- [x] 6.1 Reescrever `app.routes.ts` conforme a tabela da decisão 7 do `design.md`:
  - `''` (exato) para o `CfpDashboardComponent`, com título "Dashboard";
  - `palestras/nova` para o `CfpSubmissionComponent`;
  - `eventos/novo` para o `CfpEventComponent`, com título "Cadastre um evento";
  - `dashboard` e `**` redirecionando para `''`.

  Atualizar o link do formulário de palestra para `routerLink="/"` e o do Dashboard ("Enviar nova proposta") para `routerLink="/palestras/nova"`. Ajustar em `cfp-submission.spec.ts` a expectativa de `href` para `/`.
- [x] 6.2 Adicionar à casca `App` o `<header>` com `<nav aria-label="Navegação principal">` e os links Dashboard (`/`, `exact`), Enviar palestra (`/palestras/nova`) e Cadastrar evento (`/eventos/novo`). Cada link usa `routerLinkActive` e `ariaCurrentWhenActive="page"`. Criar em `styles.css` as classes `cfp-header` e `cfp-nav`, somente com tokens, com foco visível e um estado ativo marcado por sublinhado ou borda, além da cor. Verificar com `npx nx build frontend`.
- [x] 6.3 Reescrever `app.routes.spec.ts` renderizando a casca `App`, para incluir o menu, e criar `app.spec.ts` se for necessário. Responder `[]` às requisições pendentes de `/api/speakers` e `/api/events` no `afterEach`. Verificar com `npx nx test frontend` que:
  - `/` exibe o Dashboard, com `h1` "Dashboard";
  - `/dashboard` e uma URL desconhecida redirecionam para `/` com o Dashboard;
  - `/palestras/nova` exibe o formulário de palestra e `/eventos/novo` exibe o formulário de evento;
  - o menu existe em todas as páginas, com nome acessível e os três links rotulados;
  - clicar em cada link do menu troca de página com `defaultPrevented` e sem trocar o elemento raiz;
  - somente o link da página atual tem `aria-current="page"`, e o link Dashboard não fica marcado nas subpáginas;
  - "Ver palestras submetidas" leva a `/` e "Enviar nova proposta" leva a `/palestras/nova`, sem recarregar;
  - o título do documento é "Dashboard", "Proponha sua palestra" e "Cadastre um evento" nas respectivas rotas.

## 7. Identidade visual e verificação integrada

- [x] 7.1 Se o menu ou o formulário de evento introduzir um novo par de cor de texto ou borda sobre fundo (por exemplo, o link ativo do menu sobre o fundo do cabeçalho), adicionar o par a `design-tokens.spec.ts`. Verificar com `npx nx test frontend` que os contrastes são de pelo menos 4.5:1 para texto e 3:1 para bordas e foco.
- [x] 7.2 Executar `npx nx run-many -t test build -p shared-types api frontend` e verificar que tudo passa sem avisos de orçamento.
- [x] 7.3 Subir API e frontend (`npx nx serve api` e `npx nx serve frontend`) e verificar manualmente:
  - a aplicação abre no Dashboard e o menu navega entre as três páginas;
  - o datepicker de `/eventos/novo` não permite escolher hoje;
  - um evento com data futura é cadastrado, aparece em `curl localhost:3000/api/events` e é exibido na seção "Eventos cadastrados" do Dashboard com a data em `DD/MM/AAAA`;
  - um envio com a data de hoje, feito via `curl`, recebe 400.

## Workflow follow-up

- Depois da revisão, arquivar a change com `openspec archive add-cfp-event`. Isso cria `openspec/specs/event-registration/` e `openspec/specs/app-navigation/` e atualiza `submission-dashboard`.
