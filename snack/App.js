import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, FlatList, Modal, Platform, Pressable,
  SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, View,
} from 'react-native';

// --- src/theme/colors.js ---
const colors = {
  background: '#101010',
  surface: '#1B1B1B',
  border: '#383838',
  accent: '#FF5D19',
  title: '#F5F3EE',
  text: '#D5D1CB',
  muted: '#AAA49C',
  error: '#FF9B84',
};


// --- src/utils/conversion.js ---
function parseAmount(text) {
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

function validateConversion(value, from, to, currencies) {
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

function calculateConversion(amount, rate) {
  const total = amount * rate;
  if (!Number.isFinite(total) || total <= 0) {
    throw new Error('Não foi possível calcular esse valor.');
  }
  return total;
}

function formatMoney(value, code) {
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency', currency: code,
    }).format(value);
  } catch {
    return `${code} ${value.toFixed(2).replace('.', ',')}`;
  }
}

function formatRate(value) {
  try {
    return new Intl.NumberFormat('pt-BR', { maximumSignificantDigits: 8 }).format(value);
  } catch {
    return String(value);
  }
}

function formatDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return value || 'Não informada';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}


// --- src/models/currencyModel.js ---
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

async function getCurrencies() {
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

async function getRate(from, to) {
  const data = await getJson(`/rate/${from}/${to}`);

  if (!data || data.base !== from || data.quote !== to ||
      typeof data.rate !== 'number' || !Number.isFinite(data.rate) || data.rate <= 0 ||
      typeof data.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    throw new Error('A API não retornou uma taxa válida.');
  }

  return { rate: data.rate, date: data.date };
}


// --- src/viewmodels/useConverterViewModel.js ---
function useConverterViewModel() {
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


// --- src/components/AppButton.js ---
function AppButton({ title, onPress, disabled = false, loading = false, outline = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      disabled={disabled || loading}
      style={[buttonStyles.button, outline && buttonStyles.outline, (disabled || loading) && buttonStyles.disabled]}
    >
      {loading ? (
        <ActivityIndicator color={outline ? colors.accent : colors.background} />
      ) : (
        <Text style={[buttonStyles.text, outline && buttonStyles.outlineText]}>{title}</Text>
      )}
    </Pressable>
  );
}

const buttonStyles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
  },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  disabled: { opacity: 0.45 },
  text: { fontSize: 16, fontWeight: '700', color: colors.background },
  outlineText: { color: colors.title },
});


// --- src/components/CurrencyPicker.js ---
function CurrencyPicker({ label, value, currencies, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = currencies.find(item => item.code === value);
  const filtered = currencies.filter(item => {
    const term = search.trim().toLowerCase();
    return item.code.toLowerCase().includes(term) || item.name.toLowerCase().includes(term);
  });

  function select(code) {
    onChange(code);
    setOpen(false);
    setSearch('');
  }

  function close() {
    setOpen(false);
    setSearch('');
  }

  return (
    <View style={pickerStyles.container}>
      <Text style={pickerStyles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[pickerStyles.selector, disabled && { opacity: 0.45 }]}
      >
        <View style={pickerStyles.flex}>
          <Text style={pickerStyles.code}>{value}</Text>
          <Text style={pickerStyles.name} numberOfLines={1}>{selected?.name || 'Carregando...'}</Text>
        </View>
        <Text style={pickerStyles.arrow}>⌄</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={close}>
        <SafeAreaView style={pickerStyles.modal}>
          <View style={pickerStyles.modalHeader}>
            <Text style={pickerStyles.modalTitle}>Escolher moeda</Text>
            <Pressable accessibilityRole="button" onPress={close} hitSlop={12}>
              <Text style={pickerStyles.close}>Fechar</Text>
            </Pressable>
          </View>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar moeda"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={pickerStyles.search}
          />
          <FlatList
            data={filtered}
            keyExtractor={item => item.code}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={pickerStyles.empty}>Nenhuma moeda encontrada.</Text>}
            renderItem={({ item }) => (
              <Pressable style={pickerStyles.currencyRow} onPress={() => select(item.code)}>
                <View style={pickerStyles.flex}>
                  <Text style={pickerStyles.currencyCode}>{item.code}</Text>
                  <Text style={pickerStyles.currencyName}>{item.name}</Text>
                </View>
                {item.code === value && <Text style={pickerStyles.selected}>✓</Text>}
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  container: { flex: 1, minWidth: 0 },
  flex: { flex: 1, minWidth: 0 },
  label: { color: colors.title, fontSize: 16, fontWeight: '600', marginBottom: 11 },
  selector: {
    flexDirection: 'row', alignItems: 'center', minHeight: 78,
    borderRadius: 7, paddingHorizontal: 12, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  code: { color: colors.title, fontWeight: '700', fontSize: 20 },
  name: { color: colors.muted, fontSize: 14, marginTop: 5 },
  arrow: { color: colors.accent, fontSize: 22, marginLeft: 3 },
  modal: { backgroundColor: colors.background, flex: 1 },
  modalHeader: {
    paddingHorizontal: 24, paddingTop: 20, paddingBottom: 17,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  modalTitle: { color: colors.title, fontWeight: '700', fontSize: 24 },
  close: { color: colors.accent, fontSize: 16, fontWeight: '600' },
  search: {
    color: colors.title, fontSize: 17, minHeight: 50, paddingHorizontal: 14,
    borderWidth: 1, borderColor: colors.border, borderRadius: 7,
    backgroundColor: colors.surface, marginHorizontal: 24, marginBottom: 12,
  },
  currencyRow: {
    paddingVertical: 15, paddingHorizontal: 24, borderBottomWidth: 1,
    borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center',
  },
  currencyCode: { fontSize: 18, fontWeight: '700', color: colors.title },
  currencyName: { fontSize: 15, color: colors.muted, marginTop: 5 },
  selected: { color: colors.accent, fontSize: 22 },
  empty: { color: colors.text, fontSize: 16, padding: 24 },
});


// --- src/views/ConverterScreen.js ---
function ConverterScreen({ vm }) {
  const disabled = vm.loadingCurrencies || !!vm.currencyError;

  return (
    <ScrollView
      style={converterStyles.page}
      contentContainerStyle={converterStyles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={converterStyles.title}>Converter moedas</Text>
      <Text style={converterStyles.subtitle}>Escolha as moedas e confira o valor convertido.</Text>

      <View style={converterStyles.form}>
        <Text style={converterStyles.label}>Valor</Text>
        <TextInput
          accessibilityLabel="Valor a converter"
          value={vm.amount}
          onChangeText={vm.changeAmount}
          keyboardType="decimal-pad"
          placeholder="Ex.: 100,50"
          placeholderTextColor={colors.muted}
          style={converterStyles.input}
          maxLength={20}
        />

        <View style={converterStyles.currenciesRow}>
          <CurrencyPicker
            label="De" value={vm.from} currencies={vm.currencies}
            onChange={vm.changeFrom} disabled={disabled}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Inverter moedas"
            disabled={disabled}
            onPress={vm.swapCurrencies}
            style={[converterStyles.swap, disabled && { opacity: 0.45 }]}
          >
            <Text style={converterStyles.swapText}>⇄</Text>
          </Pressable>
          <CurrencyPicker
            label="Para" value={vm.to} currencies={vm.currencies}
            onChange={vm.changeTo} disabled={disabled}
          />
        </View>

        <AppButton
          title={vm.loadingCurrencies ? 'Carregando moedas...' : 'Converter'}
          onPress={vm.convert}
          disabled={disabled}
          loading={vm.loadingConversion}
        />
      </View>

      {vm.currencyError ? (
        <View style={converterStyles.message}>
          <Text style={converterStyles.error}>{vm.currencyError}</Text>
          <View style={converterStyles.retry}>
            <AppButton title="Tentar novamente" outline onPress={vm.loadCurrencies} />
          </View>
        </View>
      ) : null}

      {vm.error ? (
        <View style={converterStyles.message}>
          <Text style={converterStyles.error}>{vm.error}</Text>
        </View>
      ) : null}

      {vm.loadingConversion ? (
        <Text style={converterStyles.feedback}>Consultando taxa de câmbio...</Text>
      ) : null}

      {vm.result ? (
        <View style={converterStyles.result}>
          <Text style={converterStyles.resultTitle}>Resultado</Text>
          <Text style={converterStyles.resultValue} adjustsFontSizeToFit numberOfLines={2}>
            {formatMoney(vm.result.converted, vm.result.to)}
          </Text>
          <Text style={converterStyles.resultSubtitle}>
            {formatMoney(vm.result.original, vm.result.from)} em {vm.result.to}
          </Text>
          <View style={converterStyles.line} />
          <Text style={converterStyles.detail}>
            Taxa: 1 {vm.result.from} = {formatRate(vm.result.rate)} {vm.result.to}
          </Text>
          <Text style={converterStyles.detail}>Referência: {formatDate(vm.result.date)}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const converterStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 540, alignSelf: 'center', padding: 24, paddingTop: 35, paddingBottom: 40 },
  title: { color: colors.title, fontSize: 28, fontWeight: '700', lineHeight: 35 },
  subtitle: { color: colors.text, fontSize: 16, lineHeight: 24, marginTop: 11 },
  form: { marginTop: 35 },
  label: { color: colors.title, fontSize: 16, fontWeight: '600', marginBottom: 11 },
  input: {
    color: colors.title, fontSize: 27, fontWeight: '700', backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, borderRadius: 7,
    minHeight: 70, paddingHorizontal: 16,
  },
  currenciesRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 27, marginBottom: 27 },
  swap: {
    width: 39, height: 45, marginHorizontal: 8, borderWidth: 1,
    borderColor: colors.border, borderRadius: 7, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: 15,
  },
  swapText: { color: colors.accent, fontSize: 25 },
  message: { paddingTop: 19 },
  retry: { marginTop: 14 },
  error: { color: colors.error, fontSize: 16, lineHeight: 24 },
  feedback: { color: colors.text, fontSize: 16, marginTop: 24 },
  result: {
    marginTop: 33, backgroundColor: colors.surface, borderRadius: 7,
    padding: 20, borderWidth: 1, borderColor: colors.border,
  },
  resultTitle: { color: colors.title, fontSize: 20, fontWeight: '700' },
  resultValue: { color: colors.accent, fontSize: 30, fontWeight: '700', marginTop: 16 },
  resultSubtitle: { color: colors.text, fontSize: 16, marginTop: 9 },
  line: { height: 1, backgroundColor: colors.border, marginVertical: 20 },
  detail: { color: colors.text, fontSize: 15, lineHeight: 25 },
});


// --- src/views/HistoryScreen.js ---
function HistoryScreen({ vm }) {
  return (
    <ScrollView style={historyStyles.page} contentContainerStyle={historyStyles.content}>
      <Text style={historyStyles.title}>Histórico</Text>
      <Text style={historyStyles.subtitle}>Suas últimas seis conversões desta sessão.</Text>

      {vm.history.length === 0 ? (
        <View style={historyStyles.empty}>
          <Text style={historyStyles.emptyTitle}>Nenhuma conversão ainda</Text>
          <Text style={historyStyles.subtitle}>Seus resultados vão aparecer aqui.</Text>
        </View>
      ) : (
        <View style={historyStyles.list}>
          {vm.history.map(item => (
            <View style={historyStyles.row} key={item.id}>
              <Text style={historyStyles.rowTitle}>{formatMoney(item.converted, item.to)}</Text>
              <Text style={historyStyles.rowSubtitle}>
                {formatMoney(item.original, item.from)} · {item.from} para {item.to}
              </Text>
              <Text style={historyStyles.rowSubtitle}>Referência: {formatDate(item.date)}</Text>
            </View>
          ))}
          <View style={historyStyles.clear}>
            <AppButton title="Limpar histórico" outline onPress={vm.clearHistory} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const historyStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 540, alignSelf: 'center', padding: 24, paddingTop: 35, paddingBottom: 40 },
  title: { color: colors.title, fontSize: 28, fontWeight: '700' },
  subtitle: { color: colors.text, fontSize: 16, lineHeight: 24, marginTop: 11 },
  empty: { marginTop: 42 },
  emptyTitle: { color: colors.title, fontSize: 19, fontWeight: '600' },
  list: { marginTop: 27 },
  row: { paddingVertical: 22, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowTitle: { color: colors.title, fontSize: 23, fontWeight: '700' },
  rowSubtitle: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 6 },
  clear: { marginTop: 27 },
});


// --- src/views/AboutScreen.js ---
function AboutScreen() {
  return (
    <ScrollView style={aboutStyles.page} contentContainerStyle={aboutStyles.content}>
      <Text style={aboutStyles.title}>Sobre o Câmbio</Text>
      <Text style={aboutStyles.subtitle}>Um conversor de moedas desenvolvido com React Native.</Text>

      <View style={aboutStyles.section}>
        <Text style={aboutStyles.heading}>Cotações de referência</Text>
        <Text style={aboutStyles.subtitle}>
          Os valores vêm da API Frankfurter e podem ser diferentes das taxas cobradas por bancos e casas de câmbio.
        </Text>
      </View>

      <View style={aboutStyles.section}>
        <Text style={aboutStyles.heading}>Organização MVVM</Text>
        <Text style={aboutStyles.subtitle}>
          Model consulta a API, ViewModel faz a conversão e View apresenta o resultado.
        </Text>
      </View>

      <View style={aboutStyles.section}>
        <Text style={aboutStyles.heading}>Desenvolvido por</Text>
        <Text style={aboutStyles.subtitle}>Kevin Silva</Text>
      </View>
    </ScrollView>
  );
}

const aboutStyles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 540, alignSelf: 'center', padding: 24, paddingTop: 35, paddingBottom: 40 },
  title: { color: colors.title, fontSize: 28, fontWeight: '700' },
  subtitle: { color: colors.text, fontSize: 16, lineHeight: 25, marginTop: 11 },
  section: { marginTop: 33, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 24 },
  heading: { color: colors.title, fontSize: 20, fontWeight: '700' },
});


// --- src/navigation/AppNavigator.js ---
const pages = ['Conversor', 'Histórico', 'Sobre'];

function AppNavigator() {
  const [page, setPage] = useState('Conversor');
  const vm = useConverterViewModel();

  return (
    <View style={navigationStyles.app}>
      <View style={navigationStyles.header}>
        <Text style={navigationStyles.logo}>Câmbio<Text style={navigationStyles.dot}>.</Text></Text>
      </View>

      <View style={navigationStyles.body}>
        {page === 'Conversor' && <ConverterScreen vm={vm} />}
        {page === 'Histórico' && <HistoryScreen vm={vm} />}
        {page === 'Sobre' && <AboutScreen />}
      </View>

      <View style={navigationStyles.navigation}>
        {pages.map(name => (
          <Pressable
            key={name}
            accessibilityRole="tab"
            accessibilityState={{ selected: page === name }}
            onPress={() => setPage(name)}
            style={[navigationStyles.tab, page === name && navigationStyles.activeTab]}
          >
            <Text style={[navigationStyles.tabText, page === name && navigationStyles.activeText]}>{name}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const navigationStyles = StyleSheet.create({
  app: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 60, justifyContent: 'center', paddingHorizontal: 24,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  logo: { color: colors.title, fontSize: 21, fontWeight: '700' },
  dot: { color: colors.accent },
  body: { flex: 1 },
  navigation: {
    minHeight: 62, flexDirection: 'row', borderTopWidth: 1,
    borderTopColor: colors.border, backgroundColor: colors.background,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  activeTab: { borderTopWidth: 2, borderTopColor: colors.accent },
  tabText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  activeText: { color: colors.title },
});


// --- App.js ---
export default function App() {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) : 0,
      }}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <AppNavigator />
    </SafeAreaView>
  );
}
