alter table public.orcamentos
  add column if not exists desconto numeric(14,2),
  add column if not exists deslocamento numeric(14,2);

alter table public.financeiro_receber
  add column if not exists paid_at timestamptz;

alter table public.financeiro_pagar
  add column if not exists paid_at timestamptz;

comment on column public.orcamentos.desconto is
  'Discount entered for this quote. NULL means the value was not recorded on a legacy quote.';

comment on column public.orcamentos.deslocamento is
  'Travel charge entered for this quote. NULL means the value was not recorded on a legacy quote.';

comment on column public.financeiro_receber.paid_at is
  'Settlement timestamp. Existing paid rows remain NULL when their historical settlement date is unknown.';

comment on column public.financeiro_pagar.paid_at is
  'Settlement timestamp. Existing paid rows remain NULL when their historical settlement date is unknown.';
