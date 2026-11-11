import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parseAmount, validateConversion, calculateConversion, formatMoney, formatDate,
} from '../src/utils/conversion.js';

const currencies = [{ code: 'USD' }, { code: 'BRL' }, { code: 'EUR' }];

test('aceita valores inteiros e decimais com vírgula ou ponto', () => {
  assert.equal(parseAmount('100').amount, 100);
  assert.equal(parseAmount('10,50').amount, 10.5);
  assert.equal(parseAmount('10.50').amount, 10.5);
});

test('não aceita valor vazio, zero, negativo e texto', () => {
  for (const input of ['', '0', '-3', 'abc', '1.000,50', '1,000.50', '1.000', '1,000']) {
    assert.ok(parseAmount(input).error, `Deveria recusar ${input}`);
  }
});

test('não aceita moedas iguais ou indisponíveis', () => {
  assert.ok(validateConversion('10', 'USD', 'USD', currencies).error);
  assert.ok(validateConversion('10', 'USD', 'XYZ', currencies).error);
  assert.ok(validateConversion('10', '', 'BRL', currencies).error);
});

test('permite moedas diferentes presentes na API', () => {
  assert.equal(validateConversion('10,50', 'USD', 'BRL', currencies).amount, 10.5);
});

test('multiplica valor pela taxa sem arredondar antes', () => {
  assert.equal(calculateConversion(100, 5.25), 525);
  assert.equal(calculateConversion(1.5, 2.5), 3.75);
  assert.throws(() => calculateConversion(0, 5.25));
});

test('formata valor monetário e data de referência', () => {
  assert.ok(formatMoney(100, 'BRL').includes('100'));
  assert.equal(formatDate('2026-11-11'), '11/11/2026');
});

test('respeita a precisão de moedas sem centavos e com três casas', () => {
  const jpy = formatMoney(1234.56, 'JPY');
  const kwd = formatMoney(1.23456, 'KWD');
  assert.match(jpy, /1\.235|1235/);
  assert.match(kwd, /1,235/);
});

test('impede entradas ambíguas, exponenciais e valores numéricos não finitos', () => {
  for (const value of ['1,234', '1.234', '1e3', 'Infinity', 'NaN', '10.000,50']) {
    assert.ok(parseAmount(value).error, value);
  }
  assert.ok(parseAmount('0,001').amount > 0);
});
