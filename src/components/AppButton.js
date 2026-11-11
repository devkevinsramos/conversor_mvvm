import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import colors from '../theme/colors';

export default function AppButton({ title, onPress, disabled = false, loading = false, outline = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.button, outline && styles.outline, (disabled || loading) && styles.disabled]}
    >
      {loading ? (
        <ActivityIndicator color={outline ? colors.accent : colors.background} />
      ) : (
        <Text style={[styles.text, outline && styles.outlineText]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
