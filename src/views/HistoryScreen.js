import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import AppButton from '../components/AppButton';
import { formatDate, formatMoney } from '../utils/conversion';
import colors from '../theme/colors';

export default function HistoryScreen({ vm }) {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Histórico</Text>
      <Text style={styles.subtitle}>Suas últimas seis conversões desta sessão.</Text>

      {vm.history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nenhuma conversão ainda</Text>
          <Text style={styles.subtitle}>Seus resultados vão aparecer aqui.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {vm.history.map(item => (
            <View style={styles.row} key={item.id}>
              <Text style={styles.rowTitle}>{formatMoney(item.converted, item.to)}</Text>
              <Text style={styles.rowSubtitle}>
                {formatMoney(item.original, item.from)} · {item.from} para {item.to}
              </Text>
              <Text style={styles.rowSubtitle}>Referência: {formatDate(item.date)}</Text>
            </View>
          ))}
          <View style={styles.clear}>
            <AppButton title="Limpar histórico" outline onPress={vm.clearHistory} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
