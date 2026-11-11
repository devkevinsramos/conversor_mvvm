import { useEffect, useRef, useState } from 'react';
import { getCurrencies, getRate } from '../models/currencyModel';
import { calculateConversion, validateConversion } from '../utils/conversion';

export default function useConverterViewModel() {
  const [amount, setAmount] = useState('100');
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('BRL');
  const [currencies, setCurrencies] = useState([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);
  const [currencyError, setCurrencyError] = useState('');
  const [loadingConversion, setLoadingConversion] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const conversionId = useRef(0);
  const currenciesId = useRef(0);
  const busy = useRef(false);
  const mounted = useRef(true);

  async function loadCurrencies() {
    const id = ++currenciesId.current;
    setLoadingCurrencies(true);
    setCurrencyError('');

    try {
      const list = await getCurrencies();
      if (!mounted.current || id !== currenciesId.current) return;

      const initialFrom = list.some(item => item.code === 'USD') ? 'USD' : list[0].code;
      const initialTo = list.some(item => item.code === 'BRL' && item.code !== initialFrom)
        ? 'BRL'
        : list.find(item => item.code !== initialFrom).code;

      setCurrencies(list);
      setFrom(initialFrom);
      setTo(initialTo);
    } catch (e) {
      if (!mounted.current || id !== currenciesId.current) return;
      setCurrencies([]);
      setCurrencyError(e.message || 'Falha ao carregar as moedas.');
    } finally {
      if (mounted.current && id === currenciesId.current) setLoadingCurrencies(false);
    }
  }

  useEffect(() => {
    mounted.current = true;
    loadCurrencies();
    return () => {
      mounted.current = false;
      currenciesId.current += 1;
      conversionId.current += 1;
    };
  }, []);

  function clearOldResult() {
    conversionId.current += 1;
    busy.current = false;
    setLoadingConversion(false);
    setResult(null);
    setError('');
  }

  function changeAmount(text) {
    clearOldResult();
    setAmount(text);
  }

  function changeFrom(code) {
    clearOldResult();
    setFrom(code);
  }

  function changeTo(code) {
    clearOldResult();
    setTo(code);
  }

  function swapCurrencies() {
    clearOldResult();
    setFrom(to);
    setTo(from);
  }

  async function convert() {
    if (busy.current || loadingCurrencies) return;
    clearOldResult();

    const validation = validateConversion(amount, from, to, currencies);
    if (validation.error) {
      setError(validation.error);
      return;
    }

    const id = ++conversionId.current;
    busy.current = true;
    setLoadingConversion(true);

    try {
      const data = await getRate(from, to);
      const converted = calculateConversion(validation.amount, data.rate);
      if (!mounted.current || id !== conversionId.current) return;

      const item = {
        id: String(Date.now()) + '-' + String(id),
        original: validation.amount, from, to,
        converted, rate: data.rate, date: data.date,
      };
      setResult(item);
      setHistory(previous => [item, ...previous].slice(0, 6));
    } catch (e) {
      if (mounted.current && id === conversionId.current) {
        setResult(null);
        setError(e.message || 'Erro ao converter. Tente novamente.');
      }
    } finally {
      if (mounted.current && id === conversionId.current) {
        busy.current = false;
        setLoadingConversion(false);
      }
    }
  }

  return {
    amount, from, to, currencies, loadingCurrencies, currencyError,
    loadingConversion, error, result, history,
    changeAmount, changeFrom, changeTo, swapCurrencies,
    convert, loadCurrencies, clearHistory: () => setHistory([]),
  };
}
