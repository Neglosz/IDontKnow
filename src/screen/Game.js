import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Esp32Board, SensorModule, ESP_VB, ESP_PADS, SENSOR_VB, SENSOR_PADS } from './HardwareArt';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import TraceWidthSim from './TraceWidthSim';
import { SequenceSim, SelectSim, DiagnoseSim } from './simEngine';
import BlockCodeSim from './SoftwareGame';
import { FALLBACK_LESSON } from '../data/lessons';

const { width: SW } = Dimensions.get('window');

const CAT_FRAMES = 3;
const CAT_W = 80;
const CAT_H = 80;
const CAT_FPS = 6;  // ความเร็ว animation แมว (frames/วินาที)
const ORC_FPS = 5; // ความเร็ว animation orc (frames/วินาที)

const ORC_W = 150;
const ORC_H = 175;
const _orcAsset = Image.resolveAssetSource(require('../../assets/npc_orc-sheet.png'));
const ORC_FRAMES = Math.round(_orcAsset.width / ORC_W);

const BG_W = 540;
const BG_H = 576;
const SCENE_H = SW * (BG_H / BG_W);
const GROUND_PX = SCENE_H * ((BG_H - 530) / BG_H);

// ── โครงด่าน ────────────────────────────────────────────────────────────────
// step 0 = Intro, step 1..N = ด่านตาม lesson.steps, step N+1 = Clear
//   kind:'dialogue'  = ผู้เชี่ยวชาญสอน (กดรับทราบ)
//   kind:'sim'       = simulation (Tune / Sequence / Select / Diagnose)
//   kind:'blockcode' = ลากบล็อกโค้ด (software)
//   kind:'boss'      = Connect = CircuitPuzzle (ต่อวงจร)
// เนื้อหาทั้งหมดมาจาก src/data/lessons.js — ไฟล์นี้เป็นแค่ "เครื่องเล่นด่าน"

// ป้าย/ไอคอนของแต่ละชนิดด่าน (ใช้ในแถว lineup หน้า Intro)
const STEP_BADGE = {
  dialogue:  { icon: '🧑‍🏫', label: 'PRO' },
  sim:       { icon: '⚔️',  label: 'SIM' },
  blockcode: { icon: '</>', label: 'CODE' },
  boss:      { icon: '👹',  label: 'BOSS' },
};

function useSpriteAnim(frameCount, fps = 8) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % frameCount), 1000 / fps);
    return () => clearInterval(id);
  }, [frameCount, fps]);
  return frame;
}

export default function Game({ onNavigate, lesson }) {
  const LESSON = lesson ?? FALLBACK_LESSON;
  const STEPS = LESSON.steps ?? [];

  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState('');
  const [combo, setCombo] = useState(1);
  const [bestCombo] = useState(6);
  const [stars, setStars] = useState(1);
  const [circuitOpen, setCircuitOpen] = useState(false);
  const [activeSim, setActiveSim] = useState(null);

  const catFrame = useSpriteAnim(CAT_FRAMES, CAT_FPS);
  const orcFrame = useSpriteAnim(ORC_FRAMES, ORC_FPS);

  // ไปด่านถัดไป (ใช้ร่วมทุก encounter)
  const goNext = () => {
    setCombo(c => c + 1);
    setStars(s => Math.min(s + 1, STEPS.length));
    setAnswer('');
    setStep(s => s + 1);
  };

  // ── Step 0: Intro ────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.introRoot}>
          <Text style={styles.chapterLabel}>{LESSON.chapter}</Text>
          <Text style={styles.chapterIconRow}>⚙️  💰</Text>
          <Text style={styles.chapterTitle}>{LESSON.gameTitle}</Text>

          <View style={styles.introBox}>
            <Text style={styles.introDesc}>{LESSON.intro}</Text>
            <View style={styles.npcLineup}>
              {STEPS.map((st, i) => {
                const badge = STEP_BADGE[st.kind] ?? STEP_BADGE.sim;
                const isBoss = st.kind === 'boss';
                return (
                  <View key={i} style={[styles.npcChip, isBoss && styles.npcChipBoss]}>
                    <Text style={styles.npcChipIcon}>{badge.icon}</Text>
                    <Text style={[styles.npcChipTxt, isBoss && styles.npcChipBossTxt]}>
                      {badge.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.introStarRow}>
            <Text style={styles.introStarTxt}>⭐  Your Stars:  1200</Text>
            <Text style={styles.introRewardTxt}>Max Reward: +{LESSON.maxReward}</Text>
          </View>

          <TouchableOpacity style={styles.orangeBtn} activeOpacity={0.8} onPress={goNext}>
            <Text style={styles.orangeBtnTxt}>เริ่มเลย !!!</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.6} onPress={() => onNavigate?.('skill-tree')}>
            <Text style={styles.backLink}>◄  BACK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Clear (หลังผ่านด่านสุดท้าย) ────────────────────────────────────────────
  if (step > STEPS.length) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.clearRoot} showsVerticalScrollIndicator={false}>
          <Text style={styles.clearTitle}>{LESSON.chapter} Clear !</Text>
          <Text style={styles.clearParty}>🎉</Text>

          <View style={styles.clearBadgeRow}>
            <View style={[styles.clearBadge, { borderColor: '#E8A020' }]}>
              <Text style={[styles.clearBadgeTxt, { color: '#E8A020' }]}>⭐ +7</Text>
            </View>
            <View style={[styles.clearBadge, { borderColor: '#D94040' }]}>
              <Text style={[styles.clearBadgeTxt, { color: '#D94040' }]}>🔥 COMBO {bestCombo}</Text>
            </View>
          </View>

          <Text style={styles.clearSubtitle}>{LESSON.gameTitle}</Text>

          <View style={styles.scoreRow}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>ด่านที่ผ่าน</Text>
              <Text style={[styles.scoreValue, { color: '#4CAF50' }]}>{STEPS.length}</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>Boss Bonus</Text>
              <Text style={[styles.scoreValue, { color: '#2E7D32' }]}>+3</Text>
            </View>
          </View>

          <View style={styles.clearPanel}>
            <Text style={styles.clearPanelTxt}>
              ผ่านครบทั้ง 5 รูปแบบ: ปรับค่า · เรียงลำดับ · เลือกอุปกรณ์ · หาจุดเสีย · ต่อวงจร{'\n'}
              ระบบได้บันทึกพฤติกรรมการเล่นไว้ประเมินความเข้าใจแล้ว
            </Text>
          </View>

          <View style={styles.clearHintRow}>
            <Text style={styles.clearHintTxt}>🧑‍🏫  ควรทบทวนเรื่อง "กระแสไฟฟ้า (Current)"</Text>
            <Text style={styles.clearHintTxt}>       ลองเพิ่มเรื่อง "สูตรคำนวณ Trace Width"</Text>
            <Text style={styles.clearHintLink}>       🔴 สร้าง Node การเรียนรู้</Text>
          </View>

          <TouchableOpacity style={[styles.orangeBtn, { marginTop: 16 }]} activeOpacity={0.8} onPress={() => { setStep(0); onNavigate?.('skill-tree'); }}>
            <Text style={styles.orangeBtnTxt}>กลับ SKILL TREE  ▶</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── เปิด challenge (Tune / Sequence / Select / Diagnose / BlockCode) ────────
  if (activeSim) {
    const enc = STEPS[step - 1];
    const close = () => setActiveSim(null);
    const win   = () => { setActiveSim(null); goNext(); };
    let sim = null;
    if (activeSim === 'tune')
      sim = <TraceWidthSim current={enc.current} questId={enc.questId}
              npcName={enc.npc} npcEmoji={enc.emoji} onSuccess={win} onClose={close} />;
    else if (activeSim === 'sequence')  sim = <SequenceSim  onSuccess={win} onClose={close} />;
    else if (activeSim === 'select')    sim = <SelectSim    onSuccess={win} onClose={close} />;
    else if (activeSim === 'diagnose')  sim = <DiagnoseSim  onSuccess={win} onClose={close} />;
    else if (activeSim === 'blockcode') sim = <BlockCodeSim level={enc} onSuccess={win} onClose={close} />;
    return <SafeAreaView style={styles.safe}>{sim}</SafeAreaView>;
  }

  // ── Boss: Circuit puzzle (Connect) — full screen ───────────────────────────
  if (circuitOpen) {
    return (
      <SafeAreaView style={styles.safe}>
        <CircuitPuzzle
          onSuccess={() => { setCircuitOpen(false); goNext(); }}
          onClose={() => setCircuitOpen(false)}
        />
      </SafeAreaView>
    );
  }

  // ── ด่านปัจจุบัน: หน้าจอ Battle / Dialogue ─────────────────────────────────
  const enc = STEPS[step - 1];
  const multiplier = (1 + (combo - 1) * 0.2).toFixed(1);

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1 }}>

        {/* Battle scene */}
        <View style={styles.scene}>
          <Image
            source={require('../../assets/background.png')}
            style={{ position: 'absolute', width: SW, height: SCENE_H }}
            resizeMode="stretch"
          />
          <View style={styles.starBadge}>
            <Text style={styles.starEmoji}>⭐</Text>
            <Text style={styles.starCount}>{stars}</Text>
          </View>
          <View style={styles.playerPos}>
            <View style={styles.catClip}>
              <Image
                source={require('../../assets/player_cat-sheet.png')}
                style={[styles.catSheet, { transform: [{ translateX: -catFrame * CAT_W }] }]}
                resizeMode="stretch"
              />
            </View>
          </View>
          <View style={styles.bossPos}>
            <View style={styles.orcClip}>
              <Image
                source={require('../../assets/npc_orc-sheet.png')}
                style={[styles.orcSheet, { transform: [{ translateX: -orcFrame * ORC_W }] }]}
                resizeMode="stretch"
              />
            </View>
          </View>
        </View>

        {/* Stats bar */}
        <View style={styles.statsBar}>
          <StatBadge icon="⚡" label="COMBO NOW"  value={String(combo)}      color="#E8A020" />
          <StatBadge icon="↗"  label="MULTIPLIER" value={`x${multiplier}`}  color="#3A8FE8" />
          <StatBadge icon="🔥" label="BEST COMBO" value={String(bestCombo)} color="#D94040" />
        </View>

        {/* Dialogue panel */}
        <View style={styles.panel}>
          <View style={styles.npcRow}>
            <View style={styles.avatarWrap}>
              <View style={styles.avatarBox}>
                <Text style={styles.avatarEmoji}>{enc.emoji}</Text>
              </View>
              <Text style={styles.npcName}>{enc.npc}</Text>
            </View>
            <ScrollView style={styles.textScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.dialogueTxt}>{enc.text}</Text>
            </ScrollView>
          </View>
        </View>

        {/* Action area */}
        <View style={styles.actionArea}>
          {enc.kind === 'dialogue' ? (
            <TouchableOpacity style={styles.acceptBtn} activeOpacity={0.8} onPress={goNext}>
              <Text style={styles.acceptBtnTxt}>รับทราบ  ▶</Text>
            </TouchableOpacity>
          ) : enc.kind === 'boss' ? (
            <TouchableOpacity style={styles.acceptBtn} activeOpacity={0.8} onPress={() => setCircuitOpen(true)}>
              <Text style={styles.acceptBtnTxt}>🔌  INTERACT  ▶</Text>
            </TouchableOpacity>
          ) : enc.kind === 'blockcode' ? (
            <TouchableOpacity style={styles.acceptBtn} activeOpacity={0.8} onPress={() => setActiveSim('blockcode')}>
              <Text style={styles.acceptBtnTxt}>{'</>'}  เขียนโค้ด  ▶</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.acceptBtn} activeOpacity={0.8} onPress={() => setActiveSim(enc.sim)}>
              <Text style={styles.acceptBtnTxt}>⚔️  เผชิญหน้า  ▶</Text>
            </TouchableOpacity>
          )}
        </View>

      </View>
      </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StatBadge({ icon, label, value, color }) {
  return (
    <View style={[styles.statCard, { borderColor: color }]}>
      <Text style={[styles.statLabel, { color }]}>{icon} {label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );
}

// ── CircuitPuzzle data ────────────────────────────────────────────────────────
const SENSORS = [
  { id:'pir',   name:'PIR',   icon:'👁',  label:'PIR SENSOR', color:'#C0392B',
    pins:[{id:'sen_sig',label:'SIG'},{id:'sen_vcc',label:'VCC'},{id:'sen_gnd',label:'GND'}] },
  { id:'dht11', name:'DHT11', icon:'🌡️',  label:'DHT11',      color:'#2980B9',
    pins:[{id:'sen_sig',label:'DATA'},{id:'sen_vcc',label:'VCC'},{id:'sen_gnd',label:'GND'}] },
  { id:'soil',  name:'SOIL',  icon:'🌱',  label:'SOIL',       color:'#7D4E1E',
    pins:[{id:'sen_sig',label:'AO'},{id:'sen_vcc',label:'VCC'},{id:'sen_gnd',label:'GND'}] },
  { id:'ldr',   name:'LDR',   icon:'☀️',  label:'LDR',        color:'#D4A017',
    pins:[{id:'sen_sig',label:'OUT'},{id:'sen_vcc',label:'VCC'},{id:'sen_gnd',label:'GND'}] },
];
const ESP32_PINS = [
  { id:'esp_d2',  label:'GPIO 2' },
  { id:'esp_vcc', label:'3V3' },
  { id:'esp_gnd', label:'GND' },
];
const CORRECT_SENSOR = 'pir';
const CORRECT_WIRES = [
  { from:'sen_sig', to:'esp_d2'  },
  { from:'sen_vcc', to:'esp_vcc' },
  { from:'sen_gnd', to:'esp_gnd' },
];

// Per-signal wire colours (keyed by the sensor pin = conn.from).
// Red is reserved for wrong wires, so power uses orange.
const WIRE_PALETTE = {
  sen_sig: '#2EC8C0', // signal  → teal
  sen_vcc: '#F2901E', // power   → orange
  sen_gnd: '#9AA7B5', // ground  → grey
};
const WIRE_ERROR = '#FF3B30';
const WIRE_LEGEND = [
  { c: WIRE_PALETTE.sen_sig, label: 'สัญญาณ (SIG)' },
  { c: WIRE_PALETTE.sen_vcc, label: 'ไฟเลี้ยง (VCC)' },
  { c: WIRE_PALETTE.sen_gnd, label: 'กราวด์ (GND)' },
];

// ── Auto wire router ─────────────────────────────────────────────────────────
function roundedPath(pts, r = 7) {
  if (!pts.length) return '';
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1], [cx, cy] = pts[i], [nx, ny] = pts[i + 1];
    const v1x = cx - px, v1y = cy - py, l1 = Math.hypot(v1x, v1y) || 1;
    const v2x = nx - cx, v2y = ny - cy, l2 = Math.hypot(v2x, v2y) || 1;
    const rr = Math.min(r, l1 / 2, l2 / 2);
    d += ` L ${cx - (v1x / l1) * rr} ${cy - (v1y / l1) * rr}`;
    d += ` Q ${cx} ${cy} ${cx + (v2x / l2) * rr} ${cy + (v2y / l2) * rr}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last[0]} ${last[1]}`;
  return d;
}

function routeWires(items) {
  if (!items.length) return [];
  const espX = Math.max(...items.map(it => it.s.x));
  const senX = Math.min(...items.map(it => it.e.x));
  let gapL = espX + 14, gapR = senX - 14;
  if (gapR < gapL) { const m = (espX + senX) / 2; gapL = gapR = m; }
  const sorted = [...items].sort((a, b) => (a.s.y + a.e.y) - (b.s.y + b.e.y));
  const n = sorted.length;
  sorted.forEach((it, idx) => {
    const t = n === 1 ? 0.5 : idx / (n - 1);
    it.laneX = gapL + (gapR - gapL) * t;
  });
  return items.map(it => ({
    color: it.color,
    d: roundedPath([[it.s.x, it.s.y], [it.laneX, it.s.y], [it.laneX, it.e.y], [it.e.x, it.e.y]]),
  }));
}

function WireLayer({ wires, width, height }) {
  if (!width || !height) return null;
  return (
    <Svg pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0 }} width={width} height={height}>
      {wires.map((w, i) => (
        <Path key={i} d={w.d} stroke={w.color} strokeWidth={w.w || 5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      ))}
    </Svg>
  );
}

function DamageFX({ x, y, fire, spark, smoke }) {
  const flameSY = fire.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1.35] });
  const flameOp = fire.interpolate({ inputRange: [0, 1], outputRange: [0.65, 1] });
  const puffLX = [-12, 6, -3, 13];
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: x - 45, top: y - 78, width: 90, height: 150, alignItems: 'center', justifyContent: 'flex-end' }}>
      <View style={{ position: 'absolute', bottom: 50, width: 56, height: 30, borderRadius: 28, backgroundColor: 'rgba(8,4,2,0.72)' }} />
      {smoke.map((v, i) => {
        const ty = v.interpolate({ inputRange: [0, 1], outputRange: [0, -92] });
        const op = v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.5, 0] });
        const sc = v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.9] });
        return (
          <Animated.View key={i} style={{ position: 'absolute', bottom: 64, left: 45 + puffLX[i], width: 20, height: 20, borderRadius: 10, backgroundColor: '#8c8c8c', opacity: op, transform: [{ translateY: ty }, { scale: sc }] }} />
        );
      })}
      <Animated.View style={{ position: 'absolute', bottom: 48, width: 30, height: 48, opacity: flameOp, transform: [{ scaleY: flameSY }] }}>
        <View style={{ position: 'absolute', bottom: 0, left: 3, width: 24, height: 42, borderRadius: 12, borderTopLeftRadius: 15, borderTopRightRadius: 15, backgroundColor: '#E5484D' }} />
        <View style={{ position: 'absolute', bottom: 0, left: 7, width: 16, height: 30, borderRadius: 9, backgroundColor: '#F2901E' }} />
        <View style={{ position: 'absolute', bottom: 0, left: 10, width: 10, height: 18, borderRadius: 6, backgroundColor: '#FFD45A' }} />
      </Animated.View>
      {[0, 1, 2, 3, 4, 5].map(i => {
        const ang = (Math.PI * 2 / 6) * i;
        const tx = spark.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(ang) * 40] });
        const ty = spark.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(ang) * 40 - 12] });
        const op = spark.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });
        return (
          <Animated.View key={'sp' + i} style={{ position: 'absolute', bottom: 58, left: 44, width: 4, height: 4, borderRadius: 2, backgroundColor: '#FFE08A', opacity: op, transform: [{ translateX: tx }, { translateY: ty }] }} />
        );
      })}
    </View>
  );
}

function CpWireV({ x1, y1, x2, y2, color = '#C97D10', offset = 0 }) {
  const T = 5;
  const R = T / 2;
  let my = Math.min(y1, y2) + 16 + offset;
  const maxMy = Math.max(y1, y2) - 8;
  if (my > maxMy) my = (y1 + y2) / 2;
  const s = (extra) => ({ position: 'absolute', backgroundColor: color, ...extra });
  const vTop = Math.min(y1, my), vH = Math.abs(my - y1);
  const v2Top = Math.min(my, y2), v2H = Math.abs(y2 - my);
  return (
    <>
      <View pointerEvents="none" style={s({ left: x1 - R, top: vTop - R, width: T, height: vH + T })} />
      <View pointerEvents="none" style={s({ left: Math.min(x1, x2) - R, top: my - R, width: Math.abs(x2 - x1) + T, height: T })} />
      <View pointerEvents="none" style={s({ left: x2 - R, top: v2Top - R, width: T, height: v2H + T })} />
    </>
  );
}

function CpWire({ x1, y1, x2, y2, color = '#C97D10' }) {
  const T    = 5;
  const R    = T / 2;
  const mx   = (x1 + x2) / 2;
  const dy   = Math.abs(y2 - y1);
  const minY = Math.min(y1, y2);
  const s = (extra) => ({ position: 'absolute', backgroundColor: color, ...extra });
  return (
    <>
      <View pointerEvents="none" style={s({
        left:   Math.min(x1, mx) - R,
        top:    y1 - R,
        width:  Math.abs(mx - x1) + T,
        height: T,
      })} />
      {dy > 1 && (
        <View pointerEvents="none" style={s({
          left:   mx - R,
          top:    minY - R,
          width:  T,
          height: dy + T,
        })} />
      )}
      <View pointerEvents="none" style={s({
        left:   Math.min(mx, x2) - R,
        top:    y2 - R,
        width:  Math.abs(x2 - mx) + T,
        height: T,
      })} />
    </>
  );
}

// ── CircuitPuzzle component (Connect archetype) ───────────────────────────────
function CircuitPuzzle({ onSuccess, onClose }) {
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [activePinId,    setActivePinId]    = useState(null);
  const [connections,    setConnections]    = useState([]);
  const [result,         setResult]         = useState(null);
  const [wrongIds,       setWrongIds]       = useState([]);
  const [failMsg,        setFailMsg]        = useState('');

  const BOARD_BORDER = 2.5;
  const [boardSize, setBoardSize] = useState({ w: SW - 28, h: 380 });

  const MIN_Z = 1, MAX_Z = 3;
  const scaleV = useRef(new Animated.Value(1)).current;
  const txV = useRef(new Animated.Value(0)).current;
  const tyV = useRef(new Animated.Value(0)).current;
  const z = useRef({
    scale: 1, tx: 0, ty: 0,
    startScale: 1, startTx: 0, startTy: 0, startDist: 0,
    innerW: 0, innerH: 0, lastTap: 0,
  }).current;

  const clampZ = (v, max) => Math.max(-max, Math.min(max, v));
  const applyZoom = () => {
    z.scale = Math.max(MIN_Z, Math.min(MAX_Z, z.scale));
    const mx = (z.scale - 1) * z.innerW / 2;
    const my = (z.scale - 1) * z.innerH / 2;
    z.tx = clampZ(z.tx, mx);
    z.ty = clampZ(z.ty, my);
    scaleV.setValue(z.scale); txV.setValue(z.tx); tyV.setValue(z.ty);
  };
  const resetZoom = () => {
    z.scale = 1; z.tx = 0; z.ty = 0;
    Animated.parallel([
      Animated.timing(scaleV, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(txV, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(tyV, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();
  };
  const dist = (t) => Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponderCapture: (e) => {
      if (e.nativeEvent.touches.length <= 1) {
        const now = Date.now();
        if (now - z.lastTap < 280) { resetZoom(); z.lastTap = 0; }
        else z.lastTap = now;
      }
      return false;
    },
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (e, g) =>
      e.nativeEvent.touches.length === 2 || Math.abs(g.dx) > 6 || Math.abs(g.dy) > 6,
    onPanResponderGrant: () => {
      z.startScale = z.scale; z.startTx = z.tx; z.startTy = z.ty; z.startDist = 0;
    },
    onPanResponderMove: (e, g) => {
      const t = e.nativeEvent.touches;
      if (t.length === 2) {
        const d = dist(t);
        if (!z.startDist) z.startDist = d;
        z.scale = z.startScale * (d / z.startDist);
      } else {
        z.tx = z.startTx + g.dx;
        z.ty = z.startTy + g.dy;
      }
      applyZoom();
    },
    onPanResponderRelease: () => { z.startDist = 0; applyZoom(); },
    onPanResponderTerminate: () => { z.startDist = 0; applyZoom(); },
  })).current;

  const shakeX  = useRef(new Animated.Value(0)).current;
  const fxFire  = useRef(new Animated.Value(0)).current;
  const fxSpark = useRef(new Animated.Value(0)).current;
  const fxSmoke = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  useEffect(() => {
    const loops = [];
    if (result === 'fried') {
      const s = (to, dur) => Animated.timing(shakeX, { toValue: to, duration: dur, useNativeDriver: true });
      Animated.sequence([s(9, 38), s(-9, 38), s(7, 36), s(-7, 36), s(4, 34), s(-4, 34), s(0, 34)]).start();
      fxSpark.setValue(0);
      Animated.timing(fxSpark, { toValue: 1, duration: 520, useNativeDriver: true }).start();
      const fire = Animated.loop(Animated.sequence([
        Animated.timing(fxFire, { toValue: 1, duration: 95, useNativeDriver: true }),
        Animated.timing(fxFire, { toValue: 0.35, duration: 95, useNativeDriver: true }),
      ]));
      fire.start(); loops.push(fire);
      fxSmoke.forEach((v, i) => {
        v.setValue(0);
        const l = Animated.loop(Animated.timing(v, { toValue: 1, duration: 1500, delay: i * 320, useNativeDriver: true }));
        l.start(); loops.push(l);
      });
    } else {
      shakeX.stopAnimation(() => shakeX.setValue(0));
      fxFire.stopAnimation(); fxSpark.stopAnimation();
      fxSmoke.forEach(v => v.stopAnimation());
    }
    return () => loops.forEach(l => l.stop && l.stop());
  }, [result]);

  const [lockedHint, setLockedHint] = useState(false);
  const lockTimer = useRef(null);
  const handleLockedTap = () => {
    setLockedHint(true);
    if (lockTimer.current) clearTimeout(lockTimer.current);
    lockTimer.current = setTimeout(() => setLockedHint(false), 1700);
  };
  useEffect(() => () => { if (lockTimer.current) clearTimeout(lockTimer.current); }, []);

  const handlePickSensor = (id) => {
    setSelectedSensor(id);
    setConnections([]);
    setActivePinId(null);
    setResult(null);
    setWrongIds([]);
    setFailMsg('');
  };

  const handlePinTap = (id) => {
    if (result) return;
    if (!activePinId) { setActivePinId(id); return; }
    if (activePinId === id) { setActivePinId(null); return; }
    const activeIsSen = activePinId.startsWith('sen_');
    const tapIsSen    = id.startsWith('sen_');
    if (activeIsSen === tapIsSen) { setActivePinId(id); return; }
    const [from, to] = activeIsSen ? [activePinId, id] : [id, activePinId];
    const next = connections.filter(c => c.from !== from && c.to !== to);
    setConnections([...next, { from, to }]);
    setActivePinId(null);
    setWrongIds([]);
  };

  const handleRun = () => {
    if (!selectedSensor || connections.length === 0) return;
    const espOf = {};
    connections.forEach(c => { espOf[c.from] = c.to; });
    const vccTo = espOf['sen_vcc'], gndTo = espOf['sen_gnd'], sigTo = espOf['sen_sig'];

    if (vccTo === 'esp_gnd' || gndTo === 'esp_vcc') {
      setWrongIds(connections.map(c => c.from));
      setFailMsg('กลับขั้วไฟ (VCC ↔ GND) → ลัดวงจร กระแสพุ่งสูง อุปกรณ์ไหม้!');
      setResult('fried'); return;
    }
    if (sigTo === 'esp_vcc') {
      setWrongIds(connections.map(c => c.from));
      setFailMsg('จ่ายไฟ 3V3 เข้าขาสัญญาณ (OUT) โดยตรง → ขาสัญญาณไหม้!');
      setResult('fried'); return;
    }
    if (selectedSensor !== CORRECT_SENSOR) {
      setFailMsg('เซนเซอร์ผิดชนิด — มีไฟเข้าแต่ตรวจจับการเคลื่อนไหวไม่ได้');
      setResult('dead'); return;
    }
    const allOk = CORRECT_WIRES.every(w =>
      connections.some(c => c.from === w.from && c.to === w.to)
    );
    if (allOk && connections.length === CORRECT_WIRES.length) {
      setResult('correct'); return;
    }
    const bad = connections.filter(c =>
      !CORRECT_WIRES.some(w => w.from === c.from && w.to === c.to)
    );
    setWrongIds(bad.map(c => c.from));
    const noPower = !connections.some(c => c.from === 'sen_vcc' && c.to === 'esp_vcc')
                 || !connections.some(c => c.from === 'sen_gnd' && c.to === 'esp_gnd');
    setFailMsg(noPower
      ? 'ไฟเลี้ยงไม่ครบ/ต่อผิด — เซนเซอร์ไม่ทำงาน (ไม่เสียหาย)'
      : 'สายสัญญาณต่อผิดตำแหน่ง — เซนเซอร์ไม่ส่งค่า');
    setResult('dead');
  };

  const handleReset = () => {
    setConnections([]); setActivePinId(null);
    setResult(null); setWrongIds([]); setFailMsg('');
  };

  const wireColor = (conn) => wrongIds.includes(conn.from) ? WIRE_ERROR : (WIRE_PALETTE[conn.from] || '#C97D10');
  const connColorFor = (pinId) => {
    const c = connections.find(x => x.from === pinId || x.to === pinId);
    if (!c) return null;
    return wrongIds.includes(c.from) ? WIRE_ERROR : (WIRE_PALETTE[c.from] || '#C97D10');
  };
  const sensor = SENSORS.find(s => s.id === selectedSensor);

  const BPAD = 16;
  const contentW = Math.max(200, boardSize.w - BPAD * 2);
  const contentH = Math.max(200, boardSize.h - BPAD * 2);

  let espH = contentH;
  let espW = espH * ESP_VB.w / ESP_VB.h;
  const espMaxW = contentW * 0.46;
  if (espW > espMaxW) { espW = espMaxW; espH = espW * ESP_VB.h / ESP_VB.w; }
  const sE = espW / ESP_VB.w;

  let senW = contentW * 0.40;
  let senH = senW * SENSOR_VB.h / SENSOR_VB.w;
  if (senH > contentH) { senH = contentH; senW = senH * SENSOR_VB.w / SENSOR_VB.h; }
  const sS = senW / SENSOR_VB.w;

  const espPitchPx = (() => {
    const r = ESP_PADS.filter(p => p.side === 'R');
    return (r.length > 1 ? r[1].y - r[0].y : 16) * sE;
  })();
  const senPitchPx = (SENSOR_PADS.length > 1 ? SENSOR_PADS[1].y - SENSOR_PADS[0].y : 18) * sS;
  const espHitH = Math.max(11, Math.min(36, espPitchPx - 2));
  const senHitH = Math.max(11, Math.min(36, senPitchPx - 2));
  const HIT_W = 48;

  const espLeft = BPAD;
  const espTop  = BPAD + (contentH - espH) / 2;
  const senLeft = BPAD + contentW - senW;
  const senTop  = BPAD + (contentH - senH) / 2;

  const senLabel = (id) => (sensor?.pins ?? []).find(p => p.id === id)?.label ?? '';

  const boardInnerW = Math.max(0, boardSize.w - BOARD_BORDER * 2);
  const boardInnerH = Math.max(0, boardSize.h - BOARD_BORDER * 2);

  const espActive = ESP_PADS.filter(p => p.active);

  const pinXY = (id) => {
    const ep = ESP_PADS.find(p => p.id === id);
    if (ep) return { x: espLeft + ep.x * sE, y: espTop + ep.y * sE };
    const sp = SENSOR_PADS.find(p => p.id === id);
    if (sp) return { x: senLeft + sp.x * sS, y: senTop + sp.y * sS };
    return null;
  };

  const laneCount = espActive.length;
  const espEdgeX  = espLeft + Math.max(...espActive.map(p => p.x)) * sE;
  const senEdgeX  = senLeft + Math.min(...SENSOR_PADS.map(p => p.x)) * sS;
  let gapL = espEdgeX + 14, gapR = senEdgeX - 14;
  if (gapR < gapL) { const m = (espEdgeX + senEdgeX) / 2; gapL = gapR = m; }
  const laneX = (slot) =>
    laneCount <= 1 ? (gapL + gapR) / 2 : gapL + (gapR - gapL) * (slot / (laneCount - 1));

  const wireData = connections.map(conn => {
    const s = pinXY(conn.to), e = pinXY(conn.from);
    if (!s || !e) return null;
    const slot = Math.max(0, espActive.findIndex(p => p.id === conn.to));
    const lx = laneX(slot);
    return { color: wireColor(conn), w: 5, d: roundedPath([[s.x, s.y], [lx, s.y], [lx, e.y], [e.x, e.y]]) };
  }).filter(Boolean);

  z.innerW = boardInnerW; z.innerH = boardInnerH;

  return (
    <Animated.View style={[cp.screen, { transform: [{ translateX: shakeX }] }]}>

      <View style={cp.topBar}>
        <TouchableOpacity onPress={onClose} style={cp.backBtn}>
          <Text style={cp.backBtnTxt}>◄ ออก</Text>
        </TouchableOpacity>
        <Text style={cp.title}>THE BLUEPRINT...</Text>
        <Text style={cp.chapterTag}>CHAPTER 3</Text>
      </View>

      <View style={cp.parchment}>
        <Text style={cp.parchmentLabel}>📜  ภารกิจ</Text>
        <Text style={cp.parchmentTxt}>
          {!selectedSensor
            ? '"เลือกเซนเซอร์ที่ใช้ตรวจจับการเคลื่อนไหว แล้วต่อสายให้ถูกต้อง"'
            : '"แตะขาที่เรืองแสง (3V3 / GND / D2) บน ESP32 → แตะขาบนเซนเซอร์ทางขวา"'}
        </Text>
      </View>

      <View
        style={cp.board}
        collapsable={false}
        onLayout={(e) => { const l = e?.nativeEvent?.layout; if (l) setBoardSize({ w: l.width, h: l.height }); }}
      >
        {[{top:6,left:6},{top:6,right:6},{bottom:6,left:6},{bottom:6,right:6}].map((pos,i) => (
          <View key={i} style={[cp.rivet, pos]} />
        ))}

        <Animated.View
          {...panResponder.panHandlers}
          style={[
            cp.stage,
            { width: boardInnerW, height: boardInnerH },
            { transform: [{ translateX: txV }, { translateY: tyV }, { scale: scaleV }] },
          ]}
        >
            <WireLayer wires={wireData} width={boardInnerW} height={boardInnerH} />

            <View style={[cp.device, { left: espLeft, top: espTop, width: espW, height: espH }]}>
              <Esp32Board w={espW} />
              {ESP_PADS.map(p => {
                const cx = p.x * sE, cy = p.y * sE;
                if (!p.active) {
                  return (
                    <TouchableOpacity
                      key={p.key}
                      onPress={handleLockedTap}
                      activeOpacity={0.6}
                      style={[cp.lockHotspot, { left: cx - 10, top: cy - espHitH / 2, width: 20, height: espHitH }]}
                    />
                  );
                }
                const isActive = activePinId === p.id;
                const isConn   = connections.some(c => c.to === p.id);
                return (
                  <React.Fragment key={p.key}>
                    <View pointerEvents="none" style={[cp.pinChip, { left: cx - 8 - 30, top: cy - 8 }]}>
                      <Text style={cp.pinChipTxt} numberOfLines={1}>{p.label}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handlePinTap(p.id)}
                      activeOpacity={0.7}
                      style={[cp.hitZone, { left: cx - 16, top: cy - espHitH / 2, width: 28, height: espHitH }]}
                    />
                    <View
                      pointerEvents="none"
                      style={[
                        cp.connDot, cp.connDotEsp,
                        { left: cx - 7, top: cy - 7 },
                        isActive && cp.connDotActive,
                        isConn   && cp.connDotConnected,
                        isConn   && { borderColor: connColorFor(p.id) },
                      ]}
                    />
                  </React.Fragment>
                );
              })}
            </View>

            {selectedSensor && sensor ? (
              <View style={[cp.device, { left: senLeft, top: senTop, width: senW, height: senH }]}>
                <SensorModule type={sensor.id} w={senW} labels={SENSOR_PADS.map(p => senLabel(p.id))} />
                {SENSOR_PADS.map(p => {
                  const cx = p.x * sS, cy = p.y * sS;
                  const isActive = activePinId === p.id;
                  const isConn   = connections.some(c => c.from === p.id);
                  return (
                    <React.Fragment key={p.id}>
                      <TouchableOpacity
                        onPress={() => handlePinTap(p.id)}
                        activeOpacity={0.7}
                        style={[cp.hitZone, { left: Math.max(0, cx - 10), top: cy - senHitH / 2, width: 30, height: senHitH }]}
                      />
                      <View
                        pointerEvents="none"
                        style={[
                          cp.connDot, { backgroundColor: sensor.color },
                          { left: cx - 7, top: cy - 7 },
                          isActive && cp.connDotActive,
                          isConn   && cp.connDotConnected,
                          isConn   && { borderColor: connColorFor(p.id) },
                          wrongIds.includes(p.id) && cp.connDotWrong,
                        ]}
                      />
                    </React.Fragment>
                  );
                })}
                {result === 'fried' && <View pointerEvents="none" style={cp.friedTint} />}
                {result === 'dead' && (
                  <View pointerEvents="none" style={cp.deadOverlay}>
                    <Text style={cp.deadTxt}>💤 ไม่ทำงาน</Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={[cp.emptyDevice, { left: senLeft, top: senTop, width: senW, height: senH }]}>
                <Text style={cp.emptySlotQ}>?</Text>
                <Text style={cp.emptySlotTxt}>เลือก{'\n'}เซนเซอร์</Text>
              </View>
            )}

            {result === 'fried' && (
              <DamageFX
                x={senLeft + senW / 2}
                y={senTop + senH / 2}
                fire={fxFire}
                spark={fxSpark}
                smoke={fxSmoke}
              />
            )}

          </Animated.View>

        <View pointerEvents="none" style={cp.zoomHint}>
          <Text style={cp.zoomHintTxt}>🔍 จีบนิ้วซูม · ลากเลื่อน · แตะสองครั้งรีเซ็ต</Text>
        </View>

        {result && (
          <View style={cp.resultOverlay} pointerEvents="box-none">
            <View style={cp.resultCard}>
              {result === 'correct' ? (
                <>
                  <Text style={cp.feedbackOk}>✅  วงจรสมบูรณ์! ประตูเปิดแล้ว</Text>
                  <TouchableOpacity style={cp.nextBtn} onPress={onSuccess}>
                    <Text style={cp.nextBtnTxt}>ต่อไป  ▶</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={cp.feedbackBad}>
                    {result === 'fried' ? '🔥  ' : '🔌  '}{failMsg}
                  </Text>
                  <TouchableOpacity style={cp.retryBtn} onPress={handleReset}>
                    <Text style={cp.retryBtnTxt}>{result === 'fried' ? 'เปลี่ยนอุปกรณ์ใหม่' : 'รีเซ็ตสาย'}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
      </View>

      {selectedSensor && (
        <View style={cp.legend}>
          {WIRE_LEGEND.map((it, i) => (
            <View key={i} style={cp.legendItem}>
              <View style={[cp.legendDot, { backgroundColor: it.c }]} />
              <Text style={cp.legendTxt}>{it.label}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={cp.statusBar}>
        {result ? (
          <Text style={[cp.statusTxt, { color: result === 'correct' ? '#4CAF50' : '#E8908F' }]} numberOfLines={1}>
            {result === 'correct'
              ? '✅ วงจรสมบูรณ์! ประตูเปิดแล้ว'
              : result === 'fried'
                ? '🔥 ลัดวงจร! อุปกรณ์ไหม้'
                : '🔌 เซนเซอร์ไม่ทำงาน'}
          </Text>
        ) : activePinId ? (
          <Text style={[cp.statusTxt, { color: '#FFD700' }]} numberOfLines={1}>
            📍 เลือก {activePinId.replace('_', ' ').toUpperCase()} แล้ว — แตะขาฝั่งตรงข้าม
          </Text>
        ) : lockedHint ? (
          <Text style={[cp.statusTxt, { color: '#E8908F' }]} numberOfLines={1}>
            🔒 ขานี้ถูกล็อก — ต่อได้เฉพาะขาที่เรืองแสง
          </Text>
        ) : (
          <Text style={[cp.statusTxt, { color: '#888' }]} numberOfLines={1}>
            แตะขาเรืองแสงบน ESP32 แล้วแตะขาบนเซนเซอร์
          </Text>
        )}
      </View>

      <View style={cp.inventory}>
        <Text style={cp.inventoryLabel}>◈  คลังเซนเซอร์  —  แตะเพื่อเลือก</Text>
        <View style={cp.inventoryRow}>
          {SENSORS.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[cp.inventoryItem, selectedSensor === s.id && cp.inventoryItemActive]}
              onPress={() => handlePickSensor(s.id)}
              activeOpacity={0.75}
            >
              <View style={cp.invArt}>
                <SensorModule type={s.id} w={38} />
              </View>
              <Text style={[cp.inventoryName, selectedSensor === s.id && cp.inventoryNameActive]}>
                {s.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[cp.runBtn, (!selectedSensor || connections.length === 0 || result === 'correct') && cp.runBtnDim]}
        onPress={handleRun}
        disabled={!selectedSensor || connections.length === 0 || result === 'correct'}
      >
        <Text style={cp.runBtnTxt}>⚡  RUN & TEST CIRCUIT</Text>
      </TouchableOpacity>

    </Animated.View>
  );
}

const cp = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0D1117' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#161B22',
    paddingHorizontal: 14, paddingVertical: 10,
    borderBottomWidth: 2, borderBottomColor: '#C97D10',
  },
  backBtn: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 6, borderWidth: 1.5, borderColor: '#555',
  },
  backBtnTxt: { color: '#aaa', fontSize: 12, fontWeight: '600' },
  title: { fontSize: 14, fontWeight: 'bold', color: '#FFD700', letterSpacing: 1 },
  chapterTag: { color: '#C97D10', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  parchment: {
    backgroundColor: '#F7E7C4',
    marginHorizontal: 14, marginTop: 12,
    borderRadius: 8, borderWidth: 2, borderColor: '#C97D10',
    padding: 10,
  },
  parchmentLabel: { fontSize: 11, fontWeight: '800', color: '#8B4513', marginBottom: 2 },
  parchmentTxt: { fontSize: 12, color: '#3B2010', lineHeight: 17 },
  board: {
    flex: 1,
    backgroundColor: '#1C1008',
    borderRadius: 10, borderWidth: 2.5, borderColor: '#5A3010',
    marginHorizontal: 14, marginTop: 12,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  stage: { position: 'absolute', left: 0, top: 0 },
  friedTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20,8,4,0.55)', borderRadius: 6,
  },
  deadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  deadTxt: { color: '#cfd3d8', fontSize: 11, fontWeight: '800' },
  rivet: {
    position: 'absolute', width: 8, height: 8,
    borderRadius: 4, backgroundColor: '#5A3010', zIndex: 20,
  },
  device: { position: 'absolute' },
  emptyDevice: {
    position: 'absolute',
    borderWidth: 2, borderColor: '#333', borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#111',
  },
  hitZone: { position: 'absolute', zIndex: 6, backgroundColor: 'transparent' },
  lockHotspot: { position: 'absolute', zIndex: 4 },
  legend: {
    flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap',
    marginHorizontal: 14, marginTop: 8, gap: 14,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 14, height: 6, borderRadius: 3 },
  legendTxt: { color: '#bbb', fontSize: 11, fontWeight: '600' },
  statusBar: {
    height: 30, justifyContent: 'center', alignItems: 'center',
    marginHorizontal: 14, marginTop: 8,
  },
  statusTxt: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  resultOverlay: {
    position: 'absolute', left: 0, right: 0, bottom: 0, top: 0,
    alignItems: 'center', justifyContent: 'flex-end', padding: 14,
  },
  resultCard: {
    width: '100%',
    backgroundColor: 'rgba(22,27,34,0.96)',
    borderRadius: 12, borderWidth: 1.5, borderColor: '#3a3a4c',
    padding: 14, alignItems: 'center', gap: 10,
  },
  connDot: {
    position: 'absolute', zIndex: 5,
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2, borderColor: '#fff',
  },
  connDotEsp:       { backgroundColor: '#2E7D32' },
  connDotActive:    { borderColor: '#FFD700', borderWidth: 3, transform: [{ scale: 1.3 }] },
  connDotConnected: { borderColor: '#C97D10', borderWidth: 3 },
  connDotWrong:     { borderColor: '#D94040', borderWidth: 3 },
  pinChip: {
    position: 'absolute', zIndex: 6, height: 16, minWidth: 30,
    borderRadius: 4, paddingHorizontal: 4,
    backgroundColor: 'rgba(20,70,40,0.95)', borderWidth: 1, borderColor: '#46d268',
    alignItems: 'center', justifyContent: 'center',
  },
  pinChipTxt: { color: '#8FFFB0', fontSize: 9.5, fontWeight: '800', fontFamily: 'monospace' },
  zoomHint: {
    position: 'absolute', bottom: 8, left: 0, right: 0, alignItems: 'center', zIndex: 15,
  },
  zoomHintTxt: { color: 'rgba(220,200,160,0.55)', fontSize: 10.5, fontWeight: '600' },
  invArt: { height: 44, alignItems: 'center', justifyContent: 'center' },
  feedbackOk:  { color: '#4CAF50', fontSize: 14, fontWeight: '700' },
  feedbackBad: { color: '#D94040', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  nextBtn: {
    width: '100%', backgroundColor: '#C97D10', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', elevation: 3,
  },
  nextBtnTxt: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  retryBtn: {
    paddingHorizontal: 24, paddingVertical: 8,
    borderRadius: 8, borderWidth: 1.5, borderColor: '#D94040',
  },
  retryBtnTxt: { color: '#D94040', fontSize: 13, fontWeight: '600' },
  inventory: {
    backgroundColor: '#161B22',
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 8,
    borderTopWidth: 2, borderTopColor: '#2a2a3a',
    marginTop: 8, gap: 8,
  },
  inventoryLabel: { color: '#666', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  inventoryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  inventoryItem: {
    alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 10,
    borderRadius: 8, borderWidth: 1.5, borderColor: '#2a2a3a',
    backgroundColor: '#1a1a2a', minWidth: 60,
  },
  inventoryItemActive: { borderColor: '#C97D10', backgroundColor: '#2a1a08' },
  inventoryName: { color: '#888', fontSize: 10, fontWeight: '700' },
  inventoryNameActive: { color: '#FFD700' },
  runBtn: {
    backgroundColor: '#C97D10',
    marginHorizontal: 14, marginBottom: 16, marginTop: 10,
    borderRadius: 10, paddingVertical: 15,
    alignItems: 'center', elevation: 4,
  },
  runBtnDim: { opacity: 0.35 },
  runBtnTxt: { color: '#fff', fontSize: 15, fontWeight: 'bold', letterSpacing: 0.5 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0e0e1a' },
  introRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, gap: 12 },
  chapterLabel: { color: '#fff', fontSize: 22, fontWeight: 'bold', letterSpacing: 2 },
  chapterIconRow: { fontSize: 28 },
  chapterTitle: { color: '#d4c9a8', fontSize: 16, fontWeight: '600', textAlign: 'center', lineHeight: 24 },
  introBox: { width: '100%', backgroundColor: '#1c1c30', borderRadius: 12, borderWidth: 1.5, borderColor: '#3a3a5c', padding: 14, gap: 12 },
  introDesc: { color: '#ccc', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  npcLineup: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8 },
  npcChip: { alignItems: 'center', backgroundColor: '#2a2a45', borderRadius: 8, padding: 8, minWidth: 48, borderWidth: 1, borderColor: '#4a4a6a' },
  npcChipBoss: { borderColor: '#D94040', backgroundColor: '#3a1a1a' },
  npcChipIcon: { fontSize: 20 },
  npcChipTxt: { color: '#aaa', fontSize: 10, fontWeight: '700', marginTop: 2 },
  npcChipBossTxt: { color: '#D94040' },
  introStarRow: { alignItems: 'center', gap: 4 },
  introStarTxt: { color: '#E8A020', fontSize: 15, fontWeight: '700' },
  introRewardTxt: { color: '#aaa', fontSize: 13 },
  clearRoot: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 32, paddingBottom: 40, gap: 12 },
  clearTitle: { color: '#4CAF50', fontSize: 24, fontWeight: 'bold', letterSpacing: 1 },
  clearParty: { fontSize: 48 },
  clearBadgeRow: { flexDirection: 'row', gap: 10 },
  clearBadge: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4 },
  clearBadgeTxt: { fontWeight: 'bold', fontSize: 14 },
  clearSubtitle: { color: '#d4c9a8', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  scoreRow: { flexDirection: 'row', gap: 12, width: '100%' },
  scoreBox: { flex: 1, backgroundColor: '#1c1c30', borderRadius: 10, borderWidth: 1, borderColor: '#3a3a5c', alignItems: 'center', paddingVertical: 10 },
  scoreLabel: { color: '#aaa', fontSize: 12 },
  scoreValue: { fontSize: 22, fontWeight: 'bold', marginTop: 2 },
  clearPanel: { width: '100%', backgroundColor: '#1c1c30', borderRadius: 10, borderWidth: 1, borderColor: '#3a3a5c', padding: 14 },
  clearPanelTxt: { color: '#ccc', fontSize: 13, lineHeight: 20 },
  clearHintRow: { width: '100%', backgroundColor: '#1a2a1a', borderRadius: 10, padding: 12, gap: 4 },
  clearHintTxt: { color: '#aaa', fontSize: 12 },
  clearHintLink: { color: '#D94040', fontSize: 12 },
  orangeBtn: { width: '100%', backgroundColor: '#C97D10', borderRadius: 12, paddingVertical: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  orangeBtnTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  backLink: { color: '#888', fontSize: 14, marginTop: 4 },
  root: { flex: 1 },
  scene: { width: SW, height: SCENE_H, overflow: 'hidden' },
  starBadge: { position: 'absolute', top: 10, right: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff8e1', borderRadius: 18, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 2, borderColor: '#E8A020', gap: 4 },
  starEmoji: { fontSize: 14 },
  starCount: { fontWeight: 'bold', fontSize: 15, color: '#555' },
  playerPos: { position: 'absolute', left: SW * 0.13, bottom: GROUND_PX },
  catClip: { width: CAT_W, height: CAT_H, overflow: 'hidden' },
  catSheet: { width: CAT_W * CAT_FRAMES, height: CAT_H },
  bossPos: { position: 'absolute', right: SW * 0.10, bottom: GROUND_PX },
  orcClip: { width: ORC_W, height: ORC_H, overflow: 'hidden' },
  orcSheet: { width: ORC_W * ORC_FRAMES, height: ORC_H },
  statsBar: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#F7F1E5', paddingVertical: 8, paddingHorizontal: 6, borderBottomWidth: 1, borderBottomColor: '#e5e5e5' },
  statCard: { alignItems: 'center', borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4, minWidth: 88 },
  statLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  statValue: { fontSize: 20, fontWeight: 'bold', marginTop: 1 },
  panel: { flex: 1, backgroundColor: '#F7F1E5', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 4 },
  npcRow: { flex: 1, flexDirection: 'row', gap: 10 },
  avatarWrap: { alignItems: 'center', gap: 4 },
  avatarBox: { width: 52, height: 52, borderRadius: 10, backgroundColor: '#f2f2f2', borderWidth: 1.5, borderColor: '#ddd', justifyContent: 'center', alignItems: 'center' },
  avatarEmoji: { fontSize: 28 },
  npcName: { fontSize: 11, fontWeight: '700', color: '#333', textAlign: 'center' },
  textScroll: { flex: 1 },
  dialogueTxt: { fontSize: 13, color: '#333', lineHeight: 20 },
  actionArea: { backgroundColor: '#F7F1E5', paddingHorizontal: 12, paddingVertical: 12 },
  acceptBtn: { backgroundColor: '#C97D10', borderRadius: 12, paddingVertical: 14, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 4 },
  acceptBtnTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  inputRow: { flexDirection: 'row', gap: 8 },
  answerInput: { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, backgroundColor: '#fafafa', color: '#333' },
  submitBtn: { width: 48, backgroundColor: '#C97D10', borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },
  submitBtnTxt: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});