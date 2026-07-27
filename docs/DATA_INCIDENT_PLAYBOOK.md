# Playbook de incidentes de dados

Objetivo:
- padronizar resposta para incidentes de inconsistencia de KPI e dados

## Severidade

S1 (critico)
- KPI financeiro incorreto em producao com impacto de decisao
- dados sensiveis corrompidos ou indisponiveis

S2 (alto)
- divergencia de KPI sem perda de dados
- falha de escrita em modulo critico para parte dos usuarios

S3 (medio)
- anomalia pontual de visualizacao sem impacto sistemico

## Fluxo de resposta

1. Triage inicial (ate 15 min)
- identificar modulo impactado
- capturar horario, usuario, perfil e acao executada
- classificar severidade (S1/S2/S3)

2. Contencao
- pausar deploys em andamento
- se necessario, bloquear feature por flag operacional
- comunicar status inicial no canal do time

3. Diagnostico tecnico
- executar supabase/tests/kpi_suite.sql
- executar supabase/tests/kpi_crud_reflex.sql
- consultar trilha de auditoria:
  - tabela: public.audit_log
  - filtros: tabela, operacao, actor_id, created_at
- validar policies RLS e perfil do usuario afetado

4. Mitigacao
- corrigir regra SQL/JS causadora
- aplicar patch pequeno e verificavel
- rodar novamente suite KPI + smoke test

5. Encerramento
- registrar causa raiz
- registrar janela de impacto
- registrar acoes preventivas e dono

## Queries uteis

Ultimos eventos de auditoria por tabela:

select tabela, operacao, actor_id, created_at
from public.audit_log
where tabela in ('financeiro_receber','financeiro_pagar','obras','estoque_itens','fornecedores')
order by created_at desc
limit 100;

Eventos de um ator especifico:

select tabela, operacao, registro_id, created_at
from public.audit_log
where actor_id = '<USER_UUID>'::uuid
order by created_at desc
limit 100;

## Definicao de resolucao

Incidente resolvido somente quando:
- causa raiz identificada
- correcoes aplicadas
- suite de KPI 100% verde
- smoke de release 100% verde
- comunicacao final enviada ao time
