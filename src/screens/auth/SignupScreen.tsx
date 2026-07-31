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
import { useAuth } from '../../context/AuthContext';
import { colors } from '../../theme/theme';
import { authStyles as s } from './authStyles';

export default function SignupScreen({ navigation }: { navigation: any }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const canSubmit = name.trim().length > 0 && email.trim().length > 3 && password.length >= 6 && !busy;

  const handleSignup = async () => {
    setError('');
    setBusy(true);
    try {
      const { devOtp } = await register(name, email, password);
      navigation.navigate('VerifyOtp', { email: email.trim().toLowerCase(), devOtp });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
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
            <Text style={s.title}>Create your account</Text>
            <Text style={s.subtitle}>We'll email you a 6-digit OTP to verify</Text>
          </View>

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={s.label}>Full Name</Text>
          <View style={s.inputBox}>
            <Ionicons name="person-outline" size={18} color={colors.textMuted} />
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Rahul Kumar"
              placeholderTextColor={colors.textFaint}
              autoComplete="name"
            />
          </View>

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
              placeholder="At least 6 characters"
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

          <TouchableOpacity onPress={handleSignup} disabled={!canSubmit} activeOpacity={0.85}>
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
                  <Ionicons name="person-add-outline" size={20} color={colors.white} />
                  <Text style={s.primaryButtonText}>Sign Up</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={s.footerRow}>
            <Text style={s.footerText}>Already have an account?</Text>
            <Text style={s.footerLink} onPress={() => navigation.navigate('Login')}>
              Log in
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
