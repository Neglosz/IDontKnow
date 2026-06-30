// ============================================================================
//  MiniGames.js — "เครื่องเกมกลาง" 6 ตัว แบบ data-driven (reuse ทุก node ผ่าน data)
// ----------------------------------------------------------------------------
//  ปรัชญา: ไม่คิด kind ใหม่ต่อ node — ใช้ engine กลางไม่กี่ตัว ป้อน data ง่าย/ยาก
//    • มอนสเตอร์อ่อน = engine + data ง่าย
//    • บอสของ node   = engine เดิม + data ยาก + boss:true (มีเงื่อนไขแพ้)
//
//  ทุกเกมเป็น "ลงมือทำ" (แตะ/จับคู่/เรียง/ปรับ) ไม่ใช่กาช้อย และปล่อย evidence
//  ผ่าน useSimSession → ป้อน Quiz Accuracy / Level Score ที่มีอยู่แล้ว
//
//  kind ที่รองรับ:  wire | sort | sequence | select | diagnose | tune
//  ทุก step ใช้สัญญาเดียวกัน: { kind, questId?, boss?, npc, emoji, title, brief,
//                              ...ข้อมูลเฉพาะ engine..., success:[...], error:[...] }
// ============================================================================
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, PanResponder, Animated, Dimensions, Easing, Image, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line, Text as SvgText, G, Defs, LinearGradient as SvgLG, Stop } from 'react-native-svg';
import { useSimSession } from './simEngine';
import { PartArt, hasPartArt, CardboardBox, BatteryRail, SchematicSymbol } from './PartArt';
import { S, SEQ_PADL } from './minigameStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

// ปุ่มไล่เฉดสไตล์แอป (กระดาษ/ทอง)
const BTN_GOLD = ['#DEA569', '#C47A2D', '#C47A2D', '#854F18'];
const BTN_GREEN = ['#86D89A', '#46B25E', '#46B25E', '#2E7D32'];
const BTN_RED = ['#EC9A9A', '#D94040', '#D94040', '#A82C2C'];

// โค้ชสอนเล่นครั้งแรกของเกม diagnose (RepairBench)
const COACH_KEY = 'coach_diagnose_v3';
const COACH_ALWAYS = true;   // 🔧 โหมดเทสต์: โชว์สอนทุกครั้ง ยังไม่จำ — ตั้งเป็น false เมื่อพร้อมจริง

// path สี่เหลี่ยมมุมมน (ใช้เจาะรูสปอตไลต์โค้ชด้วย fillRule evenodd)
const roundRectPath = (x, y, w, h, r) => {
  const rr = Math.min(r, w / 2, h / 2);
  return `M ${x + rr} ${y} H ${x + w - rr} A ${rr} ${rr} 0 0 1 ${x + w} ${y + rr}`
    + ` V ${y + h - rr} A ${rr} ${rr} 0 0 1 ${x + w - rr} ${y + h}`
    + ` H ${x + rr} A ${rr} ${rr} 0 0 1 ${x} ${y + h - rr}`
    + ` V ${y + rr} A ${rr} ${rr} 0 0 1 ${x + rr} ${y} Z`;
};

// มาสคอต PIPO (ฮิปโป) — สไปรต์ชีตเดียวกับหน้า ScanScreen
const HIPPO_SRC = require('../../assets/hippo.png');
function HippoSprite({ size = 76, totalFrames = 4, fps = 5 }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame(p => (p + 1) % totalFrames), 1000 / fps);
    return () => clearInterval(id);
  }, [totalFrames, fps]);
  return (
    <View style={{ width: size, height: size, overflow: 'hidden' }}>
      <Image source={HIPPO_SRC} resizeMode="cover"
        style={{ width: size * totalFrames, height: size, marginLeft: -size * frame }} />
    </View>
  );
}
const COACH_TEXT = [
  'นี่คือโต๊ะซ่อมบอร์ด 🛠️ เป้าหมาย: หา “เส้นที่ขาด” แล้วบัดกรีต่อกลับให้วงจรครบ',
  '👉 แตะเส้นใดก็ได้เพื่อ “วัดค่า” — ดูผลบนจอมิเตอร์ด้านบน',
  '🔢 ตัวเลข = ไฟปกติ · ถ้าขึ้น “O.L” = เส้นนั้นขาด! ลองวัดให้เจอเส้นที่ขึ้น O.L',
  '🔧 เจอเส้น O.L แล้ว — กดปุ่มด้านล่างเพื่อ “หยิบหัวแร้ง” ⬇',
  '🛠️ แตะ “เส้นที่ขาด” เพื่อบัดกรีต่อกลับ ให้วงจรครบ',
];

const WIRE_COLORS = ['#E5484D', '#E8A020', '#F2C14E', '#3FAE5A', '#B0703A', '#E67E22'];

// จานสีสายจัมเปอร์ตามมาตรฐาน (เลือกสีถูก = คะแนนพิเศษ)
const WIRE_PALETTE = [
  { key: 'sig', color: '#F2C14E', dark: '#9C7A1E', label: 'สัญญาณ' },   // เหลือง
  { key: 'pwr', color: '#E5484D', dark: '#94262A', label: 'ไฟเลี้ยง' }, // แดง
  { key: 'gnd', color: '#5A4632', dark: '#3A2A1A', label: 'กราวด์' },   // น้ำตาลเข้ม (แทนดำ)
];
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// เหตุการณ์จริงเมื่อต่อผิด (จาก misconception → ผลทางฟิสิกส์ที่ "เห็นภาพ")
const SHORT_OUTCOMES = {
  mcu_direct_drive: { fx: 'burn',  txt: '💥 ESP32 ไหม้! มอเตอร์ดึงกระแสเกินที่ขา MCU จ่ายไหว (overcurrent)' },
  no_flyback:       { fx: 'spark', txt: '⚡ ทรานซิสเตอร์พังจากแรงดันย้อน (flyback) ตอนมอเตอร์หยุด — ลืมไดโอด!' },
  diode_misplaced:  { fx: 'spark', txt: '⚡ ไดโอดวางผิดที่ ไม่กันไฟย้อน — ทรานซิสเตอร์เสี่ยงพัง' },
  reverse_polarity: { fx: 'burn',  txt: '💥 ต่อกลับขั้ว! จ่ายไฟแล้วระบบไม่ติด/อุปกรณ์เสียหาย' },
  ground_to_power:  { fx: 'short', txt: '🔥 กราวด์ชนไฟบวก = ลัดวงจร! กระแสพุ่งจนร้อน' },
  switch_to_power:  { fx: 'short', txt: '🔥 ปุ่มลัดไฟเลี้ยงลงกราวด์ = ช็อต!' },
  switch_as_power:  { fx: 'short', txt: '🔥 เอาปุ่มไปตัดไฟหลัก = ลัดวงจร' },
  switch_no_path:   { fx: 'spark', txt: '⚠️ ปุ่มต่อ VCC ไม่มีทางลงกราวด์ บอร์ดอ่านการกดไม่ได้' },
  wiper_to_power:   { fx: 'flat',  txt: '📉 wiper ตรึงที่ไฟเลี้ยง ค่าอนาล็อกนิ่งสุดขอบ ไม่ขยับ' },
  wiper_to_ground:  { fx: 'flat',  txt: '📉 wiper ตรึงที่กราวด์ ค่าอนาล็อกเป็น 0 ตลอด' },
  power_to_adc:     { fx: 'flat',  txt: '📉 เอาขั้วไฟตรงเข้า ADC อ่านได้แต่ค่าคงที่ ไม่ใช่การเลื่อนสติ๊ก' },
  shared_pin:       { fx: 'spark', txt: '⚠️ ใช้ขา GPIO เดียวกันซ้ำ สองปุ่มชนกัน อ่านแยกไม่ได้' },
};

export const MINIGAME_KINDS = ['wire', 'sort', 'sequence', 'select', 'diagnose', 'tune', 'polarity', 'codefill'];
const BIN_DOT = ['#4EA36A', '#C47A2D', '#9A6E1E', '#E0564F', '#CAA24A'];

const completenessOf = (correct, total) =>
  correct >= total ? 'full' : correct > 0 && correct >= total / 2 ? 'partial' : 'none';

// ── ของตกแต่งพรีเมียม (โลหะ/PCB) ─────────────────────────────────────────────
const { width: SCRW, height: SCRH } = Dimensions.get('window');

// พื้นหลังกระดาษครีม (เข้าธีมแอป — เหมือนหน้า ScanScreen) + เนื้อกระดาษจาง ๆ
function LabBg() {
  const dots = []; for (let i = 0; i < 30; i++) dots.push([(i * 61 + 20) % SCRW, (i * 97 + 30) % SCRH, ((i * 7) % 2) + 1]);
  return (
    <Svg style={StyleSheet.absoluteFill} width={SCRW} height={SCRH} pointerEvents="none">
      <Rect x="0" y="0" width={SCRW} height={SCRH} fill="#F7F1E5" />
      {dots.map(([x, y, r], i) => <Circle key={i} cx={x} cy={y} r={r} fill="#6E441B" opacity="0.04" />)}
    </Svg>
  );
}

// ปุ่มไล่เฉดสไตล์แอป (ขอบน้ำตาลเข้ม + ข้อความขาว)
function GradBtn({ onPress, disabled, colors, style, children }) {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={disabled} style={[S.gbtn, style, disabled && S.runDim]}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
      <Text style={S.gbtnTxt}>{children}</Text>
    </TouchableOpacity>
  );
}

// ป้ายเตือนไฟฟ้าแรงสูง (สามเหลี่ยม + ฟ้าผ่า)
function WarnBadge({ w = 22, danger }) {
  return (
    <Svg width={w} height={w} viewBox="0 0 40 40">
      <Path d="M20 3 L37.5 36 H2.5 Z" fill={danger ? '#E0564F' : '#F2C14E'} stroke="#0B0E12" strokeWidth="2.6" strokeLinejoin="round" />
      <Path d="M22.5 11 L13 25 H19 L17 33 L27.5 18 H21 Z" fill="#0B0E12" />
    </Svg>
  );
}

// ตะแกรงไมโคร (micro-grille) ในกรอบ PCB
function Grille({ w, h }) {
  const dots = [];
  for (let y = 7; y < h; y += 8) for (let x = 9; x < w; x += 11) dots.push([x, y]);
  return (
    <Svg width={w} height={h} style={StyleSheet.absoluteFill} pointerEvents="none">
      {dots.map(([x, y], i) => <Circle key={i} cx={x} cy={y} r="0.85" fill="#39E08A" opacity="0.09" />)}
    </Svg>
  );
}

// มอเตอร์สั่นของจอย (DC vibration motor) — วาดนิ่ง ๆ ทั้งตัวสั่นตอนทำงาน (เสถียร ไม่หมุนข้างใน)
function VibeMotor({ buzz }) {
  return (
    <Svg width={112} height={60} viewBox="0 0 112 60">
      <Defs>
        <SvgLG id="vm_can" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#CDD3DB" /><Stop offset="0.5" stopColor="#949CA8" /><Stop offset="1" stopColor="#5C646F" />
        </SvgLG>
        <SvgLG id="vm_w" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E7C46A" /><Stop offset="1" stopColor="#A77E22" />
        </SvgLG>
      </Defs>
      {/* สายมอเตอร์ */}
      <Path d="M20 26 q-9 2 -14 -3" stroke="#E5484D" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <Path d="M20 34 q-9 5 -14 1" stroke="#2B313B" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      {/* คลื่นการสั่น (โชว์ตอนทำงาน) */}
      {buzz && <G>
        <Path d="M24 16 q-7 14 0 28" stroke="#54E07A" strokeWidth="2.2" fill="none" opacity="0.75" />
        <Path d="M100 16 q7 14 0 28" stroke="#54E07A" strokeWidth="2.2" fill="none" opacity="0.75" />
      </G>}
      {/* กระบอกมอเตอร์ (cylinder) */}
      <Rect x="26" y="16" width="54" height="28" rx="13" fill="url(#vm_can)" stroke="#3a414b" strokeWidth="1.3" />
      <Rect x="33" y="19" width="40" height="3.6" rx="1.8" fill="#FFFFFF" opacity="0.42" />
      <Line x1="66" y1="17" x2="66" y2="43" stroke="#3a414b" strokeWidth="1" opacity="0.45" />
      <SvgText x="48" y="34" fontSize="13" fontWeight="bold" fill="#2A2F37" textAnchor="middle" fontFamily="monospace">M</SvgText>
      {/* เพลา */}
      <Line x1="80" y1="30" x2="88" y2="30" stroke="#cfd3d8" strokeWidth="3" />
      {/* ตุ้มถ่วงเยื้องศูนย์ (half-disc) — หนักข้างเดียว */}
      <Path d="M88 17 A13 13 0 0 1 88 43 Z" fill="url(#vm_w)" stroke="#6E4E16" strokeWidth="1.1" />
      <Circle cx="88" cy="30" r="2.2" fill="#4A525E" stroke="#2A3038" strokeWidth="0.7" />
    </Svg>
  );
}

// ปลายสายไฟปอกฉนวน (ใช้ในถาดเครื่องมือ)
function WireEnd({ color }) {
  return (
    <Svg width={44} height={18} viewBox="0 0 44 18">
      <Rect x="0" y="5" width="28" height="9" rx="4.5" fill={color} />
      <Rect x="2" y="6" width="24" height="2.8" rx="1.4" fill="#FFFFFF" opacity="0.3" />
      <Rect x="27" y="7" width="15" height="5" rx="2" fill="#C8843C" />
      <Rect x="27" y="7" width="15" height="1.7" rx="1" fill="#F0C896" />
    </Svg>
  );
}

// ── UI ร่วม ─────────────────────────────────────────────────────────────────
function Shell({ step, children, footer, noScroll, overlay }) {
  return (
    <View style={S.screen}>
      <LabBg />
      <StatusBar barStyle="dark-content" backgroundColor="#F7F1E5" />
      <View style={S.topBar}>
        <TouchableOpacity onPress={step.onClose} style={S.backBtn}>
          <Text style={S.backTxt}>◄ ออก</Text>
        </TouchableOpacity>
        <Text style={S.title} numberOfLines={1}>{step.title ?? 'ภารกิจ'}</Text>
        <View style={step.boss ? S.bossTag : { width: 56 }}>
          {step.boss ? <Text style={S.bossTagTxt}>BOSS</Text> : null}
        </View>
      </View>
      <View style={[S.parchment, step.boss && S.parchmentBoss]}>
        <Text style={S.parLabel}>{step.emoji}  {step.npc}</Text>
        <Text style={S.parTxt}>{step.brief}</Text>
      </View>
      {noScroll
        ? <View style={{ flex: 1 }}>{children}</View>
        : <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 16 }}>{children}</ScrollView>}
      {footer}
      {overlay}
    </View>
  );
}
function RunBtn({ label, disabled, onPress }) {
  return (
    <GradBtn colors={BTN_GOLD} disabled={disabled} onPress={onPress}
      style={{ marginHorizontal: 14, marginTop: 10, marginBottom: 20, alignSelf: 'stretch' }}>
      {label}
    </GradBtn>
  );
}
function ResultBar({ result, okText, badText, onNext, onRetry }) {
  if (!result) return null;
  if (result === 'correct') {
    return (
      <View style={S.resultBox}>
        <View style={S.okPanel}><Text style={S.okTxt}>✅ {okText}</Text></View>
        <GradBtn colors={BTN_GREEN} onPress={onNext} style={{ alignSelf: 'stretch' }}>ต่อไป ▶</GradBtn>
      </View>
    );
  }
  return (
    <View style={S.resultBox}>
      <View style={S.errPanel}><Text style={S.wrongTxt}>❌ {badText}</Text></View>
      <GradBtn colors={BTN_RED} onPress={onRetry} style={{ alignSelf: 'stretch' }}>⟲ ลองอีกครั้ง</GradBtn>
    </View>
  );
}
const firstStr = (arr, fallback) => (Array.isArray(arr) ? arr[0] : arr) ?? fallback;

// ════════════════════════════════════════════════════════════════════
//  WIRE — จับคู่/ต่อสาย ซ้าย→ขวา (pinout, ขั้ว, กราวด์ร่วม ฯลฯ)
//  data: left:[{id,label,icon}], right:[{id,label,icon}],
//        pairs:[[leftId,rightId]], traps?:{'leftId->rightId': misId}
// ════════════════════════════════════════════════════════════════════
// ไอคอนข้างป้ายขา: ใช้ "ของจริง" (PartArt) ถ้ามี → ไม่งั้นใช้สัญลักษณ์วงจร → ไม่งั้น emoji
function WireIcon({ art, icon }) {
  if (art && hasPartArt(art)) {
    return (
      <View style={S.wireArt}>
        <PartArt kind={art} w={30} />
      </View>
    );
  }
  if (art) {
    return (
      <View style={S.wireSym}>
        <SchematicSymbol kind={art} w={26} />
      </View>
    );
  }
  if (icon) return <Text style={S.wireIcon}>{icon}</Text>;
  return null;
}
function WireGame({ step, onSuccess, onClose }) {
  const sess = useSimSession({ questId: step.questId ?? 'wire', archetype: 'wire', parMs: step.boss ? 30000 : 18000 });
  const left = step.left ?? [], right = step.right ?? [], pairs = step.pairs ?? [];
  const [conn, setConn] = useState({});           // { leftId: { to } }
  const [active, setActive] = useState(null);     // ขั้วทองซ้ายที่เลือกอยู่ (แตะ→แตะ)
  const [result, setResult] = useState(null);
  const [outcome, setOutcome] = useState(null);   // { fx, txt } ผลทางฟิสิกส์เมื่อผิด
  const [badLeft, setBadLeft] = useState([]);
  const [W, setW] = useState(0);
  // เลือกสีสายให้อัตโนมัติตามหน้าที่ของขาปลายทาง (ไฟเลี้ยง=แดง, กราวด์=ดำ, สัญญาณ=เหลือง)
  const WT_COLOR = { pwr: '#E5484D', gnd: '#3B4250', sig: '#F2C14E' };
  const wireColor = (rid, i) => {
    const rp = right.find(r => r.id === rid);
    return (rp?.wireType && WT_COLOR[rp.wireType]) || WIRE_COLORS[i % WIRE_COLORS.length];
  };
  // สลับลำดับฝั่งขวา (ครั้งเดียว) เพื่อไม่ให้ต่อตรงแถวเดียวกันแล้วถูก — ต้องจับคู่ตามหน้าที่จริง
  const [rOrder] = useState(() => {
    const idx = right.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    if (idx.length > 1 && idx.every((v, i) => v === i)) idx.push(idx.shift()); // กันกรณีสุ่มได้เรียงเดิม
    return idx;
  });

  const rows = Math.max(left.length, right.length);
  const PADR = 13, PITCH = 78, TOP = 48;
  const motorStep = left.some(p => p.art === 'motor') || right.some(p => p.art === 'motor');
  const MOTOR_H = 92;                                   // แถบว่างด้านล่างไว้วางมอเตอร์
  const padArea = TOP * 2 + Math.max(0, rows - 1) * PITCH;
  const H = padArea + (motorStep ? MOTOR_H : 0);
  const leftX = (W || 1) * 0.43, rightX = (W || 1) * 0.57;
  const yOf = (i) => TOP + i * PITCH;
  const leftPos = left.map((l, i) => ({ ...l, side: 'L', x: leftX, y: yOf(i) }));
  const rightPos = rOrder.map((ri, k) => ({ ...right[ri], side: 'R', x: rightX, y: yOf(k) }));

  // ── current-flow / juice animations ──────────────────────────────────────
  const flow = useRef(new Animated.Value(0)).current;   // วิ่งไฟตามสาย
  const shake = useRef(new Animated.Value(0)).current;   // สั่นตอนช็อต
  const fxA = useRef(new Animated.Value(0)).current;     // ควัน/ประกายไฟ
  const spin = useRef(new Animated.Value(0)).current;    // มอเตอร์หมุน
  useEffect(() => {
    const a = Animated.loop(Animated.timing(flow, { toValue: 1, duration: 700, useNativeDriver: false }));
    a.start(); return () => a.stop();
  }, [flow]);
  useEffect(() => {
    if (result !== 'correct') return;
    // สั่นทั้งตัว (translate บน View) — ใช้ native driver ให้ลื่นและเสถียร
    const a = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 120, useNativeDriver: true }));
    a.start(); return () => a.stop();
  }, [result, spin]);
  const dashOff = flow.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });
  const vibX = spin.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, -2.4, 0, 2.4, 0] });
  const vibY = spin.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, 1.8, 0, -1.8, 0] });
  const fxOpacity = fxA.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] });
  const fxRise = fxA.interpolate({ inputRange: [0, 1], outputRange: [0, -46] });

  // ── แตะ→แตะ: แตะขั้วทองซ้ายก่อน แล้วแตะขั้วปลายทางขวา ────────────────────
  const tapLeft = (id) => {
    if (result) return;
    if (conn[id]) { setConn(c => { const n = { ...c }; delete n[id]; return n; }); setActive(null); setBadLeft([]); return; }
    setActive(a => (a === id ? null : id));
  };
  const tapRight = (id) => {
    if (result || active == null) return;
    setConn(c => ({ ...c, [active]: { to: id } }));
    setActive(null); setBadLeft([]);
  };

  const run = () => {
    let correct = 0, total; const bad = []; const mis = new Set();
    const got = (lid) => conn[lid]?.to;
    if (step.need) {
      const rById = Object.fromEntries(right.map(r => [r.id, r]));
      const used = new Set();
      total = left.length;
      left.forEach(l => {
        const g = got(l.id); const r = g ? rById[g] : null;
        if (r && r.group === step.need && !used.has(g)) { correct++; used.add(g); }
        else if (r) { bad.push(l.id); const t = step.trap?.[r.group]; if (t) mis.add(t); else if (used.has(g)) mis.add('shared_pin'); }
      });
    } else {
      // ปลายทางของแต่ละขาเป็นได้ทั้ง string หรือ array
      const want = Object.fromEntries(pairs.map(([l, r]) => [l, r]));
      total = pairs.length;
      const used = new Set();   // ใช้กันซ้ำเฉพาะกรณี "สลับปลายทางได้" (array) เท่านั้น
      left.forEach(l => {
        const g = got(l.id); const w = want[l.id];
        if (Array.isArray(w)) {
          // ปลายทางสลับกันได้ (เช่น ขาริม pot → VCC/GND อันไหนก็ได้) — ห้ามใช้ปลายทางเดียวกันซ้ำ
          if (g && w.includes(g) && !used.has(g)) { correct++; used.add(g); }
          else if (g) { bad.push(l.id); const t = step.traps?.[`${l.id}->${g}`]; if (t) mis.add(t); }
        } else {
          // ปลายทางเดียว — อนุญาตให้หลายขามารวมจุดเดียวกันได้ (เช่น กราวด์ร่วม)
          if (g && g === w) correct++;
          else if (g) { bad.push(l.id); const t = step.traps?.[`${l.id}->${g}`]; if (t) mis.add(t); }
        }
      });
    }
    const ok = correct === total && Object.keys(conn).length === total;
    sess.submit({ correct: ok, misconceptions: [...mis] });
    if (ok) {
      sess.complete({ completeness: 'full' }); setResult('correct'); setBadLeft([]);
    } else {
      setBadLeft(bad);
      const firstMis = [...mis][0];
      setOutcome(SHORT_OUTCOMES[firstMis] ?? { fx: 'spark', txt: firstStr(step.error, 'ยังมีเส้นต่อผิด ลองดูใหม่') });
      sess.complete({ completeness: completenessOf(correct, total) });
      setResult('wrong');
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 1, duration: 50, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
      fxA.setValue(0);
      Animated.timing(fxA, { toValue: 1, duration: 1100, useNativeDriver: true }).start();
    }
  };

  const wirePath = (ax, ay, bx, by) => {
    const c = Math.max(20, Math.abs(bx - ax) * 0.5);
    const d1 = bx >= ax ? c : -c;
    return `M ${ax} ${ay} C ${ax + d1} ${ay}, ${bx - d1} ${by}, ${bx} ${by}`;
  };
  const labelW = Math.max(40, leftX - PADR - 24);
  const rLabelLeft = rightX + 36, rLabelW = Math.max(40, W - rLabelLeft - 10);
  const badPad = badLeft.length ? leftPos.find(l => l.id === badLeft[0]) : null;

  const okMsg = firstStr(step.success, 'ต่อถูกหมด!');

  return (
    <Shell step={{ ...step, onClose }} footer={
      !result
        ? <RunBtn label="⚡ จ่ายไฟ & ตรวจวงจร" disabled={Object.keys(conn).length === 0} onPress={run} />
        : <ResultBar result={result} okText={okMsg} badText={outcome?.txt ?? firstStr(step.error, 'ยังมีเส้นต่อผิด')}
            onNext={onSuccess} onRetry={() => { setResult(null); setConn({}); setActive(null); setBadLeft([]); setOutcome(null); sess.bump('resets'); }} />
    }>
      <Animated.View style={[S.wireCanvas, { transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-7, 7] }) }] }]}
        onLayout={e => { const w = e.nativeEvent.layout.width; if (w && Math.abs(w - W) > 1) setW(w); }}>
        {W > 0 && (
          <Svg width={W} height={H} pointerEvents="none">
            <Defs>
              <SvgLG id="wg_grn" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#EBDCBC" /><Stop offset="1" stopColor="#D8C29A" /></SvgLG>
              <SvgLG id="wg_dark" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#E4D4B2" /><Stop offset="1" stopColor="#CDB68C" /></SvgLG>
              <SvgLG id="wg_pin" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#F6DD93" /><Stop offset="0.5" stopColor="#D9A841" /><Stop offset="1" stopColor="#9A6E1E" /></SvgLG>
              <SvgLG id="wg_term" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#2E8B57" /><Stop offset="1" stopColor="#185030" /></SvgLG>
            </Defs>

            {/* แผ่นบอร์ดซ้าย = โมดูล (โทนกระดาษ ขอบน้ำตาล) */}
            <Rect x="8" y="8" width={leftX + 6 - 8} height={padArea - 16} rx="10" fill="url(#wg_grn)" stroke="#2C1810" strokeWidth="2" />
            <Circle cx="20" cy="20" r="4.3" fill="#F7F1E5" stroke="#6E441B" strokeWidth="1.2" />
            <Circle cx="20" cy={padArea - 20} r="4.3" fill="#F7F1E5" stroke="#6E441B" strokeWidth="1.2" />
            <SvgText x="31" y="22" fontSize="9" fill="#6E441B" fontFamily="monospace" fontWeight="bold">MODULE</SvgText>

            {/* แผ่นบอร์ดขวา = ESP32 (โทนกระดาษ) */}
            <Rect x={rightX - 6} y="8" width={W - 8 - (rightX - 6)} height={padArea - 16} rx="10" fill="url(#wg_dark)" stroke="#2C1810" strokeWidth="2" />
            <SvgText x={W - 14} y="24" fontSize="10" fill="#6E441B" textAnchor="end" fontWeight="bold" fontFamily="monospace">ESP32</SvgText>
            <Rect x={W - 58} y={padArea - 24} width="14" height="9" rx="1.5" fill="#A9885E" />
            <Rect x={W - 40} y={padArea - 24} width="14" height="9" rx="1.5" fill="#A9885E" />

            {/* ฐานวางมอเตอร์สั่น (แถบว่างด้านล่าง) */}
            {motorStep && <G>
              <Line x1="20" y1={padArea + 4} x2={W - 20} y2={padArea + 4} stroke="#B7A079" strokeWidth="1" strokeDasharray="2 4" />
              <Rect x={W / 2 - 60} y={padArea + 14} width="120" height="64" rx="9" fill="#EFE7DA" stroke="#2C1810" strokeWidth="2" />
              <SvgText x={W / 2} y={padArea + 74} fontSize="8" fill="#6E441B" textAnchor="middle" fontFamily="monospace" letterSpacing="1">VIBRATION MOTOR</SvgText>
            </G>}

            {/* ลายทองแดงสั้นเข้าขั้ว */}
            {leftPos.map((p) => <Path key={'lt' + p.id} d={`M ${p.x} ${p.y} H ${p.x - 30}`} stroke="#C9A24A" strokeWidth="2.5" opacity="0.5" />)}
            {rightPos.map((p) => <Path key={'rt' + p.id} d={`M ${p.x} ${p.y} H ${p.x + 30}`} stroke="#8A9099" strokeWidth="2.5" opacity="0.45" />)}

            {/* สายจัมเปอร์ที่ต่อแล้ว (ไฟวิ่งตามสาย) */}
            {leftPos.map((p, i) => {
              const e = conn[p.id]; if (!e) return null;
              const b = rightPos.find(r => r.id === e.to); if (!b) return null;
              const bad = badLeft.includes(p.id);
              const col = bad ? '#D94040' : (result === 'correct' ? '#3FAE5A' : wireColor(e.to, i));
              const d = wirePath(p.x + PADR, p.y, b.x - PADR, b.y);
              return (
                <G key={'w' + p.id}>
                  <Path d={d} stroke="#05070A" strokeWidth="7" fill="none" strokeLinecap="round" opacity="0.5" />
                  <Path d={d} stroke={col} strokeWidth="5" fill="none" strokeLinecap="round" />
                  {!bad && <AnimatedPath d={d} stroke="#FFFFFF" strokeWidth="2.4" fill="none" strokeLinecap="round"
                    strokeDasharray="6 14" strokeDashoffset={dashOff} opacity={result === 'correct' ? 0.95 : 0.55} />}
                </G>
              );
            })}

            {/* ขั้วต่อ: ซ้าย = เทอร์มินอลบล็อก (สกรู) · ขวา = พินเฮดเดอร์ทอง */}
            {[...leftPos, ...rightPos].map((p) => {
              const connected = p.side === 'L' ? !!conn[p.id] : leftPos.some(l => conn[l.id]?.to === p.id);
              const bad = p.side === 'L' ? badLeft.includes(p.id) : leftPos.some(l => badLeft.includes(l.id) && conn[l.id]?.to === p.id);
              const ringCol = bad ? '#E0564F' : (result === 'correct' && connected ? '#3FAE5A' : '#FFD700');
              const isActive = p.side === 'L' && active === p.id;          // ขั้วซ้ายที่เลือกอยู่
              const isTarget = p.side === 'R' && active != null && !result; // ปลายทางที่จิ้มได้
              const showRing = connected || isActive;
              if (p.side === 'L') {
                return (
                  <G key={p.side + p.id}>
                    {isActive && <Rect x={p.x - 21} y={p.y - 18} width="38" height="36" rx="7" fill="none" stroke="#FFD700" strokeWidth="2.5" />}
                    <Rect x={p.x - 17} y={p.y - 14} width="31" height="28" rx="5" fill="url(#wg_term)" stroke="#0E3A22" strokeWidth="1" />
                    <Rect x={p.x - 17} y={p.y - 14} width="31" height="3" rx="2" fill="#FFFFFF" opacity="0.2" />
                    {showRing && <Circle cx={p.x} cy={p.y} r={PADR + 2.5} fill="none" stroke={ringCol} strokeWidth="2.5" opacity="0.9" />}
                    <Circle cx={p.x} cy={p.y} r={PADR} fill="url(#wg_pin)" stroke="#7A571A" strokeWidth="1" />
                    <Line x1={p.x - 5} y1={p.y - 5} x2={p.x + 5} y2={p.y + 5} stroke="#6E4E16" strokeWidth="2" strokeLinecap="round" />
                  </G>
                );
              }
              const s = PADR * 1.45;
              return (
                <G key={p.side + p.id}>
                  {isTarget && <Rect x={p.x - PADR - 7} y={p.y - PADR - 7} width={(PADR + 7) * 2} height={(PADR + 7) * 2} rx="6" fill="none" stroke="#C47A2D" strokeWidth="2" strokeDasharray="3 3" />}
                  {showRing && <Rect x={p.x - PADR - 4} y={p.y - PADR - 4} width={(PADR + 4) * 2} height={(PADR + 4) * 2} rx="6" fill="none" stroke={ringCol} strokeWidth="2.5" opacity="0.9" />}
                  <Rect x={p.x - 11} y={p.y - 14} width="22" height="28" rx="3" fill="#0A0E14" stroke="#2a3346" strokeWidth="1" />
                  <Rect x={p.x - s / 2} y={p.y - s / 2} width={s} height={s} rx="2.5" fill="url(#wg_pin)" stroke="#7A571A" strokeWidth="1" />
                  <Rect x={p.x - s / 2} y={p.y - s / 2} width={s} height={s * 0.4} rx="2" fill="#FFFFFF" opacity="0.28" />
                </G>
              );
            })}
          </Svg>
        )}

        {/* ป้ายชื่อขา — ไอคอน "ของจริง" วางบน, ชื่อด้านล่าง (เต็มความกว้างคอลัมน์) */}
        {W > 0 && leftPos.map((p) => (
          <View key={'ll' + p.id} pointerEvents="none"
            style={{ position: 'absolute', left: 4, width: labelW - 2, top: p.y - 30, height: 60, alignItems: 'flex-end', justifyContent: 'center', gap: 2 }}>
            <WireIcon art={p.art} icon={p.icon} />
            <Text style={[S.wireTxt, { width: '100%', textAlign: 'right' }]} numberOfLines={2}
              textBreakStrategy="balanced" lineBreakStrategyIOS="push-out">{p.label}</Text>
          </View>
        ))}
        {W > 0 && rightPos.map((p) => (
          <View key={'rl' + p.id} pointerEvents="none"
            style={{ position: 'absolute', left: rLabelLeft, width: rLabelW, top: p.y - 30, height: 60, alignItems: 'flex-start', justifyContent: 'center', gap: 2 }}>
            <WireIcon art={p.art} icon={p.icon} />
            <Text style={[S.wireTxt, { width: '100%', textAlign: 'left' }]} numberOfLines={2}
              textBreakStrategy="balanced" lineBreakStrategyIOS="push-out">{p.label}</Text>
          </View>
        ))}

        {/* จุดแตะ (โปร่งใส วางทับแพด) */}
        {W > 0 && leftPos.map((p) => (
          <TouchableOpacity key={'hl' + p.id} activeOpacity={0.6} onPress={() => tapLeft(p.id)}
            style={[S.wireHit, { left: p.x - 24, top: p.y - 24 }]} />
        ))}
        {W > 0 && rightPos.map((p) => (
          <TouchableOpacity key={'hr' + p.id} activeOpacity={0.6} onPress={() => tapRight(p.id)}
            style={[S.wireHit, { left: p.x - 24, top: p.y - 24 }]} />
        ))}

        {/* juice: ควัน/ประกายไฟตอนช็อต */}
        {result === 'wrong' && badPad && (
          <Animated.Text pointerEvents="none"
            style={{ position: 'absolute', left: (badPad.x + rightX) / 2 - 16, top: badPad.y - 14, fontSize: 30, opacity: fxOpacity, transform: [{ translateY: fxRise }] }}>
            {outcome ? Array.from(outcome.txt)[0] : '💥'}
          </Animated.Text>
        )}
        {/* มอเตอร์สั่นของจอย วางบนฐานด้านล่าง — นิ่งตอนยังไม่ต่อ, สั่น+ตุ้มหมุนตอนวงจรทำงาน */}
        {W > 0 && motorStep && (
          <Animated.View pointerEvents="none"
            style={{ position: 'absolute', left: W / 2 - 56, top: padArea + 18, transform: [{ translateX: vibX }, { translateY: vibY }] }}>
            <VibeMotor buzz={result === 'correct'} />
          </Animated.View>
        )}
      </Animated.View>

      <Text style={S.wireTip}>
        {result ? (result === 'correct' ? '✅ วงจรทำงาน! ดูไฟวิ่งตามสาย' : '⚠️ ดูผลที่เกิดขึ้น แล้วแก้สายที่ผิด')
          : active != null ? '✅ เลือกขั้วทองแล้ว — แตะขั้วปลายทาง (ขวา) ที่จะต่อ'
            : '👆 แตะขั้วทอง (ซ้าย) → แตะขั้วปลายทาง (ขวา) · แตะขั้วที่ต่อแล้วเพื่อถอด'}
      </Text>
    </Shell>
  );
}

// ════════════════════════════════════════════════════════════════════
//  SORT — แกะชิ้นส่วนจริงลง "ลัง" ที่มีป้ายกำกับ (เห็นเป็นของ ไม่ใช่แค่ข้อความ)
//  data: bins:[{id,label,icon}], items:[{id,label,icon,bin}]
// ════════════════════════════════════════════════════════════════════
function PartTile({ it, selected, onPress, compact, tilt = 0 }) {
  const realArt = it.art && hasPartArt(it.art);
  const symArt = it.art && !realArt;   // สัญลักษณ์วงจร (วาดเวกเตอร์) ที่ไม่ใช่ของจริง
  // ── ในลัง: ไม่มีกรอบ แสดงเป็นตัวชิ้นส่วนวางอยู่จริง (เอียงเล็กน้อย) ──
  if (compact) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}
        style={[S.boxItem, !!tilt && { transform: [{ rotate: `${tilt}deg` }] }]}>
        {realArt ? <PartArt kind={it.art} w={48} />
          : symArt ? <View style={S.chipTile}><SchematicSymbol kind={it.art} w={40} /></View>
            : <Text style={S.boxEmoji}>{it.icon}</Text>}
      </TouchableOpacity>
    );
  }
  // ── บนถาด: การ์ดของจริง ──
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} style={[S.part, selected && S.partSel]}>
      <View style={[S.partFace, (realArt || symArt) && S.partFaceArt]}>
        {realArt ? <PartArt kind={it.art} w={72} />
          : symArt ? <SchematicSymbol kind={it.art} w={60} />
            : <Text style={S.partEmoji}>{it.icon}</Text>}
      </View>
      <Text style={S.partLabel} numberOfLines={2}>{it.label}</Text>
    </TouchableOpacity>
  );
}

function SortGame({ step, onSuccess, onClose }) {
  const sess = useSimSession({ questId: step.questId ?? 'sort', archetype: 'sort', parMs: step.boss ? 30000 : 20000 });
  const bins = step.bins ?? [], items = step.items ?? [];
  const [sel, setSel] = useState(null);           // itemId
  const [place, setPlace] = useState({});         // { itemId: binId }
  const [result, setResult] = useState(null);

  const run = () => {
    let correct = 0;
    items.forEach(it => { if (place[it.id] === it.bin) correct++; });
    const ok = correct === items.length;
    sess.submit({ correct: ok });
    sess.complete({ completeness: completenessOf(correct, items.length) });
    setResult(ok ? 'correct' : 'wrong');
  };

  const placedIn = (binId) => items.filter(it => place[it.id] === binId);
  const unplaced = items.filter(it => !place[it.id]);
  const dropInto = (binId) => { if (sel && !result) { setPlace(p => ({ ...p, [sel]: binId })); setSel(null); } };
  const pickOut = (id) => { if (!result) setPlace(p => { const n = { ...p }; delete n[id]; return n; }); };

  return (
    <Shell step={{ ...step, onClose }} footer={
      !result
        ? <RunBtn label="⚡ ตรวจการจัดกลุ่ม" disabled={unplaced.length === items.length} onPress={run} />
        : <ResultBar result={result} okText={firstStr(step.success, 'จัดกลุ่มถูกหมด!')}
            badText={firstStr(step.error, 'ยังมีชิ้นผิดกล่อง')}
            onNext={onSuccess} onRetry={() => { setResult(null); setPlace({}); setSel(null); sess.bump('resets'); }} />
    }>
      {/* โต๊ะแกะชิ้นส่วน */}
      <View style={S.benchHead}>
        <Text style={S.benchTitle}>🧰 ชิ้นส่วนที่แกะออกมา</Text>
        <Text style={S.benchCount}>{unplaced.length} ชิ้น</Text>
      </View>
      <View style={S.bench}>
        {unplaced.length === 0
          ? <Text style={S.benchEmpty}>หยิบลงกล่องครบแล้ว ✓</Text>
          : unplaced.map(it => (
              <PartTile key={it.id} it={it} selected={sel === it.id}
                onPress={() => !result && setSel(s => (s === it.id ? null : it.id))} />
            ))}
      </View>

      <Text style={S.hint}>{sel ? '▸ แตะกล่องที่ใช่เพื่อหย่อนชิ้นนี้ลงไป' : 'แตะชิ้นส่วนเพื่อหยิบขึ้นมา'}</Text>

      {/* กล่องลังเปิดฝา — grid 2 คอลัมน์ ไม่มีกรอบ เหมือนวางอยู่จริง */}
      <View style={S.boxGrid}>
        {bins.map((b, i) => {
          const inside = placedIn(b.id);
          return (
            <View key={b.id} style={S.boxCell}>
              <View style={S.boxLabel}>
                <View style={[S.boxDot, { backgroundColor: BIN_DOT[i % BIN_DOT.length] }]} />
                <Text style={S.boxName} numberOfLines={1}>{b.label}</Text>
                <Text style={S.boxCount}>{inside.length}</Text>
              </View>
              <TouchableOpacity activeOpacity={sel ? 0.85 : 1} onPress={() => dropInto(b.id)} style={S.boxArt}>
                <CardboardBox h={128} ready={!!sel} />
                <View style={S.boxOverlay} pointerEvents="box-none">
                  {inside.length === 0
                    ? (sel ? <View style={S.dropChip}><Text style={S.dropChipTxt}>หย่อนที่นี่</Text></View> : null)
                    : <View style={S.boxItems}>
                        {inside.map((it, k) => (
                          <PartTile key={it.id} it={it} compact tilt={k % 2 ? -6 : 6}
                            onPress={() => (sel ? dropInto(b.id) : pickOut(it.id))} />
                        ))}
                      </View>}
                </View>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </Shell>
  );
}

// ════════════════════════════════════════════════════════════════════
//  SEQUENCE — เรียงลำดับ (ขั้นตอน/วงจรอนุกรม)
//  data: items:[{id,label,icon}], correctOrder:[id,...]
// ════════════════════════════════════════════════════════════════════
// การ์ดโมดูลขั้นตอน (Circuit Module Card)
function ModuleCard({ it, state }) {
  const border = state === 'good' ? '#3FAE5A' : state === 'bad' ? '#E0564F'
    : (state === 'active' || state === 'charging') ? '#F2C14E' : '#2a3744';
  return (
    <View style={[S.modCard, { borderColor: border },
      state === 'good' && S.modGood, state === 'bad' && S.modBad,
      state === 'charging' && S.modCharge, state === 'queued' && S.modQueued]}>
      <View style={S.modIcon}>
        {it?.art && hasPartArt(it.art) ? <PartArt kind={it.art} w={26} />
          : it?.art ? <SchematicSymbol kind={it.art} w={24} />
            : <Text style={S.modIconTxt}>{it?.icon}</Text>}
      </View>
      <Text style={S.modLabel} numberOfLines={2}>{it?.label}</Text>
    </View>
  );
}
// สวิตช์โยกจ่ายไฟ (Master Switch / Circuit Breaker)
function Lever({ on }) {
  return (
    <Svg width={38} height={38} viewBox="0 0 40 40">
      <Rect x="13" y="5" width="14" height="30" rx="4" fill="#E6D8BE" stroke="#2C1810" strokeWidth="1.6" />
      <Circle cx="20" cy={on ? 12 : 28} r="6.5" fill={on ? '#46B25E' : '#B7A079'} stroke="#2C1810" strokeWidth="1.6" />
      <Circle cx="20" cy={on ? 12 : 28} r="2" fill="#2C1810" />
      <SvgText x="20" y={on ? 31 : 13} fontSize="6" fill="#6E441B" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{on ? 'ON' : 'OFF'}</SvgText>
    </Svg>
  );
}

function SequenceGame({ step, onSuccess, onClose }) {
  const sess = useSimSession({ questId: step.questId ?? 'sequence', archetype: 'sequence', parMs: step.boss ? 30000 : 22000 });
  const items = step.items ?? [];
  const correctOrder = step.correctOrder ?? items.map(i => i.id);
  const byId = Object.fromEntries(items.map(it => [it.id, it]));
  const N = correctOrder.length;

  const [placed, setPlaced] = useState(() => Array(N).fill(null)); // ช่อง → itemId
  const [sel, setSel] = useState(null);        // ช่องที่เลือก
  const [phase, setPhase] = useState('edit');  // edit | running | done
  const [lit, setLit] = useState(0);           // ไฟวิ่งถึงช่องที่เท่าไร
  const [failAt, setFailAt] = useState(-1);
  const [result, setResult] = useState(null);
  const flash = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const smoke = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;  // ไฟวับตอนกำลังจ่ายไฟแต่ละขั้น
  const fillProg = useRef(new Animated.Value(0)).current; // ตำแหน่งหัวกระแส (index ทศนิยม 0..N-1)
  const timer = useRef(null);
  const anim = useRef(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); anim.current?.stop?.(); fillProg.removeAllListeners(); }, [fillProg]);
  useEffect(() => {
    if (result !== 'wrong') { blink.setValue(1); return; }
    const a = Animated.loop(Animated.sequence([
      Animated.timing(blink, { toValue: 0.35, duration: 380, useNativeDriver: true }),
      Animated.timing(blink, { toValue: 1, duration: 380, useNativeDriver: true }),
    ]));
    a.start(); return () => a.stop();
  }, [result, blink]);
  useEffect(() => {
    if (phase !== 'running') { pulse.setValue(0); return; }
    const a = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0.2, duration: 300, useNativeDriver: true }),
    ]));
    a.start(); return () => a.stop();
  }, [phase, pulse]);

  // สลับลำดับการ์ดในคลัง (ครั้งเดียวต่อรอบ) — เข้ามาแต่ละครั้งตำแหน่งไม่ซ้ำ กันจำตำแหน่งแทนความรู้
  const [libOrder] = useState(() => {
    const ids = items.map(i => i.id);
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    if (ids.length > 1 && ids.every((v, i) => v === correctOrder[i])) ids.push(ids.shift()); // กันสุ่มได้ตรงเฉลยพอดี
    return ids;
  });
  const libIds = libOrder.filter(id => !placed.includes(id));
  const allFilled = placed.every(x => x !== null);
  const filledCount = placed.filter(Boolean).length;

  const placeLib = (id) => {
    if (phase !== 'edit') return;
    const e = placed.indexOf(null); if (e < 0) return;
    const n = placed.slice(); n[e] = id; setPlaced(n); setSel(null);
  };
  const tapSlot = (i) => {
    if (phase !== 'edit') return;
    if (placed[i] === null) {
      if (sel !== null && placed[sel] != null) { const n = placed.slice(); n[i] = n[sel]; n[sel] = null; setPlaced(n); }
      setSel(null); return;
    }
    if (sel === null) { setSel(i); return; }
    if (sel === i) { const n = placed.slice(); n[i] = null; setPlaced(n); setSel(null); return; } // คืนคลัง
    const n = placed.slice(); [n[sel], n[i]] = [n[i], n[sel]]; setPlaced(n); setSel(null); sess.bump('reversals');
  };

  const flip = () => {
    if (!allFilled || phase !== 'edit') return;
    let fail = -1, correct = 0;
    placed.forEach((id, i) => { if (id === correctOrder[i]) correct++; else if (fail < 0) fail = i; });
    const target = fail >= 0 ? fail + 1 : N;      // ตรวจกี่ใบ
    const path = buildPath(target);
    setFailAt(fail); setSel(null); setPhase('running'); setLit(0);
    fillProg.setValue(0);
    fillProg.removeAllListeners();
    // ติดไฟการ์ดใบที่ i ตอนยาม "ชนขอบ" การ์ด (prog ถึง enterE[i] = จุดสัมผัส)
    fillProg.addListener(({ value }) => {
      let n = 0; for (let i = 0; i < target; i++) if (value >= path.enterE[i] - 1e-6) n = i + 1;
      setLit(n);
    });
    // ยามเดินตามเส้นทาง บน UI thread (native) ช้า ๆ ลื่น
    anim.current = Animated.timing(fillProg, {
      toValue: 1, duration: Math.max(2000, path.denom * 450),
      easing: Easing.linear, useNativeDriver: true,
    });
    anim.current.start(({ finished }) => {
      if (!finished) return;
      fillProg.removeAllListeners();
      setLit(target);
      if (fail >= 0) {
        sess.submit({ correct: false });
        sess.complete({ completeness: completenessOf(correct, N) });
        Animated.sequence([
          Animated.timing(flash, { toValue: 1, duration: 80, useNativeDriver: false }),
          Animated.timing(flash, { toValue: 0, duration: 450, useNativeDriver: false }),
        ]).start();
        Animated.sequence([
          Animated.timing(shake, { toValue: 1, duration: 45, useNativeDriver: true }),
          Animated.timing(shake, { toValue: -1, duration: 45, useNativeDriver: true }),
          Animated.timing(shake, { toValue: 0, duration: 45, useNativeDriver: true }),
        ]).start();
        smoke.setValue(0);
        Animated.timing(smoke, { toValue: 1, duration: 1300, useNativeDriver: true }).start();
        setResult('wrong'); setPhase('done');
      } else {
        timer.current = setTimeout(() => {
          sess.submit({ correct: true }); sess.complete({ completeness: 'full' });
          setResult('correct'); setPhase('done');
        }, 280);
      }
    });
  };

  const retry = () => {
    if (timer.current) clearTimeout(timer.current);
    anim.current?.stop?.(); fillProg.removeAllListeners(); fillProg.setValue(0);
    setResult(null); setPhase('edit'); setLit(0); setFailAt(-1); setSel(null);
    setPlaced(Array(N).fill(null));   // เคลียร์การ์ดทั้งหมดกลับคลัง
    sess.bump('resets');
  };

  // สถานะของช่อง i ระหว่างเล่น
  const slotState = (i) => {
    if (phase === 'edit') return sel === i ? 'active' : (placed[i] ? 'idle' : 'empty');
    if (lit > i) {
      if (failAt === i) return 'bad';
      if (failAt >= 0 && i > failAt) return 'queued';
      if (phase === 'running' && i === lit - 1) return 'charging';   // ขั้นที่กำลังจ่ายไฟ
      return 'good';
    }
    return placed[i] ? 'queued' : 'empty';   // ช่องที่ยังไม่ถึงคิว (รอจ่ายไฟ)
  };
  const flashBg = flash.interpolate({ inputRange: [0, 1], outputRange: ['rgba(224,86,79,0)', 'rgba(224,86,79,0.3)'] });
  const smokeOp = smoke.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] });
  const smokeRise = smoke.interpolate({ inputRange: [0, 1], outputRange: [0, -34] });

  // ── เรขาคณิตรางจ่ายไฟ (current bus) ──
  const PITCH = 64, ROWH = 54, CY = ROWH / 2, RX = 22, RAILW = 46;
  const nodeY = (i) => i * PITCH + CY;
  const railH = (N - 1) * PITCH + ROWH;
  const L = Math.max(1, (N - 1) * PITCH);
  const flowEndIdx = failAt >= 0 ? failAt + 1 : N;   // กระแสไหลถึง/ตรวจกี่ใบ
  const RAILX = 14 + RX;                             // ตำแหน่ง x ของแกนราง (container)
  const DOT_R = 8;                                   // รัศมีจุดยาม
  const branchLen = SEQ_PADL - RAILX;                // แขนงจากรางถึงขอบการ์ดพอดี
  const INSX = SEQ_PADL - DOT_R;                     // ยามหยุดให้ "ขอบจุด" ชนขอบการ์ด (ไม่ทะลุเข้า)

  // เส้นทางเดินของยาม: ลง → เข้าขวา → ออก → ลง → เข้า ... ตรวจทีละใบ
  const buildPath = (M) => {
    const DOWN = 1, ENTER = 0.6, DWELL = 0.45, EXIT = 0.6;
    let t = 0; const wt = [0], wx = [RAILX], wy = [nodeY(0)], es = [], ee = [];
    const push = (dt, x, y) => { t += dt; wt.push(t); wx.push(x); wy.push(y); };
    for (let i = 0; i < M; i++) {
      if (i > 0) push(DOWN, RAILX, nodeY(i));   // เดินลงไปโหนดถัดไป
      es[i] = t; push(ENTER, INSX, nodeY(i)); ee[i] = t; // เข้าไปในการ์ด
      push(DWELL, INSX, nodeY(i));              // ยืนตรวจ
      push(EXIT, RAILX, nodeY(i));              // เดินออกมา
    }
    const d = t || 1;
    return { inRange: wt.map(v => v / d), wx, wy, enterS: es.map(v => v / d), enterE: ee.map(v => v / d), denom: d };
  };
  const P = buildPath(flowEndIdx);
  const leadShow = phase !== 'edit';
  const showDot = phase !== 'edit' && result !== 'wrong';
  const dotXi = fillProg.interpolate({ inputRange: P.inRange, outputRange: P.wx.map(x => x - DOT_R) });
  const dotYi = fillProg.interpolate({ inputRange: P.inRange, outputRange: P.wy.map(y => y - DOT_R) });
  const railTransY = fillProg.interpolate({ inputRange: P.inRange, outputRange: P.wy.map(y => y - nodeY(0) - L) });
  const branchTX = (i) => fillProg.interpolate({ inputRange: [P.enterS[i], Math.max(P.enterS[i] + 1e-4, P.enterE[i])], outputRange: [-branchLen, 0], extrapolate: 'clamp' });

  // รายงานสาเหตุเชิงลึก (Diagnostic) — ระบุขั้นที่เริ่มพัง
  const badMsg = failAt >= 0
    ? `ขั้นที่ ${failAt + 1} ผิดลำดับ: ไปทำ “${byId[placed[failAt]]?.label}” เร็วเกินไป\nตำแหน่งนี้ต้องเป็น “${byId[correctOrder[failAt]]?.label}” ก่อน\n${firstStr(step.error, '')}`
    : firstStr(step.error, 'ลำดับผิด — ระบบช็อต!');

  // แถบ Log สถานะระบบ
  const log = phase === 'running' ? { txt: '[ RUN ] : POWERING UP…', s: S.logRun, c: '#F2C14E' }
    : result === 'correct' ? { txt: '[ SUCCESS ] : SYSTEM READY 100%', s: S.logOk, c: '#7DE0A0' }
      : result === 'wrong' ? { txt: '[ CRITICAL ERROR ] : HARDWARE DAMAGE', s: S.logErr, c: '#F2706C' }
        : { txt: `[ STANDBY ] : รอประกอบ  ${filledCount}/${N}`, s: S.logIdle, c: '#8b93a0' };

  return (
    <Shell step={{ ...step, onClose }} footer={
      phase === 'done'
        ? <ResultBar result={result} okText={firstStr(step.success, 'ลำดับถูกต้อง! จอยทำงานครบ')}
            badText={badMsg}
            onNext={onSuccess} onRetry={retry} />
        : phase === 'running'
          ? <View style={S.swRun}><Text style={S.swRunTxt}>⏳ กำลังจ่ายไฟไล่ตามลำดับ…</Text></View>
          : <TouchableOpacity activeOpacity={0.85} disabled={!allFilled} onPress={flip} style={[S.master, allFilled ? S.masterOn : S.masterOff]}>
              <Lever on={allFilled} />
              <Text style={[S.masterTxt, allFilled && { color: '#fff' }]}>{allFilled ? 'สับสวิตช์จ่ายไฟ ▼' : `วางให้ครบก่อน  ${filledCount}/${N}`}</Text>
            </TouchableOpacity>
    }>
      {/* แถบ Log สถานะระบบ */}
      <Animated.View style={[S.logBar, log.s, result === 'wrong' && { opacity: blink }]}>
        <Text style={[S.logTxt, { color: log.c }]}>{log.txt}</Text>
      </Animated.View>

      {/* คลังขั้นตอน (ซ่อนตอนกำลังจ่ายไฟ/จบ เพื่อให้โฟกัสที่ไทม์ไลน์) */}
      {phase === 'edit' && (
        <>
          <Text style={S.seqHd}>คลังขั้นตอน — แตะเพื่อวางลงไทม์ไลน์</Text>
          <View style={S.libBox}>
            {libIds.length === 0 ? <Text style={S.libEmpty}>— วางครบทุกขั้นแล้ว —</Text>
              : libIds.map(id => (
                <TouchableOpacity key={id} activeOpacity={0.85} onPress={() => placeLib(id)} style={S.libCardWrap}>
                  <ModuleCard it={byId[id]} state="lib" />
                </TouchableOpacity>
              ))}
          </View>
        </>
      )}

      {/* ไทม์ไลน์ประกอบ + รางจ่ายไฟ */}
      <Text style={S.seqHd}>ไทม์ไลน์ประกอบ — สับสวิตช์แล้วไฟจะไหลลงราง</Text>
      <Animated.View style={{ position: 'relative', transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] }) }] }}>
        {/* รางพื้น (ยังไม่จ่ายไฟ) */}
        <View pointerEvents="none" style={{ position: 'absolute', left: RAILX - 2, top: nodeY(0), width: 4, height: L, backgroundColor: '#C9B690', borderRadius: 2 }} />
        {/* เส้นกระแสเขียว ค่อย ๆ ไหลลง (ตามยามที่เดินลง) */}
        {leadShow && L > 0 && (
          <View pointerEvents="none" style={{ position: 'absolute', left: RAILX - 2, top: nodeY(0), width: 4, height: L, overflow: 'hidden', borderRadius: 2 }}>
            <Animated.View style={{ width: 4, height: L, borderRadius: 2, backgroundColor: '#3FAE5A', transform: [{ translateY: railTransY }] }} />
          </View>
        )}
        {/* แขนงพื้น (เทา) เข้าการ์ดแต่ละขั้น */}
        {placed.map((id, i) => (
          <View key={'bb' + i} pointerEvents="none" style={{ position: 'absolute', left: RAILX, top: nodeY(i) - 2, width: branchLen, height: 4, backgroundColor: '#C9B690', borderRadius: 2 }} />
        ))}
        {/* ไฟเขียวค้างไว้หลังยามเข้าตรวจการ์ดแต่ละใบ */}
        {leadShow && placed.map((id, i) => (i < flowEndIdx ? (
          <View key={'bf' + i} pointerEvents="none" style={{ position: 'absolute', left: RAILX, top: nodeY(i) - 2, width: branchLen, height: 4, overflow: 'hidden', borderRadius: 2 }}>
            <Animated.View style={{ width: branchLen, height: 4, backgroundColor: i === failAt ? '#E0564F' : '#3FAE5A', transform: [{ translateX: branchTX(i) }] }} />
          </View>
        ) : null))}
        {/* โหนด (อยู่บนเส้น) */}
        <Svg width={RAILW} height={railH} style={{ position: 'absolute', left: 14, top: 0 }} pointerEvents="none">
          {placed.map((id, i) => {
            const st = slotState(i);
            const sc = st === 'good' ? '#2E7D32' : st === 'charging' ? '#C47A2D' : st === 'bad' ? '#D94040' : '#A9885E';
            const fill = st === 'good' ? '#E7F2DE' : st === 'bad' ? '#F6E3E0' : st === 'charging' ? '#FBF0D2' : '#F6F0E2';
            return (
              <G key={'nd' + i}>
                <Circle cx={RX} cy={nodeY(i)} r="13" fill={fill} stroke={sc} strokeWidth="2" />
                <SvgText x={RX} y={nodeY(i) + 4.5} fontSize="12" fontWeight="bold" textAnchor="middle"
                  fill={st === 'good' ? '#2E7D32' : st === 'bad' ? '#D94040' : st === 'charging' ? '#C47A2D' : '#C47A2D'}>
                  {st === 'good' ? '✓' : i + 1}
                </SvgText>
              </G>
            );
          })}
        </Svg>

        {/* การ์ดแต่ละขั้น (เยื้องขวาให้พ้นราง) */}
        {placed.map((id, i) => {
          const st = slotState(i);
          const cardSt = st === 'good' ? 'good' : st === 'bad' ? 'bad' : st === 'charging' ? 'charging' : st === 'queued' ? 'queued' : 'idle';
          return (
            <View key={i} style={S.slotRow}>
              {id
                ? <TouchableOpacity activeOpacity={0.85} disabled={phase !== 'edit'} onPress={() => tapSlot(i)} style={{ flex: 1 }}>
                    <ModuleCard it={byId[id]} state={st === 'active' ? 'active' : cardSt} />
                  </TouchableOpacity>
                : <TouchableOpacity activeOpacity={0.7} disabled={phase !== 'edit'} onPress={() => tapSlot(i)} style={[S.slotEmpty, sel !== null && S.slotEmptyHot]}>
                    <Text style={S.slotEmptyTxt}>{sel !== null ? 'แตะเพื่อย้ายมาที่นี่' : `ช่องที่ ${i + 1}`}</Text>
                  </TouchableOpacity>}
              {st === 'charging' && <Animated.View pointerEvents="none" style={[S.chargeRing, { opacity: pulse }]} />}
              {st === 'bad' && (
                <Animated.Text pointerEvents="none" style={{ position: 'absolute', right: 16, top: 0, fontSize: 24, opacity: smokeOp, transform: [{ translateY: smokeRise }] }}>💨</Animated.Text>
              )}
            </View>
          );
        })}

        {/* ยามตรวจ (จุดเขียวเรือง) เดินตามเส้นทาง ลง→เข้า→ออก→ลง... อยู่บนสุด */}
        {showDot && (
          <Animated.View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, width: 16, height: 16, borderRadius: 8, backgroundColor: '#BFFFD4', shadowColor: '#54E07A', shadowOpacity: 0.95, shadowRadius: 7, shadowOffset: { width: 0, height: 0 }, elevation: 7, transform: [{ translateX: dotXi }, { translateY: dotYi }] }} />
        )}
      </Animated.View>

      <Text style={S.hint}>
        {phase === 'edit' ? 'แตะการ์ดในคลังเพื่อวาง · แตะการ์ดในช่องเพื่อเลือก แล้วแตะอีกช่องเพื่อสลับ/ย้าย · แตะซ้ำเพื่อเอากลับคลัง'
          : phase === 'running' ? '🔎 กำลังไล่ตรวจระบบทีละขั้น…'
            : result === 'correct' ? '✅ ตรวจครบทุกขั้น ระบบทำงานสมบูรณ์'
              : '💥 ไฟลัดที่ขั้นที่ผิด — แก้ลำดับแล้วสับสวิตช์ใหม่'}
      </Text>

      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: flashBg }]} />
    </Shell>
  );
}

// ════════════════════════════════════════════════════════════════════
//  SELECT — เลือกอุปกรณ์/วิธีให้ตรงเงื่อนไข (มี "เหตุผล" ไม่ใช่เดา)
//  data: prompt, options:[{id,label,desc,correct,mis}]
// ════════════════════════════════════════════════════════════════════
function SelectGame({ step, onSuccess, onClose }) {
  const sess = useSimSession({ questId: step.questId ?? 'select', archetype: 'select', parMs: step.boss ? 25000 : 18000 });
  const options = step.options ?? [];
  const [pick, setPick] = useState(null);
  const [result, setResult] = useState(null);
  const [badId, setBadId] = useState(null);

  const run = () => {
    const o = options.find(x => x.id === pick); if (!o) return;
    if (o.correct) { sess.submit({ correct: true }); sess.complete({ completeness: 'full' }); setResult('correct'); }
    else { sess.submit({ correct: false, misconceptions: o.mis ? [o.mis] : [] }); sess.complete({ completeness: 'none' }); setBadId(o.id); setResult('wrong'); }
  };

  return (
    <Shell step={{ ...step, onClose }} footer={
      !result
        ? <RunBtn label="⚡ ยืนยันตัวเลือก" disabled={!pick} onPress={run} />
        : <ResultBar result={result} okText={firstStr(step.success, 'เลือกถูก!')}
            badText={firstStr(step.error, 'ยังไม่ใช่ตัวที่เหมาะที่สุด')}
            onNext={onSuccess} onRetry={() => { setResult(null); setPick(null); setBadId(null); sess.bump('resets'); }} />
    }>
      {step.prompt ? <Text style={[S.hint, { marginTop: 12 }]}>{step.prompt}</Text> : null}
      <View style={{ padding: 14, gap: 10 }}>
        {options.map(o => (
          <TouchableOpacity key={o.id} onPress={() => { if (!result) { setPick(o.id); setBadId(null); } }}
            style={[S.selCard, pick === o.id && S.selCardSel, badId === o.id && S.selCardBad]}>
            <View style={{ flex: 1 }}>
              <Text style={S.selName}>{o.label}</Text>
              {o.desc ? <Text style={S.selDesc}>{o.desc}</Text> : null}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </Shell>
  );
}

// ════════════════════════════════════════════════════════════════════
//  DIAGNOSE — ซ่อมจริง: วัดด้วยมัลติมิเตอร์ทุกจุด → เจอจุดเสีย → ลงมือซ่อม
//  (บังคับวัดครบก่อน ห้ามเดา = evidence-based)
//  data: probes:[{id,label,reading,ok}], faults:[{id,label,correct,mis}]
// ════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════
//  REPAIR BENCH — โต๊ะซ่อมบอร์ด: มัลติมิเตอร์ + โพรบจิ้มวัด + บัดกรีต่อเส้นที่ขาด
//  ใช้กับ diagnose ที่มี step.circuit (ไล่หาเส้นขาดบน PCB)
//  data: circuit:{ a:{label}, b:{label}, wires:[{probeId,label,color,v,broken}] }
// ════════════════════════════════════════════════════════════════════
function RepairBench({ step, onSuccess, onClose }) {
  const sess = useSimSession({ questId: step.questId ?? 'diagnose', archetype: 'diagnose', parMs: step.boss ? 35000 : 30000 });
  const C = step.circuit || {};
  const wires = C.wires || [];
  const [mode, setMode] = useState('dcv');      // 'dcv' | 'cont'
  const [red, setRed] = useState(null);         // probeId ที่สายแดงจิ้มอยู่
  const [repairMode, setRepairMode] = useState(false);
  const [fixed, setFixed] = useState(false);
  const [result, setResult] = useState(null);
  const [W, setW] = useState(0);
  const [coach, setCoach] = useState(-1);       // -1=ยังไม่รู้, null=ไม่โชว์, 1..3=สเต็ปสอน
  const [dmmLay, setDmmLay] = useState(null);   // ตำแหน่งมิเตอร์ในพิกัดหน้าจอ (window) สำหรับ spotlight
  const [boardLay, setBoardLay] = useState(null);
  const [rootLay, setRootLay] = useState(null); // จุดอ้างอิงมุมซ้ายบนของ overlay (window) + ขนาด
  const dmmRef = useRef(null), boardRef = useRef(null), rootRef = useRef(null);
  const measureWin = (ref, set) => ref.current?.measureInWindow?.((x, y, w, h) => set({ x, y, w, h }));
  const insets = useSafeAreaInsets();
  const beep = useRef(new Animated.Value(0)).current;
  const bob = useRef(new Animated.Value(0)).current;   // มาสคอตเด้ง + วงเรืองกะพริบ
  const black = true;                           // สายดำหนีบ GND ไว้ให้แล้ว (ลดขั้นตอนที่งง)

  const redWire = wires.find(w => w.probeId === red);
  const isOpen = (w) => w.broken && !fixed;
  const coaching = coach != null && coach >= 1;

  // โค้ชครั้งแรก (Onboarding) — เช็คว่าเคยเล่นยัง
  useEffect(() => {
    if (COACH_ALWAYS) { setCoach(1); return; }   // โหมดเทสต์: โชว์ทุกครั้ง
    let alive = true;
    AsyncStorage.getItem(COACH_KEY).then(v => { if (alive) setCoach(v ? null : 1); }).catch(() => setCoach(null));
    return () => { alive = false; };
  }, []);
  const endCoach = () => {
    setCoach(null);
    if (!COACH_ALWAYS) AsyncStorage.setItem(COACH_KEY, '1').catch(() => {});
    // จบสอนแล้ว "เด้งกลับสภาพปกติ" — สอนวิธีเล่น ไม่ใช่เฉลย ผู้เล่นต้องลงมือหาเส้นที่ขาดเอง
    setMode('dcv'); setRed(null); setRepairMode(false); setFixed(false); setResult(null);
  };
  // เดินสเต็ปด้วยปุ่ม "ถัดไป" (เหมือนสอนเล่นทั่วไป) — ไม่บังคับให้จิ้มจริงตอนสอน
  const nextCoach = () => { if (coach >= 3) endCoach(); else setCoach(coach + 1); };

  // ── ค่าที่จอ DMM แสดง ──
  let val = '--.--', unit = '', cls = 'idle';
  if (redWire) {
    if (isOpen(redWire)) { val = 'O.L'; cls = 'bad'; }
    else if (mode === 'cont') { val = 'CONT'; cls = 'ok'; }
    else { val = Number(redWire.v ?? 0).toFixed(2); unit = 'V'; cls = 'ok'; }
  }
  const beeping = mode === 'cont' && cls === 'ok';
  useEffect(() => {
    if (!beeping) { beep.setValue(0); return; }
    const a = Animated.loop(Animated.sequence([
      Animated.timing(beep, { toValue: 1, duration: 170, useNativeDriver: true }),
      Animated.timing(beep, { toValue: 0, duration: 170, useNativeDriver: true }),
    ]));
    a.start(); return () => a.stop();
  }, [beeping, beep]);
  useEffect(() => {
    if (!coaching) { bob.setValue(0); return; }
    const a = Animated.loop(Animated.sequence([
      Animated.timing(bob, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(bob, { toValue: 0, duration: 650, useNativeDriver: true }),
    ]));
    a.start(); return () => a.stop();
  }, [coaching, bob]);
  const bobY = bob.interpolate({ inputRange: [0, 1], outputRange: [0, -7] });
  const glowOp = bob.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
  const lcdCol = cls === 'ok' ? '#2E7D32' : cls === 'bad' ? '#B23A1A' : cls === 'warn' ? '#A05A14' : '#B7A079';

  const solder = (w) => {
    const ok = !!w.broken;
    sess.submit({ correct: ok, misconceptions: ok ? [] : ['repair_wrong'] });
    sess.complete({ completeness: ok ? 'full' : 'none' });
    if (ok) setFixed(true);
    setResult(ok ? 'correct' : 'wrong');
  };
  const tapTrace = (w) => { if (result) return; if (repairMode) solder(w); else setRed(w.probeId); };
  const reset = () => { setResult(null); setRepairMode(false); setRed(null); sess.bump('resets'); };

  const TUT = [null,
    '👆 นี่คือ “มัลติมิเตอร์” ของเรา! ด่านนี้ต้องหาเส้นที่ขาด ลองกดโหมด 🔊 เช็คสายขาด ดูสิ~',
    '👆 นี่คือลายวงจร PCB จริง ๆ เลยนะ! แตะแต่ละเส้นเพื่อวัด ถ้าจอขึ้น “O.L” = เส้นนั้นขาด!',
    '👇 เจอเส้นขาดแล้วกดปุ่ม 🔧 “หยิบหัวแร้ง” ด้านล่าง แล้วแตะเส้นนั้นเพื่อซ่อมเลย!'];
  const tgt = coach === 1 ? dmmLay : coach === 2 ? boardLay : null;

  return (
    <Shell step={{ ...step, onClose }} noScroll
      overlay={coaching ? (
        <Modal transparent visible animationType="fade" statusBarTranslucent onRequestClose={endCoach}>
        <View ref={rootRef} style={StyleSheet.absoluteFill} pointerEvents="box-none"
          onLayout={() => measureWin(rootRef, setRootLay)}>
          {/* สปอตไลต์: หรี่ทั้งจอ (รวมกล่องผีน้อย) เป็นชิ้นเดียว เจาะรูมุมมนตามกรอบเป้าหมาย */}
          {tgt && rootLay && (() => {
            const PAD = 8, R = 16;
            const sx = Math.max(0, tgt.x - rootLay.x - PAD), sy = Math.max(0, tgt.y - rootLay.y - PAD);
            const sw = tgt.w + PAD * 2, sh = tgt.h + PAD * 2;
            const mask = `M 0 0 H ${rootLay.w} V ${rootLay.h} H 0 Z ` + roundRectPath(sx, sy, sw, sh, R);
            return (
              <>
                <Svg width={rootLay.w} height={rootLay.h} style={StyleSheet.absoluteFill} pointerEvents="none">
                  <Path d={mask} fill="rgba(22,13,6,0.5)" fillRule="evenodd" />
                </Svg>
                <Animated.View pointerEvents="none"
                  style={[S.glowRing, { left: sx, width: sw, top: sy, height: sh, opacity: glowOp }]} />
              </>
            );
          })()}
          {/* มาสคอต + บับเบิลคำพูด (มุมล่าง — ยกพ้นปุ่ม + พ้น safe area) */}
          <View style={[S.mascotWrap, { bottom: insets.bottom + 90 }]} pointerEvents="box-none">
            <View style={S.mascot}>
              <HippoSprite size={76} />
            </View>
            <View style={S.speech}>
              <View style={S.speechTail} />
              <Text style={S.speechTxt}>{TUT[coach]}</Text>
              <View style={S.speechBar}>
                <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
                  {[1, 2, 3].map(i => <View key={i} style={[S.sDot, coach === i && S.sDotOn]} />)}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TouchableOpacity onPress={endCoach} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Text style={S.sSkip}>ข้าม</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={nextCoach} activeOpacity={0.85} style={S.sNext}>
                    <Text style={S.sNextTxt}>{coach >= 3 ? 'เริ่มเล่น ✓' : 'ถัดไป →'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </View>
        </Modal>
      ) : null}
      footer={
      !result
        ? <RunBtn label={repairMode ? '🔧 หัวแร้งพร้อม — แตะเส้นที่ขาดเพื่อบัดกรี' : '🔧 หยิบหัวแร้งมาบัดกรีซ่อม'}
            onPress={() => setRepairMode(m => !m)} />
        : <ResultBar result={result} okText={firstStr(step.success, 'บัดกรีต่อเส้นกลับ! วงจรครบ ระบบทำงาน')}
            badText={firstStr(step.error, 'เส้นนั้นไม่ได้ขาด — ไล่วัดหาเส้นที่ขึ้น O.L ก่อน')}
            onNext={onSuccess} onRetry={reset} />
    }>
      {/* ── มัลติมิเตอร์ดิจิทัล (DMM) ── */}
      <View ref={dmmRef} style={S.dmm} onLayout={() => measureWin(dmmRef, setDmmLay)}>
        <View style={S.dmmScreen}>
          <View style={S.dmmRow}>
            <Animated.Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}
              style={[S.dmm7, { color: lcdCol, opacity: beeping ? beep.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) : 1 }]}>
              {val}{unit ? ' ' + unit : ''}
            </Animated.Text>
          </View>
          <Text style={S.dmmTag}>{mode === 'dcv' ? '⎓ DC VOLTAGE' : '🔊 CONTINUITY'}</Text>
        </View>
        <View style={S.modeRow}>
          <Text style={S.modeLab}>ย่านวัด</Text>
          <TouchableOpacity activeOpacity={0.85} style={[S.modeChip, mode === 'dcv' && S.modeChipOn]} onPress={() => setMode('dcv')}>
            <Text style={[S.modeChipTxt, mode === 'dcv' && S.modeChipTxtOn]}>⎓ วัดโวลต์ (V)</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.85} style={[S.modeChip, mode === 'cont' && S.modeChipOn]} onPress={() => setMode('cont')}>
            <Text style={[S.modeChipTxt, mode === 'cont' && S.modeChipTxtOn]}>🔊 เช็คสายขาด</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── แผ่นวงจร PCB จริง (ลอยตัว ไม่มีกรอบ) ── */}
      <View ref={boardRef} style={{ marginHorizontal: 12, marginTop: 12 }}
        onLayout={e => { const { width } = e.nativeEvent.layout; if (width && Math.abs(width - W) > 1) setW(width); measureWin(boardRef, setBoardLay); }}>
        {W > 0 && (() => {
          const CW = W, N = wires.length;
          const topPad = 40, gap = 54, lx = Math.round(CW * 0.40), rx = Math.round(CW * 0.60), mid = (lx + rx) / 2;
          const trY = (i) => topPad + i * gap;
          const H = trY(N - 1) + 66;
          const midY = (trY(0) + trY(N - 1)) / 2;
          const gndX = Math.round((lx + rx) / 2), gndY = H - 20;   // GND อยู่กึ่งกลางล่าง (ช่องว่างระหว่างบอร์ด)
          const redIdx = wires.findIndex(w => w.probeId === red);
          const lbX = 6, lbW = lx + 10 - 6, rbX = rx - 10, rbW = CW - 6 - (rx - 10);
          const icX = 22, icW = lx - 50, icTop = trY(0) - 12, icBot = trY(N - 1) + 12;
          const Pin = (x, y) => (
            <G key={'pin' + x + y}>
              <Rect x={x - 8} y={y - 9} width="16" height="18" rx="2.5" fill="#0E0C08" />
              <Rect x={x - 6} y={y - 7} width="12" height="14" rx="2" fill="url(#rb_pin)" stroke="#7A571A" strokeWidth="0.8" />
            </G>
          );
          return (
            <View style={{ height: H }}>
              <Svg width={CW} height={H} pointerEvents="none">
                <Defs>
                  <SvgLG id="rb_board" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#EBDCBC" /><Stop offset="1" stopColor="#D8C29A" /></SvgLG>
                  <SvgLG id="rb_pin" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#F6DD93" /><Stop offset="0.5" stopColor="#D9A841" /><Stop offset="1" stopColor="#9A6E1E" /></SvgLG>
                  <SvgLG id="rb_ic" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#2A2A31" /><Stop offset="1" stopColor="#101015" /></SvgLG>
                </Defs>
                {/* บอร์ดซ้าย (โมดูล MCU) + บอร์ดขวา (ESP32/ทรานซิสเตอร์) — แผ่นกระดาษ ขอบน้ำตาล เหมือนด่านต่อ ESP32 */}
                <Rect x={lbX} y="8" width={lbW} height={H - 16} rx="10" fill="url(#rb_board)" stroke="#2C1810" strokeWidth="2" />
                <SvgText x={lbX + 12} y="22" fontSize="9" fill="#6E441B" fontWeight="bold" fontFamily="monospace">{(C.a?.label || 'MCU').toUpperCase()}</SvgText>
                <Rect x={rbX} y="8" width={rbW} height={H - 16} rx="10" fill="url(#rb_board)" stroke="#2C1810" strokeWidth="2" />
                <Path d={`M ${CW - 34} 16 l 5 0 l 0 5 l 5 0 l 0 5 l 5 0`} stroke="#B8862F" strokeWidth="1.4" fill="none" opacity="0.7" />
                <SvgText x={CW - 14} y="22" fontSize="9" fill="#6E441B" fontWeight="bold" textAnchor="end" fontFamily="monospace">{(C.b?.label || 'Q').toUpperCase()}</SvgText>

                {/* ชิป MCU (IC ดำ + ขาเงิน) บนบอร์ดซ้าย */}
                {wires.map((w, i) => <Rect key={'mp' + i} x={icX + icW} y={trY(i) - 2} width={lx - (icX + icW)} height="4" fill="#B7BEC6" />)}
                <Rect x={icX} y={icTop} width={icW} height={icBot - icTop} rx="3.5" fill="url(#rb_ic)" stroke="#05050A" strokeWidth="1" />
                <Circle cx={icX + 7} cy={icTop + 8} r="2.2" fill="#454B55" />
                <SvgText x={icX + icW / 2} y={midY + 3} fontSize="7.5" fill="#C9D2DA" textAnchor="middle" fontFamily="monospace">IC</SvgText>

                {/* ทรานซิสเตอร์ TO-92 (3 ขาเงิน + ตัวถังโดมดำ หน้าตัดแบน) บนบอร์ดขวา */}
                {wires.map((w, i) => <Rect key={'tl' + i} x={rx} y={trY(i) - 1.5} width="26" height="3" fill="#B7BEC6" />)}
                {(() => {
                  const fx = rx + 26, rr = Math.min(CW - 14, rx + 92), cy = midY, cxL = (fx + rr) / 2;
                  return (
                    <G>
                      <Path d={`M ${fx} ${cy - 27} L ${rr - 15} ${cy - 27} Q ${rr} ${cy - 27} ${rr} ${cy} Q ${rr} ${cy + 27} ${rr - 15} ${cy + 27} L ${fx} ${cy + 27} Z`} fill="url(#rb_ic)" stroke="#05050A" strokeWidth="1.2" />
                      <Path d={`M ${fx} ${cy - 27} L ${fx} ${cy + 27}`} stroke="#454B55" strokeWidth="1.6" opacity="0.5" />
                      <Path d={`M ${rr - 18} ${cy - 18} Q ${rr - 7} ${cy - 22} ${rr - 4} ${cy - 8}`} stroke="#4A525C" strokeWidth="2" fill="none" opacity="0.5" />
                      <SvgText x={cxL} y={cy + 4} fontSize="11" fill="#C9D2DA" textAnchor="middle" fontWeight="bold" fontFamily="monospace">Q</SvgText>
                      <SvgText x={cxL} y={cy - 31} fontSize="7" fill="#6E441B" textAnchor="middle" fontWeight="bold">TO-92</SvgText>
                    </G>
                  );
                })()}

                {/* ลายทองแดง + Test Points + พินทอง */}
                {wires.map((w, i) => {
                  const y = trY(i), bk = isOpen(w), probed = red === w.probeId;
                  const col = bk ? '#A9885E' : (fixed && w.broken ? '#3FAE5A' : '#C99A4A');
                  return (
                    <G key={w.probeId}>
                      {bk ? (
                        <G>
                          <Path d={`M ${lx} ${y} H ${mid - 12}`} stroke={col} strokeWidth="3.5" strokeLinecap="round" />
                          <Path d={`M ${mid + 12} ${y} H ${rx}`} stroke={col} strokeWidth="3.5" strokeLinecap="round" />
                          <Path d={`M ${mid - 12} ${y - 5} l 5 10 M ${mid + 12} ${y - 5} l -5 10`} stroke="#D94040" strokeWidth="1.8" strokeLinecap="round" />
                        </G>
                      ) : <Path d={`M ${lx} ${y} H ${rx}`} stroke={col} strokeWidth="3.5" strokeLinecap="round" />}
                      {Pin(lx, y)}
                      {Pin(rx, y)}
                      {/* Test point ทอง (จุดจิ้มโพรบ) */}
                      <Circle cx={mid} cy={y} r="10" fill="#0E0C08" />
                      <Circle cx={mid} cy={y} r="8" fill="url(#rb_pin)" stroke="#7A571A" strokeWidth="1" />
                      <Circle cx={mid} cy={y} r="3" fill="#15110A" />
                      {probed && <Circle cx={mid} cy={y} r="13" fill="none" stroke="#E5484D" strokeWidth="2.5" />}
                      <SvgText x={mid} y={y - 15} fontSize="9" fontWeight="bold" fill="#4A2800" textAnchor="middle">{w.label}</SvgText>
                    </G>
                  );
                })}

                {/* แพด GND (กึ่งกลางล่าง) — จุดทองซ้าย, ตัวอักษรขวา */}
                <Rect x={gndX - 19} y={gndY - 8} width="38" height="16" rx="3" fill="#14110A" stroke="#C9A24A" strokeWidth="1.2" />
                <Circle cx={gndX - 11} cy={gndY} r="4" fill="url(#rb_pin)" stroke="#7A571A" strokeWidth="0.7" />
                <Circle cx={gndX - 11} cy={gndY} r="1.5" fill="#15110A" />
                <SvgText x={gndX + 7} y={gndY + 2.8} fontSize="7.5" fill="#E8C36A" textAnchor="middle" fontFamily="monospace" fontWeight="bold">GND</SvgText>
                {/* สายดำหนีบที่จุด GND (ลีดออกลงล่างตรง ๆ) */}
                {black && (
                  <G>
                    <Path d={`M ${gndX - 11} ${gndY} L ${gndX - 11} ${gndY + 11}`} stroke="#2B313B" strokeWidth="3" strokeLinecap="round" />
                    <Circle cx={gndX - 11} cy={gndY} r="2.6" fill="#2B313B" />
                  </G>
                )}
                {/* โพรบแดง (ตัวที่ไล่จิ้ม) จิ้มที่จุดวัดที่เลือก */}
                {redIdx >= 0 && (
                  <G>
                    <Path d={`M ${mid} ${trY(redIdx)} L ${mid + 28} ${trY(redIdx) - 34}`} stroke="#E5484D" strokeWidth="4" strokeLinecap="round" />
                    <Path d={`M ${mid} ${trY(redIdx)} l 3 -8 l 6 5 z`} fill="#E5484D" />
                  </G>
                )}
                {repairMode && <SvgText x={lbX + 14} y={H - 12} fontSize="16" textAnchor="middle">🔧</SvgText>}
              </Svg>
              {wires.map((w, i) => (
                <TouchableOpacity key={'tt' + w.probeId} activeOpacity={0.7} onPress={() => tapTrace(w)}
                  style={{ position: 'absolute', left: lx - 10, width: rx - lx + 20, top: trY(i) - 18, height: 40 }} />
              ))}
            </View>
          );
        })()}
      </View>

      {/* คำใบ้สั้น ๆ (เฉพาะตอนไม่ได้สอน) */}
      {!coaching && (
        <Text style={[S.hint, { marginTop: 10 }]}>
          {result === 'correct' ? '✅ ซ่อมเส้นที่ขาดแล้ว วงจรครบ'
            : repairMode ? '🔧 แตะเส้นที่ขาด (O.L) เพื่อบัดกรีต่อกลับ'
              : 'แตะเส้นเพื่อวัด · เจอ O.L แล้วหยิบหัวแร้งมาซ่อม'}
        </Text>
      )}
    </Shell>
  );
}

function DiagnoseGame({ step, onSuccess, onClose }) {
  const sess = useSimSession({ questId: step.questId ?? 'diagnose', archetype: 'diagnose', parMs: step.boss ? 35000 : 30000 });
  const probes = step.probes ?? [], faults = step.faults ?? [];
  const [revealed, setRevealed] = useState({});
  const [sel, setSel] = useState(null);            // จุดที่เลือก/วัดล่าสุด (โชว์บนจอ)
  const [measuringId, setMeasuringId] = useState(null);
  const [flick, setFlick] = useState('');
  const [pick, setPick] = useState(null);
  const [result, setResult] = useState(null);
  const [RW, setRW] = useState(0);
  const [jit, setJit] = useState({ x: 0, y: 0 });   // เคอร์เซอร์กระตุกในจอเกม
  const isCtrl = step.circuit && step.circuit.device === 'controller';

  const measured = probes.filter(p => revealed[p.id]).length;
  const allMeasured = probes.length === 0 || measured >= probes.length;
  const cur = probes.find(p => p.id === sel);

  const measuring = measuringId != null;
  const timers = useRef([]);
  const pulse = useRef(new Animated.Value(1)).current;
  const scan = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const lp = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 0.25, duration: 360, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 360, useNativeDriver: true }),
    ]));
    const ls = Animated.loop(Animated.timing(scan, { toValue: 1, duration: 820, useNativeDriver: true }));
    lp.start(); ls.start();
    return () => { lp.stop(); ls.stop(); timers.current.forEach(t => { clearTimeout(t); clearInterval(t); }); };
  }, []);
  // เคอร์เซอร์ในจอเกม: กระตุกตอน GND ยังขาด, นิ่งเมื่อต่อกลับ (result==='correct')
  useEffect(() => {
    if (!isCtrl) return;
    const id = setInterval(() => {
      setJit(result === 'correct' ? { x: 0, y: 0 } : { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1 });
    }, 130);
    return () => clearInterval(id);
  }, [isCtrl, result]);

  const measure = (id) => {
    setSel(id); setMeasuringId(id);
    const SCR = ['8.8.8', '▓ ▓ ▓', '- - -', '0.00', '12.7', '?.??', '5.01'];
    let n = 0;
    const iv = setInterval(() => { setFlick(SCR[n % SCR.length]); n++; }, 70);
    const to = setTimeout(() => {
      clearInterval(iv); setMeasuringId(null);
      if (!revealed[id]) { setRevealed(r => ({ ...r, [id]: true })); sess.bump('probes'); }
    }, 700);
    timers.current.push(iv, to);
  };
  // เฟส 1: ยังวัดไม่ครบ → แตะ = จิ้มวัด ; เฟส 2: วัดครบแล้ว → แตะ = ชี้จุดต้นเหตุ
  const onPad = (p) => {
    if (result || measuring) return;
    setSel(p.id);
    if (!revealed[p.id]) { measure(p.id); return; }
    if (allMeasured) setPick(p.id);
  };
  const run = () => {
    const t = probes.find(p => p.id === pick);
    const ok = !!(t && t.fault);
    sess.submit({ correct: ok, misconceptions: ok ? [] : (t && t.mis ? [t.mis] : ['wrong_diagnosis']) });
    sess.complete({ completeness: ok ? 'full' : 'none' });
    setResult(ok ? 'correct' : 'wrong');
  };

  // ── จอแสดงค่า ────────────────────────────────────────────────
  const shown = cur && revealed[cur.id];
  const dispLabel = measuring ? 'กำลังวัด…' : (cur ? cur.label : 'เลือกจุดวัด');
  const dispVal = measuring ? flick : (shown ? cur.reading : '— — —');
  const dispCol = measuring ? '#C47A2D' : (shown ? (cur.ok ? '#2E7D32' : '#B23A1A') : '#B7A079');
  const scanX = scan.interpolate({ inputRange: [0, 1], outputRange: [-60, RW || 300] });

  return (
    <Shell step={{ ...step, onClose }} footer={
      !result
        ? <RunBtn
            label={allMeasured ? (step.circuit ? '🔧 ต่อเส้นที่ขาดกลับ' : '🔧 ซ่อมจุดที่เป็นต้นเหตุ') : `🔌 วัดให้ครบก่อน (${measured}/${probes.length})`}
            disabled={!allMeasured || !pick} onPress={run} />
        : <ResultBar result={result} okText={firstStr(step.success, 'ซ่อมถูกจุด! ระบบกลับมาทำงาน')}
            badText={firstStr(step.error, 'ยังไม่ใช่จุดที่เสีย ดูค่าที่วัดได้อีกที')}
            onNext={onSuccess} onRetry={() => { setResult(null); setPick(null); setSel(null); sess.bump('resets'); }} />
    }>
      {/* จอแสดงค่ามัลติมิเตอร์ */}
      <View style={S.readout} onLayout={e => { const w = e.nativeEvent.layout.width; if (w && Math.abs(w - RW) > 1) setRW(w); }}>
        <View style={S.readoutTop}>
          <Text style={S.readoutTag}>⎓ MULTIMETER</Text>
          <Text style={S.readoutPt} numberOfLines={1}>{dispLabel}</Text>
        </View>
        <Text style={[S.readoutVal, { color: dispCol }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.45}>{dispVal}</Text>
        {measuring && <Animated.View pointerEvents="none" style={[S.scan, { transform: [{ translateX: scanX }] }]} />}
      </View>

      {step.circuit ? (
        <>
          <Text style={S.section}>{allMeasured
            ? (result === 'correct' ? '✅ ต่อเส้นที่ขาดกลับแล้ว — วงจรครบ!' : '👉 แตะ "เส้นที่ขาด/ลอย" เพื่อต่อกลับ')
            : `🔌 แตะแต่ละเส้นเพื่อจิ้มวัด (${measured}/${probes.length})`}</Text>
          {RW > 0 && (() => {
            const C = step.circuit, wires = C.wires || [], N = wires.length, CW = RW;
            const probeOf = (id) => probes.find(p => p.id === id);
            const fixed = result === 'correct';
            const wireEl = (w, i, lx, rx, wireY) => {
              const y = wireY(i), pr = probeOf(w.probeId);
              const on = pr && revealed[pr.id], busy = pr && measuringId === pr.id;
              const picked = allMeasured && pr && pick === pr.id;
              const broken = w.broken && !fixed, mid = (lx + rx) / 2;
              const col = busy ? '#FFD27A' : on ? (pr.ok ? '#54E07A' : '#FF6B6B') : (w.color || '#7C8A99');
              return (
                <G key={w.probeId}>
                  <Circle cx={lx} cy={y} r="4" fill="#E8C36A" />
                  <Circle cx={rx} cy={y} r="4" fill="#E8C36A" />
                  {broken ? (
                    <G>
                      <Path d={`M ${lx} ${y} H ${mid - 15}`} stroke={col} strokeWidth="4" strokeLinecap="round" />
                      <Path d={`M ${mid + 15} ${y} H ${rx}`} stroke={col} strokeWidth="4" strokeLinecap="round" />
                      <Path d={`M ${mid - 15} ${y - 5} l 5 10 M ${mid + 15} ${y - 5} l -5 10`} stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" />
                      <SvgText x={mid} y={y - 9} fontSize="13" textAnchor="middle">⚡</SvgText>
                    </G>
                  ) : (
                    <Path d={`M ${lx} ${y} H ${rx}`} stroke={col} strokeWidth={picked ? 5.5 : 4} strokeLinecap="round" />
                  )}
                  {picked && <Circle cx={mid} cy={y} r="11" fill="none" stroke="#C97D10" strokeWidth="2" strokeDasharray="3 3" />}
                  <SvgText x={mid} y={y + (broken ? 20 : -9)} fontSize="9" fontWeight="bold" fill="#cdd6df" textAnchor="middle">{w.label}</SvgText>
                </G>
              );
            };
            const touch = (lx, rx, wireY) => wires.map((w, i) => (
              <TouchableOpacity key={'wt' + w.probeId} activeOpacity={0.7}
                onPress={() => { const pr = probeOf(w.probeId); if (pr) onPad(pr); }}
                style={{ position: 'absolute', left: lx - 8, width: rx - lx + 16, top: wireY(i) - 17, height: 34 }} />
            ));

            if (isCtrl) {
              const monH = 104, gap = 44, wy0 = monH + 28;
              const wireY = (i) => wy0 + i * gap;
              const H = wireY(N - 1) + 30;
              const lx = 92, rx = CW - 104, my = (wireY(0) + wireY(N - 1)) / 2;
              const cx = CW / 2 + jit.x * 26, cy = 50 + jit.y * 20;
              return (
                <View style={{ marginHorizontal: 14, marginTop: 8, height: H }}>
                  <Svg width={CW} height={H} pointerEvents="none">
                    <Defs>
                      <SvgLG id="dg_pcb2" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#1F6E42" /><Stop offset="1" stopColor="#124A2B" /></SvgLG>
                    </Defs>
                    {/* จอภาพในเกม */}
                    <Rect x={CW / 2 - 94} y="4" width="188" height="92" rx="10" fill="#08130D" stroke={fixed ? '#54E07A' : '#C0392B'} strokeWidth="2" />
                    <Path d={`M ${CW / 2} 18 V 86 M ${CW / 2 - 78} 50 H ${CW / 2 + 78}`} stroke="#143524" strokeWidth="1" />
                    <SvgText x={CW / 2} y="16" fontSize="8" fill="#5A6B7A" textAnchor="middle">🖥 ภาพในเกม</SvgText>
                    {!fixed && <Circle cx={cx} cy={cy} r="11" fill="none" stroke="#E5C237" strokeWidth="1" opacity="0.35" />}
                    <Circle cx={cx} cy={cy} r="6.5" fill={fixed ? '#54E07A' : '#E5C237'} />
                    <SvgText x={CW / 2} y="92" fontSize="9" fontWeight="bold" fill={fixed ? '#54E07A' : '#FF6B6B'} textAnchor="middle">{fixed ? '✓ นิ่ง ควบคุมได้' : '⚠ ตัวละครเดินเอง/กระตุก'}</SvgText>

                    {/* อนาล็อกสติ๊ก */}
                    <Rect x="20" y={my - 42} width="72" height="84" rx="9" fill="url(#dg_pcb2)" stroke="#0E3F24" strokeWidth="1.5" />
                    <Circle cx="54" cy={my} r="25" fill="#0A0A0D" />
                    <Circle cx="54" cy={my} r="22" fill="#26262E" stroke="#000" strokeWidth="1" />
                    <Circle cx="54" cy={my} r="12" fill="none" stroke="#000" strokeWidth="3" opacity="0.5" />
                    <SvgText x="54" y={my + 38} fontSize="8" fill="#BFE6CF" textAnchor="middle">สติ๊ก</SvgText>

                    {/* บอร์ดไร้สาย */}
                    <Rect x={CW - 100} y={my - 42} width="86" height="84" rx="9" fill="#16202B" stroke="#2A3A48" strokeWidth="1.5" />
                    <Path d={`M ${CW - 86} ${my - 42} V ${my - 56} h 8 v 8 h 8 v -8 h 8 v 8 h 8 v -14`} fill="none" stroke="#9AA7B5" strokeWidth="1.5" />
                    <SvgText x={CW - 57} y={my - 2} fontSize="8.5" fontWeight="bold" fill="#AEB8C2" textAnchor="middle" fontFamily="monospace">ESP32</SvgText>
                    <SvgText x={CW - 57} y={my + 12} fontSize="7" fill="#5FAE86" textAnchor="middle">((•)) ไร้สาย</SvgText>

                    {wires.map((w, i) => wireEl(w, i, lx, rx, wireY))}
                  </Svg>
                  {touch(lx, rx, wireY)}
                </View>
              );
            }

            // ── ฉากทั่วไป: กล่อง 2 ฝั่ง ──
            const topPad = 32, gap = 46;
            const wireY = (i) => topPad + i * gap;
            const H = wireY(N - 1) + 32;
            const boxW = 88, boxY = wireY(0) - 18, boxH = wireY(N - 1) - wireY(0) + 36;
            const ax = 12, bxx = CW - 12 - boxW, lx = ax + boxW, rx = bxx;
            return (
              <View style={{ marginHorizontal: 14, marginTop: 8, height: H }}>
                <Svg width={CW} height={H} pointerEvents="none">
                  <Rect x={ax} y={boxY} width={boxW} height={boxH} rx="10" fill="#16202B" stroke="#2A3A48" strokeWidth="1.5" />
                  <Rect x={bxx} y={boxY} width={boxW} height={boxH} rx="10" fill="#16202B" stroke="#2A3A48" strokeWidth="1.5" />
                  <SvgText x={ax + boxW / 2} y={boxY + 17} fontSize="10" fontWeight="bold" fill="#aeb8c2" textAnchor="middle">{C.a?.icon} {C.a?.label}</SvgText>
                  <SvgText x={bxx + boxW / 2} y={boxY + 17} fontSize="10" fontWeight="bold" fill="#aeb8c2" textAnchor="middle">{C.b?.icon} {C.b?.label}</SvgText>
                  {wires.map((w, i) => wireEl(w, i, lx, rx, wireY))}
                </Svg>
                {touch(lx, rx, wireY)}
              </View>
            );
          })()}
          {allMeasured && result !== 'correct' && <Text style={[S.hint, { marginTop: 10 }]}>💡 เส้นที่ "ขาด/ลอย" คือต้นเหตุ — บางค่าที่เพี้ยนเป็นแค่อาการต่อเนื่อง</Text>}
        </>
      ) : (
        <>
          <Text style={S.section}>{allMeasured
            ? '👉 วัดครบแล้ว — แตะ "จุดต้นเหตุ" บนบอร์ด แล้วกดซ่อม'
            : `🔌 แตะแพดทองทีละจุดเพื่อวัด (${measured}/${probes.length})`}</Text>
          <View style={S.tpBoard}>
            {probes.map(p => {
              const on = revealed[p.id], busy = measuringId === p.id, picked = allMeasured && pick === p.id;
              const probing = busy || picked;
              return (
                <TouchableOpacity key={p.id} activeOpacity={0.85} onPress={() => onPad(p)}
                  style={[S.tpItem, probing && S.tpItemBusy, on && !picked && (p.ok ? S.tpItemOk : S.tpItemBad)]}>
                  <Svg width="34" height="34">
                    {on && <Circle cx="17" cy="17" r="14" fill="none" stroke={p.ok ? '#54E07A' : '#FF6B6B'} strokeWidth="2.5" />}
                    {picked && <Circle cx="17" cy="17" r="16.5" fill="none" stroke="#C97D10" strokeWidth="2" strokeDasharray="3 3" />}
                    <Circle cx="17" cy="17" r="10.5" fill="#E8C36A" stroke="#F2F5F8" strokeWidth="1.3" />
                    <Circle cx="17" cy="17" r="3" fill="#1A1407" />
                    {probing && <Path d="M 17 17 L 34 0" stroke="#C0392B" strokeWidth="3.5" strokeLinecap="round" />}
                    {probing && <Path d="M 17 17 l 1 -9 l 7 5 z" fill="#C0392B" />}
                  </Svg>
                  <Text style={S.tpItemLabel} numberOfLines={2}>{p.label}</Text>
                  <Text style={[S.tpItemVal, { color: busy ? '#C47A2D' : on ? (p.ok ? '#2E7D32' : '#B23A1A') : '#9A8569' }]} numberOfLines={1}>
                    {busy ? flick : on ? `${p.ok ? '✓' : '✕'} ${p.reading}` : 'แตะวัด ▸'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {allMeasured && (
            <Text style={[S.hint, { marginTop: 10, marginBottom: 6 }]}>💡 บางค่าที่ผิดปกติเป็นแค่ "อาการ" — ชี้จุดที่เป็น "ต้นเหตุ" จริง ๆ</Text>
          )}
        </>
      )}
    </Shell>
  );
}

// ════════════════════════════════════════════════════════════════════
//  TUNE — เครื่องมือวัดจริง: หมุน/เลื่อนปรับค่า ดูเข็มมิเตอร์เข้าโซนเป้าหมาย
//  data: unit, min, max, step, target, tolerance, prompt?
// ════════════════════════════════════════════════════════════════════
function TuneGame({ step, onSuccess, onClose }) {
  const sess = useSimSession({ questId: step.questId ?? 'tune', archetype: 'tune', parMs: step.boss ? 25000 : 18000 });
  const min = step.min ?? 0, max = step.max ?? 100, inc = step.step ?? 1;
  const target = step.target ?? max / 2, tol = step.tolerance ?? inc;
  const decimals = (String(inc).split('.')[1] || '').length;
  const fmt = (v) => v.toFixed(decimals);
  const [val, setVal] = useState(() => Math.round(((min + max) / 2) / inc) * inc);
  const [result, setResult] = useState(null);
  const [W, setW] = useState(0);

  const clamp = (v) => Math.max(min, Math.min(max, v));
  const snap = (v) => clamp(Number((Math.round((v - min) / inc) * inc + min).toFixed(4)));
  const inZone = Math.abs(val - target) <= tol;

  const run = () => {
    const ok = inZone;
    sess.submit({ correct: ok });
    sess.complete({ completeness: ok ? 'full' : Math.abs(val - target) <= tol * 3 ? 'partial' : 'none' });
    setResult(ok ? 'correct' : 'wrong');
  };

  // ── ปุ่มหมุน (knob) ─────────────────────────────────────────
  const Wd = W || 320;
  const KR = Math.min(Wd * 0.26, 86);
  const kcx = Wd / 2, kcy = KR + 16;
  const knobH = KR * 2 + 34;
  const D2R = Math.PI / 180;
  const frac = (max > min) ? (clamp(val) - min) / (max - min) : 0;
  const thetaOf = (f) => (225 - f * 270) * D2R;             // มุม (y ขึ้น), กวาด 270° ช่องว่างด้านล่าง
  const kpol = (th, r) => ({ x: kcx + r * Math.cos(th), y: kcy - r * Math.sin(th) });
  const ptr = kpol(thetaOf(frac), KR - 12);
  const ticks = [];
  for (let k = 0; k <= 10; k++) {
    const f = k / 10, major = k % 5 === 0;
    const o = kpol(thetaOf(f), KR + 2), inn = kpol(thetaOf(f), KR - (major ? 9 : 5));
    ticks.push({ key: k, major, d: `M ${o.x.toFixed(1)} ${o.y.toFixed(1)} L ${inn.x.toFixed(1)} ${inn.y.toFixed(1)}` });
  }
  const lblMin = kpol(thetaOf(0), KR + 15), lblMax = kpol(thetaOf(1), KR + 15);

  // ── หมุนแบบลากขึ้น–ลง (มาตรฐาน ลื่น เสถียร) ──────────────────
  const lockRef = useRef(false); lockRef.current = !!result;
  const valRef = useRef(val); valRef.current = val;
  const startRef = useRef(val);
  const DRAG_PX = 230;                                  // ลากเต็มจอ ~230px = เต็มช่วง
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !lockRef.current,
    onMoveShouldSetPanResponder: () => !lockRef.current,
    onStartShouldSetPanResponderCapture: () => !lockRef.current,
    onMoveShouldSetPanResponderCapture: () => !lockRef.current,
    onPanResponderTerminationRequest: () => false,
    onShouldBlockNativeResponder: () => true,
    onPanResponderGrant: () => { startRef.current = valRef.current; },
    onPanResponderMove: (e, g) => {
      if (lockRef.current) return;
      setVal(snap(clamp(startRef.current + (-g.dy / DRAG_PX) * (max - min))));   // ลากขึ้น = เพิ่ม
    },
  })).current;

  return (
    <Shell step={{ ...step, onClose }} noScroll footer={
      !result
        ? <RunBtn label="⚡ ตรวจค่า" onPress={run} />
        : <ResultBar result={result} okText={firstStr(step.success, 'ค่าพอดีแล้ว!')}
            badText={firstStr(step.error, 'ยังไม่พอดี ลองคำนวณ/ปรับใหม่')}
            onNext={onSuccess} onRetry={() => { setResult(null); sess.bump('resets'); }} />
    }>
      {step.prompt ? <Text style={[S.hint, { marginTop: 12 }]}>{step.prompt}</Text> : null}

      <View style={S.tuneWrap} onLayout={e => { const w = e.nativeEvent.layout.width; if (w && Math.abs(w - W) > 1) setW(w); }}>
        <Text style={S.tuneVal}>{fmt(val)} <Text style={S.tuneUnit}>{step.unit ?? ''}</Text></Text>
        <Text style={S.tuneState}>หมุนปุ่มตั้งค่าตามที่คำนวณได้ แล้วกดตรวจ</Text>

        <View style={{ height: knobH }}>
          {W > 0 && (
            <Svg width={Wd} height={knobH} pointerEvents="none">
              <Defs>
                <SvgLG id="tk_knob" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#F0E0BE" /><Stop offset="1" stopColor="#D2B884" /></SvgLG>
              </Defs>
              {ticks.map(t => <Path key={t.key} d={t.d} stroke={t.major ? '#6E441B' : '#B7A079'} strokeWidth={t.major ? 2.5 : 1.6} />)}
              <SvgText x={lblMin.x} y={lblMin.y + 4} fontSize="10" fill="#6E441B" textAnchor="middle">{fmt(min)}</SvgText>
              <SvgText x={lblMax.x} y={lblMax.y + 4} fontSize="10" fill="#6E441B" textAnchor="middle">{fmt(max)}</SvgText>
              {/* ตัวปุ่ม */}
              <Circle cx={kcx} cy={kcy} r={KR + 2} fill="#2C1810" />
              <Circle cx={kcx} cy={kcy} r={KR} fill="url(#tk_knob)" stroke="#2C1810" strokeWidth="2" />
              <Circle cx={kcx} cy={kcy} r={KR - 8} fill="none" stroke="#C9A24A" strokeWidth="1" />
              {/* ปุ่มหยัก (knurling) */}
              {Array.from({ length: 18 }).map((_, i) => { const a = i / 18 * 2 * Math.PI; const p = kpol(a, KR - 3); return <Circle key={'kn' + i} cx={p.x} cy={p.y} r="1.5" fill="#B8862F" />; })}
              {/* เข็มชี้ */}
              <Path d={`M ${kcx} ${kcy} L ${ptr.x} ${ptr.y}`} stroke="#B23A1A" strokeWidth="5" strokeLinecap="round" />
              <Circle cx={ptr.x} cy={ptr.y} r="4.5" fill="#B23A1A" />
              <Circle cx={kcx} cy={kcy} r="7" fill="#F7F1E5" stroke="#C47A2D" strokeWidth="2" />
            </Svg>
          )}
          {W > 0 && (
            <View style={{ position: 'absolute', left: kcx - KR - 14, top: kcy - KR - 14, width: (KR + 14) * 2, height: (KR + 14) * 2, borderRadius: 9999 }}
              {...pan.panHandlers} />
          )}
        </View>

        <Text style={S.tuneHint}>↕ ลากขึ้น–ลง บนปุ่มเพื่อหมุนค่า · ช่วง {fmt(min)}–{fmt(max)} {step.unit ?? ''}</Text>
      </View>
    </Shell>
  );
}

// ════════════════════════════════════════════════════════════════════
//  POLARITY — ใส่ถ่านลงราง AA ให้ถูกขั้ว (ลงมือทำ: หมุนถ่านเอง → จ่ายไฟ)
//  data: slots:[{plusSide:'left'|'right'}]  (บอส = หลายช่อง ต่ออนุกรม)
//        หรือใช้ plusSide:'left'|'right' สำหรับช่องเดียว
// ════════════════════════════════════════════════════════════════════
const _opp = (s) => (s === 'left' ? 'right' : 'left');
function PolarityGame({ step, onSuccess, onClose }) {
  const slotDefs = (step.slots ?? [{ plusSide: step.plusSide }]).map(d => ({
    plusSide: d.plusSide === 'right' ? 'right' : 'left',
  }));
  const sess = useSimSession({ questId: step.questId ?? 'polarity', archetype: 'polarity', parMs: step.boss ? 32000 : 18000 });
  const [batt, setBatt] = useState(() => slotDefs.map(d => _opp(d.plusSide)));   // เริ่มกลับขั้วทุกก้อน
  const [result, setResult] = useState(null);

  const slots = slotDefs.map((d, i) => ({ plusSide: d.plusSide, battPlus: batt[i] }));
  const allOk = slots.every(s => s.plusSide === s.battPlus);

  const flip = (i) => { if (!result) setBatt(b => b.map((v, k) => (k === i ? _opp(v) : v))); };
  const power = () => {
    const wrong = slots.filter(s => s.plusSide !== s.battPlus).length;
    sess.submit({ correct: allOk, misconceptions: allOk ? [] : ['reverse_polarity'] });
    sess.complete({ completeness: allOk ? 'full' : wrong < slots.length ? 'partial' : 'none' });
    setResult(allOk ? 'correct' : 'wrong');
  };

  const multi = slots.length > 1;
  return (
    <Shell step={{ ...step, onClose }} footer={
      !result
        ? <RunBtn label="⚡ จ่ายไฟเข้าบอร์ด" onPress={power} />
        : <ResultBar result={result}
            okText={firstStr(step.success, multi ? 'ขั้วตรงทุกก้อน! ไฟเลี้ยงเข้าบอร์ด' : 'ขั้วตรง! ไฟเลี้ยงเข้าบอร์ด')}
            badText={firstStr(step.error, 'มีก้อนใส่กลับขั้ว! ไฟไม่ไหล หมุนก้อนที่ไฟแดงแล้วลองใหม่')}
            onNext={onSuccess} onRetry={() => { setResult(null); sess.bump('resets'); }} />
    }>
      <View style={S.polWrap}>
        <Text style={S.polCaption}>🎮 {multi ? `รางใส่ถ่าน ${slots.length} ก้อน (อนุกรม)` : 'รางใส่ถ่านของจอย'}</Text>
        <BatteryRail slots={slots} result={result} />
        <View style={S.flipRow}>
          {slots.map((s, i) => (
            <TouchableOpacity key={i} activeOpacity={0.8} disabled={!!result} onPress={() => flip(i)}
              style={[S.flipBtn, s.plusSide === s.battPlus && S.flipBtnOk]}>
              <Text style={S.flipTxt}>⟲ หมุน{multi ? ` #${i + 1}` : 'ถ่าน'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={S.hint}>หมุนให้หัวขั้ว + (สีทอง) ชนกับหน้าสัมผัส + บนราง ทุกก้อน แล้วกดจ่ายไฟ</Text>
      </View>
    </Shell>
  );
}

// ════════════════════════════════════════════════════════════════════
//  CODEFILL — เติมโค้ดในช่องว่าง (ลงมือเขียนโค้ด ไม่ใช่กาช้อย)
//  data: before, after (สตริงโค้ดรอบช่องว่าง, รองรับ \n),
//        options:[{id, token, correct, mis}]
// ════════════════════════════════════════════════════════════════════
function CodeFillGame({ step, onSuccess, onClose }) {
  const sess = useSimSession({ questId: step.questId ?? 'codefill', archetype: 'codefill', parMs: step.boss ? 22000 : 16000 });
  const options = step.options ?? [];
  const [pick, setPick] = useState(null);
  const [result, setResult] = useState(null);
  const chosen = options.find(o => o.id === pick);

  const run = () => {
    const o = chosen; if (!o) return;
    if (o.correct) { sess.submit({ correct: true }); sess.complete({ completeness: 'full' }); setResult('correct'); }
    else { sess.submit({ correct: false, misconceptions: o.mis ? [o.mis] : [] }); sess.complete({ completeness: 'none' }); setResult('wrong'); }
  };

  return (
    <Shell step={{ ...step, onClose }} footer={
      !result
        ? <RunBtn label="▶ รันโค้ด" disabled={!pick} onPress={run} />
        : <ResultBar result={result} okText={firstStr(step.success, 'โค้ดถูกต้อง รันผ่าน!')}
            badText={firstStr(step.error, 'โค้ดยังไม่ถูก ลองเติมใหม่')}
            onNext={onSuccess} onRetry={() => { setResult(null); setPick(null); sess.bump('resets'); }} />
    }>
      {step.prompt ? <Text style={[S.hint, { marginTop: 12 }]}>{step.prompt}</Text> : null}
      <View style={S.codeCard}>
        <Text style={S.codeTxt}>
          {step.before}
          <Text style={[S.codeSlot, result === 'correct' && S.codeSlotOk, result === 'wrong' && S.codeSlotBad]}>
            {chosen ? ` ${chosen.token} ` : ' ___ '}
          </Text>
          {step.after}
        </Text>
      </View>
      <Text style={S.hint}>แตะบล็อกโค้ดด้านล่าง เติมลงในช่องว่าง</Text>
      <View style={S.tokenRow}>
        {options.map(o => (
          <TouchableOpacity key={o.id} disabled={!!result} onPress={() => { if (!result) setPick(o.id); }}
            style={[S.token, pick === o.id && S.tokenSel]}>
            <Text style={S.tokenTxt}>{o.token}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </Shell>
  );
}

// ── dispatcher ───────────────────────────────────────────────────────────────
export function MiniGame({ step, onSuccess, onClose }) {
  switch (step.kind) {
    case 'wire':     return <WireGame     step={step} onSuccess={onSuccess} onClose={onClose} />;
    case 'sort':     return <SortGame     step={step} onSuccess={onSuccess} onClose={onClose} />;
    case 'sequence': return <SequenceGame step={step} onSuccess={onSuccess} onClose={onClose} />;
    case 'select':   return <SelectGame   step={step} onSuccess={onSuccess} onClose={onClose} />;
    case 'diagnose': return step.circuit
      ? <RepairBench step={step} onSuccess={onSuccess} onClose={onClose} />
      : <DiagnoseGame step={step} onSuccess={onSuccess} onClose={onClose} />;
    case 'tune':     return <TuneGame     step={step} onSuccess={onSuccess} onClose={onClose} />;
    case 'polarity': return <PolarityGame step={step} onSuccess={onSuccess} onClose={onClose} />;
    case 'codefill': return <CodeFillGame step={step} onSuccess={onSuccess} onClose={onClose} />;
    default:         return null;
  }
}
