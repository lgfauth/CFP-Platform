# Spec Delta

## Purpose

Define como a pessoa usuária se orienta e circula entre as páginas do frontend do Call for Papers: um menu principal comum, a página de entrada padrão, as URLs de cada página e os títulos do documento.

## ADDED Requirements

### Requirement: Dashboard é a entrada padrão
O frontend MUST exibir o Dashboard na rota raiz `/`. O caminho legado `/dashboard` e qualquer URL desconhecida MUST redirecionar para `/`.

#### Scenario: Abertura da aplicação
- **WHEN** a aplicação é aberta em `/`
- **THEN** o Dashboard é exibido

#### Scenario: URL legada do dashboard
- **WHEN** a aplicação é aberta diretamente em `/dashboard`
- **THEN** a URL passa a ser `/` e o Dashboard é exibido

#### Scenario: URL desconhecida
- **WHEN** a aplicação é aberta em uma URL que não corresponde a nenhuma página
- **THEN** a URL passa a ser `/` e o Dashboard é exibido

### Requirement: Cada página tem uma URL própria
O frontend MUST oferecer o formulário de submissão de palestra em `/palestras/nova` e o formulário de cadastro de evento em `/eventos/novo`. As duas páginas MUST poder ser abertas diretamente pela URL.

#### Scenario: Acesso direto ao formulário de palestra
- **WHEN** a aplicação é aberta diretamente em `/palestras/nova`
- **THEN** o formulário de submissão de palestra é exibido

#### Scenario: Acesso direto ao cadastro de evento
- **WHEN** a aplicação é aberta diretamente em `/eventos/novo`
- **THEN** o formulário de cadastro de evento é exibido

### Requirement: Menu principal comum a todas as páginas
O frontend MUST exibir em todas as páginas um único menu de navegação principal, identificado para tecnologias assistivas. O menu MUST ter links textuais para Dashboard, Enviar palestra e Cadastrar evento, operáveis por teclado, que trocam de página sem recarregar a aplicação.

#### Scenario: Menu presente em todas as páginas
- **WHEN** qualquer uma das páginas é exibida
- **THEN** o menu principal aparece com os três links rotulados, em uma landmark de navegação com nome acessível

#### Scenario: Navegação pelo menu
- **WHEN** o usuário aciona um link do menu
- **THEN** a página correspondente é exibida sem recarregar a aplicação

#### Scenario: Operação por teclado
- **WHEN** o usuário percorre o menu com Tab e aciona um link com Enter
- **THEN** cada link recebe foco visível e leva à página correspondente

### Requirement: Menu indica a página atual
O menu principal MUST marcar o link da página exibida com `aria-current="page"` e com um destaque visual que não dependa apenas de cor. Apenas um link MUST estar marcado por vez.

#### Scenario: Página atual marcada
- **WHEN** uma página é exibida
- **THEN** somente o link dessa página tem `aria-current="page"` e o destaque visual de página atual

#### Scenario: Dashboard não marcado em subpáginas
- **WHEN** o formulário de palestra ou o de evento é exibido
- **THEN** o link Dashboard não está marcado como página atual

### Requirement: Ações contextuais entre dashboard e formulário de palestra
O frontend MUST manter no formulário de palestra uma ação textual para ver as palestras submetidas, que leva a `/`, e no Dashboard uma ação textual para enviar uma nova proposta, que leva a `/palestras/nova`. As duas ações MUST trocar de página sem recarregar a aplicação.

#### Scenario: Do formulário para o dashboard
- **WHEN** o usuário aciona "Ver palestras submetidas" no formulário de palestra
- **THEN** o Dashboard é exibido em `/` sem recarregar a aplicação

#### Scenario: Do dashboard para o formulário
- **WHEN** o usuário aciona "Enviar nova proposta" no Dashboard
- **THEN** o formulário de palestra é exibido em `/palestras/nova` sem recarregar a aplicação

### Requirement: Título do documento reflete a página
O frontend MUST atualizar o título do documento a cada navegação: "Dashboard" no Dashboard, "Proponha sua palestra" no formulário de palestra e "Cadastre um evento" no cadastro de evento.

#### Scenario: Troca de página
- **WHEN** o usuário navega entre as três páginas
- **THEN** o título do documento passa a ser o título da página exibida
