import React, { useState } from 'react';
import {
  FlatList, Modal, Pressable, StyleSheet,
  Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import colors from '../theme/colors';

export default function CurrencyPicker({ label, value, currencies, onChange, disabled }) {
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
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={[styles.selector, disabled && { opacity: 0.45 }]}
      >
        <View style={styles.flex}>
          <Text style={styles.code}>{value}</Text>
          <Text style={styles.name} numberOfLines={1}>{selected?.name || 'Carregando...'}</Text>
        </View>
        <Text style={styles.arrow}>⌄</Text>
      </Pressable>

      <Modal visible={open} animationType="slide" onRequestClose={close}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Escolher moeda</Text>
            <Pressable accessibilityRole="button" onPress={close} hitSlop={12}>
              <Text style={styles.close}>Fechar</Text>
            </Pressable>
          </View>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar moeda"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.search}
          />
          <FlatList
            data={filtered}
            keyExtractor={item => item.code}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={styles.empty}>Nenhuma moeda encontrada.</Text>}
            renderItem={({ item }) => (
              <Pressable style={styles.currencyRow} onPress={() => select(item.code)}>
                <View style={styles.flex}>
                  <Text style={styles.currencyCode}>{item.code}</Text>
                  <Text style={styles.currencyName}>{item.name}</Text>
                </View>
                {item.code === value && <Text style={styles.selected}>✓</Text>}
              </Pressable>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
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
