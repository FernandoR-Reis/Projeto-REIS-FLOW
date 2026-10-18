const test = require('node:test');
const assert = require('node:assert/strict');
const metrics = require('../assets/js/metrics.js');

test('budget calculation derives the net sale for a target margin after adjustments', () => {
  const result = metrics.calculateBudget({
    items: [
      { quantity: 200, unitPrice: 2.4 },
      { quantity: 2, unitPrice: 380 },
      { quantity: 1, unitPrice: 12800 }
    ],
    marginPercent: 32,
    discount: 2000,
    displacement: 400
  });

  assert.equal(result.itemCost, 14040);
  assert.ok(Math.abs(result.total - result.itemCost / 0.68) <= 0.01);
  assert.ok(Math.abs(result.profit - (result.total - result.itemCost)) <= 0.01);
  assert.ok(Math.abs(result.marginPercent - 32) <= 0.01);
  assert.ok(Math.abs(result.saleSubtotal + result.displacement - result.discount - result.total) <= 0.01);
});

test('budget calculation rejects invalid margin and negative adjustments', () => {
  assert.throws(() => metrics.calculateBudget({ marginPercent: 100 }), RangeError);
  assert.throws(() => metrics.calculateBudget({ marginPercent: -1 }), RangeError);
  assert.throws(() => metrics.calculateBudget({ discount: -1 }), RangeError);
});

test('budget item costs round each line to cents across calculation surfaces', () => {
  const items = [
    { quantidade: 1, valor_unitario: 0.335 },
    { quantity: 1, unitPrice: 0.335 }
  ];
  assert.equal(metrics.calculateItemCost(items), 0.68);
  assert.equal(metrics.calculateBudget({ items, marginPercent: 0 }).itemCost, 0.68);
});

test('money parser handles Brazilian currency with and without cents', () => {
  assert.equal(metrics.parseMoney('R$ 48.150'), 48150);
  assert.equal(metrics.parseMoney('R$ 48.150,75'), 48150.75);
});

test('legacy budget margin is derived from stored sale and linked item costs', () => {
  assert.equal(metrics.deriveMargin(48150, 26750), (21400 / 48150) * 100);
  assert.equal(metrics.deriveMargin(0, 26750), null);
  assert.equal(metrics.deriveMargin(48150, null), null);
});

test('financial due window includes today and the seventh day, but excludes overdue and paid items', () => {
  const today = '2026-10-08';
  assert.equal(metrics.isDueWithinDays({ vencimento: today, status: 'pendente' }, today), true);
  assert.equal(metrics.isDueWithinDays({ vencimento: '2026-10-15', status: 'futuro' }, today), true);
  assert.equal(metrics.isDueWithinDays({ vencimento: '2026-10-16', status: 'futuro' }, today), false);
  assert.equal(metrics.isDueWithinDays({ vencimento: '2026-10-07', status: 'pendente' }, today), false);
  assert.equal(metrics.isDueWithinDays({ vencimento: '2026-10-10', status: 'pago' }, today), false);
});

test('payment and temporal states remain separate and date-only values are timezone-stable', () => {
  const today = '2026-10-08';
  assert.equal(metrics.getPaymentState({ status: 'pendente' }), 'aberto');
  assert.equal(metrics.getTemporalState({ vencimento: '2026-10-07', status: 'pendente' }, today), 'vencido');
  assert.equal(metrics.getTemporalState({ vencimento: '2026-10-08', status: 'pendente' }, today), 'vence_hoje');
  assert.equal(metrics.getTemporalState({ vencimento: '2026-10-09', status: 'pendente' }, today), 'a_vencer');
  assert.equal(metrics.getTemporalState({ vencimento: '2026-10-07', status: 'recebido' }, today), 'quitado');
  assert.equal(metrics.todayInTimeZone(new Date('2026-10-08T02:59:00Z')), '2026-10-07');
  assert.equal(metrics.getPaidDateKey({ paid_at: '2026-10-08T02:59:00Z' }), '2026-10-07');
});

test('only sent, client-pending budgets expire after validity', () => {
  const today = '2026-10-08';
  assert.equal(metrics.getEffectiveBudgetStatus('cliente_pendente', '2026-10-07', today), 'expirado');
  assert.equal(metrics.getEffectiveBudgetStatus('cliente_pendente', '2026-10-08', today), 'cliente_pendente');
  assert.equal(metrics.getEffectiveBudgetStatus('aprovado', '2025-01-01', today), 'aprovado');
  assert.equal(metrics.getEffectiveBudgetStatus('dados_incompletos', '2025-01-01', today), 'dados_incompletos');
  assert.equal(metrics.getEffectiveBudgetStatus('pendente', '2025-01-01', today), 'pendente');
});

test('six-month dashboard range ends with the selected month and crosses year boundaries', () => {
  assert.deepEqual(metrics.getRollingMonths('2026-10').map((month) => month.key), [
    '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'
  ]);
  assert.deepEqual(metrics.getRollingMonths('2025-02').map((month) => month.key), [
    '2024-09', '2024-10', '2024-11', '2024-12', '2025-01', '2025-02'
  ]);
});

test('work and budget aggregates use shared canonical status rules', () => {
  assert.deepEqual(metrics.aggregateWorkMetrics([
    { status: 'andamento' },
    { status: 'aprovada' },
    { status: 'atrasada' }
  ]), { total: 3, active: 2, delayed: 1 });

  const budgetMetrics = metrics.aggregateBudgetMetrics([
    { status: 'cliente_pendente', validade: '2026-10-07', valor: 'R$ 100,00' },
    { status: 'pendente', validade: '2026-10-09', valor: 'R$ 250,00' },
    { status: 'aprovado', validade: '2026-10-09', valor: 'R$ 500,00' }
  ], '2026-10-08');
  assert.equal(budgetMetrics.count, 1);
  assert.equal(budgetMetrics.total, 250);
  assert.deepEqual(budgetMetrics.effective.map((item) => item.effectiveStatus), ['expirado', 'pendente', 'aprovado']);
});

test('finance aggregates use one due window and paid dates rather than creation dates', () => {
  const result = metrics.aggregateFinanceMetrics(
    [
      { status: 'pendente', vencimento: '2026-10-08', valor: 'R$ 100,00' },
      { status: 'recebido', vencimento: '2026-10-09', paidAt: '2026-10-08T15:00:00Z', valor: 'R$ 50,00' }
    ],
    [
      { status: 'futuro', vencimento: '2026-10-15', valor: 'R$ 75,00' },
      { status: 'pendente', vencimento: '2026-10-07', valor: 'R$ 200,00' }
    ],
    '2026-10-08',
    '2026-10'
  );
  assert.equal(result.totalReceber, 100);
  assert.equal(result.totalPagar, 275);
  assert.equal(result.aReceberCount, 1);
  assert.equal(result.pagar7dias, 75);
  assert.equal(result.contasVencendo, 175);
  assert.equal(result.faturadoMes, 50);
  assert.equal(result.saldo, -175);
});

test('dashboard monthly finance series uses paid dates for receipts and payments', () => {
  const result = metrics.aggregateMonthlyPaidFlows(
    [
      { status: 'recebido', paid_at: '2026-10-08', vencimento: '2026-09-30', valor: 450 },
      { status: 'pendente', paid_at: '2026-10-09', valor: 800 }
    ],
    [
      { status: 'pago', paid_at: '2026-10-02', vencimento: '2026-09-28', valor: 125 },
      { status: 'pendente', paid_at: '2026-10-03', valor: 300 }
    ],
    [{ key: '2026-09' }, { key: '2026-10' }]
  );

  assert.deepEqual(result.map(({ key, receipts, payments }) => ({ key, receipts, payments })), [
    { key: '2026-09', receipts: 0, payments: 0 },
    { key: '2026-10', receipts: 450, payments: 125 }
  ]);
});

test('dashboard work distribution accounts for every work, including unknown statuses', () => {
  const result = metrics.aggregateWorkStatusCounts(
    [
      { status: 'andamento' },
      { status: 'atrasada' },
      { status: 'novo-status' }
    ],
    ['andamento', 'atrasada', 'concluida']
  );

  assert.deepEqual(result, {
    counts: { andamento: 1, atrasada: 1, concluida: 0 },
    other: 1,
    total: 3
  });
});
