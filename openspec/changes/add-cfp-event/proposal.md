# Proposal

## Why

A plataforma de Call for Papers só conhece palestras: não há como registrar os eventos para os quais as propostas são enviadas. Esta mudança adiciona o cadastro de eventos, de ponta a ponta, no mesmo padrão já usado para as palestras. Também cria um menu de navegação comum, porque a aplicação passa a ter três páginas e os links soltos entre formulário e dashboard deixam de bastar.

## What Changes

- **Shared-types:** adicionar o `EventDTO` em `@cfp-platform/shared-types`, com `id` (string, UUID gerado no frontend, como no `SpeakerDTO`), `name` (string), `address` (string) e `date` (string ISO `YYYY-MM-DD`). Junto, uma regra compartilhada de "data futura", para que frontend e API decidam da mesma forma.
- **Backend:** adicionar `POST /api/events`, que valida o payload e guarda o evento em memória, e `GET /api/events`, que lista os eventos aceitos na ordem de cadastro. A validação segue o padrão do `POST /api/speakers`: campos obrigatórios, textos não vazios, propriedades extras rejeitadas e HTTP 400 em caso de erro. A API também rejeita datas de hoje ou passadas.
- **Frontend:** nova página de cadastro de eventos com um formulário de nome, endereço e data, com todos os campos obrigatórios. O datepicker (`<input type="date">`) só oferece datas a partir de amanhã, e o formulário rejeita hoje, datas passadas e valores digitados fora dessa faixa. Os estados de envio, sucesso e erro e a acessibilidade (WAI-ARIA) seguem o formulário de palestras.
- **Frontend — dashboard:** o Dashboard passa a mostrar também os eventos cadastrados, obtidos de `GET /api/events`, em uma tabela com nome, endereço e data. A seção de eventos tem seus próprios estados de carregamento, lista vazia e erro, independentes da seção de palestras. A página passa a se chamar "Dashboard", com as seções "Palestras submetidas" e "Eventos cadastrados".
- **Frontend — navegação:** um menu principal no componente raiz, presente em todas as páginas, com links para Dashboard, Enviar palestra e Cadastrar evento. O menu indica a página atual.
- **Frontend — rotas (BREAKING para URLs):**
  - O Dashboard passa a ser a entrada padrão, em `/`.
  - O formulário de palestra sai de `/` e vai para `/palestras/nova`.
  - O cadastro de evento fica em `/eventos/novo`.
  - `/dashboard` redireciona para `/`, e URLs desconhecidas também levam a `/`.

  As ações contextuais já existentes ("Ver palestras submetidas" e "Enviar nova proposta") passam a apontar para as novas URLs.

## Capabilities

### New Capabilities
- `event-registration`: cadastro de eventos. Cobre o contrato `EventDTO`, a validação e a retenção em memória na API (`POST`/`GET /api/events`) e o formulário acessível no frontend, com a restrição de datas futuras.
- `app-navigation`: estrutura de navegação da aplicação. Cobre o menu principal comum, a página de entrada padrão, as URLs de cada página, os redirecionamentos e os títulos do documento.

### Modified Capabilities
- `submission-dashboard`:
  - Novos requisitos para a seção de eventos cadastrados do Dashboard: listagem, carregamento, lista vazia e erro, e formato da data.
  - O requisito "Navegação entre formulário e dashboard" é removido e substituído por `app-navigation`, porque o formulário deixa de ser a rota padrão e o Dashboard passa a ser a entrada.
  - O requisito "Identidade visual compartilhada e acessível" passa a abranger todas as páginas e o menu, não apenas o formulário e o dashboard.

## Impact

- **Shared-types (`shared-types/`):** novo `event.dto.ts` com o `EventDTO` e a função pura de data futura, exportados por `src/index.ts`, com testes da regra de data.
- **API (`apps/api`):**
  - um novo controlador e um novo serviço de eventos, registrados no `AppModule`, com estado em memória que se perde ao reiniciar;
  - uma nova classe de validação com `class-validator`;
  - novos testes HTTP com `supertest`.
  - `configure-app.ts` (prefixo `api` e `ValidationPipe` global) é reutilizado sem alteração.
- **Frontend (`apps/frontend`):**
  - novo componente de cadastro de evento e um serviço HTTP de eventos;
  - o `CfpDashboardComponent` passa a carregar também `GET /api/events` e a renderizar a tabela de eventos, reaproveitando os estilos de tabela existentes;
  - `App` passa a renderizar o menu acima do `<router-outlet>`;
  - `app.routes.ts` e `app.routes.spec.ts` são reescritos para as novas URLs;
  - os specs do formulário e do dashboard que verificam `href` são atualizados;
  - os estilos de campo do formulário de palestra são promovidos a classes globais `cfp-`, para que o novo formulário use a mesma aparência sem duplicar CSS.
- **Contrato:** `SpeakerDTO` não muda.
- **Fora de escopo:**
  - página dedicada a eventos com busca, filtros ou ordenação (os eventos aparecem apenas no Dashboard, na ordem de cadastro);
  - vínculo entre palestras e eventos;
  - edição e exclusão de eventos;
  - persistência em banco e autenticação;
  - horário e fuso do evento, já que a data é apenas o dia;
  - testes E2E.
