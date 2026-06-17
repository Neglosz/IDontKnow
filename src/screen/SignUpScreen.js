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

export default function SignUpScreen({ onNavigate }) {
  const { signUp } = useAuth();
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [showCPw, setShowCPw]       = useState(false);
  const [loading, setLoading]       = useState(false);

  const handleSignUp = () => {
    if (!name || !email || !password || !confirmPw) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    if (password !== confirmPw) {
      Alert.alert('แจ้งเตือน', 'รหัสผ่านไม่ตรงกัน');
      return;
    }
    if (password.length < 6) {
      Alert.alert('แจ้งเตือน', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    setLoading(true);
    const result = signUp(name, email, password);
    setLoading(false);
    if (result.error) {
      Alert.alert('สมัครสมาชิกไม่สำเร็จ', result.error);
    }
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

          {/* Form */}
          <View style={s.card}>
            <Text style={s.formTitle}>สมัครสมาชิก</Text>

            {/* Name */}
            <Text style={s.label}>ชื่อ</Text>
            <View style={s.inputRow}>
              <Ionicons name="person-outline" size={18} color="#8B6340" style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="กรอกชื่อ"
                placeholderTextColor="#B8A898"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Email */}
            <Text style={[s.label, { marginTop: 14 }]}>อีเมล</Text>
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

            {/* Confirm Password */}
            <Text style={[s.label, { marginTop: 14 }]}>ยืนยันรหัสผ่าน</Text>
            <View style={s.inputRow}>
              <Ionicons name="lock-closed-outline" size={18} color="#8B6340" style={s.inputIcon} />
              <TextInput
                style={s.input}
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                placeholderTextColor="#B8A898"
                secureTextEntry={!showCPw}
                value={confirmPw}
                onChangeText={setConfirmPw}
              />
              <TouchableOpacity onPress={() => setShowCPw(v => !v)} activeOpacity={0.7}>
                <Ionicons
                  name={showCPw ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#8B6340"
                />
              </TouchableOpacity>
            </View>

            {/* Register button */}
            <TouchableOpacity
              style={[s.registerBtn, { marginTop: 24 }]}
              activeOpacity={0.85}
              onPress={handleSignUp}
              disabled={loading}
            >
              <LinearGradient
                colors={['#DEA569', '#C47A2D', '#C47A2D', '#854F18']}
                locations={[0, 0.15, 0.85, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text style={s.registerBtnText}>{loading ? 'กำลังสมัคร...' : 'สมัครสมาชิก'}</Text>
            </TouchableOpacity>

            {/* Sign in link */}
            <View style={s.signinRow}>
              <Text style={s.signinText}>มีบัญชีอยู่แล้ว? </Text>
              <TouchableOpacity onPress={() => onNavigate?.('signin')} activeOpacity={0.7}>
                <Text style={s.signinLink}>เข้าสู่ระบบ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F7F1E5' },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },


  appHeader: { alignItems: 'center', marginTop: 16 },
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

  card: { backgroundColor: '#F7F1E5' },

  formTitle: {
    fontFamily: 'PKNonthaburi',
    fontSize: 26,
    fontWeight: '700',
    color: '#3A1A00',
    textAlign: 'center',
    marginBottom: 15,
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

  registerBtn: {
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#2C1810',
  },
  registerBtnText: {
    fontFamily: 'PKNonthaburi',
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },

  signinRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  signinText: {
    fontFamily: 'PKNonthaburi',
    fontSize: 18,
    color: '#6E441B',
  },
  signinLink: {
    fontFamily: 'PKNonthaburi',
    fontSize: 18,
    color: '#C47A30',
    fontWeight: '700',
  },
});
