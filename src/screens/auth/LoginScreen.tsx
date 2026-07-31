import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NeedsVerificationError, useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/theme';
import { authStyles as s } from './authStyles';

export default function LoginScreen({ navigation }: { navigation: any }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const canSubmit = email.trim().length > 3 && password.length >= 6 && !busy;

  const handleLogin = async () => {
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      // Success: RootNavigator switches to the app automatically.
    } catch (err) {
      if (err instanceof NeedsVerificationError) {
        navigation.navigate('VerifyOtp', { email: err.email, devOtp: err.devOtp });
      } else {
        setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">
          <View style={s.logoWrap}>
            <LinearGradient colors={[...colors.saveGradient]} style={s.logoBadge}>
              <Text style={s.logoText}>₹</Text>
            </LinearGradient>
            <Text style={s.title}>Welcome back</Text>
            <Text style={s.subtitle}>Log in to continue tracking your expenses</Text>
          </View>

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={s.label}>Email</Text>
          <View style={s.inputBox}>
            <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={colors.textFaint}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <Text style={s.label}>Password</Text>
          <View style={s.inputBox}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Your password"
              placeholderTextColor={colors.textFaint}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleLogin} disabled={!canSubmit} activeOpacity={0.85}>
            <LinearGradient
              colors={[...colors.saveGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[s.primaryButton, !canSubmit && s.disabled]}
            >
              {busy ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color={colors.white} />
                  <Text style={s.primaryButtonText}>Log In</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={s.footerRow}>
            <Text style={s.footerText}>New here?</Text>
            <Text style={s.footerLink} onPress={() => navigation.navigate('Signup')}>
              Create an account
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
