import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  Image, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const hippoSrc = require('../../assets/hippo100.png');
const FRAME_W = 100;
const FRAME_H = 100;
const TOTAL_FRAMES = 4;
const FPS = 5;

function SpriteFrame() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame(prev => (prev + 1) % TOTAL_FRAMES), 1000 / FPS);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={{ width: FRAME_W, height: FRAME_H, overflow: 'hidden' }}>
      <Image
        source={hippoSrc}
        style={{ width: FRAME_W * TOTAL_FRAMES, height: FRAME_H, marginLeft: -FRAME_W * frame }}
        resizeMode="cover"
      />
    </View>
  );
}

export default function WelcomeScreen({ onStart }) {
  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.body}>

        {/* App header */}
        <View style={s.appHeader}>
          <Text style={s.appTitle}>I DON'T KNOW.exe</Text>
          <Text style={s.appSub}>SCAN · LEARN</Text>
        </View>

        {/* PIPO dialog */}
        <View style={s.msgCol}>
          <Text style={s.msgName}>PIPO</Text>
          <View style={[s.bubble, s.bubbleLeft]}>
            <Text style={s.bubbleText}>
              ฉันชื่อ <Text style={s.bubbleBold}>PIPO</Text> จะเป็นเพื่อนคู่หูของเธอในการเรียนรู้นะ~
            </Text>
          </View>
        </View>

        {/* Mascot */}
        <View style={s.mascotWrap}>
          <SpriteFrame />
        </View>

        {/* Welcome message */}
        <View style={s.msgWrap}>
          <Text style={s.welcomeTitle}>ยินดีต้อนรับ!</Text>
          <Text style={s.welcomeDesc}>
            สมัครสมาชิกสำเร็จแล้ว!{'\n'}พร้อมออกสำรวจโลกแห่งความรู้ไปด้วยกันนะ
          </Text>
        </View>

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* CTA button */}
        <TouchableOpacity style={s.startBtn} activeOpacity={0.85} onPress={onStart}>
          <LinearGradient
            colors={['#DEA569', '#C47A2D', '#C47A2D', '#854F18']}
            locations={[0, 0.15, 0.85, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={s.startBtnText}>เริ่มต้นใช้งาน</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F1E5' },
  body: { flex: 1, paddingHorizontal: 24 },

  appHeader: { alignItems: 'center', marginTop: 160 },
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

  msgCol: {
    alignSelf: 'center',
    alignItems: 'flex-start',
    maxWidth: '90%',
    marginTop: 20,
    marginBottom: 12,
  },
  msgName: {
    fontFamily: 'Jersey',
    fontSize: 16,
    fontWeight: '900',
    color: '#C77A20',
    letterSpacing: 1,
    marginBottom: 4,
    marginLeft: 4,
  },
  bubble: {
    maxWidth: '100%',
    backgroundColor: '#EFE7DA',
    borderWidth: 2,
    borderColor: '#2C1810',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleLeft: { borderBottomLeftRadius: 16 },
  bubbleText: {
    fontFamily: 'PKNonthaburi',
    fontSize: 18,
    color: '#4A2800',
    lineHeight: 30,
  },
  bubbleBold: {
    fontWeight: '700',
  },

  mascotWrap: { alignItems: 'center', marginTop: 10 },

  msgWrap: { alignItems: 'center', marginTop: 20 },
  welcomeTitle: {
    fontFamily: 'PKNonthaburi',
    fontSize: 30,
    fontWeight: '700',
    color: '#3A1A00',
    marginBottom: 8,
  },
  welcomeDesc: {
    fontFamily: 'PKNonthaburi',
    fontSize: 18,
    color: '#6E441B',
    textAlign: 'center',
    lineHeight: 26,
    opacity: 0.85,
  },

  startBtn: {
    height: 52,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#2C1810',
    marginBottom: 180,
  },
  startBtnText: {
    fontFamily: 'PKNonthaburi',
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
  },
});
