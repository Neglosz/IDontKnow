import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Image, StyleSheet, KeyboardAvoidingView,
  ScrollView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';

const hippoSrc = require('../../assets/hippo100.png');
const FRAME_W = 100;
const FRAME_H = 100;

export default function SignInScreen({ onNavigate }) {
  const { signIn } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    setLoading(true);
    const result = signIn(email, password);
    setLoading(false);
    if (result.error) {
      Alert.alert('เข้าสู่ระบบไม่สำเร็จ', result.error);
    }
  };

  const handleGoogle = () => {
    Alert.alert('Google Sign-In', 'ฟีเจอร์นี้ยังไม่เปิดให้ใช้งาน');
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        

          {/* App header */}
          <View style={s.appHeader}>
            <Text style={s.appTitle}>I DON'T KNOW.exe</Text>
            <Text style={s.appSub}>SCAN · LEARN</Text>
          </View>

          {/* Mascot */}
          <View style={s.mascotWrap}>
            <View style={{ width: FRAME_W, height: FRAME_H, overflow: 'hidden' }}>
              <Image
                source={hippoSrc}
                style={{ width: FRAME_W * 4, height: FRAME_H }}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Form card */}
          <View style={s.card}>
            <Text style={s.formTitle}>เข้าสู่ระบบ</Text>

            {/* Email */}
            <Text style={s.label}>อีเมล</Text>
            <View style={s.inputRow}>
              <Ionicons name="mail-outline" size={18} color="#8B6340" style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="กรอกอีเมล"
                placeholderTextColor="#B8A898"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Password */}
            <Text style={[s.label, { marginTop: 14 }]}>รหัสผ่าน</Text>
            <View style={s.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color="#8B6340" style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="กรอกรหัสผ่าน"
                placeholderTextColor="#B8A898"
                secureTextEntry={!showPw}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPw(v => !v)} activeOpacity={0.7}>
                <Ionicons
                  name={showPw ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#8B6340"
                />
              </TouchableOpacity>
            </View>

            {/* Forgot password */}
            <TouchableOpacity
              style={s.forgotWrap}
              activeOpacity={0.7}
              onPress={() => onNavigate?.('forgot-password')}
            >
              <Text style={s.forgotText}>ลืมรหัสผ่าน?</Text>
            </TouchableOpacity>

            {/* Login button */}
            <TouchableOpacity
              style={s.loginBtn}
              activeOpacity={0.85}
              onPress={handleSignIn}
              disabled={loading}
            >
              <LinearGradient
                colors={['#DEA569', '#C47A2D', '#C47A2D', '#854F18']}
                locations={[0, 0.15, 0.85, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={s.loginText}>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</Text>
            </TouchableOpacity>

            {/* Register link */}
            <View style={s.registerRow}>
              <Text style={s.registerText}>ยังไม่มีบัญชี? </Text>
              <TouchableOpacity onPress={() => onNavigate?.('signup')} activeOpacity={0.7}>
                <Text style={s.registerLink}>สมัครสมาชิก</Text>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={s.divider}>
              <View style={s.divLine} />
              <Text style={s.divText}>หรือ</Text>
              <View style={s.divLine} />
            </View>

            {/* Google button */}
            <TouchableOpacity style={s.googleBtn} activeOpacity={0.8} onPress={handleGoogle}>
              <Ionicons name="logo-google" size={18} color="#6E441B" />
              <Text style={s.googleText}>ดำเนินการต่อด้วย Google</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F7F1E5' },
  scroll: { paddingHorizontal: 24, paddingBottom: 32 },

  screenLabel: {
    fontFamily: 'Jersey',
    fontSize: 12,
    color: '#C9BBA4',
    marginTop: 6,
    letterSpacing: 0.5,
  },

  appHeader: { alignItems: 'center', marginTop: 40},
  appTitle: {
    fontFamily: 'Jersey',
    fontSize: 36,
    fontWeight: '900',
    color: '#C47A30',
    letterSpacing: 0.4,
  },
  appSub: {
    fontFamily: 'Jersey',
    fontSize: 18,
    fontWeight: '800',
    color: '#6E441B',
    letterSpacing: 3,
    marginTop: 2,
  },

  mascotWrap: { alignItems: 'center', marginTop: 25, marginBottom: 5 },

  card: {
    backgroundColor: '#F7F1E5',
  },

  formTitle: {
    fontFamily: 'PKNonthaburi',
    fontSize: 26,
    fontWeight: '700',
    color: '#3A1A00',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 20,
  },

  label: {
    fontFamily: 'PKNonthaburi',
    fontSize: 18,
    fontWeight: '700',
    color: '#3A1A00',
    marginBottom: 6,
  },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#C9BBA4',
    borderRadius: 10,
    backgroundColor: '#FDFAF5',
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontFamily: 'PKNonthaburi',
    fontSize: 18,
    color: '#3A1A00',
  },

  forgotWrap: { alignSelf: 'flex-end', marginTop: 10, marginBottom: 20 },
  forgotText: {
    fontFamily: 'PKNonthaburi',
    fontSize: 16,
    color: '#C47A30',
  },

  loginBtn: {
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#2C1810',
  },
  loginText: {
    fontFamily: 'PKNonthaburi',
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  registerText: {
    fontFamily: 'PKNonthaburi',
    fontSize: 16,
    color: '#6E441B',
  },
  registerLink: {
    fontFamily: 'PKNonthaburi',
    fontSize: 16,
    color: '#C47A30',
    fontWeight: '700',
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 10,
  },
  divLine: { flex: 1, height: 1, backgroundColor: '#C9BBA4' },
  divText: {
    fontFamily: 'PKNonthaburi',
    fontSize: 16,
    color: '#8B6340',
  },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#C9BBA4',
    backgroundColor: '#FDFAF5',
    gap: 10,
  },
  googleText: {
    fontFamily: 'PKNonthaburi',
    fontSize: 18,
    fontWeight: '700',
    color: '#3A1A00',
  },
});
