import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import colors from '../theme/colors';

export default function AboutScreen() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Sobre o Câmbio</Text>
      <Text style={styles.subtitle}>Um conversor de moedas desenvolvido com React Native.</Text>

      <View style={styles.section}>
        <Text style={styles.heading}>Cotações de referência</Text>
        <Text style={styles.subtitle}>
          Os valores vêm da API Frankfurter e podem ser diferentes das taxas cobradas por bancos e casas de câmbio.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Organização MVVM</Text>
        <Text style={styles.subtitle}>
          Model consulta a API, ViewModel faz a conversão e View apresenta o resultado.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.heading}>Desenvolvido por</Text>
        <Text style={styles.subtitle}>Kevin Silva</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: 540, alignSelf: 'center', padding: 24, paddingTop: 35, paddingBottom: 40 },
  title: { color: colors.title, fontSize: 28, fontWeight: '700' },
  subtitle: { color: colors.text, fontSize: 16, lineHeight: 25, marginTop: 11 },
  section: { marginTop: 33, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 24 },
  heading: { color: colors.title, fontSize: 20, fontWeight: '700' },
});
