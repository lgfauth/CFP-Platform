# Design

## Context

Consulte `proposal.md` para a motivação e `specs/submission-dashboard/spec.md` para o comportamento exigido.

Estado atual relevante:

- **API (`apps/api`):** o `AppController` atende `GET /api` (mensagem de boas-vindas, verificada pelo `api-e2e`) e `POST /api/speakers`. O `POST` recebe `SpeakerSubmissionDto`, que implementa `SpeakerDTO` e é validado pelo `ValidationPipe` global configurado em `configureApp`. O `AppService` só devolve o payload e não guarda nada.
- **Frontend (`apps/frontend`):** o formulário inteiro (Signals, validação, envio e WAI-ARIA) vive no componente raiz `App` (`app-root`). Não existe `<router-outlet>`, `app.routes.ts` está vazio e `provideRouter`/`provideHttpClient` já estão configurados. O `SpeakerSubmissionService` encapsula o `POST`.
- **Estilos:** as cores e medidas estão fixas em `app.css`, que tem orçamento de 4 kB (aviso) e 8 kB (erro) por componente. `styles.css` contém apenas um reset mínimo.
- **Testes:** Jest em ambos os apps. Os testes do formulário estão em `app.spec.ts` e os testes HTTP da API, com `supertest`, em `app.controller.spec.ts`.

## Goals / Non-Goals

**Goals:**

- Isolar o estado em memória da API em um único ponto, que os testes possam reiniciar criando uma nova instância da aplicação.
- Separar a casca de roteamento das telas, para que formulário e dashboard sejam páginas irmãs com a mesma estrutura visual.
- Centralizar a identidade visual em tokens e classes globais, para que nenhum componente declare cores próprias.
- Tornar a exigência de contraste da spec verificável por teste automatizado.

**Non-Goals:**

- Mudar o comportamento, os textos ou as regras de validação do formulário além da troca de cores e da adição do link de navegação.
- Adotar lazy loading, guards, resolvers ou estado global (store) para o roteamento.
- Introduzir bibliotecas de componentes, pré-processadores CSS ou temas claro/escuro.
- Renomear o `AppService`, o `AppModule` ou a rota `GET /api`.

## Decisions

### 1. `CfpController` por renomeação

`app.controller.ts` passa a ser `cfp.controller.ts`, com a classe `CfpController`, mantendo `@Controller()` sem prefixo próprio. Isso preserva `GET /api` e `POST /api/speakers` e acrescenta `@Get('speakers')` ao lado do `@Post('speakers')`. O spec HTTP é renomeado da mesma forma (`cfp.controller.spec.ts`) e o `AppModule` passa a registrar o `CfpController`.

**Rationale:** atende à decisão de renomear o controlador existente e não criar um segundo, sem quebrar os endpoints públicos nem o `api-e2e`.

**Alternatives considered:** `@Controller('speakers')` com rotas vazias deixaria o `GET /api` órfão e exigiria outro controlador. Um `CfpController` novo ao lado do `AppController` foi descartado pela decisão da proposta.

### 2. Armazenamento em memória no serviço

O `AppService`, provider singleton do módulo, mantém um array privado `SpeakerDTO[]`:

- `submitSpeaker` acrescenta ao array uma cópia plana com exatamente os cinco campos do contrato e retorna essa cópia.
- `listSpeakers` retorna uma cópia rasa do array, preservando a ordem de inserção.

Como o `ValidationPipe` roda antes do controlador, payloads rejeitados nunca chegam ao serviço e, portanto, nunca são armazenados.

**Rationale:** a cópia plana garante que a resposta do `GET` tenha a forma exata de `SpeakerDTO`, e não a instância transformada da classe de validação. A cópia na leitura impede que um consumidor altere o estado interno. O estado vive na instância do provider, então cada `NestApplication` nova começa vazia, o que reproduz o cenário de reinício da spec.

**Alternatives considered:** um provider de repositório separado seria um isolamento prematuro para um array. Um array em escopo de módulo (variável global) vazaria estado entre testes e entre instâncias.

### 3. Casca de roteamento e páginas irmãs

- `App` passa a ter apenas `<router-outlet>` e importa `RouterOutlet`.
- O formulário atual (classe, template, estilos e lógica) é movido sem mudanças de comportamento para `cfp-submission/` como `CfpSubmissionComponent`.
- O dashboard fica em `cfp-dashboard/` como `CfpDashboardComponent`.

As rotas em `app.routes.ts`:

- `{ path: '', component: CfpSubmissionComponent, title: 'Proponha sua palestra' }`
- `{ path: 'dashboard', component: CfpDashboardComponent, title: 'Palestras submetidas' }`

Carregamento eager, com `title` em cada rota, para que o título do documento mude a cada navegação.

**Rationale:** o formulário e o dashboard ficam simétricos e testáveis isoladamente. O título por rota informa a mudança de página a tecnologias assistivas sem código extra.

**Alternatives considered:** manter o formulário no `App` e exibir o dashboard condicionalmente não cumpre a rota `/dashboard` nem o acesso direto. `loadComponent` (lazy) não traz ganho perceptível com duas telas pequenas e complica os testes de rota.

### 4. Navegação como links estilizados

A navegação usa `<a routerLink="/dashboard">Ver palestras submetidas</a>` no formulário e `<a routerLink="/">Enviar nova proposta</a>` no dashboard. Os dois links usam a classe global de botão na variante secundária.

**Rationale:** navegar entre páginas é semântica de link. Um `<a>` com `href` real é anunciado corretamente, abre em nova aba e funciona pelo teclado nativamente. A variante secundária (contorno terracota) mantém forma, tipografia, raio e altura do botão principal sem competir com a ação "Enviar proposta".

**Alternatives considered:** `<button (click)="router.navigate(...)">` imitaria um link sem `href`. Usar o botão terracota preenchido criaria duas ações primárias no formulário.

### 5. Dashboard: HttpClient direto e estado em Signals

Conforme solicitado, o `CfpDashboardComponent` injeta o `HttpClient` e faz `GET /api/speakers` tipado como `SpeakerDTO[]`. A requisição é disparada na criação do componente e cancelada com `takeUntilDestroyed` se o usuário sair da página antes da resposta.

Estado:

- `speakers: WritableSignal<SpeakerDTO[]>`, inicialmente `[]`.
- `status: WritableSignal<'loading' | 'ready' | 'error'>`, inicialmente `'loading'`.
- Valores computados `isLoading`, `hasError` e `isEmpty` (`ready` com lista vazia).

Em caso de sucesso, a lista é gravada e o status vira `ready`. Em caso de erro, `speakers` volta a `[]` e o status vira `error`, sem exibir dados parciais.

**Rationale:** um único `status` evita combinações impossíveis, como carregando e com erro ao mesmo tempo. Os valores computados deixam o template declarativo e os testes podem inspecioná-los diretamente.

**Alternatives considered:** estender o `SpeakerSubmissionService` com `list()` manteria o transporte fora do componente, mas contraria a instrução explícita de injetar o `HttpClient` no dashboard. Com o `HttpTestingController`, a testabilidade é a mesma nos dois casos. Booleanos separados (`loading`, `error`) permitiriam estados divergentes.

### 6. Estrutura semântica do dashboard

As submissões aparecem em uma `<table>` com:

- `<caption>`;
- `<th scope="col">` para Palestra, Palestrante, Email e GDE;
- uma linha por submissão, com a coluna GDE em texto ("Sim" ou "Não"). O "Sim" leva também um selo visual.

A tabela fica em um contêiner com rolagem horizontal (`role="region"`, `aria-labelledby` apontando para o título, `tabindex="0"`), para telas estreitas.

Os estados ficam em uma área com `aria-busy` durante o carregamento:

- carregando: `<p role="status">Carregando palestras…</p>`;
- vazio: `<p role="status">Ainda não há palestras submetidas.</p>`, sem tabela;
- erro: `<p role="alert">` com texto estável, sem tabela.

**Rationale:** quatro atributos por submissão são dados tabulares. A tabela permite que leitores de tela naveguem por coluna e anunciem os cabeçalhos. O contêiner focável torna a rolagem acessível pelo teclado.

**Alternatives considered:** cards exigiriam rotular cada campo dentro de cada card e perderiam a navegação por colunas.

### 7. Design tokens e classes globais

`styles.css` passa a declarar os tokens em `:root` e as classes compartilhadas de layout: página, cartão, eyebrow, botão primário, botão secundário e mensagens de feedback. Os componentes guardam apenas estilos próprios (campos do formulário, tabela do dashboard) e nunca usam cores literais.

| Token | Valor | Uso | Contraste verificado |
| --- | --- | --- | --- |
| `--color-ink` | `#4D4E49` (cinza-escuro) | texto principal, bordas de campos, hover do botão primário | 8.39:1 sobre branco |
| `--color-accent` | `#9B574A` (terracota) | botão primário, eyebrow, contorno de foco, botão secundário, texto de erro | 5.45:1 sobre branco; branco sobre ele 5.45:1 |
| `--color-sand` | `#CFB079` (mostarda/areia) | só decorativo: faixa superior do cartão, gradiente do fundo, borda do selo GDE | — |
| `--color-mist` | `#CAC6C3` (cinza-claro) | bordas de cartão, separadores de linhas, fundo do botão desabilitado | ink sobre ele 4.95:1 |
| `--color-surface` | `#FFFFFF` | fundo do cartão | — |
| `--color-page` | `#EFEEED` (cinza-claro 30%) | fundo da página | ink 7.24:1 · accent 4.70:1 |
| `--color-sand-soft` | `#F3EBDE` (mostarda 25%) | cabeçalho da tabela, selo GDE, fundo da mensagem de sucesso | ink 7.10:1 |
| `--color-accent-soft` | `#F5EEED` (terracota 10%) | fundo da mensagem de erro | accent 4.76:1 |

Também viram tokens os raios (`--radius-card`, `--radius-control`), a sombra do cartão (derivada do cinza-escuro), a família tipográfica e a largura dos cartões: 42rem no formulário, 64rem no dashboard.

Erro e sucesso continuam distinguíveis sem depender de cor. O erro usa terracota, `role="alert"` e texto explícito. O sucesso usa fundo areia, `role="status"` e texto explícito. O botão desabilitado mantém o atributo `disabled` e texto em `--color-ink`.

**Rationale:** a paleta tem só quatro cores, e duas delas (mostarda e cinza-claro) não atingem 3:1 sobre branco. Tons claros derivados por mistura com branco ampliam as opções de fundo sem sair da paleta, e todos os pares de texto continuam AA. As classes globais evitam duplicar o CSS do botão e do cartão nos dois componentes e mantêm cada componente abaixo do orçamento de estilo.

**Alternatives considered:** manter vermelho e verde semânticos para erro e sucesso quebraria a harmonia pedida. Usar `color-mix()` em tempo de execução dificultaria verificar o contraste dos valores finais em teste. Duplicar os estilos por componente reintroduziria divergência visual.

### 8. Estratégia de testes

- **API (`cfp.controller.spec.ts`):** uma nova `NestApplication` por teste, criada via `configureApp`. Cobre:
  - os testes de `POST` existentes;
  - `GET` vazio;
  - duas submissões listadas em ordem e iguais aos payloads;
  - `POST` rejeitado ausente da lista;
  - lista vazia em uma nova instância, que representa o reinício.
- **Formulário:** `app.spec.ts` vira `cfp-submission.spec.ts`, com os mesmos casos apontando para `CfpSubmissionComponent`, mais a verificação do link com `href="/dashboard"`.
- **Dashboard (`cfp-dashboard.spec.ts`):** com `HttpTestingController`, cobre:
  - estado inicial `loading` com `aria-busy` e texto de status;
  - lista renderizada com cabeçalhos e GDE em texto;
  - mensagem de vazio;
  - `role="alert"` em caso de erro, sem tabela;
  - remoção do indicador ao concluir.
- **Rotas (`app.routes.spec.ts`):** com `RouterTestingHarness`, verifica que `/` exibe o formulário, `/dashboard` exibe o dashboard e o link do dashboard volta ao formulário.
- **Contraste (`design-tokens.spec.ts`):** lê os tokens de `styles.css` e verifica as razões da tabela acima (≥ 4.5:1 para texto e ≥ 3:1 para bordas e foco), para que uma troca de cor que viole a spec quebre o build de testes.

## Risks / Trade-offs

- **Mover o formulário pode quebrar os testes e seletores existentes** → mover classe, template e estilos sem alterar a lógica e migrar `app.spec.ts` na mesma tarefa, rodando os testes antes de mudar as cores.
- **Classes globais podem colidir com estilos de componentes** → usar nomes com prefixo (`cfp-`) para as classes compartilhadas e manter o encapsulamento padrão nos componentes.
- **A terracota serve tanto para ação principal quanto para erro, o que pode confundir** → mensagens de erro sempre com texto explícito, fundo próprio e `role="alert"`; a ação principal é sempre um botão rotulado.
- **Estado em memória é compartilhado entre todas as requisições e se perde ao reiniciar** → aceito pela proposta; documentado como volátil na spec.
- **Mostarda e cinza-claro sobre branco ficam abaixo de 3:1** → restritos a usos decorativos ou como fundo de texto `--color-ink`, garantido pelo teste de contraste.
- **Rolagem horizontal da tabela em telas estreitas** → contêiner focável e rotulado; colunas com quebra de linha para título e email.

## Migration Plan

1. API: renomear `AppController` para `CfpController` (arquivo, módulo e spec), adicionar o armazenamento em memória e o `GET`, com seus testes.
2. Frontend: mover o formulário para `CfpSubmissionComponent`, transformar `App` em casca com `<router-outlet>`, registrar as rotas e migrar os testes, ainda com as cores atuais.
3. Introduzir os tokens e as classes globais em `styles.css` com a nova paleta, aplicar ao formulário e adicionar o teste de contraste.
4. Criar o `CfpDashboardComponent` com tabela, estados e testes, e adicionar os links de navegação nas duas páginas.
5. Executar testes e builds de `frontend`, `api` e `shared-types` e validar a mudança no OpenSpec.

Rollback: reverter os commits da mudança. Não há dados persistidos nem migração de esquema.
