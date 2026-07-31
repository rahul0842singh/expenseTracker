import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ExpenseProvider } from './src/context/ExpenseContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ExpenseProvider>
          <StatusBar style="light" />
          <RootNavigator />
        </ExpenseProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
