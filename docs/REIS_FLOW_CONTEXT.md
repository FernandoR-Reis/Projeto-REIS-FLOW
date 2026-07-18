# REIS FLOW - CONTEXTO TÉCNICO DO PROJETO

## 1. Visão Geral

O REIS FLOW é um sistema de gestão operacional desenvolvido para centralizar processos administrativos de empresas.

O objetivo do sistema é permitir o controle de:

- Obras
- Clientes
- Orçamentos
- Financeiro
- Equipes
- Estoque
- Indicadores operacionais

O projeto atualmente está em fase de protótipo funcional de front-end, com estrutura preparada para uma futura evolução para uma aplicação completa com backend, banco de dados e autenticação real.

---

# 2. Objetivo do Produto

Criar uma plataforma SaaS de gestão operacional onde empresas possam controlar suas operações em um único ambiente.

O sistema deve permitir:

- Cadastro de empresas.
- Cadastro de usuários.
- Controle de permissões.
- Gestão de obras.
- Gestão financeira.
- Controle de materiais.
- Controle de equipes.
- Dashboards gerenciais.

A arquitetura futura deve considerar múltiplas empresas utilizando o mesmo sistema (modelo multi-tenant).

---

# 3. Estado Atual do Projeto

## Status

Protótipo funcional.

## Ambiente atual

Frontend estático hospedado no GitHub Pages.

URL atual:

https://fernandor-reis.github.io/Projeto-REIS-FLOW/

---

# 4. Tecnologias Atuais

## Frontend

Tecnologias utilizadas:

- HTML5
- CSS3
- JavaScript Vanilla

Não utilizar frameworks atualmente.

Não migrar automaticamente para React, Vue ou Next.js.

Uma migração de tecnologia deve acontecer somente após análise técnica.

---

## Bibliotecas

Utilizadas atualmente:

- Google Fonts
- Tabler Icons

---

# 5. Estrutura Atual de Arquivos

Estrutura principal:

```
Projeto-REIS-FLOW/

index.html

assets/
│
├── css/
│   └── styles.css
│
└── js/
    ├── app-part1.js
    └── app-part2.js

docs/

README.md
```

---

# 6. Responsabilidade dos Arquivos

## index.html

Responsável por:

- Estrutura principal da aplicação.
- Containers das telas.
- Elementos HTML.
- Organização dos módulos.

---

## assets/css/styles.css

Responsável por:

- Layout.
- Responsividade.
- Componentes visuais.
- Temas.
- Animações.
- Estilos globais.

---

## assets/js/app-part1.js

Responsável atualmente por:

- Navegação.
- Dados principais.
- Obras.
- Clientes.
- Orçamentos.
- Controle das telas iniciais.

---

## assets/js/app-part2.js

Responsável atualmente por:

- Financeiro.
- Equipes.
- Estoque.
- Gráficos.
- Modais.
- Autenticação visual.

---

# 7. Módulos Existentes

## Login

Estado atual:

Interface visual.

Possui:

- Entrar.
- Cadastro.
- Recuperação de senha.

Ainda não possui:

- Autenticação real.
- Banco de usuários.
- Controle de sessão.

---

# Dashboard

Possui:

- Indicadores principais.
- Cards operacionais.
- Gráficos.
- Alertas.
- Clientes recentes.
- Status de obras.

Objetivo futuro:

Conectar com dados reais.

---

# Obras

Possui:

- Lista de obras.
- Visualização Kanban.
- Detalhamento individual.
- Etapas.
- Histórico.
- Galeria.
- Informações financeiras.

Futuro:

Persistência no banco.

---

# Orçamentos

Possui:

- Cadastro visual.
- Tabela.
- Preview.
- Cálculo de subtotal.
- Lucro.
- Total.

Futuro:

Gerar PDF real.
Salvar histórico.
Relacionar com clientes.

---

# Clientes

Possui:

- Cadastro visual.
- Listagem.
- Status.
- Informações financeiras.

---

# Financeiro

Possui:

- Contas a receber.
- Contas a pagar.
- Fluxo de caixa.
- Gráficos.

---

# Equipes

Possui:

- Cadastro visual de colaboradores.
- Funções.
- Diárias.
- Comissão.
- Alocação.

---

# Estoque

Possui:

- Lista de materiais.
- Controle visual de quantidade.
- Estoque mínimo.
- Alertas.

---

# 8. Diretrizes de Desenvolvimento

Sempre seguir:

## Antes de alterar código:

1. Analisar estrutura existente.
2. Entender impacto da alteração.
3. Preservar funcionalidades atuais.
4. Evitar quebra de layout.

---

## Código

Priorizar:

- Código simples.
- Organização.
- Reutilização.
- Performance.
- Fácil manutenção.

Evitar:

- Código duplicado.
- Soluções complexas sem necessidade.
- Dependências externas sem justificativa.

---

# 9. Futura Arquitetura

A evolução planejada:

## Backend

Possível utilização:

- Supabase.

Recursos:

- PostgreSQL.
- Authentication.
- Storage.
- APIs.
- Row Level Security.


---

# 10. Banco de Dados Futuro

Considerar entidades:

## Empresa

Representa a organização cliente.

Campos futuros:

- id
- nome
- dados gerais


---

## Usuário

Representa pessoas que acessam o sistema.

Possíveis perfis:

- Administrador.
- Gestor.
- Funcionário.
- Cliente.


---

## Obras

Relacionada à empresa e clientes.

---

## Clientes

Cadastro de clientes finais.

---

## Financeiro

Controle financeiro por empresa.

---

## Estoque

Controle de materiais.

---

# 11. Regras Importantes

Toda evolução futura deve considerar:

- Segurança dos dados.
- Separação por empresa.
- Controle de acesso.
- Histórico de alterações.
- Escalabilidade.

---

# 12. Processo de Desenvolvimento

Ao implementar uma nova funcionalidade:

Seguir:

1. Entender objetivo.
2. Avaliar impacto.
3. Planejar alteração.
4. Implementar.
5. Testar.
6. Validar integração com módulos existentes.

---

# 13. Papel do Desenvolvedor IA

O agente deve atuar como:

- Desenvolvedor Full Stack Senior.
- Tech Lead.
- Revisor de código.

Comportamento esperado:

- Ser objetivo.
- Evitar explicações longas.
- Priorizar execução.
- Manter arquitetura existente.
- Fazer perguntas apenas quando necessário.

---

# 14. Prioridade do Projeto

Ordem de evolução:

1. Melhorar protótipo atual.
2. Criar autenticação real.
3. Integrar banco de dados.
4. Criar usuários e permissões.
5. Transformar em SaaS completo.
