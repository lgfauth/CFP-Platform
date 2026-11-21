# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Navegação entre formulário e dashboard
**Reason**: O formulário de palestra deixa de ser a rota padrão. O Dashboard passa a ser a entrada em `/` e a aplicação ganha um menu principal com três páginas, então a navegação deixa de ser uma questão do dashboard e passa a ser da aplicação inteira.
**Migration**: Os comportamentos equivalentes ficam na capability `app-navigation`:
- Dashboard em `/` e redirecionamento de `/dashboard` para `/` ("Dashboard é a entrada padrão");
- formulário de palestra em `/palestras/nova` ("Cada página tem uma URL própria");
- ações contextuais entre formulário e dashboard ("Ações contextuais entre dashboard e formulário de palestra");
- menu comum ("Menu principal comum a todas as páginas").

Links salvos para `/` agora abrem o Dashboard, e não mais o formulário.
