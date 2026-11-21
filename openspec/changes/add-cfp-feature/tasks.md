# Tasks

## 1. Migrar o workspace e preparar dependências

- [x] 1.1 Mover os aplicativos `frontend/` e `api/` para `apps/frontend/` e `apps/api/`, sem renomear os projetos Nx, e verificar com `nx show projects` que `frontend` e `api` continuam registrados.
- [x] 1.2 Atualizar `project.json`, configurações TypeScript, imports, proxy, caminhos de assets, saída e comandos relacionados aos novos diretórios, verificando que `rg` não encontre referências ativas aos caminhos antigos.
- [x] 1.3 Alinhar as dependências Angular à versão 21 e manter as versões dos pacotes `@angular/*` coerentes, verificando com `npm install` concluído sem conflitos e `npx nx build frontend`.
- [x] 1.4 Adicionar `class-validator`, `class-transformer`, `supertest` e tipos necessários ao workspace, verificando que o lockfile foi atualizado e `npm install` termina com sucesso.
- [x] 1.5 Configurar Jest e `jest-preset-angular` no frontend, substituir o alvo Vitest e ajustar `tsconfig.spec.json`, verificando que um teste Jest mínimo existente roda com `npx nx test frontend`.

## 2. Implementar a fronteira do backend

- [x] 2.1 Criar a classe de entrada do endpoint em `apps/api`, implementando `SpeakerDTO` importado de `@cfp-platform/shared-types` e decorando os cinco campos conforme as regras estritas, verificando que o type-check falha se o contrato compartilhado deixar de ser implementado.
- [x] 2.2 Configurar o `ValidationPipe` global em `apps/api` com `transform`, `whitelist` e `forbidNonWhitelisted` ativos, verificando que o comportamento é aplicado no bootstrap usado pelos testes HTTP.
- [x] 2.3 Criar controlador, serviço e registro no módulo NestJS para `POST /api/speakers`, usando `@Body()` tipado com a classe validada e confirmando por teste HTTP que um payload válido retorna sucesso e o mesmo `SpeakerDTO`.
- [x] 2.4 Adicionar teste Jest parametrizado para payloads sem cada campo obrigatório e verificar que todas as requisições recebem 400 e não alcançam o serviço.
- [x] 2.5 Adicionar testes Jest para email inválido, strings vazias, `id` com tipo incorreto, `isGDE` com tipo incorreto e propriedade desconhecida, verificando HTTP 400 em cada caso.
- [x] 2.6 Executar `npx nx test api` e `npx nx build api`, verificando que os testes HTTP, decoradores e build da aplicação passam.

## 3. Implementar o serviço Angular de submissão

- [x] 3.1 Habilitar `HttpClient` na configuração de `apps/frontend` e criar um serviço standalone que envie `SpeakerDTO` para `POST /api/speakers`, verificando por teste Jest a URL, método e tipo do payload enviado.
- [x] 3.2 Garantir que qualquer uso de `SpeakerDTO` no serviço e no componente importe o contrato de `@cfp-platform/shared-types`, verificando por compilação que não há interface duplicada na aplicação.
- [x] 3.3 Adicionar testes Jest do serviço para resposta bem-sucedida e erro HTTP, verificando que ambos os caminhos são propagados ao chamador sem transformação silenciosa.

## 4. Implementar o formulário acessível com Signals

- [x] 4.1 Substituir a tela de boas-vindas por um componente standalone em `apps/frontend` que mantenha `SpeakerDTO`, status e mensagens em Signals, verificando por build que ele é carregado pela aplicação sem `NgModule`.
- [x] 4.2 Implementar Signals derivados para validade, submissão em andamento e `canSubmit`, gerando o `id` apenas ao iniciar o envio e verificando que os valores iniciais permanecem sem proposta enviada e `canSubmit` falso.
- [x] 4.3 Implementar bloqueio por `disabled`, manter `isSubmitting` verdadeiro durante a requisição e liberar o formulário no sucesso ou erro, verificando por teste Jest que não ocorre segundo envio enquanto o primeiro está pendente.
- [x] 4.4 Criar os controles do formulário com `label`, `aria-invalid`, `aria-describedby`, região viva para feedback e `aria-busy`, verificando por testes do DOM que os atributos de acessibilidade existem nos estados aplicáveis.
- [x] 4.5 Exibir confirmação apenas após sucesso e erro acessível após falha, sem depender apenas de cor, verificando os dois estados por testes Jest do componente.
- [x] 4.6 Atualizar ou substituir o teste atual do componente raiz para verificar que as Signals começam no estado ocioso, o formulário está inicialmente inválido e o botão de envio está bloqueado.
- [x] 4.7 Adicionar testes Jest para habilitar o botão após preencher entradas válidas e desabilitá-lo novamente durante o envio, verificando as alterações diretamente no DOM.
- [x] 4.8 Executar `npx nx test frontend` e `npx nx build frontend`, verificando que o runner Jest, os testes de estado/acessibilidade e a aplicação Angular 21 passam.

## 5. Verificar a integração do CFP

- [x] 5.1 Executar `npx nx run-many --targets=test,build --projects=frontend,api,shared-types`, verificando que contrato, API e frontend compilam e seus testes passam em conjunto.
- [x] 5.2 Revisar todas as ocorrências de `SpeakerDTO`, `apps/frontend`, `apps/api` e os decorators do DTO, verificando que frontend e backend consomem o path alias compartilhado e que a validação não foi duplicada manualmente.
- [x] 5.3 Executar `openspec validate add-cfp-feature --strict`, verificando que os artefatos da mudança permanecem válidos após a implementação.

## Workflow follow-up

- Revisar o fluxo implementado e, quando aprovado, iniciar explicitamente o arquivamento OpenSpec.
- Após o arquivamento, verificar a especificação resultante e o status da mudança.
