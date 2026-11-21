# Design

## Context

A motivação está em `proposal.md`, e o comportamento exigido em `specs/event-registration`, `specs/app-navigation` e `specs/submission-dashboard`.

Estado atual relevante:

- **API (`apps/api`):**
  - o `CfpController` (`@Controller()`) atende `GET /api`, `GET /api/speakers` e `POST /api/speakers`;
  - o `AppService` guarda as palestras em um array privado. `submitSpeaker` grava e devolve cópias planas, e `listSpeakers` devolve cópias;
  - `configureApp` aplica o prefixo `api` e o `ValidationPipe` global (`transform`, `whitelist`, `forbidNonWhitelisted`), e os testes HTTP (`supertest`) o reutilizam;
  - a validação da palestra fica em `SpeakerSubmissionDto`, que `implements SpeakerDTO`, usa `class-validator` e rejeita textos em branco com `@Matches(/\S/)`.
- **Frontend (`apps/frontend`, Angular 21, componentes standalone com Signals):**
  - `App` é uma casca com apenas `<router-outlet />`;
  - as rotas atuais são `''` para o `CfpSubmissionComponent` e `'dashboard'` para o `CfpDashboardComponent`, ambas com `title`;
  - o formulário de palestra usa signals (`speaker`, `touched`, `submissionStatus`), `computed` para `isValid` e `canSubmit`, `aria-invalid`/`aria-describedby` e mensagens em `role="status"`/`role="alert"`;
  - o envio passa pelo `SpeakerSubmissionService`, que encapsula o `POST`.
- **Estilos:**
  - os tokens e as classes globais `cfp-` (página, cartão, botões e mensagens) ficam em `styles.css`;
  - os estilos de campo (`.field`, `label`, inputs, `.field-error`) ficam no CSS do componente de palestra;
  - `design-tokens.spec.ts` verifica o contraste dos tokens.
- **Testes:**
  - `app.routes.spec.ts` verifica rotas, títulos e navegação sem recarregar;
  - `cfp-submission.spec.ts` verifica o link para `/dashboard`;
  - o dashboard tem um link para `/`, verificado em `app.routes.spec.ts`.

## Goals / Non-Goals

**Goals:**

- Fazer o cadastro de evento seguir o padrão do fluxo de palestras, para que o código e os testes sejam reconhecíveis: DTO compartilhado, classe de validação, serviço em memória, serviço HTTP no frontend e componente com signals.
- Usar uma única regra de "data futura" no frontend e na API, sem duas implementações que possam divergir.
- Concentrar a navegação na casca `App`, para que as páginas não precisem conhecer o menu.
- Reaproveitar a identidade visual existente sem duplicar CSS nem estourar o orçamento de estilo por componente.

**Non-Goals:**

- Página dedicada a eventos, ou busca, filtro e ordenação de eventos no Dashboard.
- Biblioteca de datepicker de terceiros, máscaras de entrada ou suporte a horário e fuso.
- Refatorar o fluxo de palestras além do que for necessário para as novas URLs e para os estilos de campo compartilhados.
- Lazy loading de rotas, guards ou estado global.

## Decisions

### 1. `EventDTO` com data como string ISO `YYYY-MM-DD`

Em `shared-types/src/lib/event.dto.ts`:

```ts
export interface EventDTO {
  id: string;
  name: string;
  address: string;
  date: string; // YYYY-MM-DD, dia do calendário, sem horário
}
```

Os nomes dos campos ficam em inglês, como no `SpeakerDTO`; os rótulos da interface ficam em português. O `id` é um UUID gerado no frontend com `crypto.randomUUID()` a cada envio, como no fluxo de palestras.

**Rationale:**

- O formato é o mesmo que trafega no JSON e o mesmo que o `<input type="date">` produz e consome em `value` e `min`.
- Sem horário, "hoje" não depende de conversão de fuso: compara-se o dia.
- Strings `YYYY-MM-DD` com zeros à esquerda podem ser comparadas lexicograficamente.

**Alternatives considered:** `date: Date` no contrato exigiria `@Type(() => Date)` na API. Além disso, o tipo seria mentiroso no fio, porque o JSON sempre leva uma string, e a serialização com `toISOString()` converte para UTC e pode trocar o dia. A alternativa foi descartada com a pessoa usuária.

### 2. Regra de data futura compartilhada em `shared-types`

Funções puras exportadas junto do DTO:

- `toIsoDate(date: Date): string` formata o dia **local** de `date` como `YYYY-MM-DD`;
- `isValidIsoDate(value: string): boolean` aceita apenas o formato estrito `^\d{4}-\d{2}-\d{2}$` e uma data existente no calendário. Para isso, reconstrói a data com `new Date(y, m - 1, d)` e confere ano, mês e dia;
- `isFutureIsoDate(value: string, now: Date = new Date()): boolean`, definida como `isValidIsoDate(value) && value > toIsoDate(now)`;
- `minFutureIsoDate(now: Date = new Date()): string` retorna o dia seguinte a `now`, usado no atributo `min` do datepicker.

**Rationale:** o frontend e a API passam a aplicar a mesma definição de "futuro", incluindo a validação de calendário (`2027-02-30` é inválido nos dois lados). O parâmetro `now` permite testes determinísticos sem mockar o relógio global.

**Alternatives considered:**

- Duplicar a lógica em cada app: risco de divergência, por exemplo um lado aceitar hoje e o outro não.
- Usar `@MinDate` do `class-validator`: exige `Date`, cai no problema de fuso da decisão 1 e não existe no frontend.

### 3. Validação na API com `EventRegistrationDto`

Em `apps/api/src/app/event-registration.dto.ts`, a classe `EventRegistrationDto implements EventDTO` espelha o `SpeakerSubmissionDto`:

- `id`, `name` e `address` recebem `@IsString() @IsNotEmpty() @Matches(/\S/)`;
- `date` recebe `@IsString()` e um validador customizado `@IsFutureIsoDate()`, criado com `registerDecorator` e baseado em `isFutureIsoDate`. A mensagem menciona `date`: `"date must be a future date in YYYY-MM-DD format"`.

O `ValidationPipe` global já rejeita propriedades extras e responde 400 antes de chegar ao serviço. Nada muda em `configureApp`.

**Rationale:** reaproveita o pipeline de validação de produção, que os testes HTTP também usam, e mantém a mensagem de erro com o nome do campo, como os testes de palestra já esperam.

**Alternatives considered:** validar a data dentro do serviço lançando `BadRequestException` misturaria a validação com o armazenamento e fugiria do padrão.

### 4. `EventController` e `EventService` separados

- `event.service.ts` (`EventService`) guarda um array privado `EventDTO[]`. `registerEvent` grava e devolve uma cópia plana com exatamente os quatro campos, e `listEvents` devolve as cópias na ordem de inserção. É o mesmo modelo do `AppService`.
- `event.controller.ts` (`EventController`, `@Controller('events')`) expõe `@Post()` e `@Get()`. A URL final é `/api/events` por causa do prefixo global.
- Os dois são registrados no `AppModule`.

**Rationale:** coesão por recurso, sem aumentar o `CfpController` e o `AppService`, que já misturam boas-vindas e palestras. O estado continua por instância de provider, então uma nova `NestApplication` começa vazia, o que reproduz o cenário de reinício. Arrays separados garantem que os armazenamentos sejam independentes.

**Alternatives considered:** acrescentar `@Post('events')` ao `CfpController` e o array ao `AppService` é mais curto, mas o serviço passaria a ter duas responsabilidades de domínio.

### 5. Componente `CfpEventComponent` no padrão do formulário de palestra

Em `apps/frontend/src/app/cfp-event/` (`cfp-event.ts`, `.html`, `.css`, `.spec.ts`), um componente standalone com a mesma estrutura de estado do `CfpSubmissionComponent`:

- `event = signal<Omit<EventDTO, 'id'>>({ name: '', address: '', date: '' })`;
- `touched`, `submissionStatus`, `successMessage` e `errorMessage`;
- `minDate = minFutureIsoDate()`, calculado na criação do componente e ligado a `[min]` do `<input type="date">`;
- `fieldError(field)` devolve as mensagens em português:
  - "Informe o nome do evento.";
  - "Informe o endereço do evento.";
  - "Informe a data do evento.";
  - "Escolha uma data a partir de amanhã.";
- `isValid` e `canSubmit` como `computed`, usando `isFutureIsoDate` para a data;
- `submit()` faz trim de `name` e `address`, gera o `id` e chama o `EventRegistrationService`;
- em caso de sucesso, mostra "Evento cadastrado com sucesso." em `role="status"`. Em caso de erro, mostra uma mensagem estável em `role="alert"`, sem detalhes técnicos.

O formulário **não é limpo** após o sucesso, mantendo o comportamento do formulário de palestra. Cada novo envio gera um novo `id`.

`EventRegistrationService` (`apps/frontend/src/app/event-registration.service.ts`, `providedIn: 'root'`) expõe `register(event: EventDTO): Observable<EventDTO>`, que faz `POST /api/events`, no molde do `SpeakerSubmissionService`.

**Rationale:**

- Signals e template-driven manual mantêm o padrão do projeto; os specs existentes servem de modelo para os novos.
- O `min` nativo impede escolher no seletor uma data que não seja futura.
- A validação no componente cobre a digitação manual e os navegadores que ignoram `min`.

**Alternatives considered:**

- Reactive Forms com `Validators.required` e um validador customizado: idioma diferente do resto do frontend.
- Um datepicker de biblioteca: dependência nova sem ganho para um único campo.

### 6. Estilos de campo promovidos a classes globais

Os estilos de `.field`, rótulo, inputs de texto, e-mail e data, foco, `aria-invalid` e `.field-error` saem de `cfp-submission.css` e vão para `styles.css` com os nomes:

- `.cfp-field`;
- `.cfp-field label`;
- `.cfp-field input`;
- `.cfp-field-error`;
- `.cfp-form` (grid do formulário).

Os templates dos dois formulários passam a usar essas classes, e o CSS de cada componente fica só com o que é específico (por exemplo, o checkbox de GDE).

**Rationale:** o requisito de identidade visual compartilhada passa a cobrir o cadastro de evento. Copiar o CSS duplicaria cores e medidas e abriria espaço para divergência. As classes globais `cfp-` são o padrão já adotado para cartão, botões e mensagens.

**Alternatives considered:** duplicar o CSS do campo no componente de evento é mais rápido, mas viola a regra "nenhum componente declara cores próprias" que o design anterior estabeleceu.

### 7. Menu principal na casca `App` e novas rotas

O template de `App` passa a ser:

```html
<header class="cfp-header">
  <nav class="cfp-nav" aria-label="Navegação principal">
    <a routerLink="/" routerLinkActive="is-active" ariaCurrentWhenActive="page"
       [routerLinkActiveOptions]="{ exact: true }">Dashboard</a>
    <a routerLink="/palestras/nova" routerLinkActive="is-active" ariaCurrentWhenActive="page">Enviar palestra</a>
    <a routerLink="/eventos/novo" routerLinkActive="is-active" ariaCurrentWhenActive="page">Cadastrar evento</a>
  </nav>
</header>
<router-outlet />
```

O estado ativo usa `aria-current="page"` e, no estilo, um sublinhado ou borda inferior espessa em terracota, além da cor, para não depender só dela. Os estilos `.cfp-header` e `.cfp-nav` ficam em `styles.css` e usam somente tokens.

Rotas (`app.routes.ts`), nesta ordem:

| path | destino | title |
|---|---|---|
| `''` (`pathMatch: 'full'`) | `CfpDashboardComponent` | Dashboard |
| `'palestras/nova'` | `CfpSubmissionComponent` | Proponha sua palestra |
| `'eventos/novo'` | `CfpEventComponent` | Cadastre um evento |
| `'dashboard'` | `redirectTo: ''` | — |
| `'**'` | `redirectTo: ''` | — |

As ações contextuais existentes continuam, com as URLs atualizadas:

- no formulário de palestra, "Ver palestras submetidas" passa a apontar para `/`;
- no Dashboard, "Enviar nova proposta" passa a apontar para `/palestras/nova`.

O `<main>` continua dentro de cada página. O `<header>` fica fora dele, como landmark `banner`.

**Rationale:**

- `ariaCurrentWhenActive` é o recurso nativo do Angular para `aria-current`.
- `exact: true` evita que o link Dashboard (`/`) fique ativo em todas as rotas.
- O redirecionamento de `/dashboard` preserva links e favoritos antigos.

**Alternatives considered:**

- Um componente `CfpNavComponent` separado: aceitável, mas a casca já é o ponto único de layout e o menu é pequeno. Pode ser extraído depois sem mudar o comportamento.
- Manter o formulário de palestra em `/` e redirecionar `/` para `/dashboard`: contraria a decisão de tornar o Dashboard a entrada padrão em `/`.

### 8. Seção de eventos no Dashboard

O `CfpDashboardComponent` ganha uma segunda fonte de dados, independente da primeira:

- `events: WritableSignal<EventDTO[]>` e `eventsStatus: WritableSignal<DashboardStatus>`, com os `computed` `eventsLoading`, `eventsError` e `eventsEmpty`;
- `GET /api/events` é disparado na criação, junto do `GET /api/speakers`, também com `takeUntilDestroyed`. Cada solicitação atualiza somente o próprio estado, então uma falha não afeta a outra seção;
- o template passa a ter `h1` "Dashboard" e duas `<section>`, cada uma com `aria-labelledby` apontando para o próprio `h2`: "Palestras submetidas" (conteúdo atual, sem mudanças) e "Eventos cadastrados";
- os eventos usam o mesmo padrão de tabela já existente (`.table-region` com `role="region"` e `tabindex="0"`, `caption` e `th scope="col"`), com as colunas Evento, Endereço e Data;
- a data é exibida como `<time [attr.datetime]="event.date">{{ formatEventDate(event.date) }}</time>`, em que `formatEventDate` apenas reordena `YYYY-MM-DD` para `DD/MM/AAAA` por manipulação de string, sem `Date` e, portanto, sem deslocamento de fuso;
- os estados de carregamento, vazio e erro reutilizam `.dashboard-status` e `.cfp-message-error`, com os textos "Carregando eventos…", "Ainda não há eventos cadastrados." e "Não foi possível carregar os eventos. Tente novamente mais tarde.".

O componente continua usando o `HttpClient` diretamente, como já faz para as palestras. Os estilos de tabela de `cfp-dashboard.css` servem às duas tabelas, então o CSS do componente praticamente não cresce e fica longe do orçamento de 4 kB.

**Rationale:**

- Uma tabela mantém o mesmo padrão semântico e visual já validado para as palestras e é a forma mais direta de comparar nome, endereço e data.
- Estados separados por seção satisfazem o cenário de falhas independentes.
- `<time datetime>` deixa o valor ISO legível por máquina.

**Alternatives considered:**

- Cards: exigiriam CSS novo e um segundo padrão de listagem no mesmo Dashboard.
- Um `forkJoin` das duas solicitações: acoplaria os estados, e uma falha em eventos esconderia as palestras.
- Usar `DatePipe`: interpreta a string como data UTC e pode exibir o dia anterior em fusos negativos.

## Risks / Trade-offs

- **[Risco] "Hoje" diverge entre navegador e servidor em fusos diferentes**: por exemplo, às 22h em UTC−3 o servidor em UTC já está no dia seguinte e rejeitaria a data de "amanhã" do navegador. → **Mitigação:** a spec define "hoje" pelo relógio local de quem valida. No ambiente do projeto, com front e API na mesma máquina, o dia coincide. Em caso de rejeição, a API responde 400 e o formulário mostra o erro, permitindo escolher outra data. O risco fica registrado para uma futura evolução com fuso explícito.
- **[Risco] Testes que só esperam `GET /api/speakers` quebram**: o Dashboard em `/` passa a disparar também `GET /api/events`, e `httpTesting.verify()` falha com requisições pendentes. → **Mitigação:** os specs do Dashboard e de rotas tratam as duas URLs, por exemplo respondendo `[]` a `/api/events` no `afterEach`, como já é feito com `/api/speakers`.
- **[Risco] Mudança de URLs quebra links salvos para `/` (formulário)** → **Mitigação:** `/` passa a mostrar o Dashboard, que tem a ação "Enviar nova proposta" e o menu. `/dashboard` redireciona.
- **[Risco] `minDate` calculado uma vez fica desatualizado se a página ficar aberta após a meia-noite** → **Mitigação:** `isValid` reavalia a data com `isFutureIsoDate` no momento do envio, e a API valida de novo. O `min` desatualizado só permitiria escolher "hoje", que seria rejeitado com mensagem.
- **[Trade-off] Lógica em `shared-types`**: a biblioteca, até agora só de tipos, ganha funções puras. Elas não têm dependências e são pequenas, e o ganho de uma única regra compensa.
- **[Trade-off] Promover os estilos de campo mexe no componente de palestra** → **Mitigação:** os testes existentes de `cfp-submission.spec.ts` não dependem de classes CSS de campo. Depois da mudança, verifica-se por busca que o CSS do componente continua sem cores literais.
- **[Risco] Testes de data dependem do relógio** → **Mitigação:**
  - as funções puras recebem `now`;
  - os testes HTTP montam datas relativas (`toIsoDate` de hoje, ontem e amanhã) no momento da execução;
  - os testes do componente usam `jest.useFakeTimers().setSystemTime(...)` quando precisam fixar o dia.

## Migration Plan

Não há dados a migrar, porque o armazenamento é em memória. O deploy é simples: API e frontend juntos. Para reverter, basta voltar o commit: as URLs antigas (`/` para o formulário) voltam a existir.
