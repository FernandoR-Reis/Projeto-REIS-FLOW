(function attachReisFlowMetrics(root, factory) {
  const metrics = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = metrics;
  } else {
    root.ReisFlowMetrics = metrics;
  }
})(typeof globalThis === 'object' ? globalThis : this, function createReisFlowMetrics() {
  const TIME_ZONE = 'America/Sao_Paulo';

  function normalizeStatus(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  function dateKeyInTimeZone(date, timeZone = TIME_ZONE) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${values.year}-${values.month}-${values.day}`;
  }

  function parseMoney(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const raw = String(value || '').trim().replace(/[^\d,.-]/g, '');
    if (!raw) return 0;
    const normalized = raw.includes(',')
      ? raw.replace(/\./g, '').replace(',', '.')
      : /^\d{1,3}(?:\.\d{3})+$/.test(raw)
        ? raw.replace(/\./g, '')
        : raw;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function roundMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function toDateKey(value) {
    if (value instanceof Date) return dateKeyInTimeZone(value);

    const raw = String(value || '').trim();
    const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

    if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
      const timestamp = new Date(raw);
      return dateKeyInTimeZone(timestamp);
    }

    const br = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (br) return `${br[3]}-${br[2]}-${br[1]}`;
    return '';
  }

  function todayInTimeZone(now = new Date(), timeZone = TIME_ZONE) {
    return dateKeyInTimeZone(now, timeZone);
  }

  function addDays(dateKey, days) {
    const normalized = toDateKey(dateKey);
    if (!normalized || !Number.isInteger(days)) return '';
    const [year, month, day] = normalized.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day + days));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  }

  function dayDifference(dateKey, referenceDateKey) {
    const date = toDateKey(dateKey);
    const reference = toDateKey(referenceDateKey);
    if (!date || !reference) return null;
    const toUtc = (key) => {
      const [year, month, day] = key.split('-').map(Number);
      return Date.UTC(year, month - 1, day);
    };
    return (toUtc(date) - toUtc(reference)) / 86400000;
  }

  function getPaymentState(item) {
    const status = normalizeStatus(item?.status);
    return status === 'recebido' || status === 'pago' ? 'quitado' : 'aberto';
  }

  function getPaidDateKey(item) {
    return toDateKey(item?.paidAt || item?.paid_at || '');
  }

  function getTemporalState(item, today = todayInTimeZone()) {
    if (getPaymentState(item) === 'quitado') return 'quitado';
    const dueDate = toDateKey(item?.vencimento || item?.venc || '');
    if (!dueDate) return 'sem_vencimento';
    const difference = dayDifference(dueDate, today);
    if (difference < 0) return 'vencido';
    if (difference === 0) return 'vence_hoje';
    return 'a_vencer';
  }

  function isDueWithinDays(item, today = todayInTimeZone(), inclusiveEndDays = 7) {
    if (getPaymentState(item) === 'quitado') return false;
    const dueDate = toDateKey(item?.vencimento || item?.venc || '');
    if (!dueDate) return false;
    const difference = dayDifference(dueDate, today);
    return difference !== null && difference >= 0 && difference <= inclusiveEndDays;
  }

  function calculateItemCost(items = []) {
    if (!Array.isArray(items)) throw new TypeError('Os itens do orçamento devem ser uma lista.');
    const total = items.reduce((sum, item) => {
      const quantity = Number(item?.quantity ?? item?.quantidade ?? 0);
      const unitPrice = parseMoney(item?.unitPrice ?? item?.valor_unitario ?? 0);
      if (!Number.isFinite(quantity) || quantity < 0 || unitPrice < 0) {
        throw new RangeError('Quantidade e custo unitário não podem ser negativos.');
      }
      return sum + roundMoney(quantity * unitPrice);
    }, 0);
    return roundMoney(total);
  }

  function getEffectiveBudgetStatus(status, validity, today = todayInTimeZone()) {
    const normalized = normalizeStatus(status);
    const validityDate = toDateKey(validity);
    if (normalized === 'cliente_pendente' && validityDate && dayDifference(validityDate, today) < 0) {
      return 'expirado';
    }
    return normalized;
  }

  function calculateBudget({ items = [], marginPercent = 0, discount = 0, displacement = 0 } = {}) {
    const margin = Number(marginPercent);
    const discountAmount = roundMoney(parseMoney(discount));
    const displacementAmount = roundMoney(parseMoney(displacement));
    if (!Number.isFinite(margin) || margin < 0 || margin >= 100) {
      throw new RangeError('A margem deve estar entre 0% e menos de 100%.');
    }
    if (discountAmount < 0 || displacementAmount < 0) {
      throw new RangeError('Desconto e deslocamento não podem ser negativos.');
    }

    const roundedItemCost = calculateItemCost(items);

    const netSale = roundMoney(margin === 0 ? roundedItemCost : roundedItemCost / (1 - margin / 100));
    const saleSubtotal = roundMoney(netSale - displacementAmount + discountAmount);
    if (saleSubtotal < 0 || netSale < 0) {
      throw new RangeError('Desconto e deslocamento não formam um valor de venda válido.');
    }

    const total = roundMoney(saleSubtotal + displacementAmount - discountAmount);
    const profit = roundMoney(total - roundedItemCost);
    const actualMarginPercent = total > 0 ? (profit / total) * 100 : 0;
    return {
      itemCost: roundedItemCost,
      saleSubtotal,
      discount: discountAmount,
      displacement: displacementAmount,
      total,
      profit,
      marginPercent: actualMarginPercent
    };
  }

  function deriveMargin(total, itemCost) {
    const sale = parseMoney(total);
    const cost = Number(itemCost);
    if (!Number.isFinite(cost) || cost <= 0 || sale <= 0) return null;
    return ((sale - cost) / sale) * 100;
  }

  function getRollingMonths(endMonth, count = 6) {
    const monthKey = String(endMonth || '').match(/^(\d{4})-(\d{2})$/);
    if (!monthKey || !Number.isInteger(count) || count < 1) return [];
    const end = new Date(Date.UTC(Number(monthKey[1]), Number(monthKey[2]) - 1, 1));
    return Array.from({ length: count }, (_, index) => {
      const date = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (count - index - 1), 1));
      const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
      return { key, year: date.getUTCFullYear(), month: date.getUTCMonth() };
    });
  }

  function aggregateWorkMetrics(works = []) {
    const list = Array.isArray(works) ? works : [];
    const delayed = list.filter((work) => normalizeStatus(work?.status) === 'atrasada').length;
    const active = list.filter((work) => ['andamento', 'aprovada'].includes(normalizeStatus(work?.status))).length;
    return { total: list.length, active, delayed };
  }

  function aggregateBudgetMetrics(budgets = [], today = todayInTimeZone()) {
    const effective = (Array.isArray(budgets) ? budgets : []).map((budget) => ({
      ...budget,
      effectiveStatus: getEffectiveBudgetStatus(budget?.status, budget?.validity || budget?.validade, today)
    }));
    const pending = effective.filter((budget) => budget.effectiveStatus === 'pendente');
    return {
      count: pending.length,
      total: pending.reduce((sum, budget) => sum + parseMoney(budget?.value ?? budget?.valor), 0),
      effective
    };
  }

  function aggregateFinanceMetrics(receivables = [], payables = [], today = todayInTimeZone(), month = today.slice(0, 7)) {
    const receiving = Array.isArray(receivables) ? receivables : [];
    const paying = Array.isArray(payables) ? payables : [];
    const openReceivables = receiving.filter((item) => getPaymentState(item) === 'aberto');
    const openPayables = paying.filter((item) => getPaymentState(item) === 'aberto');
    const sum = (items) => items.reduce((total, item) => total + parseMoney(item?.valor ?? item?.value), 0);
    const dueInWindow = (items) => items
      .filter((item) => isDueWithinDays(item, today, 7))
      .reduce((total, item) => total + parseMoney(item?.valor ?? item?.value), 0);
    const billedMonth = receiving
      .filter((item) => getPaymentState(item) === 'quitado' && getPaidDateKey(item).slice(0, 7) === month)
      .reduce((total, item) => total + parseMoney(item?.valor ?? item?.value), 0);

    return {
      totalReceber: sum(openReceivables),
      totalPagar: sum(openPayables),
      aReceberCount: openReceivables.length,
      pagar7dias: dueInWindow(paying),
      contasVencendo: dueInWindow([...receiving, ...paying]),
      faturadoMes: billedMonth,
      saldo: sum(openReceivables) - sum(openPayables)
    };
  }

  function aggregateMonthlyPaidFlows(receivables = [], payables = [], months = []) {
    const receiving = Array.isArray(receivables) ? receivables : [];
    const paying = Array.isArray(payables) ? payables : [];
    return (Array.isArray(months) ? months : []).map((month) => {
      const sumPaidInMonth = (items) => items
        .filter((item) => getPaymentState(item) === 'quitado' && getPaidDateKey(item).slice(0, 7) === month.key)
        .reduce((total, item) => total + parseMoney(item?.valor ?? item?.value), 0);
      return {
        ...month,
        receipts: sumPaidInMonth(receiving),
        payments: sumPaidInMonth(paying)
      };
    });
  }

  function aggregateWorkStatusCounts(works = [], statuses = []) {
    const list = Array.isArray(works) ? works : [];
    const keys = Array.isArray(statuses) ? statuses.map(normalizeStatus) : [];
    const counts = Object.fromEntries(keys.map((key) => [key, 0]));
    let other = 0;
    list.forEach((work) => {
      const status = normalizeStatus(work?.status);
      if (Object.prototype.hasOwnProperty.call(counts, status)) counts[status] += 1;
      else other += 1;
    });
    return { counts, other, total: list.length };
  }

  return {
    TIME_ZONE,
    addDays,
    aggregateBudgetMetrics,
    aggregateFinanceMetrics,
    aggregateMonthlyPaidFlows,
    aggregateWorkMetrics,
    aggregateWorkStatusCounts,
    calculateBudget,
    calculateItemCost,
    dayDifference,
    deriveMargin,
    getEffectiveBudgetStatus,
    getPaidDateKey,
    getPaymentState,
    getRollingMonths,
    getTemporalState,
    isDueWithinDays,
    normalizeStatus,
    parseMoney,
    roundMoney,
    toDateKey,
    todayInTimeZone
  };
});
