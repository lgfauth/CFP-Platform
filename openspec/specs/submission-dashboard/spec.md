# submission-dashboard Specification

## Purpose

Torna visíveis as propostas submetidas ao Call for Papers, expondo as submissões aceitas pela API e apresentando-as em um dashboard acessível que compartilha a identidade visual do formulário.

## Requirements

### Requirement: API lista as submissões aceitas
O sistema MUST oferecer `GET /api/speakers`, respondendo com sucesso e um array de `SpeakerDTO` que contém todas as submissões aceitas por `POST /api/speakers`, com os mesmos campos e valores enviados, na ordem em que foram aceitas.

#### Scenario: Nenhuma submissão aceita
- **WHEN** nenhuma submissão foi aceita desde o início da API
- **THEN** `GET /api/speakers` responde com sucesso e um array vazio

#### Scenario: Submissões aceitas são listadas em ordem
- **WHEN** duas submissões válidas são aceitas em sequência e em seguida `GET /api/speakers` é chamado
- **THEN** a resposta contém exatamente essas duas submissões, iguais aos payloads aceitos, na ordem de envio

### Requirement: Submissões rejeitadas não são listadas
O sistema MUST incluir na listagem somente submissões aceitas; uma submissão recusada pela validação não pode aparecer na resposta de `GET /api/speakers`.

#### Scenario: Submissão inválida não entra na lista
- **WHEN** um `POST /api/speakers` é respondido com HTTP 400 e em seguida `GET /api/speakers` é chamado
- **THEN** a resposta não contém o payload rejeitado

### Requirement: Retenção das submissões é volátil
O sistema MUST manter as submissões aceitas apenas durante a execução da API, sem persistência externa.

#### Scenario: Reinício da API
- **WHEN** a API é reiniciada após aceitar submissões
- **THEN** `GET /api/speakers` responde com um array vazio

### Requirement: Dashboard apresenta as palestras submetidas
O frontend MUST disponibilizar na rota `/dashboard` uma listagem das submissões obtidas de `GET /api/speakers`, em estrutura semântica (tabela com cabeçalhos ou lista de itens), exibindo para cada uma o título da palestra, o nome, o email e a indicação GDE em texto.

#### Scenario: Submissões disponíveis
- **WHEN** o dashboard é aberto e a API retorna submissões
- **THEN** cada submissão aparece como um item ou linha com título da palestra, nome, email e indicação GDE legível por tecnologias assistivas

#### Scenario: Indicação GDE sem depender de cor
- **WHEN** uma submissão tem `isGDE` verdadeiro e outra falso
- **THEN** a diferença entre elas é comunicada por texto, não apenas por cor ou ícone

### Requirement: Dashboard comunica o carregamento
O frontend MUST indicar, de forma perceptível por tecnologias assistivas, que a listagem está sendo carregada enquanto a solicitação estiver em andamento.

#### Scenario: Solicitação pendente
- **WHEN** o dashboard é aberto e a resposta de `GET /api/speakers` ainda não chegou
- **THEN** a área da listagem é marcada como ocupada e um texto de carregamento é anunciado

#### Scenario: Solicitação concluída
- **WHEN** a resposta de `GET /api/speakers` chega com sucesso ou falha
- **THEN** o indicador de carregamento é removido

### Requirement: Dashboard comunica a lista vazia
O frontend MUST apresentar uma mensagem explícita quando não houver submissões a listar, em vez de uma tabela ou lista vazia.

#### Scenario: API retorna array vazio
- **WHEN** `GET /api/speakers` responde com um array vazio
- **THEN** o dashboard exibe uma mensagem informando que ainda não há palestras submetidas

### Requirement: Dashboard comunica falhas de carregamento
O frontend MUST apresentar uma mensagem de erro acessível e estável quando a listagem não puder ser obtida, sem expor detalhes técnicos da resposta.

#### Scenario: Falha na solicitação
- **WHEN** `GET /api/speakers` falha
- **THEN** o dashboard anuncia uma mensagem de erro por região viva, sem depender apenas de cor, e não exibe dados parciais

### Requirement: Navegação entre formulário e dashboard
O frontend MUST manter o formulário de submissão na rota padrão e oferecer, no formulário, uma ação de navegação para o dashboard e, no dashboard, uma ação de retorno ao formulário, ambas operáveis por teclado e com rótulo textual.

#### Scenario: Do formulário para o dashboard
- **WHEN** o usuário aciona a navegação para o dashboard a partir do formulário
- **THEN** a rota `/dashboard` é exibida sem recarregar a aplicação

#### Scenario: Do dashboard para o formulário
- **WHEN** o usuário aciona a ação de retorno no dashboard
- **THEN** o formulário de submissão é exibido na rota padrão

#### Scenario: Acesso direto
- **WHEN** a aplicação é aberta diretamente em `/dashboard`
- **THEN** o dashboard é exibido

### Requirement: Identidade visual compartilhada e acessível
O frontend MUST aplicar ao formulário e ao dashboard a mesma paleta: cinza-escuro `#4D4E49`, terracota `#9B574A`, mostarda/areia `#CFB079` e cinza-claro `#CAC6C3`. Textos MUST ter contraste mínimo de 4.5:1, e bordas de controles e indicadores de foco de 3:1, em relação ao fundo.

#### Scenario: Consistência entre telas
- **WHEN** o formulário e o dashboard são exibidos
- **THEN** botões, ações de navegação, superfícies e textos equivalentes usam as mesmas cores da paleta

#### Scenario: Contraste de texto
- **WHEN** qualquer texto do formulário ou do dashboard é exibido sobre seu fundo
- **THEN** a razão de contraste entre eles é de pelo menos 4.5:1

#### Scenario: Estados sem depender de cor
- **WHEN** um estado de erro, sucesso, carregamento ou desabilitado é exibido
- **THEN** ele é comunicado também por texto ou atributo acessível, não apenas pela cor
