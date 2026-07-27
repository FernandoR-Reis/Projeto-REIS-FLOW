# Smoke test de release (dados e KPI)

Objetivo:
- validar rapidamente se o release esta seguro para subir

Quando rodar:
- antes de merge para branch de release
- imediatamente apos deploy em producao

## Bloco A - Banco e RLS

- [ ] executar supabase/tests/kpi_suite.sql com 100% passed
- [ ] executar supabase/tests/kpi_crud_reflex.sql com 100% passed
- [ ] confirmar funcoes de seguranca: app_user_role() e app_has_role(text[])
- [ ] confirmar trilha de auditoria ativa (audit_log + triggers)

## Bloco B - Fluxos criticos da aplicacao

- [ ] login com usuario valido
- [ ] dashboard abre sem erro de JS
- [ ] criar obra e validar reflexo nos cards do dashboard
- [ ] criar lancamento a receber e validar reflexo em KPI financeiro
- [ ] cadastrar item de estoque e validar KPI de estoque critico
- [ ] editar status de equipe e validar KPI equipes em campo

## Bloco C - Regressao visual minima

- [ ] cards dinamicos renderizados (sem valor hardcoded antigo)
- [ ] metadado de dashboard (registros analisados / atualizado em) presente
- [ ] tabela de fornecedores, estoque e equipes carrega sem fallback indevido

## Bloco D - Permissoes por perfil

- [ ] tecnico bloqueado para escrita em financeiro_pagar
- [ ] financeiro bloqueado para escrita em fornecedores
- [ ] admin com acesso de escrita em dominios permitidos

## Gate de aprovacao

Release aprovado somente com:
- 100% dos itens criticos acima em OK
- sem erro fatal no console durante fluxos criticos
