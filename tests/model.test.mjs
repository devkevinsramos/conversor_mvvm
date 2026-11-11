import assert from 'node:assert/strict';
import test from 'node:test';
import { getCurrencies, getRate } from '../src/models/currencyModel.js';

test('busca lista de moedas na API e ordena os códigos', async t => {
  t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(url, 'https://api.frankfurter.dev/v2/currencies');
    return {
      ok: true,
      json: async () => [
        { iso_code: 'USD', name: 'US Dollar' },
        { iso_code: 'BRL', name: 'Brazilian Real' },
        { iso_code: 'EUR', name: 'Euro' },
      ],
    };
  });
  const currencies = await getCurrencies();
  assert.deepEqual(currencies.map(item => item.code), ['BRL', 'EUR', 'USD']);
});

test('consulta a taxa na ordem correta e mantém a data da API', async t => {
  t.mock.method(globalThis, 'fetch', async url => {
    assert.equal(url, 'https://api.frankfurter.dev/v2/rate/USD/BRL');
    return {
      ok: true,
      json: async () => ({ base: 'USD', quote: 'BRL', rate: 5.25, date: '2026-11-10' }),
    };
  });
  assert.deepEqual(await getRate('USD', 'BRL'), { rate: 5.25, date: '2026-11-10' });
});

test('informa falha quando a API retorna HTTP 422', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({ ok: false, status: 422 }));
  await assert.rejects(() => getRate('USD', 'ZZZ'), /Cotação não encontrada/);
});

test('rejeita respostas de taxa incompletas', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    json: async () => ({ base: 'USD', quote: 'BRL', rate: null, date: '2026-11-10' }),
  }));
  await assert.rejects(() => getRate('USD', 'BRL'), /taxa válida/);
});

test('ignora moedas inválidas recebidas da API', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({
    ok: true,
    json: async () => [
      { iso_code: 'USD', name: 'US Dollar' },
      { iso_code: 'BRL', name: 'Brazilian Real' },
      { iso_code: 'XXX', name: 100 },
      { iso_code: 'ABCD', name: 'Inválida' },
      null,
    ],
  }));
  assert.deepEqual((await getCurrencies()).map(item => item.code), ['BRL', 'USD']);
});

test('não aceita lista de moedas vazia ou incompatível', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => ({ USD: 'Dollar' }) }));
  await assert.rejects(() => getCurrencies(), /lista de moedas/);
});

test('não aceita taxa com moedas trocadas ou data ausente', async t => {
  const response = { base: 'BRL', quote: 'USD', rate: 5.25, date: '2026-11-10' };
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => response }));
  await assert.rejects(() => getRate('USD', 'BRL'), /taxa válida/);
  response.base = 'USD';
  response.quote = 'BRL';
  delete response.date;
  await assert.rejects(() => getRate('USD', 'BRL'), /taxa válida/);
});

test('distingue falha de rede de resposta inválida', async t => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => { throw new TypeError('Failed to fetch'); });
  await assert.rejects(() => getRate('USD', 'BRL'), /Sem conexão/);
  fetchMock.mock.restore();
  t.mock.method(globalThis, 'fetch', async () => ({ ok: true, json: async () => { throw new SyntaxError('invalid JSON'); } }));
  await assert.rejects(() => getRate('USD', 'BRL'), /não puderam ser lidos/);
});
