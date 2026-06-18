// TraceWidthSim.js
// เควสย่อยแบบ simulation: ลาก slider ปรับความกว้างเส้นทองแดง (Trace Width)
// ให้พอดีกับกระแสที่โจทย์กำหนด — มี behavior tracking ในตัว
//
// สูตร: ความกว้าง (mil) = กระแส (A) × 50

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  PanResponder, Animated, Easing,
} from 'react-native';
import Svg, { Rect, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import Slider from '@react-native-community/slider';

// ════════════════════════════════════════════════════════════════════
//  1) BEHAVIOR TRACKER  — module singleton, เก็บ event ทั้งเกมไว้ในเครื่อง
// ════════════════════════════════════════════════════════════════════
// ใช้ง่าย ๆ: Tracker.log('event_name', {...}) ได้ทุกที่
// อยากดู: Tracker.dump()  /  อยากส่งขึ้น backend ทีหลัง: Tracker.flush()

const _events = [];

export const Tracker = {
  log(type, payload = {}) {
    _events.push({ type, ts: Date.now(), ...payload });
  },
  getEvents() {
    return _events.slice();
  },
  clear() {
    _events.length = 0;
  },
  // สรุปพฤติกรรมต่อเควส → ใช้ประเมินความเข้าใจ
  summarizeQuest(questId) {
    const ev = _events.filter(e => e.questId === questId);
    if (!ev.length) return null;

    const enter   = ev.find(e => e.type === 'quest_enter');
    const submits = ev.filter(e => e.type === 'answer_submit');
    const drags   = ev.filter(e => e.type === 'slider_settle'); // จุดที่หยุดนิ้ว
    const done    = ev.find(e => e.type === 'quest_complete');

    const firstSubmit = submits[0];
    const lastSubmit  = submits[submits.length - 1];

    // เวลาที่ใช้คิดก่อนตอบครั้งแรก
    const timeToFirstMs = (enter && firstSubmit)
      ? firstSubmit.ts - enter.ts : null;
    // เวลารวมจนผ่าน
    const totalMs = (enter && done) ? done.ts - enter.ts : null;

    // ── จับ misconception ────────────────────────────────────────────
    // under-spec = เลือกแคบกว่าค่าปลอดภัย (อันตราย — ไม่เข้าใจ safety margin)
    // over-spec  = เลือกกว้างเกิน (ปลอดภัยแต่เปลือง — เข้าใจครึ่งเดียว)
    const target = firstSubmit?.target ?? null;
    const underSpecTries = submits.filter(s => s.value < (s.target ?? Infinity)).length;
    const overSpecTries  = submits.filter(s => s.value > (s.target ?? -1) * 1.5).length;

    // ── จับ pattern การลาก ───────────────────────────────────────────
    // นับการเปลี่ยนทิศ (reversal) ของค่าที่หยุดนิ้ว
    // reversal น้อย + ตรงเป้า = เข้าใจ / reversal เยอะ = เดา-ลองผิดลองถูก
    let reversals = 0;
    for (let i = 2; i < drags.length; i++) {
      const d1 = drags[i - 1].value - drags[i - 2].value;
      const d2 = drags[i].value - drags[i - 1].value;
      if (d1 * d2 < 0) reversals++;
    }

    let approach = 'unknown';
    if (firstSubmit) {
      if (firstSubmit.correct && reversals <= 1) approach = 'confident';      // มั่นใจ ตรงเป้า
      else if (firstSubmit.correct)              approach = 'explored';        // ลองหลายค่าแล้วเจอ
      else if (underSpecTries >= 2)              approach = 'misconception';   // ลงต่ำซ้ำ → เข้าใจผิด
      else                                       approach = 'guessing';        // ตอบมั่ว
    }

    return {
      questId,
      target,
      attempts: submits.length,
      passedFirstTry: firstSubmit?.correct === true && submits.length === 1,
      finalValue: lastSubmit?.value ?? null,
      timeToFirstMs,
      totalMs,
      reversals,
      underSpecTries,
      overSpecTries,
      approach,
    };
  },
  // สรุปทั้งเกม → ภาพรวมว่าผู้เล่นรู้เรื่องแค่ไหน
  dump() {
    const ids = [...new Set(_events.filter(e => e.questId).map(e => e.questId))];
    return ids.map(id => this.summarizeQuest(id)).filter(Boolean);
  },
};

// ════════════════════════════════════════════════════════════════════
//  2) TRACE WIDTH SIMULATION  — mini-game แบบลาก slider
// ════════════════════════════════════════════════════════════════════
const MAX_MIL   = 300;            // ปลายสุดของ slider
const MIL_PER_A = 50;             // สูตร: mil = A × 50
const KNOB      = 26;

// แปลง ratio (mil ที่เลือก / mil ที่ต้องการ) → สถานะเส้นทองแดง
function traceState(ratio) {
  if (ratio < 0.5)  return { key: 'critical', color: '#FF3B30', glow: 1.0,
    msg: 'เส้นแคบมาก! กระแสเกินพิกัด → ร้อนจัด เส้นทองแดงกำลังจะขาด' };
  if (ratio < 1.0)  return { key: 'hot',      color: '#F2901E', glow: 0.6,
    msg: 'ยังแคบไป เส้นเริ่มร้อน — เพิ่มความกว้างอีกหน่อย' };
  if (ratio <= 1.5) return { key: 'good',     color: '#2EC8C0', glow: 0,
    msg: 'พอดี! เส้นทองแดงรับกระแสได้สบาย ไม่ร้อน' };
  return { key: 'wasteful', color: '#3A8FE8', glow: 0,
    msg: 'กว้างเกินจำเป็น — ปลอดภัยแต่เปลืองพื้นที่บอร์ดและทองแดง' };
}

export default function TraceWidthSim({
  current = 1,                 // กระแส (A) ที่โจทย์กำหนด
  questId = 'trace_1A',
  npcName = 'Skeleton',
  npcEmoji = '💀',
  prompt,
  onSuccess,
  onClose,
}) {
  const target = current * MIL_PER_A;            // ค่าที่ถูก
  const [trackW, setTrackW] = useState(0);
  const [mil, setMil] = useState(0);             // ค่าปัจจุบันบน slider
  const [result, setResult] = useState(null);    // 'correct' | 'wrong' | null
  const [attempts, setAttempts] = useState(0);

  const knobX = useRef(new Animated.Value(0)).current;
  const glowV = useRef(new Animated.Value(0)).current;
  const milRef = useRef(0);
  const settleTimer = useRef(null);
  const trackWRef = useRef(0);          // width ล่าสุด — กัน stale closure ใน PanResponder
  const setFromXRef = useRef(() => {}); // ตัว setter ล่าสุดให้ PanResponder เรียก

  const ratio = target > 0 ? mil / target : 0;
  const st = traceState(ratio);
  // ผ่านเมื่ออยู่ในช่วงปลอดภัยพอดี (1.0–1.5 เท่า) และตรงค่า target ±10%
  const isCorrect = Math.abs(mil - target) <= target * 0.1;

  // ── log ตอนเข้าเควส ───────────────────────────────────────────────
  useEffect(() => {
    Tracker.log('quest_enter', { questId, current, target });
  }, [questId]);

  // ── glow loop เมื่อเส้นร้อน ───────────────────────────────────────
  useEffect(() => {
    glowV.stopAnimation();
    if (st.glow > 0 && !result) {
      Animated.loop(Animated.sequence([
        Animated.timing(glowV, { toValue: st.glow, duration: 280, useNativeDriver: false, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(glowV, { toValue: st.glow * 0.3, duration: 280, useNativeDriver: false, easing: Easing.inOut(Easing.ease) }),
      ])).start();
    } else {
      Animated.timing(glowV, { toValue: 0, duration: 150, useNativeDriver: false }).start();
    }
  }, [st.key, result]);

  // เก็บค่าตอน "หยุดนิ้ว" (settle) — ใช้วิเคราะห์ pattern การลาก
  const logSettle = useCallback((v) => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      Tracker.log('slider_settle', { questId, value: v, target });
    }, 250);
  }, [questId, target]);

  const setFromX = useCallback((x) => {
    const w = trackWRef.current;
    if (!w) return;
    const clamped = Math.max(0, Math.min(w, x));
    const v = Math.round((clamped / w) * MAX_MIL);
    milRef.current = v;
    setMil(v);
    knobX.setValue(clamped);   // ตำแหน่ง knob ตามนิ้ว
    logSettle(v);
  }, [logSettle]);
  setFromXRef.current = setFromX;   // อัปเดต setter ล่าสุดทุกเรนเดอร์

  // ลากแบบสัมพัทธ์ (relative dx) — กันอาการ knob สั่น/กระโดดตอนจับครั้งที่สอง
  // locationX ไม่นิ่งเมื่อนิ้วไปโดน knob ที่ขยับอยู่ จึงใช้ dx จากจุดเริ่มจับแทน
  const gestureStartPx = useRef(0);

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      const w = trackWRef.current || 1;
      gestureStartPx.current = (milRef.current / MAX_MIL) * w; // เริ่มจากตำแหน่งปัจจุบัน
    },
    onPanResponderMove: (e, g) => setFromXRef.current(gestureStartPx.current + g.dx),
  })).current;

  const handleSubmit = () => {
    const n = attempts + 1;
    setAttempts(n);
    const correct = isCorrect;
    Tracker.log('answer_submit', {
      questId, value: mil, target, correct, attemptNo: n,
      ratio: Number(ratio.toFixed(2)),
    });
    if (correct) {
      setResult('correct');
      Tracker.log('quest_complete', { questId, finalValue: mil, attempts: n });
    } else {
      setResult('wrong');
    }
  };

  const handleRetry = () => setResult(null);

  // ── สีเส้นทองแดง (interpolate glow → เพิ่มความสว่างตอนร้อน) ──────────
  const traceFill = glowV.interpolate({
    inputRange: [0, 1],
    outputRange: [st.color, '#FFE08A'],
  });
  // ความหนาเส้นที่วาด (px) — map จาก mil
  const TRACE_MAX_PX = 64;
  const thicknessPx = Math.max(3, (mil / MAX_MIL) * TRACE_MAX_PX);

  return (
    <View style={s.screen}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={onClose} style={s.backBtn}>
          <Text style={s.backTxt}>◄ ออก</Text>
        </TouchableOpacity>
        <Text style={s.title}>TRACE WIDTH LAB</Text>
        <View style={{ width: 54 }} />
      </View>

      {/* โจทย์ */}
      <View style={s.parchment}>
        <Text style={s.parLabel}>{npcEmoji}  {npcName}</Text>
        <Text style={s.parTxt}>
          {prompt ?? `บอร์ดนี้มีกระแสไหลผ่าน ${current} แอมแปร์ (${current}A) — ลากปรับความกว้างเส้นทองแดงให้พอดี!`}
        </Text>
      </View>

      {/* เวที: เส้นทองแดงที่ปรับได้แบบ real-time */}
      <View style={s.stage}>
        <Svg width="100%" height="160" viewBox="0 0 320 160">
          <Defs>
            <LinearGradient id="board" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#1a6b3a" />
              <Stop offset="1" stopColor="#0f4f29" />
            </LinearGradient>
          </Defs>
          {/* แผ่น PCB */}
          <Rect x="0" y="0" width="320" height="160" fill="url(#board)" rx="8" />
          {/* แพดสองข้าง */}
          <Rect x="14" y={80 - thicknessPx / 2} width="34" height={thicknessPx} fill="#d9b24a" rx="2" />
          <Rect x="272" y={80 - thicknessPx / 2} width="34" height={thicknessPx} fill="#d9b24a" rx="2" />
          {/* เส้นทองแดง (ความหนา = mil) — ใช้ AnimatedRect ไม่ได้ตรง ๆ จึงวาดด้วย View ทับ */}
        </Svg>
        {/* เส้นทองแดงเป็น Animated.View ทับบน SVG เพื่อให้สีกระพริบได้ */}
        <Animated.View
          pointerEvents="none"
          style={[
            s.trace,
            {
              height: thicknessPx * (160 / 160), // สัดส่วนตาม viewBox≈px ของ stage
              backgroundColor: traceFill,
            },
          ]}
        />
        {/* ป้ายค่า mil ลอยกลางเส้น */}
        <View pointerEvents="none" style={s.milTag}>
          <Text style={s.milTagTxt}>{mil} mil</Text>
        </View>
      </View>

      {/* feedback บรรทัดเดียว เปลี่ยนตามสถานะ real-time */}
      <View style={[s.feedback, { borderColor: st.color }]}>
        <Text style={[s.feedbackTxt, { color: st.color }]}>{st.msg}</Text>
      </View>

      {/* SLIDER — community slider: นิ่ง ไม่สั่น ไม่ต้องจัดการ gesture เอง */}
      <View style={s.sliderWrap}>
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={0}
          maximumValue={MAX_MIL}
          step={1}
          value={mil}
          onValueChange={(v) => {
            const val = Math.round(v);
            milRef.current = val;
            setMil(val);
            logSettle(val);
          }}
          minimumTrackTintColor={st.color}
          maximumTrackTintColor="#2a3744"
          thumbTintColor="#FFD700"
        />
        {result === 'wrong' && (
          <Text style={[s.scaleTxt, { color: '#FFD700', textAlign: 'center', marginTop: 4 }]}>
            🎯 ค่าที่ถูก: {target} mil
          </Text>
        )}
        <View style={s.scaleRow}>
          <Text style={s.scaleTxt}>0</Text>
          <Text style={s.scaleTxt}>{MAX_MIL} mil</Text>
        </View>
      </View>

      {/* result / submit */}
      {result === 'correct' ? (
        <View style={s.resultBox}>
          <Text style={s.okTxt}>✅ เส้นทองแดงพอดี! ({mil} mil = {current}A × {MIL_PER_A})</Text>
          <TouchableOpacity style={s.nextBtn} onPress={onSuccess}>
            <Text style={s.nextTxt}>ต่อไป ▶</Text>
          </TouchableOpacity>
        </View>
      ) : result === 'wrong' ? (
        <View style={s.resultBox}>
          <Text style={s.wrongTxt}>
            ❌ ยังไม่พอดี — ค่าที่ถูกคือ {target} mil (เส้นประขาวบน slider)
          </Text>
          <TouchableOpacity style={s.retryBtn} onPress={handleRetry}>
            <Text style={s.retryTxt}>ลองอีกครั้ง</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[s.runBtn, mil === 0 && s.runDim]}
          onPress={handleSubmit}
          disabled={mil === 0}
        >
          <Text style={s.runTxt}>⚡ ยืนยันความกว้าง</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════
//  3) DEBUG PANEL  — ดูพฤติกรรมเบื้องหลัง (เปิดเฉพาะตอน dev)
// ════════════════════════════════════════════════════════════════════
const APPROACH_LABEL = {
  confident:     { t: 'เข้าใจชัด',      c: '#4CAF50' },
  explored:      { t: 'ลองแล้วเจอ',     c: '#3A8FE8' },
  guessing:      { t: 'เดา',            c: '#E8A020' },
  misconception: { t: 'เข้าใจผิด ⚠️',   c: '#D94040' },
  unknown:       { t: '-',              c: '#888' },
};

export function AnalyticsDebugPanel({ visible = false, onClose }) {
  const [rows, setRows] = useState([]);
  useEffect(() => { if (visible) setRows(Tracker.dump()); }, [visible]);
  if (!visible) return null;

  return (
    <View style={d.overlay}>
      <View style={d.panel}>
        <View style={d.head}>
          <Text style={d.headTxt}>🔬 Behavior Analytics</Text>
          <TouchableOpacity onPress={onClose}><Text style={d.close}>✕</Text></TouchableOpacity>
        </View>
        {rows.length === 0 ? (
          <Text style={d.empty}>ยังไม่มีข้อมูล — เล่นเควสก่อน</Text>
        ) : rows.map((r, i) => {
          const a = APPROACH_LABEL[r.approach] ?? APPROACH_LABEL.unknown;
          return (
            <View key={i} style={d.card}>
              <View style={d.cardHead}>
                <Text style={d.qid}>{r.questId}</Text>
                <Text style={[d.badge, { color: a.c, borderColor: a.c }]}>{a.t}</Text>
              </View>
              <Text style={d.line}>เป้า {r.target} mil · ตอบ {r.finalValue} mil · {r.attempts} ครั้ง</Text>
              <Text style={d.line}>
                คิดก่อนตอบ {r.timeToFirstMs != null ? (r.timeToFirstMs / 1000).toFixed(1) + 's' : '-'}
                {'  ·  '}รวม {r.totalMs != null ? (r.totalMs / 1000).toFixed(1) + 's' : '-'}
              </Text>
              <Text style={d.line}>
                เลื่อนกลับไปกลับมา {r.reversals} ครั้ง · ต่ำกว่าพิกัด {r.underSpecTries} · เกินพิกัด {r.overSpecTries}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0D1117' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#161B22', paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 2, borderBottomColor: '#C97D10',
  },
  backBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1.5, borderColor: '#555' },
  backTxt: { color: '#aaa', fontSize: 12, fontWeight: '600' },
  title: { fontSize: 14, fontWeight: 'bold', color: '#FFD700', letterSpacing: 1 },

  parchment: {
    backgroundColor: '#F7E7C4', marginHorizontal: 14, marginTop: 12,
    borderRadius: 8, borderWidth: 2, borderColor: '#C97D10', padding: 10,
  },
  parLabel: { fontSize: 12, fontWeight: '800', color: '#8B4513', marginBottom: 3 },
  parTxt: { fontSize: 13, color: '#3B2010', lineHeight: 19 },

  stage: {
    marginHorizontal: 14, marginTop: 14, height: 160,
    borderRadius: 8, overflow: 'hidden', justifyContent: 'center',
  },
  trace: {
    position: 'absolute', left: 40, right: 40, top: '50%',
    marginTop: -2, borderRadius: 3,
  },
  milTag: {
    position: 'absolute', alignSelf: 'center',
    backgroundColor: 'rgba(13,17,22,0.85)', borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  milTagTxt: { color: '#fff', fontSize: 15, fontWeight: '800', fontFamily: 'monospace' },

  feedback: {
    marginHorizontal: 14, marginTop: 12, padding: 10,
    borderRadius: 8, borderWidth: 1.5, backgroundColor: '#161B22',
  },
  feedbackTxt: { fontSize: 12.5, fontWeight: '600', textAlign: 'center', lineHeight: 18 },

  sliderWrap: { marginHorizontal: 24, marginTop: 22 },
  track: {
    height: 40, backgroundColor: '#1C2530', borderRadius: 20,
    justifyContent: 'center', borderWidth: 1, borderColor: '#2a3744',
  },
  trackFill: {
    position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 20, opacity: 0.35,
  },
  knob: {
    width: KNOB, height: KNOB, borderRadius: KNOB / 2,
    backgroundColor: '#FFD700', borderWidth: 3, borderColor: '#fff',
    marginLeft: 0,
  },
  targetMark: {
    position: 'absolute', top: -6, bottom: -6, width: 0,
    borderLeftWidth: 2, borderLeftColor: '#fff', borderStyle: 'dashed',
  },
  scaleRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  scaleTxt: { color: '#667', fontSize: 11 },

  runBtn: {
    backgroundColor: '#C97D10', marginHorizontal: 14, marginTop: 'auto', marginBottom: 20,
    borderRadius: 10, paddingVertical: 15, alignItems: 'center',
  },
  runDim: { opacity: 0.35 },
  runTxt: { color: '#fff', fontSize: 15, fontWeight: 'bold', letterSpacing: 0.5 },

  resultBox: { marginHorizontal: 14, marginTop: 'auto', marginBottom: 20, gap: 10, alignItems: 'center' },
  okTxt: { color: '#4CAF50', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  wrongTxt: { color: '#E8908F', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  nextBtn: { width: '100%', backgroundColor: '#C97D10', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  nextTxt: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 9, borderRadius: 8, borderWidth: 1.5, borderColor: '#D94040' },
  retryTxt: { color: '#D94040', fontSize: 13, fontWeight: '600' },
});

const d = StyleSheet.create({
  overlay: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 18, zIndex: 999,
  },
  panel: { backgroundColor: '#161B22', borderRadius: 12, borderWidth: 1.5, borderColor: '#C97D10', padding: 14, maxHeight: '80%' },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headTxt: { color: '#FFD700', fontSize: 15, fontWeight: 'bold' },
  close: { color: '#aaa', fontSize: 18, paddingHorizontal: 6 },
  empty: { color: '#888', fontSize: 13, textAlign: 'center', paddingVertical: 20 },
  card: { backgroundColor: '#1C2530', borderRadius: 8, padding: 10, marginBottom: 8 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  qid: { color: '#fff', fontSize: 13, fontWeight: '700', fontFamily: 'monospace' },
  badge: { fontSize: 11, fontWeight: '700', borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 1 },
  line: { color: '#9aa7b5', fontSize: 11.5, lineHeight: 17 },
});