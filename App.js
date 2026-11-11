import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import colors from './src/theme/colors';

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <AppNavigator />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
