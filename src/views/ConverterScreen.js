import React from 'react';
import { ScrollView, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import AppButton from '../components/AppButton';
import CurrencyPicker from '../components/CurrencyPicker';
import { formatDate, formatMoney, formatRate } from '../utils/conversion';
import colors from '../theme/colors';

export default function ConverterScreen({ vm }) {
  const disabled = vm.loadingCurrencies || !!vm.currencyError;

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Converter moedas</Text>
      <Text style={styles.subtitle}>Escolha as moedas e confira o valor convertido.</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Valor</Text>
        <TextInput
          accessibilityLabel="Valor a converter"
          value={vm.amount}
          onChangeText={vm.changeAmount}
          keyboardType="decimal-pad"
          placeholder="Ex.: 100,50"
          placeholderTextColor={colors.muted}
          style={styles.input}
          maxLength={20}
        />

        <View style={styles.currenciesRow}>
          <CurrencyPicker
            label="De" value={vm.from} currencies={vm.currencies}
            onChange={vm.changeFrom} disabled={disabled}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Inverter moedas"
            disabled={disabled}
            onPress={vm.swapCurrencies}
            style={[styles.swap, disabled && { opacity: 0.45 }]}
          >
            <Text style={styles.swapText}>⇄</Text>
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
        <View style={styles.message}>
          <Text style={styles.error}>{vm.currencyError}</Text>
          <View style={styles.retry}>
            <AppButton title="Tentar novamente" outline onPress={vm.loadCurrencies} />
          </View>
        </View>
      ) : null}

      {vm.error ? (
        <View style={styles.message}>
          <Text style={styles.error}>{vm.error}</Text>
        </View>
      ) : null}

      {vm.loadingConversion ? (
        <Text style={styles.feedback}>Consultando taxa de câmbio...</Text>
      ) : null}

      {vm.result ? (
        <View style={styles.result}>
          <Text style={styles.resultTitle}>Resultado</Text>
          <Text style={styles.resultValue} adjustsFontSizeToFit numberOfLines={2}>
            {formatMoney(vm.result.converted, vm.result.to)}
          </Text>
          <Text style={styles.resultSubtitle}>
            {formatMoney(vm.result.original, vm.result.from)} em {vm.result.to}
          </Text>
          <View style={styles.line} />
          <Text style={styles.detail}>
            Taxa: 1 {vm.result.from} = {formatRate(vm.result.rate)} {vm.result.to}
          </Text>
          <Text style={styles.detail}>Referência: {formatDate(vm.result.date)}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
