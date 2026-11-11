import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import ConverterScreen from '../views/ConverterScreen';
import HistoryScreen from '../views/HistoryScreen';
import AboutScreen from '../views/AboutScreen';
import useConverterViewModel from '../viewmodels/useConverterViewModel';
import colors from '../theme/colors';

const pages = ['Conversor', 'Histórico', 'Sobre'];

export default function AppNavigator() {
  const [page, setPage] = useState('Conversor');
  const vm = useConverterViewModel();

  return (
    <View style={styles.app}>
      <View style={styles.header}>
        <Text style={styles.logo}>Câmbio<Text style={styles.dot}>.</Text></Text>
      </View>

      <View style={styles.body}>
        {page === 'Conversor' && <ConverterScreen vm={vm} />}
        {page === 'Histórico' && <HistoryScreen vm={vm} />}
        {page === 'Sobre' && <AboutScreen />}
      </View>

      <View style={styles.navigation}>
        {pages.map(name => (
          <Pressable
            key={name}
            accessibilityRole="tab"
            accessibilityState={{ selected: page === name }}
            onPress={() => setPage(name)}
            style={[styles.tab, page === name && styles.activeTab]}
          >
            <Text style={[styles.tabText, page === name && styles.activeText]}>{name}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
