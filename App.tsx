import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { ExpenseProvider } from './src/context/ExpenseContext';
import RootNavigator from './src/navigation/RootNavigator';
import SplashScreen from './src/screens/SplashScreen';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <ExpenseProvider>
          <StatusBar style="light" />
          {/* The app mounts underneath the splash so auth/expense loading
              happens during the intro rather than after it. */}
          <View style={{ flex: 1 }}>
            <RootNavigator />
            {!splashDone ? <SplashScreen onFinish={() => setSplashDone(true)} /> : null}
          </View>
        </ExpenseProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
