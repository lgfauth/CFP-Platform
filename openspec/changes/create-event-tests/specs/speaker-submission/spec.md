# Spec Delta

## ADDED Requirements

### Requirement: Envio inválido de palestra revela todos os erros
Quando o formulário de palestra é submetido em estado inválido, por exemplo pela tecla Enter num campo, o frontend MUST NOT chamar a API. Em vez disso, MUST exibir a mensagem de erro de todos os campos inválidos, inclusive os que o usuário ainda não visitou, associadas aos respectivos controles.

#### Scenario: Submissão do formulário vazio
- **WHEN** o formulário de palestra é submetido sem nenhum campo preenchido
- **THEN** Nome, Email e Título da palestra são marcados como inválidos e exibem "Informe seu nome.", "Informe seu email." e "Informe o título da palestra.", sem nenhuma chamada à API

#### Scenario: Submissão com parte dos campos válida
- **WHEN** o formulário é submetido com o nome preenchido e o email em formato inválido
- **THEN** o Nome não exibe erro, o Email exibe "Informe um email válido.", o Título da palestra exibe "Informe o título da palestra." e nenhuma chamada à API é feita
