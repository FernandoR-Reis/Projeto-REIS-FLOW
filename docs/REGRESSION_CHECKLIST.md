# Checklist de Regressao por Modulo

Objetivo:
- validar cada entrega incremental sem quebrar fluxo existente

Como usar:
- executar em localhost e, quando aplicavel, em producao
- registrar resultado por item: OK | FALHOU | NA

---

## 1) Auth

- [ ] Login com e-mail/senha abre app e popula perfil
- [ ] Cadastro cria conta sem falso sucesso
- [ ] Recuperacao de senha redireciona para reset e atualiza senha
- [ ] Logout encerra sessao e volta para login

## 2) Navegacao e permissoes

- [ ] Sidebar respeita visibilidade por perfil
- [ ] Rotas dashboard/clientes/orcamentos/obras/financeiro/equipes/estoque/fornecedores funcionam
- [ ] Refresh da view atual recarrega dados sem erro

## 3) Obras

- [ ] Lista de obras carrega do banco
- [ ] Kanban abre sem erro e respeita status
- [ ] Detalhe da obra abre com dados corretos
- [ ] Etapas e historico sincronizam (ou entram em fallback controlado)

## 4) Orcamentos

- [ ] Listagem carrega do banco
- [ ] Criar orcamento persiste e reaparece apos reload
- [ ] Itens do orcamento persistem corretamente
- [ ] Filtros por status funcionam

## 5) Clientes

- [ ] Listagem carrega do banco
- [ ] Criar/editar cliente persiste e reaparece apos reload
- [ ] Modal de detalhe abre com KPIs sem quebrar UI

## 6) Financeiro

- [ ] Lancamento a receber persiste e aparece na tabela
- [ ] Lancamento a pagar persiste e aparece na tabela
- [ ] Troca de status (pendente/quitado etc.) funciona
- [ ] Cards financeiros atualizam apos alteracoes

## 7) Equipes

- [ ] Criar/editar membro funciona
- [ ] Filtros de area/funcao/status funcionam
- [ ] Card de detalhe abre sem erro
- [ ] Dados persistem conforme estrategia atual da sprint

## 8) Estoque

- [ ] Cadastrar novo item funciona
- [ ] Registrar entrada altera quantidade
- [ ] Editar item atualiza custo/minimo/fornecedor
- [ ] Indicador de estoque critico atualiza corretamente

## 9) Fornecedores

- [ ] Criar fornecedor com validacoes obrigatorias
- [ ] Mascara de telefone/CNPJ funcionando
- [ ] Editar/inativar/ativar funcionando
- [ ] Datalist de fornecedores alimenta formularios de estoque

## 10) Dashboard

- [ ] Cards dinamicos de Equipes e Estoque atualizam apos mudancas
- [ ] Nao ha erro JS ao abrir dashboard
- [ ] Grafico renderiza
- [ ] Sem inconsistencias visuais apos refresh

---

## Criterio minimo para merge de sprint

- sem erro fatal de console nos fluxos criticos
- persistencia coerente com objetivo da sprint
- checklist com 100% de itens criticos (Auth, CRUD, Dashboard base) em OK
