# REIS FLOW

Sistema front-end de gestão operacional para obras, clientes, orçamentos, financeiro, equipes e estoque.

## Acesso online (domínio provisório)

- Produção (GitHub Pages): https://reisflow-provisorio.github.io/Projeto-REIS-FLOW/
- Status esperado: a página deve ficar disponível após o workflow de deploy ser executado com sucesso.

## Sobre o projeto

O **REIS FLOW** é um painel administrativo construído com **HTML**, **CSS** e **JavaScript puro**, com foco em apresentar uma experiência moderna para controle operacional.

A aplicação possui:

- tela de login, cadastro e recuperação de acesso
- dashboard com indicadores principais
- gestão de obras em lista e kanban
- detalhamento individual de obra
- módulo de orçamentos com preview
- cadastro e listagem de clientes
- módulo financeiro com contas a receber, a pagar e fluxo de caixa
- gestão de equipes
- controle de estoque
- modais de cadastro rápido
- layout responsivo

## Estrutura do projeto

- [index.html](index.html) — estrutura principal da aplicação
- [assets/css/styles.css](assets/css/styles.css) — estilos globais e componentes visuais
- [assets/js/app-part1.js](assets/js/app-part1.js) — navegação, dados principais, obras, clientes e orçamentos
- [assets/js/app-part2.js](assets/js/app-part2.js) — financeiro, equipes, estoque, gráficos, modais e autenticação visual

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript Vanilla
- Google Fonts
- Tabler Icons

## Funcionalidades atuais

### Login
- aba de entrar
- aba de cadastro
- aba de recuperação de senha

### Dashboard
- cards com indicadores operacionais
- alertas rápidos
- gráfico de faturamento
- progresso de status das obras
- tarefas pendentes
- tabela de clientes recentes

### Obras
- listagem em tabela
- visualização em kanban
- tela de detalhe da obra
- etapas, histórico, galeria e financeiro da obra

### Orçamentos
- tabela de orçamentos
- preview detalhado
- construtor visual com cálculo de subtotal, lucro e total

### Clientes
- listagem com status e total faturado

### Financeiro
- contas a receber
- contas a pagar
- fluxo de caixa com gráfico SVG

### Equipes
- cards dos membros com função, diária, comissão e alocação

### Estoque
- listagem de materiais
- alerta de itens abaixo do mínimo
- indicador visual de nível de estoque

## Como executar localmente

### Opção recomendada

Com Python instalado, execute na raiz do projeto:

```bash
python -m http.server 8000
```

Depois abra no navegador:

```text
http://localhost:8000/index.html
```

## Objetivo

Este projeto pode ser usado como:

- protótipo de sistema administrativo
- base para integração futura com backend
- referência de UI para dashboard operacional
- ponto de partida para migração para React, Vue ou outro framework

## Melhorias futuras

- autenticação real
- integração com API
- persistência em banco de dados
- upload real de arquivos e imagens
- geração real de PDF
- filtros funcionais
- busca dinâmica
- permissões por perfil de usuário
- domínio personalizado (quando o domínio final estiver definido)

## Status do projeto

Protótipo funcional de front-end com deploy ativo no GitHub Pages.

## Licença

Uso privado, salvo definição posterior.
