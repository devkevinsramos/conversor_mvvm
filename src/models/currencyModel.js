const API = 'https://api.frankfurter.dev/v2';

async function getJson(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(API + path, { signal: controller.signal });

    if (!response.ok) {
      if ([400, 404, 422].includes(response.status)) {
        throw new Error('Cotação não encontrada. Tente outra moeda.');
      }
      throw new Error('Não foi possível consultar a cotação. Tente novamente.');
    }

    try {
      return await response.json();
    } catch {
      throw new Error('A API enviou dados que não puderam ser lidos.');
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('A consulta demorou demais. Tente novamente.');
    }
    if (error instanceof TypeError || /network request failed|failed to fetch/i.test(error.message || '')) {
      throw new Error('Sem conexão com a API. Verifique sua internet.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function getCurrencies() {
  const data = await getJson('/currencies');

  if (!Array.isArray(data)) {
    throw new Error('Não foi possível carregar a lista de moedas.');
  }

  const currencies = data
    .filter(item => item && /^[A-Z]{3}$/.test(item.iso_code) && typeof item.name === 'string')
    .map(item => ({ code: item.iso_code, name: item.name }))
    .sort((a, b) => a.code.localeCompare(b.code));

  if (currencies.length < 2) {
    throw new Error('Não há moedas disponíveis no momento.');
  }

  return currencies;
}

export async function getRate(from, to) {
  const data = await getJson(`/rate/${from}/${to}`);

  if (!data || data.base !== from || data.quote !== to ||
      typeof data.rate !== 'number' || !Number.isFinite(data.rate) || data.rate <= 0 ||
      typeof data.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    throw new Error('A API não retornou uma taxa válida.');
  }

  return { rate: data.rate, date: data.date };
}
