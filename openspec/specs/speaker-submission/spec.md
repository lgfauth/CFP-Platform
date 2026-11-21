# speaker-submission Specification

## Purpose

Define o comportamento observável necessário para que um palestrante prepare e envie uma proposta ao Call for Papers com contrato consistente, interação acessível e validação confiável.

## Requirements

### Requirement: Submissão usa o contrato compartilhado
O sistema MUST representar a submissão com os campos públicos do `SpeakerDTO`: `id`, `name`, `email`, `talkTitle` e `isGDE`, usando a definição exportada pela biblioteca `shared-types` tanto no frontend quanto no backend.

#### Scenario: Formulário compatível com o contrato
- **WHEN** o frontend prepara uma submissão válida
- **THEN** o payload enviado contém exatamente os campos públicos do `SpeakerDTO` com tipos compatíveis

#### Scenario: API compatível com o contrato
- **WHEN** a API recebe uma submissão válida
- **THEN** ela processa o payload como um `SpeakerDTO` sem duplicar uma representação incompatível do contrato

### Requirement: Campos de entrada são obrigatórios e tipados
O sistema MUST rejeitar submissões sem `id`, `name`, `email`, `talkTitle` ou `isGDE`, com o `email` em formato válido e os demais campos de texto não vazios.

#### Scenario: Campos obrigatórios ausentes
- **WHEN** um payload não contém um dos campos obrigatórios
- **THEN** a API responde HTTP 400 Bad Request com uma indicação de validação

#### Scenario: Tipo ou formato inválido
- **WHEN** um payload contém um email inválido, um booleano com tipo incorreto ou um texto vazio
- **THEN** a API responde HTTP 400 Bad Request sem processar a proposta

### Requirement: Propriedades extras não são aceitas
O sistema MUST rejeitar propriedades que não pertençam ao contrato público da submissão.

#### Scenario: Payload com propriedade desconhecida
- **WHEN** um payload válido também contém uma propriedade não reconhecida
- **THEN** a API responde HTTP 400 Bad Request

### Requirement: Envio é bloqueado quando indisponível
O frontend MUST manter a ação de envio desabilitada enquanto o estado do formulário for inválido ou uma submissão estiver em andamento.

#### Scenario: Estado inicial
- **WHEN** o formulário é aberto sem entrada válida do palestrante
- **THEN** o estado inicial representa nenhuma submissão em andamento e o botão de envio permanece desabilitado

#### Scenario: Formulário válido
- **WHEN** todos os campos obrigatórios se tornam válidos e nenhuma submissão está em andamento
- **THEN** o botão de envio é habilitado

#### Scenario: Submissão em andamento
- **WHEN** o usuário inicia uma submissão válida
- **THEN** o botão de envio permanece desabilitado até a conclusão ou falha da solicitação

### Requirement: Formulário oferece interação acessível
O sistema MUST oferecer controles rotulados, associação de mensagens de erro aos respectivos campos e anúncios de estado compreensíveis por tecnologias assistivas.

#### Scenario: Erro de campo
- **WHEN** um campo inválido apresenta uma mensagem de erro
- **THEN** a mensagem fica associada ao controle por WAI-ARIA e pode ser percebida por leitores de tela

#### Scenario: Resultado da submissão
- **WHEN** a submissão termina com sucesso ou falha
- **THEN** o resultado é anunciado de forma acessível sem depender apenas de cor ou indicação visual

### Requirement: Submissão válida recebe confirmação
O frontend MUST enviar uma submissão válida à API e apresentar confirmação somente após receber uma resposta bem-sucedida.

#### Scenario: Submissão aceita
- **WHEN** a API aceita o payload válido
- **THEN** a API responde com sucesso, o frontend encerra o estado de carregamento e apresenta uma confirmação

#### Scenario: Submissão rejeitada
- **WHEN** a API rejeita o payload ou a solicitação falha
- **THEN** o frontend encerra o estado de carregamento, apresenta o erro de forma acessível e permite correção e nova tentativa
