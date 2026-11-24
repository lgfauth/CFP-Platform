# Spec Delta

## ADDED Requirements

### Requirement: Envio inválido de evento revela todos os erros
Quando o formulário de evento é submetido em estado inválido, por exemplo pela tecla Enter num campo, o frontend MUST NOT chamar a API. Em vez disso, MUST exibir a mensagem de erro de todos os campos inválidos, inclusive os que o usuário ainda não visitou, associadas aos respectivos controles.

#### Scenario: Submissão do formulário vazio
- **WHEN** o formulário de evento é submetido sem nenhum campo preenchido
- **THEN** Nome, Endereço e Data são marcados como inválidos e exibem "Informe o nome do evento.", "Informe o endereço do evento." e "Informe a data do evento.", sem nenhuma chamada à API

#### Scenario: Submissão com data que não é futura
- **WHEN** o formulário é submetido com nome e endereço preenchidos e uma data passada
- **THEN** só o campo Data exibe erro, com a mensagem "Escolha uma data a partir de amanhã.", e nenhuma chamada à API é feita
