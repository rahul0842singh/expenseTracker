import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { colors, font, radius, spacing } from '../../theme/theme';
import { authStyles as s } from './authStyles';

export default function VerifyOtpScreen({ navigation, route }: { navigation: any; route: any }) {
  const { verifyOtp, resendOtp } = useAuth();
  const email: string = route.params?.email ?? '';
  const [devOtp, setDevOtp] = useState<string | undefined>(route.params?.devOtp);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const canSubmit = code.trim().length === 6 && !busy;

  const handleVerify = async () => {
    setError('');
    setBusy(true);
    try {
      await verifyOtp(email, code.trim());
      // Success: RootNavigator switches to the app automatically.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    try {
      const res = await resendOtp(email);
      setDevOtp(res.devOtp);
      setInfo('A new OTP has been sent to your email.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend OTP.');
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
              <Ionicons name="mail-open-outline" size={28} color={colors.white} />
            </LinearGradient>
            <Text style={s.title}>Verify your email</Text>
            <Text style={s.subtitle}>Enter the 6-digit code sent to {email}</Text>
          </View>

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}
          {info ? (
            <View style={s.infoBox}>
              <Text style={s.infoText}>{info}</Text>
            </View>
          ) : null}
          {devOtp ? (
            <View style={s.infoBox}>
              <Text style={s.infoText}>Dev mode — your OTP is {devOtp}</Text>
            </View>
          ) : null}

          <TextInput
            style={styles.otpInput}
            value={code}
            onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
            placeholder="••••••"
            placeholderTextColor={colors.textFaint}
            keyboardType="number-pad"
            maxLength={6}
            textAlign="center"
          />

          <TouchableOpacity onPress={handleVerify} disabled={!canSubmit} activeOpacity={0.85}>
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
                  <Ionicons name="shield-checkmark-outline" size={20} color={colors.white} />
                  <Text style={s.primaryButtonText}>Verify & Continue</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={s.footerRow}>
            <Text style={s.footerText}>Didn't get the code?</Text>
            <Text style={s.footerLink} onPress={handleResend}>
              Resend OTP
            </Text>
          </View>
          <View style={s.footerRow}>
            <Text style={s.footerLink} onPress={() => navigation.navigate('Login')}>
              Back to login
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  otpInput: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    height: 64,
    color: colors.text,
    fontSize: 28,
    fontWeight: font.heavy,
    letterSpacing: 16,
    marginVertical: spacing.md,
  },
});
