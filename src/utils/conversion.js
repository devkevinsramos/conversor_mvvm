export function parseAmount(text) {
  const value = String(text).trim();

  if (!value) {
    return { error: 'Digite um valor para converter.' };
  }

  if (!/^\d+(?:[.,]\d+)?$/.test(value)) {
    return { error: 'Digite um número válido, como 100 ou 10,50.' };
  }

  if (/^[1-9]\d{0,2}[.,]\d{3}$/.test(value)) {
    return { error: 'Não use separador de milhar. Ex.: digite 1000 ou 10,50.' };
  }

  const amount = Number(value.replace(',', '.'));
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: 'O valor deve ser maior que zero.' };
  }

  return { amount };
}

export function validateConversion(value, from, to, currencies) {
  const result = parseAmount(value);
  if (result.error) return result;

  if (!from || !to) {
    return { error: 'Selecione as duas moedas.' };
  }
  if (from === to) {
    return { error: 'Escolha moedas diferentes.' };
  }
  if (!currencies.some(item => item.code === from) ||
      !currencies.some(item => item.code === to)) {
    return { error: 'Selecione moedas da lista disponível.' };
  }
  return result;
}

export function calculateConversion(amount, rate) {
  const total = amount * rate;
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error('Não foi possível calcular esse valor.');
  }
  return total;
}

export function formatMoney(value, code) {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency', currency: code,
    }).format(value);
  } catch {
    return `${code} ${value.toFixed(2).replace('.', ',')}`;
  }
}

export function formatRate(value) {
  try {
    return new Intl.NumberFormat('pt-BR', { maximumSignificantDigits: 8 }).format(value);
  } catch {
    return String(value);
  }
}

export function formatDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return value || 'Não informada';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}
