// ─────────────────────────────────────────────────────────────────────────
// DailyRewardModal — ป๊อปอัปเช็คอินรายวันแบบเกม (เด้งตอนเปิดแอปวันแรกของวัน)
// ----------------------------------------------------------------------------
// โชว์รางวัลวันนี้ (+1 ทุกวัน + โบนัสหลักไมล์) ให้กด "รับเลย" → recordDailyActivity
// self-contained: ตัดสินใจเองว่าจะโชว์ไหมจาก lastActiveDate ใน AuthContext
// ─────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal, View, Text, Image, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { localDateStr, nextStreak, dailyReward } from '../data/streak';

const starSrc = require('../../assets/star.png');
const GRAD = ['#F4BB4A', '#DE7A1A'];
const WEEK = [1, 2, 3, 4, 5, 6, 7];

export default function DailyRewardModal() {
  const {
    user, isNewUser, profile, lastActiveDate, currentStreak, recordDailyActivity,
  } = useAuth();

  const [visible, setVisible] = useState(false);
  const [claimed, setClaimed] = useState(null);   // ผลหลังกดรับ { streak, reward }
  const [busy, setBusy] = useState(false);
  const shownDateRef = useRef(null);               // กันเด้งซ้ำในวันเดียว/เซสชันเดียว

  const pop = useRef(new Animated.Value(0)).current;

  // เด้งเมื่อ: ล็อกอินแล้ว, ตั้งตัวละครแล้ว, มี profile, และวันนี้ยังไม่เช็คอิน
  useEffect(() => {
    const today = localDateStr();
    if (user && !isNewUser && profile && lastActiveDate !== today && shownDateRef.current !== today) {
      shownDateRef.current = today;
      setClaimed(null);
      setVisible(true);
    }
  }, [user, isNewUser, profile, lastActiveDate]);

  // เด้งดาวตอนเปิด modal / ตอนรับรางวัล
  useEffect(() => {
    if (visible) {
      pop.setValue(0);
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }).start();
    }
  }, [visible, claimed]);

  // streak/รางวัลที่จะได้ถ้าเช็คอินวันนี้ (โชว์ก่อนกดรับ)
  const previewStreak = nextStreak({ lastActiveDate, currentStreak }, localDateStr()).streak;
  const reward = claimed ? claimed.reward : dailyReward(previewStreak);
  const dayNum = claimed ? claimed.streak : previewStreak;
  // ไฮไลต์ในตาราง 7 ช่อง (วน 7 วันต่อรอบ) — วันปัจจุบันของรอบ
  const cycleDay = ((dayNum - 1) % 7) + 1;

  const onClaim = async () => {
    setBusy(true);
    const res = await recordDailyActivity();
    setBusy(false);
    if (res?.error) { setVisible(false); return; }
    setClaimed({ streak: res.streak, reward: res.reward });
  };

  if (!visible) return null;
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
      <View style={s.overlay}>
        <Animated.View style={[s.card, { opacity: pop, transform: [{ scale }] }]}>
          <Text style={s.title}>เช็คอินรายวัน</Text>
          <Text style={s.sub}>{claimed ? 'รับรางวัลแล้ว! 🎉' : 'กลับมาเรียนต่อเนื่อง รับดาวฟรีทุกวัน'}</Text>

          {/* ไฟ + จำนวนวัน */}
          <View style={s.flameRow}>
            <LinearGradient colors={GRAD} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={s.flameCircle}>
              <Ionicons name="flame" size={34} color="#FFF" />
            </LinearGradient>
            <View>
              <View style={s.dayRow}>
                <Text style={s.dayNum}>{dayNum}</Text>
                <Text style={s.dayLabel}>วัน</Text>
              </View>
              <Text style={s.daySub}>เรียนต่อเนื่อง</Text>
            </View>
          </View>

          {/* ตาราง 7 วัน + รางวัลแต่ละวัน */}
          <View style={s.week}>
            {WEEK.map((d) => {
              const active = d <= cycleDay;
              const isToday = d === cycleDay;
              return (
                <View key={d} style={[s.cell, active && s.cellActive, isToday && s.cellToday]}>
                  <Text style={[s.cellDay, active && s.cellDayActive]}>{d}</Text>
                  <View style={s.cellReward}>
                    <Image source={starSrc} style={s.cellStar} resizeMode="contain" />
                    <Text style={[s.cellRewardTxt, active && s.cellDayActive]}>{dailyReward(d)}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* รางวัลวันนี้ */}
          <View style={s.rewardBox}>
            <Text style={s.rewardLabel}>รางวัลวันนี้</Text>
            <View style={s.rewardValue}>
              <Image source={starSrc} style={{ width: 22, height: 22 }} resizeMode="contain" />
              <Text style={s.rewardNum}>+{reward}</Text>
            </View>
          </View>

          {claimed ? (
            <TouchableOpacity style={[s.btn, s.btnDone]} activeOpacity={0.85} onPress={() => setVisible(false)}>
              <Text style={s.btnTxt}>เยี่ยม!</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[s.btn, s.btnClaim]} activeOpacity={0.85} onPress={onClaim} disabled={busy}>
              <Text style={s.btnTxt}>{busy ? 'กำลังรับ...' : 'รับเลย'}</Text>
            </TouchableOpacity>
          )}

          <Text style={s.footnote}>ขาดเรียนเกิน 1 วัน Streak จะรีเซ็ตเป็น 0</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(40,30,20,0.55)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24,
  },
  card: {
    width: '100%', backgroundColor: '#FBF3E2', borderRadius: 20, padding: 22,
    borderWidth: 2, borderColor: '#E4D3AE', alignItems: 'center',
  },
  title: { fontFamily: 'Jersey', fontSize: 28, fontWeight: '900', color: '#C47A30', letterSpacing: 1 },
  sub: { fontFamily: 'PKNonthaburi', fontSize: 15, color: '#6E441B', opacity: 0.8, marginTop: 2, textAlign: 'center' },

  flameRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 16 },
  flameCircle: {
    width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#C2700F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 4,
  },
  dayRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  dayNum: { fontFamily: 'Jersey', fontSize: 40, fontWeight: '900', color: '#241509' },
  dayLabel: { fontFamily: 'PKNonthaburi', fontSize: 20, fontWeight: '700', color: '#2C1810' },
  daySub: { fontFamily: 'PKNonthaburi', fontSize: 14, color: '#6E441B', opacity: 0.7 },

  week: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 16 },
  cell: {
    flex: 1, marginHorizontal: 2, borderRadius: 8, paddingVertical: 6, alignItems: 'center', gap: 3,
    backgroundColor: '#F4ECDC', borderWidth: 1.5, borderColor: '#E6DBC7',
  },
  cellActive: { backgroundColor: '#FCEFD3', borderColor: '#E8B45E' },
  cellToday: { borderColor: '#E8862B', borderWidth: 2 },
  cellDay: { fontFamily: 'Jersey', fontSize: 14, fontWeight: '900', color: '#B6A88F' },
  cellDayActive: { color: '#7A4E13' },
  cellReward: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  cellStar: { width: 11, height: 11 },
  cellRewardTxt: { fontFamily: 'Jersey', fontSize: 13, fontWeight: '900', color: '#B6A88F' },

  rewardBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%',
    backgroundColor: '#F2EAD8', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16,
  },
  rewardLabel: { fontFamily: 'PKNonthaburi', fontSize: 17, fontWeight: '700', color: '#452817' },
  rewardValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rewardNum: { fontFamily: 'Jersey', fontSize: 26, fontWeight: '900', color: '#C47A30' },

  btn: { width: '100%', height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnClaim: { backgroundColor: '#4CC764' },
  btnDone: { backgroundColor: '#C47A30' },
  btnTxt: { fontFamily: 'Jersey', fontSize: 22, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },

  footnote: { fontFamily: 'PKNonthaburi', fontSize: 13, color: '#C17C66', marginTop: 10, textAlign: 'center' },
});
