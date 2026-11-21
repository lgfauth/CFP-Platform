# event-registration Specification

## Purpose

Permite cadastrar os eventos do Call for Papers, com nome, endereço e uma data futura, por meio de um contrato compartilhado, de uma API que valida e retém os eventos em memória e de um formulário acessível.

## Requirements

### Requirement: Evento usa o contrato compartilhado
O sistema MUST representar o evento com os campos públicos do `EventDTO`: `id`, `name`, `address` e `date`, todos do tipo string. `date` MUST estar no formato de data ISO `YYYY-MM-DD`, sem horário. O contrato MUST vir da biblioteca `shared-types` e ser usado tanto no frontend quanto no backend.

#### Scenario: Formulário compatível com o contrato
- **WHEN** o frontend prepara um cadastro válido
- **THEN** o payload enviado contém exatamente `id`, `name`, `address` e `date`, com `date` no formato `YYYY-MM-DD`

#### Scenario: API compatível com o contrato
- **WHEN** a API aceita um cadastro válido
- **THEN** ela responde com um `EventDTO` com os mesmos campos e valores recebidos

### Requirement: Campos do evento são obrigatórios
A API MUST rejeitar com HTTP 400 Bad Request, sem registrar o evento, um cadastro que não tenha `id`, `name`, `address` ou `date`, ou que tenha qualquer um deles com tipo diferente de string, vazio ou composto apenas de espaços.

#### Scenario: Campo ausente
- **WHEN** um payload não contém um dos campos `id`, `name`, `address` ou `date`
- **THEN** a API responde HTTP 400 com uma indicação de validação que menciona o campo

#### Scenario: Texto vazio ou em branco
- **WHEN** `name` ou `address` é vazio ou contém apenas espaços
- **THEN** a API responde HTTP 400 sem registrar o evento

#### Scenario: Tipo incorreto
- **WHEN** algum dos campos é enviado com tipo diferente de string
- **THEN** a API responde HTTP 400 sem registrar o evento

### Requirement: Data do evento deve ser futura
O sistema MUST aceitar somente datas de calendário válidas no formato `YYYY-MM-DD` e posteriores ao dia corrente. A data de hoje e qualquer data passada MUST ser rejeitadas pela API com HTTP 400. "Hoje" é o dia do calendário local de quem valida: o servidor, na API, e o navegador, no frontend.

#### Scenario: Data de amanhã
- **WHEN** um cadastro é enviado com `date` igual ao dia seguinte ao dia corrente
- **THEN** a API aceita o evento

#### Scenario: Data de hoje
- **WHEN** um cadastro é enviado com `date` igual ao dia corrente
- **THEN** a API responde HTTP 400 sem registrar o evento

#### Scenario: Data passada
- **WHEN** um cadastro é enviado com `date` anterior ao dia corrente
- **THEN** a API responde HTTP 400 sem registrar o evento

#### Scenario: Formato ou data inválida
- **WHEN** `date` não segue `YYYY-MM-DD`, inclui horário ou não existe no calendário (por exemplo `2027-02-30`)
- **THEN** a API responde HTTP 400 sem registrar o evento

### Requirement: Propriedades extras do evento não são aceitas
A API MUST rejeitar com HTTP 400 um cadastro de evento que contenha propriedades fora do contrato público.

#### Scenario: Payload com propriedade desconhecida
- **WHEN** um payload de evento válido também contém uma propriedade não reconhecida
- **THEN** a API responde HTTP 400 sem registrar o evento

### Requirement: API lista os eventos cadastrados
O sistema MUST oferecer `GET /api/events`, que responde com sucesso e um array de `EventDTO` com todos os eventos aceitos por `POST /api/events`, na ordem de cadastro. Cadastros rejeitados MUST ficar fora da lista.

#### Scenario: Nenhum evento cadastrado
- **WHEN** nenhum evento foi aceito desde o início da API
- **THEN** `GET /api/events` responde com sucesso e um array vazio

#### Scenario: Eventos listados em ordem
- **WHEN** dois eventos válidos são aceitos em sequência e em seguida `GET /api/events` é chamado
- **THEN** a resposta contém exatamente esses dois eventos, iguais aos payloads aceitos e na ordem de envio

#### Scenario: Cadastro rejeitado não é listado
- **WHEN** um `POST /api/events` é respondido com HTTP 400 e em seguida `GET /api/events` é chamado
- **THEN** a resposta não contém o payload rejeitado

### Requirement: Retenção dos eventos é volátil
O sistema MUST manter os eventos aceitos apenas durante a execução da API, sem persistência externa e sem alterar as submissões de palestras.

#### Scenario: Reinício da API
- **WHEN** a API é reiniciada após aceitar eventos
- **THEN** `GET /api/events` responde com um array vazio

#### Scenario: Armazenamentos independentes
- **WHEN** um evento é cadastrado
- **THEN** `GET /api/speakers` continua retornando apenas as palestras submetidas

### Requirement: Formulário de evento exige todos os campos
O frontend MUST oferecer um formulário com os campos rotulados Nome, Endereço e Data, todos obrigatórios. Um campo vazio ou em branco MUST exibir, depois de o usuário sair dele, uma mensagem de erro específica.

#### Scenario: Campo deixado em branco
- **WHEN** o usuário sai do campo Nome, Endereço ou Data sem preenchê-lo
- **THEN** o campo é marcado como inválido e exibe uma mensagem indicando que ele é obrigatório

#### Scenario: Campos preenchidos com espaços
- **WHEN** Nome ou Endereço contém apenas espaços
- **THEN** o campo é tratado como vazio e o envio permanece bloqueado

### Requirement: Datepicker aceita somente datas futuras
O frontend MUST usar um seletor nativo de data cujo valor mínimo selecionável é o dia seguinte ao dia corrente do navegador. O formulário MUST tratar como inválida, com mensagem própria, qualquer data de hoje ou passada, inclusive quando digitada.

#### Scenario: Seletor limitado a datas futuras
- **WHEN** o formulário de evento é aberto
- **THEN** o seletor de data não permite escolher hoje nem datas anteriores

#### Scenario: Data não futura digitada
- **WHEN** o usuário informa a data de hoje ou uma data passada
- **THEN** o campo Data é marcado como inválido, exibe uma mensagem pedindo uma data futura e o envio permanece bloqueado

### Requirement: Envio do evento é bloqueado quando indisponível
O frontend MUST manter a ação de envio desabilitada enquanto algum campo for inválido ou um cadastro estiver em andamento.

#### Scenario: Estado inicial
- **WHEN** o formulário de evento é aberto
- **THEN** nenhum cadastro está em andamento e o botão de envio está desabilitado

#### Scenario: Formulário válido
- **WHEN** Nome e Endereço estão preenchidos, a Data é futura e nenhum cadastro está em andamento
- **THEN** o botão de envio é habilitado

#### Scenario: Cadastro em andamento
- **WHEN** o usuário envia um cadastro válido
- **THEN** o botão de envio permanece desabilitado e sinaliza o envio até a resposta ou falha da solicitação

### Requirement: Formulário de evento é acessível
O frontend MUST associar cada mensagem de erro ao seu campo por WAI-ARIA e anunciar o resultado do cadastro por região viva, sem depender apenas de cor.

#### Scenario: Erro de campo
- **WHEN** um campo do formulário de evento exibe uma mensagem de erro
- **THEN** o campo tem `aria-invalid="true"` e referencia a mensagem por `aria-describedby`

#### Scenario: Resultado do cadastro
- **WHEN** o cadastro termina com sucesso ou com falha
- **THEN** uma mensagem textual é anunciada por região viva (status no sucesso, alerta na falha)

### Requirement: Cadastro de evento válido recebe confirmação
O frontend MUST enviar o cadastro válido para `POST /api/events`, com textos sem espaços nas extremidades e um `id` novo a cada envio. A confirmação MUST aparecer somente após uma resposta bem-sucedida.

#### Scenario: Cadastro aceito
- **WHEN** a API aceita o evento
- **THEN** o frontend encerra o estado de envio e apresenta uma mensagem de confirmação

#### Scenario: Cadastro rejeitado
- **WHEN** a API rejeita o evento ou a solicitação falha
- **THEN** o frontend encerra o estado de envio, apresenta uma mensagem de erro sem detalhes técnicos e permite corrigir e tentar novamente
