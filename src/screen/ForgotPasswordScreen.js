import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Image, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

const hippoSrc = require('../../assets/hippo100.png');
const FRAME_W = 100;
const FRAME_H = 100;

export default function ForgotPasswordScreen({ onNavigate }) {
  const [email, setEmail]   = useState('');
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = () => {
    if (!email) {
      Alert.alert('แจ้งเตือน', 'กรุณากรอกอีเมล');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 800);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.body}>

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
        <View style={s.form}>
          <Text style={s.formTitle}>ลืมรหัสผ่าน</Text>

          {sent ? (
            <View style={s.successBox}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#C47A30" />
              <Text style={s.successTitle}>ส่งลิงก์แล้ว!</Text>
              <Text style={s.successDesc}>
                ลิงก์รีเซ็ตรหัสผ่านถูกส่งไปที่{'\n'}
                <Text style={s.successEmail}>{email}</Text>
              </Text>
            </View>
          ) : (
            <>
              <Text style={s.desc}>
                กรอกอีเมลที่ใช้ลงทะเบียน เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้คุณ
              </Text>

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
            </>
          )}
        </View>

        {/* Bottom actions */}
        {!sent ? (
          <TouchableOpacity
            style={s.sendBtn}
            activeOpacity={0.85}
            onPress={handleSend}
            disabled={loading}
          >
            <LinearGradient
              colors={['#DEA569', '#C47A2D', '#C47A2D', '#854F18']}
              locations={[0, 0.15, 0.85, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={s.sendBtnText}>{loading ? 'กำลังส่ง...' : 'ส่งลิงก์รีเซ็ต'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={s.sendBtn}
            activeOpacity={0.85}
            onPress={() => onNavigate?.('signin')}
          >
            <LinearGradient
              colors={['#DEA569', '#C47A2D', '#C47A2D', '#854F18']}
              locations={[0, 0.15, 0.85, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={s.sendBtnText}>กลับไปเข้าสู่ระบบ</Text>
          </TouchableOpacity>
        )}

        <View style={s.backRow}>
          <Text style={s.backText}>จำรหัสผ่านได้แล้ว? </Text>
          <TouchableOpacity onPress={() => onNavigate?.('signin')} activeOpacity={0.7}>
            <Text style={s.backLink}>เข้าสู่ระบบ</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F1E5' },
  body: { flex: 1, paddingHorizontal: 24 },

  appHeader: { alignItems: 'center', marginTop: 40 },
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

  form: { flex: 1 },

  formTitle: {
    fontFamily: 'PKNonthaburi',
    fontSize: 26,
    fontWeight: '700',
    color: '#3A1A00',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },

  desc: {
    fontFamily: 'PKNonthaburi',
    fontSize: 18,
    color: '#6E441B',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 25,
    opacity: 0.85,
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

  successBox: {
    alignItems: 'center',
    paddingTop: 10,
    gap: 12,
  },
  successTitle: {
    fontFamily: 'PKNonthaburi',
    fontSize: 24,
    fontWeight: '700',
    color: '#3A1A00',
  },
  successDesc: {
    fontFamily: 'PKNonthaburi',
    fontSize: 18,
    color: '#6E441B',
    textAlign: 'center',
    lineHeight: 26,
  },
  successEmail: {
    fontWeight: '700',
    color: '#C47A30',
  },

  sendBtn: {
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#2C1810',
    marginBottom: 18,
  },
  sendBtnText: {
    fontFamily: 'PKNonthaburi',
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 3,
  },

  backRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 255,
  },
  backText: {
    fontFamily: 'PKNonthaburi',
    fontSize: 18,
    color: '#6E441B',
  },
  backLink: {
    fontFamily: 'PKNonthaburi',
    fontSize: 18,
    color: '#C47A30',
    fontWeight: '700',
  },
});
