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

### Requirement: Identidade visual compartilhada e acessível
O frontend MUST aplicar a todas as páginas e ao menu principal a mesma paleta: cinza-escuro `#4D4E49`, terracota `#9B574A`, mostarda/areia `#CFB079` e cinza-claro `#CAC6C3`. As páginas são o Dashboard, o formulário de palestra e o cadastro de evento. Textos MUST ter contraste mínimo de 4.5:1, e bordas de controles e indicadores de foco de 3:1, em relação ao fundo.

#### Scenario: Consistência entre telas
- **WHEN** o Dashboard, o formulário de palestra, o cadastro de evento e o menu principal são exibidos
- **THEN** botões, ações de navegação, campos, superfícies e textos equivalentes usam as mesmas cores da paleta

#### Scenario: Contraste de texto
- **WHEN** qualquer texto de uma das páginas ou do menu é exibido sobre seu fundo
- **THEN** a razão de contraste entre eles é de pelo menos 4.5:1

#### Scenario: Estados sem depender de cor
- **WHEN** um estado de erro, sucesso, carregamento, desabilitado ou de página atual é exibido
- **THEN** ele é comunicado também por texto ou atributo acessível, não apenas pela cor

### Requirement: Dashboard apresenta os eventos cadastrados
O frontend MUST exibir no Dashboard, em uma seção "Eventos cadastrados" separada das palestras, os eventos obtidos de `GET /api/events`, na ordem recebida. A listagem MUST usar estrutura semântica (tabela com cabeçalhos ou lista de itens) e mostrar, para cada evento, nome, endereço e data.

#### Scenario: Eventos disponíveis
- **WHEN** o Dashboard é aberto e a API retorna eventos
- **THEN** cada evento aparece como uma linha ou item com nome, endereço e data, na ordem retornada pela API

#### Scenario: Seções identificadas
- **WHEN** o Dashboard é exibido
- **THEN** palestras e eventos ficam em seções distintas, cada uma com um título de seção ("Palestras submetidas" e "Eventos cadastrados") percebido por tecnologias assistivas

### Requirement: Data do evento exibida no formato brasileiro
O Dashboard MUST exibir a data de cada evento no formato `DD/MM/AAAA`, correspondente exatamente ao dia recebido em `YYYY-MM-DD`, sem deslocamento de fuso, e manter o valor ISO disponível de forma legível por máquina.

#### Scenario: Formatação da data
- **WHEN** a API retorna um evento com `date` igual a `2027-03-05`
- **THEN** o Dashboard exibe `05/03/2027` para esse evento, com o valor `2027-03-05` associado à data exibida

### Requirement: Seção de eventos comunica carregamento, lista vazia e falha
A seção de eventos MUST ter estados próprios, independentes da seção de palestras:
- um indicador de carregamento acessível enquanto `GET /api/events` estiver pendente;
- uma mensagem explícita quando não houver eventos;
- uma mensagem de erro acessível e sem detalhes técnicos quando a solicitação falhar.

#### Scenario: Solicitação pendente
- **WHEN** o Dashboard é aberto e a resposta de `GET /api/events` ainda não chegou
- **THEN** a área de eventos é marcada como ocupada e um texto de carregamento de eventos é anunciado

#### Scenario: Nenhum evento
- **WHEN** `GET /api/events` responde com um array vazio
- **THEN** a seção exibe uma mensagem informando que ainda não há eventos cadastrados

#### Scenario: Falha ao carregar eventos
- **WHEN** `GET /api/events` falha
- **THEN** a seção de eventos anuncia uma mensagem de erro por região viva, sem exibir dados parciais

#### Scenario: Falhas independentes
- **WHEN** `GET /api/events` falha e `GET /api/speakers` responde com sucesso
- **THEN** as palestras são exibidas normalmente e apenas a seção de eventos mostra o erro
