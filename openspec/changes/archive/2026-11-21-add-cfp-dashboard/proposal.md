# Proposal

## Why

Hoje as propostas enviadas ao Call for Papers são apenas confirmadas pela API e descartadas: não há como a organização ver o que foi submetido. Um dashboard de listagem torna as submissões visíveis e fecha o ciclo iniciado pelo formulário entregue em `add-cfp-feature`. A mudança também adota uma nova identidade visual, aplicada de forma única ao formulário e ao dashboard.

## What Changes

- **Backend:** renomear o `AppController` de `apps/api` para `CfpController`, sem alterar os caminhos públicos das rotas existentes, e adicionar nele, ao lado do `POST /api/speakers`, a rota `GET /api/speakers`, que retorna `SpeakerDTO[]`.
- **Backend:** o serviço passa a manter em memória as submissões aceitas pelo `POST`, para que o `GET` possa listá-las na ordem de envio. Submissões rejeitadas pela validação nunca entram na lista.
- **Frontend:** criar o `CfpDashboardComponent` standalone em `apps/frontend`, que consome `GET /api/speakers` via `HttpClient` e mantém a lista em um `WritableSignal<SpeakerDTO[]>`, com estados observáveis de carregamento, lista vazia e erro.
- **Frontend:** exibir as palestras com HTML semântico (tabela com cabeçalhos, ou lista de cards) e comunicar carregamento e erros por WAI-ARIA, no mesmo padrão do formulário.
- **Frontend:** transformar o componente raiz em casca de roteamento (`<router-outlet>`), mover o formulário para um componente próprio na rota padrão e adicionar a rota `path: 'dashboard'` para o `CfpDashboardComponent`.
- **Frontend:** adicionar ao formulário uma ação de navegação para o dashboard, e ao dashboard um caminho de volta ao formulário, com o mesmo estilo visual dos botões.
- **UI — nova identidade visual:** substituir as cores atuais por design tokens (CSS custom properties) compartilhados, baseados na paleta:
  - Cinza-escuro `#4D4E49`
  - Terracota `#9B574A`
  - Mostarda/areia `#CFB079`
  - Cinza-claro `#CAC6C3`

  Os tokens devem ser aplicados de forma coerente e harmoniosa ao formulário e ao dashboard, mantendo o contraste WCAG AA e sem depender apenas de cor para comunicar estados.

## Capabilities

### New Capabilities
- `submission-dashboard`: listagem das propostas submetidas, desde a exposição das submissões aceitas pela API até sua apresentação acessível no frontend, incluindo a navegação entre formulário e dashboard e a identidade visual compartilhada.

### Modified Capabilities
<!-- Nenhuma. Os requisitos de `speaker-submission` (contrato, validação, bloqueio do envio, acessibilidade e confirmação) permanecem inalterados; a retenção das submissões aceitas, a navegação e a identidade visual são comportamentos novos, cobertos por `submission-dashboard`. -->

## Impact

- **API (`apps/api`):** `app.controller.ts` vira `cfp.controller.ts` (`CfpController`), com o registro no `AppModule` e o spec HTTP renomeados. O serviço ganha um armazenamento em memória, cujos dados se perdem ao reiniciar a API. Surgem testes para o `GET` (lista vazia, submissão aceita listada, submissão rejeitada ausente).
- **Frontend (`apps/frontend`):** `app.routes.ts` deixa de ser vazio; `App` vira casca com `<router-outlet>`; o formulário e seus testes Jest (`app.spec.ts`) migram para o novo componente do formulário; o serviço HTTP passa também a fazer `GET /api/speakers`.
- **Estilos:** os tokens ficam em escopo global (`styles.css` ou um arquivo de tokens) e os componentes deixam de usar cores fixas. Restrição de contraste da paleta: sobre fundo branco, apenas o cinza-escuro (8.39:1) e a terracota (5.45:1) servem para texto e para bordas de controles. A mostarda (2.07:1) e o cinza-claro (1.70:1) ficam restritos a fundos, destaques e elementos decorativos. As cores de erro e sucesso devem continuar distinguíveis e acompanhadas de texto.
- **Contrato:** `SpeakerDTO` de `@cfp-platform/shared-types` continua sendo a única definição, agora também usada na resposta do `GET`, e sua forma não muda.
- **Fora de escopo:** persistência em banco, autenticação/autorização, paginação, busca/filtros, edição, aprovação ou curadoria de propostas, e testes E2E.
