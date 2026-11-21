# Design

## Context

Consulte `proposal.md` para a motivação e `specs/speaker-submission/spec.md` para o comportamento exigido.

O workspace Nx contém atualmente os aplicativos em `api/` e `frontend/`, usa Angular 22 e executa os testes unitários de `frontend` com o alvo Angular/Vitest. O backend já usa Jest, mas não possui `ValidationPipe` global nem dependências de `class-validator`. A biblioteca `shared-types` exporta `SpeakerDTO` como interface com `id`, `name`, `email`, `talkTitle` e `isGDE`.

## Goals / Non-Goals

**Goals:**

- Disponibilizar um formulário standalone em `apps/frontend`, com estado observável em Signals e sem lógica de submissão duplicada.
- Expor `POST /api/speakers` em `apps/api`, recebendo o payload por `@Body()` e retornando 400 antes do processamento para entradas inválidas.
- Tornar `SpeakerDTO` o contrato único consumido pelas duas aplicações.
- Cobrir com Jest o estado inicial e o bloqueio do botão no Angular e a rejeição de payloads inválidos no NestJS.
- Adotar práticas WAI-ARIA para rótulos, mensagens, estado de carregamento e feedback.
- Migrar os projetos existentes para `apps/frontend` e `apps/api` mantendo os nomes Nx `frontend` e `api`.

**Non-Goals:**

- Persistir propostas em banco de dados ou integrar armazenamento externo.
- Criar autenticação, autorização, edição, listagem, aprovação ou curadoria de propostas.
- Enviar e-mails ou notificações.
- Cobrir o fluxo com E2E ou alterar o projeto Playwright nesta mudança.
- Alterar a forma pública do `SpeakerDTO` sem necessidade demonstrada.

## Decisions

### 1. Workspace e versão Angular

Mover os projetos existentes para `apps/frontend` e `apps/api`, atualizar `project.json`, TypeScript, proxy, caminhos de saída e referências Nx. Alinhar todo o conjunto de pacotes Angular à versão 21 e manter somente APIs compatíveis com essa versão.

**Rationale:** Atende explicitamente à arquitetura solicitada e evita caminhos ou versões mistos que façam a implementação depender da estrutura anterior.

**Alternatives considered:** Manter os diretórios raiz ignorando o requisito ou adotar Angular 22. Ambas quebrariam a arquitetura declarada e foram descartadas.

### 2. Contrato compartilhado e DTO de transporte

Continuar importando `SpeakerDTO` de `@cfp-platform/shared-types` no frontend e no backend. Como interfaces TypeScript não podem receber decorators em tempo de execução, a API usará uma classe de entrada que implementa `SpeakerDTO` e aplica os decorators de `class-validator` aos mesmos cinco campos. O frontend usará `SpeakerDTO` como tipo do estado dos valores da proposta e o serviço de HTTP tipará requisição e resposta com esse contrato.

`id` será gerado pelo frontend antes do envio e não será exposto como campo editável; `name`, `email`, `talkTitle` e `isGDE` serão informados pelo usuário. A API validará `id` como string não vazia.

**Rationale:** Preserva uma fonte de verdade compartilhada sem acoplar a biblioteca de tipos ao runtime de NestJS. A implementação com `implements` também produz erro de compilação se o DTO da API deixar de acompanhar o contrato.

**Alternatives considered:** Transformar `SpeakerDTO` em classe decorada faria a biblioteca frontend carregar dependências de validação e reflect metadata. Criar um DTO independente duplicaria o contrato e permitiria divergência.

### 3. Validação estrita no NestJS

Adicionar `class-validator` e `class-transformer`, habilitar um `ValidationPipe` global com `transform`, `whitelist` e `forbidNonWhitelisted` ativos. O controlador definirá `POST /speakers` e receberá a classe de entrada em `@Body()`. Com o prefixo global existente, o endpoint público será `POST /api/speakers`.

Campos textuais usarão validação de obrigatoriedade, tipo string e não vazio; email usará validação de formato; `isGDE` usará validação booleana e propriedades extras serão recusadas. Uma solicitação válida será encaminhada ao serviço, que nesta fase confirmará o payload sem persistência.

**Rationale:** O fluxo comum do NestJS converte falhas do pipe em respostas 400 consistentes antes da lógica do serviço e impede propriedades silenciosamente descartadas.

**Alternatives considered:** Validação manual no controlador seria repetitiva e sujeita a respostas inconsistentes. `whitelist` sem `forbidNonWhitelisted` atenderia apenas parcialmente ao requisito estrito.

### 4. Estado frontend com Signals

Criar um componente standalone substituindo a tela de boas-vindas atual. Um `signal<SpeakerDTO>` manterá os valores, enquanto Signals derivados/computados representarão validade, envio em andamento e disponibilidade do botão. As atualizações dos controles modificarão a fonte única em vez de manter cópias concorrentes.

O estado inicial terá `id` vazio, textos vazios, `isGDE` falso, status ocioso e nenhum erro; portanto `canSubmit` será falso. `id` será preenchido no início de uma submissão válida, deixando o estado público sempre tipado como `SpeakerDTO`.

Durante a requisição, `isSubmitting` permanecerá verdadeiro até `complete` ou `error`; ambos os caminhos também liberarão o estado para uma nova tentativa.

**Rationale:** Signals tornam dependências e estado inicial diretamente testáveis e impedem que regras imperativas dispersas controlem o botão.

**Alternatives considered:** Usar somente `FormGroup` esconderia parte do estado exigido fora dos controles. Copiar validade para vários Signals criaria risco de estados divergentes.

### 5. Comunicação HTTP

Habilitar o `HttpClient` na configuração da aplicação e encapsular `POST /api/speakers` em um serviço standalone. O componente será responsável apenas por iniciar a submissão e atualizar Signals de feedback; o serviço terá o contrato `SpeakerDTO`.

**Rationale:** Separa transporte e apresentação, facilita mockar o envio nos testes de componente e mantém o uso do path alias compartilhado.

**Alternatives considered:** Chamar `fetch` diretamente no componente criaria testes e tratamento de erros duplicados.

### 6. Acessibilidade WAI-ARIA

Todos os controles terão `<label>` associados. Erros usarão `aria-invalid` e `aria-describedby` apenas quando aplicáveis; o texto de feedback de sucesso e erro será anunciado por região viva apropriada. O formulário usará `aria-busy` durante o envio e o botão terá o atributo `disabled` enquanto `canSubmit` for falso.

Não se dependerá somente de cor, placeholder ou posição para comunicar erros. O foco será direcionado à área de feedback após falha de envio quando isso não interromper a correção assistida.

**Rationale:** Combina semântica HTML nativa com ARIA complementar e cobre os estados observáveis especificados.

**Alternatives considered:** Usar somente atributos visuais ou adicionar ARIA redundante a elementos nativos violaria a acessibilidade desejada.

### 7. Testes unitários com Jest

Configurar Jest para ambos os aplicativos. O frontend trocará o alvo `@angular/build:unit-test` por uma configuração Nx/Jest compatível com Angular 21 e `jest-preset-angular`; os testes de componente verificarão explicitamente os valores iniciais das Signals e o botão desabilitado.

No backend, os testes do controlador serão construídos com `supertest` sobre uma instância Nest completa ou usarão o mesmo `ValidationPipe` em um módulo de teste. Cada classe de payload inválido exigida — campo ausente, email inválido, tipos inválidos, texto vazio e propriedade extra — deverá produzir HTTP 400 antes do serviço.

**Rationale:** Testar somente a lógica dos decorators sem o pipe não comprova a resposta HTTP exigida. A troca do frontend por Jest satisfaz o requisito explícito e unifica o executor.

**Alternatives considered:** Manter Vitest no frontend ou testar apenas chamadas de método no backend não atenderia aos critérios de aceitação.

## Risks / Trade-offs

- [A migração de Angular 22 para 21 pode exigir ajustes transitivos do Nx ou de dependências] → Alinhar versões antes de implementar a tela e validar build e testes de frontend imediatamente após a migração.
- [Mover projetos muda caminhos usados por scripts, e2e, proxy e IDE] → Fazer a migração como primeira tarefa, atualizar todas as referências por busca no workspace e não implementar funcionalidade sobre os caminhos antigos.
- [A ausência de persistência limita a confirmação a uma resposta de processamento] → Declarar o comportamento como confirmação em memória; persistência fica explicitamente fora do escopo.
- [`SpeakerDTO.id` é obrigatório, mas não deve ser preenchido pelo usuário] → Gerá-lo no frontend, validá-lo como string não vazia e mantê-lo fora dos controles visíveis.
- [Jest e Angular 21 exigem configuração específica de preset/transform] → Criar a configuração usando as integrações Nx/Jest suportadas e manter um teste mínimo de componente desde o início da migração.
- [Erros de servidor podem conter mensagens variáveis] → Exibir uma mensagem segura e estável no componente, mantendo detalhes técnicos fora do HTML.

## Migration Plan

1. Alinhar as dependências com Angular 21 e configurar Jest/Jest-Angular no frontend.
2. Mover `frontend/` para `apps/frontend/`, mover `api/` para `apps/api/` e atualizar todos os caminhos de projeto, TypeScript, build, serve, proxy e testes sem mudar os nomes Nx.
3. Validar os projetos existentes antes de adicionar o fluxo CFP.
4. Implementar contrato/validação do backend e testes HTTP 400.
5. Implementar serviço e componente standalone com Signals e WAI-ARIA, seguido dos testes Jest do componente.
6. Executar testes unitários, builds do workspace e, por fim, a validação OpenSpec.

Rollback antes da publicação consiste em reverter a migração dos diretórios, versões e dependências. Como não haverá migração de dados nem banco nesta mudança, rollback da funcionalidade não exige transformação de dados.

## Open Questions

Nenhuma. A geração de `id` no cliente e a ausência de persistência são decisões da primeira versão descrita e não alteram a forma de `SpeakerDTO`.
