# Tasks

## 1. Renomear o controlador e listar as submissões na API

- [x] 1.1 Renomear `apps/api/src/app/app.controller.ts` para `cfp.controller.ts` (classe `CfpController`, ainda com `@Controller()` sem prefixo), atualizar o registro no `AppModule` e renomear o spec para `cfp.controller.spec.ts`. Verificar com `npx nx test api` que os testes existentes de `GET /api` e `POST /api/speakers` continuam passando sem alteração de rota.
- [x] 1.2 Adicionar ao `AppService` um array privado de `SpeakerDTO`. `submitSpeaker` armazena e retorna uma cópia plana com exatamente os cinco campos do contrato, e `listSpeakers` retorna uma cópia rasa na ordem de inserção. Verificar com teste em `app.service.spec.ts` que a lista começa vazia, preserva a ordem e não é alterada quando o array retornado é modificado.
- [x] 1.3 Adicionar `@Get('speakers')` ao `CfpController`, ao lado do `@Post('speakers')`, retornando `SpeakerDTO[]` via `listSpeakers`. Verificar por teste HTTP com `supertest` que `GET /api/speakers` responde 200 com `[]` em uma aplicação recém-criada.
- [x] 1.4 Reorganizar `cfp.controller.spec.ts` para criar uma nova aplicação via `configureApp` por teste e adicionar casos HTTP. Verificar que:
  - duas submissões aceitas aparecem no `GET` iguais aos payloads e na ordem de envio;
  - um `POST` rejeitado com 400 não aparece na lista;
  - uma nova instância da aplicação, equivalente a um reinício, lista `[]`.
- [x] 1.5 Executar `npx nx test api` e `npx nx build api`, verificando que os testes e o build passam.

## 2. Introduzir roteamento e mover o formulário

- [x] 2.1 Mover a classe, o template e os estilos do formulário de `App` para `apps/frontend/src/app/cfp-submission/` como `CfpSubmissionComponent` standalone, sem alterar lógica, textos nem atributos ARIA. Migrar `app.spec.ts` para `cfp-submission.spec.ts` apontando para o novo componente. Verificar com `npx nx test frontend` que todos os testes do formulário continuam passando.
- [x] 2.2 Transformar `App` em casca com apenas `<router-outlet>` e registrar em `app.routes.ts` as rotas `''` → `CfpSubmissionComponent` (`title: 'Proponha sua palestra'`) e `'dashboard'` → `CfpDashboardComponent` (`title: 'Palestras submetidas'`). Por ora, o `CfpDashboardComponent` pode ser um componente standalone mínimo com o título da página. Verificar por teste com `RouterTestingHarness` que `/` exibe o formulário e `/dashboard` exibe o dashboard.
- [x] 2.3 Executar `npx nx build frontend`, verificando que a aplicação compila com o roteamento e que não restam referências ao formulário no componente raiz.

## 3. Aplicar a nova identidade visual com design tokens

- [x] 3.1 Declarar em `:root` de `apps/frontend/src/styles.css`:
  - os tokens de cor do design: `--color-ink`, `--color-accent`, `--color-sand`, `--color-mist`, `--color-surface`, `--color-page`, `--color-sand-soft` e `--color-accent-soft`;
  - os tokens de raio, sombra, tipografia e largura dos cartões.

  Verificar que os valores correspondem exatamente à tabela de tokens do `design.md`.
- [x] 3.2 Criar em `styles.css` as classes globais prefixadas (`cfp-`) de página, cartão (com faixa decorativa em mostarda), eyebrow, botão primário, botão secundário (contorno terracota) e mensagens de sucesso e erro, usando apenas tokens. Verificar por busca que nenhuma dessas regras contém cor literal.
- [x] 3.3 Aplicar os tokens e as classes globais ao `CfpSubmissionComponent`, removendo de seu CSS todas as cores literais antigas e mantendo nele apenas os estilos dos campos. Verificar que:
  - uma busca por `#[0-9a-fA-F]{3,6}` e `rgb(` no CSS do componente não retorna nada;
  - `npx nx test frontend` continua passando;
  - o build não emite aviso de orçamento de estilo.
- [x] 3.4 Adicionar `design-tokens.spec.ts`, que lê os tokens de `styles.css` e calcula as razões de contraste WCAG dos pares usados. Verificar que o teste passa e que ele falha se um token de texto for trocado por uma cor que fique abaixo do mínimo. Os pares e mínimos:
  - texto sobre superfície, página e fundos suaves, e branco sobre `--color-accent` e `--color-ink`: ≥ 4.5:1;
  - borda dos campos e contorno de foco sobre os fundos: ≥ 3:1.

## 4. Implementar o dashboard

- [x] 4.1 Implementar no `CfpDashboardComponent` a injeção do `HttpClient` e o `GET /api/speakers` tipado como `SpeakerDTO[]`, disparado na criação e cancelado com `takeUntilDestroyed`. O estado fica em `speakers: WritableSignal<SpeakerDTO[]>` e `status: WritableSignal<'loading' | 'ready' | 'error'>`, com os valores computados `isLoading`, `hasError` e `isEmpty`. Verificar por teste com `HttpTestingController` que:
  - o estado inicial é `loading` com lista vazia;
  - em caso de sucesso, a lista é preenchida e o status vira `ready`;
  - em caso de erro, a lista fica vazia e o status vira `error`.
- [x] 4.2 Criar o template do dashboard no cartão largo, com eyebrow, `<h1>` e uma `<table>` com `<caption>`, `<th scope="col">` (Palestra, Palestrante, Email, GDE) e GDE em texto "Sim"/"Não" (com selo visual no "Sim"), dentro de um contêiner rolável com `role="region"`, `aria-labelledby` e `tabindex="0"`. Verificar por teste do DOM que cada submissão gera uma linha com os quatro valores e que GDE verdadeiro e falso são distinguíveis pelo texto.
- [x] 4.3 Implementar a área de estados com `aria-busy` durante o carregamento:
  - carregando: `role="status"` com "Carregando palestras…";
  - vazio: `role="status"` com "Ainda não há palestras submetidas.", sem tabela;
  - erro: `role="alert"` com mensagem estável, sem tabela.

  Verificar por testes do DOM cada estado e a remoção do indicador de carregamento ao concluir.
- [x] 4.4 Estilizar a tabela apenas com tokens (cabeçalho em `--color-sand-soft`, separadores em `--color-mist`, quebra de linha em título e email). Verificar por busca que o CSS do dashboard não contém cores literais e que o build não emite aviso de orçamento de estilo.

## 5. Adicionar a navegação entre as páginas

- [x] 5.1 Adicionar ao formulário `<a routerLink="/dashboard">Ver palestras submetidas</a>` com a classe de botão secundário. Verificar por teste do `CfpSubmissionComponent` que o link existe, tem `href="/dashboard"` e rótulo textual.
- [x] 5.2 Adicionar ao dashboard `<a routerLink="/">Enviar nova proposta</a>` com a mesma classe de botão secundário. Verificar por teste com `RouterTestingHarness` que acionar o link do formulário exibe o dashboard e acionar o link do dashboard volta ao formulário, sem recarregar a aplicação.
- [x] 5.3 Verificar que o acesso direto a `/dashboard` exibe o dashboard, por teste com `RouterTestingHarness` navegando diretamente para a URL. Verificar também que o título do documento muda conforme o `title` de cada rota.

## 6. Verificar a integração

- [x] 6.1 Executar `npx nx run-many --targets=test,build --projects=frontend,api,shared-types`, verificando que todos os testes e builds passam juntos.
- [x] 6.2 Executar a API e o frontend (`npx nx serve frontend`), enviar uma proposta pelo formulário e navegar até o dashboard. Verificar que:
  - a proposta aparece na tabela;
  - a navegação de volta funciona;
  - as duas telas exibem a nova paleta de forma consistente.
- [x] 6.3 Executar `openspec validate add-cfp-dashboard --strict`, verificando que os artefatos da mudança permanecem válidos após a implementação.

## Workflow follow-up

- Revisar o fluxo implementado e, quando aprovado, arquivar a mudança no OpenSpec.
- Após o arquivamento, verificar a spec principal `submission-dashboard` resultante.
