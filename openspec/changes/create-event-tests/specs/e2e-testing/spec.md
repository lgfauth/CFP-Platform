# Spec Delta

## Purpose

Define o conjunto de testes E2E do frontend do Call for Papers: como ele é executado no navegador contra a aplicação e a API reais e quais fluxos de cadastro precisam estar cobertos, no envio bem-sucedido e na validação.

## ADDED Requirements

### Requirement: Testes E2E rodam com Cypress no projeto frontend-e2e
O workspace MUST executar os testes E2E do frontend com Cypress, no projeto Nx `frontend-e2e`, pelo target `e2e`. O projeto MUST manter esse nome e a dependência implícita do `frontend`. Nenhum outro executor E2E MUST disputar esse target.

#### Scenario: Execução pelo target padrão
- **WHEN** alguém executa `nx e2e frontend-e2e`
- **THEN** os specs Cypress do projeto rodam e o resultado de cada teste é reportado

#### Scenario: Sem configuração de outro executor
- **WHEN** o projeto `frontend-e2e` é inspecionado
- **THEN** ele não contém configuração nem specs de outro executor E2E

### Requirement: Testes rodam contra o frontend e a API reais
A execução E2E MUST iniciar, ou reaproveitar se já estiver no ar, o frontend em modo de desenvolvimento, com as chamadas a `/api` encaminhadas para a API em execução. Os fluxos de cadastro MUST usar a rede real, sem respostas simuladas.

#### Scenario: Servidores ainda não iniciados
- **WHEN** a execução E2E começa e nem o frontend nem a API estão no ar
- **THEN** os dois são iniciados antes do primeiro teste, e os cadastros chegam à API

#### Scenario: Servidor já iniciado
- **WHEN** a execução E2E começa e o frontend já está disponível na porta 4200
- **THEN** os testes usam a instância existente

### Requirement: Testes usam apenas a sintaxe tradicional do Cypress
Os specs E2E MUST usar somente os comandos e asserções nativos do Cypress, como `cy.visit`, `cy.get`, `cy.contains`, `.type`, `.click`, `.submit` e `.should`. Eles MUST localizar elementos por seletores CSS convencionais (`id`, `name` ou `class`) ou por texto visível. Eles MUST NOT depender de bibliotecas de terceiros de seletores, de comandos ou de IA.

#### Scenario: Dependências dos specs
- **WHEN** os specs E2E e seus arquivos de suporte são inspecionados
- **THEN** eles só importam o próprio Cypress e código local do projeto

### Requirement: Cadastro de palestra é coberto de ponta a ponta
Os testes MUST preencher todos os campos obrigatórios do formulário em `/palestras/nova` com dados únicos da execução, enviá-lo e conferir a mensagem de sucesso. Em seguida, MUST conferir que a palestra aparece no Dashboard, na seção "Palestras submetidas".

#### Scenario: Palestra cadastrada aparece no Dashboard
- **WHEN** o teste envia uma palestra válida com título, nome e email únicos e depois abre o Dashboard
- **THEN** a mensagem "Proposta enviada com sucesso. Obrigado por contribuir!" foi exibida e uma linha da tabela de palestras contém esse título, esse nome e esse email

#### Scenario: Registro anterior não produz falso positivo
- **WHEN** a API ainda guarda palestras de execuções anteriores
- **THEN** o teste só passa se encontrar no Dashboard os valores únicos gerados nesta execução

### Requirement: Cadastro de evento é coberto de ponta a ponta
Os testes MUST preencher nome, endereço e uma data futura no formulário em `/eventos/novo`, com dados únicos da execução, enviá-lo e conferir a mensagem de sucesso. Em seguida, MUST conferir que o evento aparece no Dashboard, na seção "Eventos cadastrados", com a data no formato `DD/MM/AAAA`.

#### Scenario: Evento cadastrado aparece no Dashboard
- **WHEN** o teste envia um evento válido com nome e endereço únicos e uma data futura, e depois abre o Dashboard
- **THEN** a mensagem "Evento cadastrado com sucesso." foi exibida e uma linha da tabela de eventos contém esse nome, esse endereço e a data em `DD/MM/AAAA`

### Requirement: Mensagens de validação da palestra são cobertas
Os testes MUST submeter o formulário de palestra vazio e conferir a mensagem de cada campo obrigatório. Depois, MUST preencher um campo por vez, submetendo de novo a cada passo, até cobrir todas as mensagens, inclusive a de email inválido. A cada passo, só os campos ainda inválidos MUST exibir mensagem.

#### Scenario: Formulário vazio
- **WHEN** o formulário de palestra é submetido sem nenhum campo preenchido
- **THEN** são exibidas "Informe seu nome.", "Informe seu email." e "Informe o título da palestra.", e o botão de envio está desabilitado

#### Scenario: Preenchimento progressivo
- **WHEN** o nome é preenchido e o formulário é submetido; depois um email sem formato válido; depois um email válido
- **THEN** a mensagem do nome some no primeiro passo; no segundo, aparece "Informe um email válido."; no terceiro, resta apenas "Informe o título da palestra."

#### Scenario: Nada é enviado enquanto inválido
- **WHEN** qualquer uma dessas submissões inválidas acontece
- **THEN** nenhuma mensagem de sucesso aparece e a palestra não é cadastrada

### Requirement: Mensagens de validação do evento são cobertas
Os testes MUST submeter o formulário de evento vazio e conferir a mensagem de cada campo obrigatório. Depois, MUST preencher um campo por vez, submetendo de novo a cada passo, até cobrir todas as mensagens, inclusive a de data que não é futura. A cada passo, só os campos ainda inválidos MUST exibir mensagem.

#### Scenario: Formulário vazio
- **WHEN** o formulário de evento é submetido sem nenhum campo preenchido
- **THEN** são exibidas "Informe o nome do evento.", "Informe o endereço do evento." e "Informe a data do evento.", e o botão de envio está desabilitado

#### Scenario: Preenchimento progressivo
- **WHEN** o nome é preenchido e o formulário é submetido; depois o endereço; depois uma data passada
- **THEN** cada mensagem de campo preenchido some no passo correspondente, e no último passo aparece "Escolha uma data a partir de amanhã."

#### Scenario: Nada é enviado enquanto inválido
- **WHEN** qualquer uma dessas submissões inválidas acontece
- **THEN** nenhuma mensagem de sucesso aparece e o evento não é cadastrado
