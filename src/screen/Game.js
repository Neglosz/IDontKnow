import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Esp32Board, SensorModule, ESP_VB, ESP_PADS, SENSOR_VB, SENSOR_PADS } from './HardwareArt';
import Svg, { Path } from 'react-native-svg';

const { width: SW } = Dimensions.get('window');

const CAT_FRAMES = 3;
const CAT_W = 80;
const CAT_H = 80;
const CAT_FPS = 6;  // ความเร็ว animation แมว (frames/วินาที)
const ORC_FPS = 5; // ความเร็ว animation orc (frames/วินาที)

const ORC_W = 150;
const ORC_H = 175;
const _orcAsset = Image.resolveAssetSource(require('./assets/npc_orc-sheet.png'));
const ORC_FRAMES = Math.round(_orcAsset.width / ORC_W);

const BG_W = 540;
const BG_H = 576;
const SCENE_H = SW * (BG_H / BG_W);
const GROUND_PX = SCENE_H * ((BG_H - 530) / BG_H);

// Steps: 0=Intro  1=Battle(Professor)  2=Battle(Skeleton)  3=Battle(Orc)  4=Clear
const BATTLE_FRAMES = [
  {
    mode: 'dialogue',
    npc: 'Professor',
    emoji: '🧑‍🏫',
    text:
      'การคำนวณขนาดเส้นทองแดง (Trace Width)\n\n' +
      'จำไว้นะ ยิ่งกระแสไฟฟ้า (Current) ไหลผ่านบอร์ดมาก เส้นทองแดงก็ต้องยิ่งกว้างขึ้น\n\n' +
      'โดยสูตรพื้นฐานที่ต้องรู้:\n' +
      'ความกว้างเส้นทองแดง (mil) = กระแสไฟ (A) × 50\n\n' +
      'ถ้าเส้นทองแดงเล็กเกินไป บอร์ดจะมอร์ดรองขาดได้!',
  },
  {
    mode: 'input',
    npc: 'Skeleton',
    emoji: '💀',
    text:
      'แฮ่ อยากไปไม่ดอรหรอ? ถ้ากระแสซอมบี้มีน้อย\n' +
      'ปัญหาหนู ๆ แผงวงจรควบคุมบุกตนอันนี้มีกระแสไฟผ่าน 1 แอมแปร์ (1A) ' +
      'และต้องตั้งค่าความกว้างเส้นทองแดง (Trace Width) mil ' +
      'ลายวงจรจะดีจะไม่จาง? พิมพ์คำตอบมาซิ!',
    answer: '50',
  },
  {
    mode: 'input',
    npc: 'Orc แห่งความสับสน',
    emoji: '👹',
    text:
      'กี่ ผ่านเจ้ากระบวนท่าได้ไงล่ะ! ' +
      'บอร์ดตลาดกระแสจ่ายไฟฟ้าสูงถึง 3 แอมแปร์ (3A) ' +
      'และต้องการขยายขนาดเส้นทองแดงกี่ mil ' +
      'จะทำแนวทางกำลังส่งออกจ่ายให้ไหว? พิมพ์คำตอบเลย!',
    answer: '150',
  },
];

function useSpriteAnim(frameCount, fps = 8) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setFrame(f => (f + 1) % frameCount), 1000 / fps);
    return () => clearInterval(id);
  }, [frameCount, fps]);
  return frame;
}

export default function Game() {
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState('');
  const [combo, setCombo] = useState(1);
  const [bestCombo] = useState(6);
  const [stars, setStars] = useState(1);
  const [circuitOpen, setCircuitOpen] = useState(false);

  const catFrame = useSpriteAnim(CAT_FRAMES, CAT_FPS);
  const orcFrame = useSpriteAnim(ORC_FRAMES, ORC_FPS);

  const goNext = () => {
    if (step >= 1 && step <= 3) {
      const frame = BATTLE_FRAMES[step - 1];
      if (frame.mode === 'input') {
        setCombo(c => c + 1);
        setAnswer('');
      }
      if (step === 1) setStars(2);
    }
    setStep(s => s + 1);
  };

  // ── Step 0: Intro ────────────────────────────────────────────────────────
  if (step === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.introRoot}>
          <Text style={styles.chapterLabel}>CHAPTER 3</Text>
          <Text style={styles.chapterIconRow}>⚙️  💰</Text>
          <Text style={styles.chapterTitle}>PCB Layout & Routing{'\n'}DUNGEON</Text>

          <View style={styles.introBox}>
            <Text style={styles.introDesc}>
              Hippo จะได้พบผู้เชี่ยวชาญ 3 คนเพื่อเรียนรู้{'\n'}
              ก่อนเผชิญหน้ากับ Boss Monster.....
            </Text>
            <View style={styles.npcLineup}>
              {['PRO', 'PRO', 'PRO', 'BOSS'].map((label, i) => (
                <View key={i} style={[styles.npcChip, label === 'BOSS' && styles.npcChipBoss]}>
                  <Text style={styles.npcChipIcon}>{label === 'BOSS' ? '👹' : '🧑‍🏫'}</Text>
                  <Text style={[styles.npcChipTxt, label === 'BOSS' && styles.npcChipBossTxt]}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.introStarRow}>
            <Text style={styles.introStarTxt}>⭐  Your Stars:  1200</Text>
            <Text style={styles.introRewardTxt}>Max Reward: +10</Text>
          </View>

          <TouchableOpacity style={styles.orangeBtn} activeOpacity={0.8} onPress={goNext}>
            <Text style={styles.orangeBtnTxt}>เริ่มเลย !!!</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.6}>
            <Text style={styles.backLink}>◄  BACK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Step 4: Clear ────────────────────────────────────────────────────────
  if (step === 4) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={styles.clearRoot} showsVerticalScrollIndicator={false}>
          <Text style={styles.clearTitle}>CHAPTER 3 Clear !</Text>
          <Text style={styles.clearParty}>🎉</Text>

          <View style={styles.clearBadgeRow}>
            <View style={[styles.clearBadge, { borderColor: '#E8A020' }]}>
              <Text style={[styles.clearBadgeTxt, { color: '#E8A020' }]}>⭐ +7</Text>
            </View>
            <View style={[styles.clearBadge, { borderColor: '#D94040' }]}>
              <Text style={[styles.clearBadgeTxt, { color: '#D94040' }]}>🔥 COMBO {bestCombo}</Text>
            </View>
          </View>

          <Text style={styles.clearSubtitle}>PCB Layout & Routing DUNGEON</Text>

          <View style={styles.scoreRow}>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>แถวเปล่า</Text>
              <Text style={[styles.scoreValue, { color: '#D94040' }]}>-15</Text>
            </View>
            <View style={styles.scoreBox}>
              <Text style={styles.scoreLabel}>Boss Bonus</Text>
              <Text style={[styles.scoreValue, { color: '#2E7D32' }]}>+3</Text>
            </View>
          </View>

          <View style={styles.clearPanel}>
            <Text style={styles.clearPanelTxt}>
              ถ้าต้องการวางเส้นทองแดงจ่ายไฟขนาดไม่สายให้รองรับกระแส 3 แอมแปร์ (3A){' '}
              จะต้องตั้งค่าความกว้างเส้นทองแดง mil?
            </Text>
            <Text style={styles.clearAnswer}>คำตอบของคุณ: 200 mil</Text>
            <Text style={styles.clearCorrect}>คำตอบที่ถูก: 150 mil</Text>
            <Text style={styles.clearExplain}>
              {'\n'}อธิบาย:{'\n'}
              ความกว้างเส้นทองแดง (mil){'\n'}
              = กระแสไฟ (A) × 50 = 3 × 50 = 150 mil
            </Text>
          </View>

          <View style={styles.clearHintRow}>
            <Text style={styles.clearHintTxt}>🧑‍🏫  ควรทบทวนเรื่อง "กระแสไฟฟ้า (Current)"</Text>
            <Text style={styles.clearHintTxt}>       ลองเพิ่มเรื่อง "สูตรคำนวณ Trace Width"</Text>
            <Text style={styles.clearHintLink}>       🔴 สร้าง Node การเรียนรู้</Text>
          </View>

          <TouchableOpacity style={[styles.orangeBtn, { marginTop: 16 }]} activeOpacity={0.8} onPress={() => setStep(0)}>
            <Text style={styles.orangeBtnTxt}>กลับ SKILL TREE  ▶</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Circuit puzzle — full screen mini-game ──────────────────────────────
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

  // ── Steps 1–3: Battle ────────────────────────────────────────────────────
  const frame = BATTLE_FRAMES[step - 1];
  const multiplier = (1 + (combo - 1) * 0.2).toFixed(1);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.root}>

        {/* Battle scene */}
        <View style={styles.scene}>
          <Image
            source={require('./assets/background.png')}
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
                source={require('./assets/player_cat-sheet.png')}
                style={[styles.catSheet, { transform: [{ translateX: -catFrame * CAT_W }] }]}
                resizeMode="stretch"
              />
            </View>
          </View>
          <View style={styles.bossPos}>
            <View style={styles.orcClip}>
              <Image
                source={require('./assets/npc_orc-sheet.png')}
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
                <Text style={styles.avatarEmoji}>{frame.emoji}</Text>
              </View>
              <Text style={styles.npcName}>{frame.npc}</Text>
            </View>
            <ScrollView style={styles.textScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.dialogueTxt}>{frame.text}</Text>
            </ScrollView>
          </View>
        </View>

        {/* Action area */}
        <View style={styles.actionArea}>
          {frame.mode === 'dialogue' ? (
            <TouchableOpacity style={styles.acceptBtn} activeOpacity={0.8} onPress={goNext}>
              <Text style={styles.acceptBtnTxt}>รับทราบ  ▶</Text>
            </TouchableOpacity>
          ) : step === 3 ? (
            // Boss: INTERACT opens circuit board overlay
            <TouchableOpacity style={styles.acceptBtn} activeOpacity={0.8} onPress={() => setCircuitOpen(true)}>
              <Text style={styles.acceptBtnTxt}>🔌  INTERACT  ▶</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.inputRow}>
              <TextInput
                style={styles.answerInput}
                placeholder="พิมพ์คำตอบ..."
                placeholderTextColor="#aaa"
                value={answer}
                onChangeText={setAnswer}
                underlineColorAndroid="transparent"
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.submitBtn} activeOpacity={0.8} onPress={goNext}>
                <Text style={styles.submitBtnTxt}>▶</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Circuit Board Overlay (Boss only) ─────────────────────── */}

      </View>
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
// You never draw wires by hand — just declare connections {from,to} as data and
// this builds a clean, non-overlapping path between the two measured pins.
// Each wire gets its own vertical "lane" in the gap so wires never sit on top
// of each other (sorted by mid-height to minimise crossings).
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

// items: [{ s:{x,y}, e:{x,y}, color }]  →  [{ d, color }]
function routeWires(items) {
  if (!items.length) return [];
  const espX = Math.max(...items.map(it => it.s.x));
  const senX = Math.min(...items.map(it => it.e.x));
  let gapL = espX + 14, gapR = senX - 14;
  if (gapR < gapL) { const m = (espX + senX) / 2; gapL = gapR = m; } // tight fallback
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
        <Path key={i} d={w.d} stroke={w.color} strokeWidth={5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
      ))}
    </Svg>
  );
}

// ── Wire renderer — vertical-first routing (ESP on top → sensor below) ───────
// V1 (down) → H (across, at a staggered mid-Y) → V2 (down into sensor pin)
function CpWireV({ x1, y1, x2, y2, color = '#C97D10', offset = 0 }) {
  const T = 5;
  const R = T / 2;
  let my = Math.min(y1, y2) + 16 + offset;          // staggered crossbar
  const maxMy = Math.max(y1, y2) - 8;
  if (my > maxMy) my = (y1 + y2) / 2;
  const s = (extra) => ({ position: 'absolute', backgroundColor: color, ...extra });
  const vTop = Math.min(y1, my), vH = Math.abs(my - y1);
  const v2Top = Math.min(my, y2), v2H = Math.abs(y2 - my);

  return (
    <>
      {/* V1: y1 → my at x1 */}
      <View pointerEvents="none" style={s({ left: x1 - R, top: vTop - R, width: T, height: vH + T })} />
      {/* H: x1 → x2 at my */}
      <View pointerEvents="none" style={s({ left: Math.min(x1, x2) - R, top: my - R, width: Math.abs(x2 - x1) + T, height: T })} />
      {/* V2: my → y2 at x2 */}
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
      {/* H1: x1 → mx (works for both left→right and right→left) */}
      <View pointerEvents="none" style={s({
        left:   Math.min(x1, mx) - R,
        top:    y1 - R,
        width:  Math.abs(mx - x1) + T,
        height: T,
      })} />
      {/* V: vertical bridge at mx */}
      {dy > 1 && (
        <View pointerEvents="none" style={s({
          left:   mx - R,
          top:    minY - R,
          width:  T,
          height: dy + T,
        })} />
      )}
      {/* H2: mx → x2 */}
      <View pointerEvents="none" style={s({
        left:   Math.min(mx, x2) - R,
        top:    y2 - R,
        width:  Math.abs(x2 - mx) + T,
        height: T,
      })} />
    </>
  );
}

// ── CircuitPuzzle component ───────────────────────────────────────────────────
function CircuitPuzzle({ onSuccess, onClose }) {
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [activePinId,    setActivePinId]    = useState(null);
  const [connections,    setConnections]    = useState([]);
  const [result,         setResult]         = useState(null);
  const [wrongIds,       setWrongIds]       = useState([]);

  // ── Real pin positions, measured relative to the board ───────────────
  // Instead of guessing from fixed constants (which breaks across screen
  // sizes & label widths), we measure each dot's true center vs the board.
  const BOARD_BORDER = 2.5; // cp.board borderWidth — absolute children start inside it
  const boardRef = useRef(null);
  const pinRefs  = useRef({});
  const [pinPos, setPinPos] = useState({}); // { [id]: { x, y } }

  // Live board size → scales the device art to fit any screen.
  const [boardSize, setBoardSize] = useState({ w: SW - 28, h: 380 });

  // Brief feedback when the player taps a locked (unused) pin.
  const [lockedHint, setLockedHint] = useState(false);
  const lockTimer = useRef(null);
  const handleLockedTap = () => {
    setLockedHint(true);
    if (lockTimer.current) clearTimeout(lockTimer.current);
    lockTimer.current = setTimeout(() => setLockedHint(false), 1700);
  };
  useEffect(() => () => { if (lockTimer.current) clearTimeout(lockTimer.current); }, []);

  const measurePin = (id) => {
    const node  = pinRefs.current[id];
    const board = boardRef.current;
    if (!node || !board) return;
    requestAnimationFrame(() => {
      try {
        if (typeof board.measure !== 'function' || typeof node.measure !== 'function') return;
        // Measure board origin (page coords), then the dot — subtract to get
        // a board-relative center. Works on both New (Fabric) & Old arch,
        // and avoids measureLayout's ref/handle restrictions.
        board.measure((bx, by, bw, bh, bpx, bpy) => {
          node.measure((x, y, w, h, px, py) => {
            if (px == null || py == null || bpx == null || bpy == null) return;
            const nx = px - bpx - BOARD_BORDER + w / 2;
            const ny = py - bpy - BOARD_BORDER + h / 2;
            setPinPos(prev => {
              const c = prev[id];
              if (c && Math.abs(c.x - nx) < 0.5 && Math.abs(c.y - ny) < 0.5) return prev;
              return { ...prev, [id]: { x: nx, y: ny } };
            });
          });
        });
      } catch (e) { /* ignore transient measure errors */ }
    });
  };

  const getPinPos = (id) => pinPos[id] || null;

  const handlePickSensor = (id) => {
    setSelectedSensor(id);
    setConnections([]);
    setActivePinId(null);
    setResult(null);
    setWrongIds([]);
  };

  const handlePinTap = (id) => {
    if (result === 'correct') return;

    if (!activePinId) { setActivePinId(id); return; }
    if (activePinId === id) { setActivePinId(null); return; }

    const activeIsSen = activePinId.startsWith('sen_');
    const tapIsSen    = id.startsWith('sen_');
    // Must connect sensor ↔ ESP32; same-side tap just switches selection
    if (activeIsSen === tapIsSen) { setActivePinId(id); return; }

    const [from, to] = activeIsSen ? [activePinId, id] : [id, activePinId];
    const next = connections.filter(c => c.from !== from && c.to !== to);
    setConnections([...next, { from, to }]);
    setActivePinId(null);
    setWrongIds([]);
  };

  const handleRun = () => {
    if (!selectedSensor || connections.length === 0) return;
    if (selectedSensor !== CORRECT_SENSOR) {
      setResult('wrong_sensor'); return;
    }
    const allOk = CORRECT_WIRES.every(w =>
      connections.some(c => c.from === w.from && c.to === w.to)
    );
    if (allOk && connections.length === CORRECT_WIRES.length) {
      setResult('correct');
    } else {
      const bad = connections.filter(c =>
        !CORRECT_WIRES.some(w => w.from === c.from && w.to === c.to)
      );
      setWrongIds(bad.map(c => c.from));
      setResult('wrong_wire');
    }
  };

  const handleReset = () => {
    setConnections([]); setActivePinId(null);
    setResult(null); setWrongIds([]);
  };

  const wireColor = (conn) => wrongIds.includes(conn.from) ? WIRE_ERROR : (WIRE_PALETTE[conn.from] || '#C97D10');
  // Colour for a pin's connected ring (matches the wire attached to it)
  const connColorFor = (pinId) => {
    const c = connections.find(x => x.from === pinId || x.to === pinId);
    if (!c) return null;
    return wrongIds.includes(c.from) ? WIRE_ERROR : (WIRE_PALETTE[c.from] || '#C97D10');
  };
  const sensor = SENSORS.find(s => s.id === selectedSensor);

  // ── Adaptive sizing: ESP32 (vertical) on left, sensor on right ───────
  const BPAD = 16;
  const contentW = Math.max(200, boardSize.w - BPAD * 2);
  const contentH = Math.max(200, boardSize.h - BPAD * 2);

  let espH = contentH;                          // try to fill height
  let espW = espH * ESP_VB.w / ESP_VB.h;
  const espMaxW = contentW * 0.46;              // ...but leave room for sensor
  if (espW > espMaxW) { espW = espMaxW; espH = espW * ESP_VB.h / ESP_VB.w; }
  const sE = espW / ESP_VB.w;

  let senW = contentW * 0.40;
  let senH = senW * SENSOR_VB.h / SENSOR_VB.w;
  if (senH > contentH) { senH = contentH; senW = senH * SENSOR_VB.w / SENSOR_VB.h; }
  const sS = senW / SENSOR_VB.w;

  // Touch-zone sizing: keep each pin's tap area shorter than the pin pitch so
  // neighbouring pins never overlap (the cause of "only the top pin is tappable").
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

  // Auto-routed wires (data → path). ESP pin = conn.to, sensor pin = conn.from.
  const boardInnerW = Math.max(0, boardSize.w - BOARD_BORDER * 2);
  const boardInnerH = Math.max(0, boardSize.h - BOARD_BORDER * 2);
  const wireData = routeWires(
    connections.map(conn => {
      const s = getPinPos(conn.to), e = getPinPos(conn.from);
      if (!s || !e) return null;
      return { s, e, color: wireColor(conn) };
    }).filter(Boolean)
  );

  return (
    <View style={cp.screen}>

      {/* ── Top bar ─────────────────────────────────── */}
      <View style={cp.topBar}>
        <TouchableOpacity onPress={onClose} style={cp.backBtn}>
          <Text style={cp.backBtnTxt}>◄ ออก</Text>
        </TouchableOpacity>
        <Text style={cp.title}>THE BLUEPRINT...</Text>
        <Text style={cp.chapterTag}>CHAPTER 3</Text>
      </View>

      {/* ── Mission parchment ───────────────────────── */}
      <View style={cp.parchment}>
        <Text style={cp.parchmentLabel}>📜  ภารกิจ</Text>
        <Text style={cp.parchmentTxt}>
          {!selectedSensor
            ? '"เลือกเซนเซอร์ที่ใช้ตรวจจับการเคลื่อนไหว แล้วต่อสายให้ถูกต้อง"'
            : '"แตะขาที่เรืองแสง (3V3 / GND / D2) บน ESP32 → แตะขาบนเซนเซอร์ทางขวา"'}
        </Text>
      </View>

      {/* ── Circuit board (flex:1) ───────────────────── */}
      <View
        ref={boardRef}
        style={cp.board}
        collapsable={false}
        onLayout={(e) => { const l = e?.nativeEvent?.layout; if (l) setBoardSize({ w: l.width, h: l.height }); }}
      >
        {/* Corner rivets */}
        {[{top:6,left:6},{top:6,right:6},{bottom:6,left:6},{bottom:6,right:6}].map((pos,i) => (
          <View key={i} style={[cp.rivet, pos]} />
        ))}

        {/* Wires — auto-routed lanes, drawn as one SVG layer */}
        <WireLayer wires={wireData} width={boardInnerW} height={boardInnerH} />

        {/* LEFT — ESP32 DevKit (30 pins; only 3V3 / GND / D2 are usable) */}
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
                  style={[cp.lockHotspot, { left: cx - 11, top: cy - espHitH / 2, width: 22, height: espHitH }]}
                />
              );
            }
            const isActive = activePinId === p.id;
            const isConn   = connections.some(c => c.to === p.id);
            return (
              <React.Fragment key={p.key}>
                {/* wide touch zone, extends LEFT into the board (stays in bounds) */}
                <TouchableOpacity
                  onPress={() => handlePinTap(p.id)}
                  activeOpacity={0.7}
                  style={[cp.hitZone, { left: cx - HIT_W + 12, top: cy - espHitH / 2, width: HIT_W, height: espHitH }]}
                />
                {/* the visible pad dot, pinned exactly on the pin */}
                <View
                  pointerEvents="none"
                  ref={(r) => { if (r) pinRefs.current[p.id] = r; }}
                  onLayout={() => measurePin(p.id)}
                  collapsable={false}
                  style={[
                    cp.connDot, cp.connDotEsp,
                    { left: cx - 9, top: cy - 9 },
                    isActive && cp.connDotActive,
                    isConn   && cp.connDotConnected,
                    isConn   && { borderColor: connColorFor(p.id) },
                  ]}
                />
              </React.Fragment>
            );
          })}
        </View>

        {/* RIGHT — Sensor module */}
        {selectedSensor && sensor ? (
          <View style={[cp.device, { left: senLeft, top: senTop, width: senW, height: senH }]}>
            <SensorModule type={sensor.id} w={senW} labels={SENSOR_PADS.map(p => senLabel(p.id))} />
            {SENSOR_PADS.map(p => {
              const cx = p.x * sS, cy = p.y * sS;
              const isActive = activePinId === p.id;
              const isConn   = connections.some(c => c.from === p.id);
              return (
                <React.Fragment key={p.id}>
                  {/* wide touch zone, extends RIGHT into the module body */}
                  <TouchableOpacity
                    onPress={() => handlePinTap(p.id)}
                    activeOpacity={0.7}
                    style={[cp.hitZone, { left: Math.max(0, cx - 12), top: cy - senHitH / 2, width: HIT_W, height: senHitH }]}
                  />
                  <View
                    pointerEvents="none"
                    ref={(r) => { if (r) pinRefs.current[p.id] = r; }}
                    onLayout={() => measurePin(p.id)}
                    collapsable={false}
                    style={[
                      cp.connDot, { backgroundColor: sensor.color },
                      { left: cx - 9, top: cy - 9 },
                      isActive && cp.connDotActive,
                      isConn   && cp.connDotConnected,
                      isConn   && { borderColor: connColorFor(p.id) },
                      wrongIds.includes(p.id) && cp.connDotWrong,
                    ]}
                  />
                </React.Fragment>
              );
            })}
          </View>
        ) : (
          <View style={[cp.emptyDevice, { left: senLeft, top: senTop, width: senW, height: senH }]}>
            <Text style={cp.emptySlotQ}>?</Text>
            <Text style={cp.emptySlotTxt}>เลือก{'\n'}เซนเซอร์</Text>
          </View>
        )}

        {/* ── Result overlay (absolute → doesn't push the board) ──────── */}
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
                    {result === 'wrong_sensor'
                      ? '❌  เซนเซอร์ผิดประเภท — ต้องใช้เซนเซอร์ตรวจจับการเคลื่อนไหว'
                      : '❌  การต่อสายไม่ถูกต้อง ตรวจสอบขาที่ต่ออีกครั้ง'}
                  </Text>
                  <TouchableOpacity style={cp.retryBtn} onPress={handleReset}>
                    <Text style={cp.retryBtnTxt}>รีเซ็ตสาย</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
      </View>

      {/* ── Wire colour legend ───────────────────────── */}
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

      {/* ── Status bar (fixed height → never reflows the board) ───────── */}
      <View style={cp.statusBar}>
        {result ? (
          <Text style={[cp.statusTxt, { color: result === 'correct' ? '#4CAF50' : '#E8908F' }]} numberOfLines={1}>
            {result === 'correct'
              ? '✅ วงจรสมบูรณ์! ประตูเปิดแล้ว'
              : result === 'wrong_sensor'
                ? '❌ เซนเซอร์ผิดประเภท'
                : '❌ การต่อสายไม่ถูกต้อง'}
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

      {/* ── Sensor inventory ─────────────────────────── */}
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

      {/* ── Run button ───────────────────────────────── */}
      <TouchableOpacity
        style={[cp.runBtn, (!selectedSensor || connections.length === 0 || result === 'correct') && cp.runBtnDim]}
        onPress={handleRun}
        disabled={!selectedSensor || connections.length === 0 || result === 'correct'}
      >
        <Text style={cp.runBtnTxt}>⚡  RUN & TEST CIRCUIT</Text>
      </TouchableOpacity>

    </View>
  );
}

const cp = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0D1117' },

  // Top bar
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

  // Parchment scroll
  parchment: {
    backgroundColor: '#F7E7C4',
    marginHorizontal: 14, marginTop: 12,
    borderRadius: 8, borderWidth: 2, borderColor: '#C97D10',
    padding: 10,
  },
  parchmentLabel: { fontSize: 11, fontWeight: '800', color: '#8B4513', marginBottom: 2 },
  parchmentTxt: { fontSize: 12, color: '#3B2010', lineHeight: 17 },

  // Board (flex:1, takes main space)
  board: {
    flex: 1,
    backgroundColor: '#1C1008',
    borderRadius: 10, borderWidth: 2.5, borderColor: '#5A3010',
    marginHorizontal: 14, marginTop: 12,
    padding: 16,
    position: 'relative',
  },
  rivet: {
    position: 'absolute', width: 8, height: 8,
    borderRadius: 4, backgroundColor: '#5A3010',
  },

  // Device containers (art + overlaid tappable pins)
  device: { position: 'absolute' },
  emptyDevice: {
    position: 'absolute',
    borderWidth: 2, borderColor: '#333', borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#111',
  },
  hotspot: {
    position: 'absolute', width: 34, height: 34,
    alignItems: 'center', justifyContent: 'center', zIndex: 5,
  },
  hitZone: {
    position: 'absolute', zIndex: 6, backgroundColor: 'transparent',
  },
  lockHotspot: {
    position: 'absolute', zIndex: 4,
  },
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
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: '#fff',
  },
  connDotEsp:       { backgroundColor: '#2E7D32' },
  connDotActive:    { borderColor: '#FFD700', borderWidth: 3, transform: [{ scale: 1.28 }] },
  connDotConnected: { borderColor: '#C97D10', borderWidth: 3 },
  connDotWrong:     { borderColor: '#D94040', borderWidth: 3 },
  pinPill: {
    position: 'absolute', zIndex: 6,
    backgroundColor: 'rgba(13,17,22,0.86)',
    borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2,
  },
  pinPillTxt: { color: '#8FE6A8', fontSize: 10, fontWeight: '700' },
  hintStripLock: { borderLeftColor: '#D94040', backgroundColor: '#2a1212' },

  // ESP32 column
  espCol: { width: 110, gap: 0 },
  chipArt: {
    width: '100%',
    height: 132,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  chipName: {
    color: '#4CAF50', fontSize: 9, fontWeight: 'bold',
    letterSpacing: 0.5, marginTop: 3, textAlign: 'center',
  },
  invArt: {
    height: 44, alignItems: 'center', justifyContent: 'center',
  },
  chipCard: {
    width: '100%',
    backgroundColor: '#0D2010',
    borderWidth: 2, borderColor: '#2E7D32',
    borderRadius: 8, padding: 8,
    alignItems: 'center', gap: 2, marginBottom: 10,
  },
  chipIconTxt: { fontSize: 22, color: '#4CAF50' },
  chipNameTxt: {
    color: '#4CAF50', fontSize: 9, fontWeight: 'bold',
    textAlign: 'center', letterSpacing: 0.5,
  },

  // Pin rows
  pinRowLeft: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'flex-end', gap: 8, paddingVertical: 10,
  },
  pinLabelLeft: { color: '#8b8', fontSize: 12, fontWeight: '600' },
  pinRowRight: {
    width: '100%',
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'flex-start', gap: 8, paddingVertical: 10,
  },
  pinLabelRight: { color: '#ddd', fontSize: 12, fontWeight: '600' },

  // Pin dots
  pinDot: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#fff',
  },
  pinDotGreen:     { backgroundColor: '#2E7D32' },
  pinDotActive:    { borderColor: '#FFD700', borderWidth: 3, transform: [{ scale: 1.3 }] },
  pinDotConnected: { borderColor: '#C97D10', borderWidth: 3 },
  pinDotWrong:     { borderColor: '#D94040', borderWidth: 3 },

  // Sensor column
  senCol: { width: 110, gap: 0, alignItems: 'flex-end' },
  emptySlot: {
    flex: 1, width: '100%',
    borderWidth: 2, borderColor: '#333',
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#111',
  },
  emptySlotQ:   { color: '#444', fontSize: 28, fontWeight: 'bold' },
  emptySlotTxt: { color: '#444', fontSize: 9, textAlign: 'center', marginTop: 4 },

  // Active pin hint
  hintStrip: {
    backgroundColor: '#252010', marginHorizontal: 14, marginTop: 8,
    borderRadius: 6, padding: 8,
    borderLeftWidth: 3, borderLeftColor: '#FFD700',
  },
  hintStripTxt: { color: '#FFD700', fontSize: 11, fontWeight: '600' },

  // Feedback
  feedbackBox: {
    marginHorizontal: 14, marginTop: 8,
    backgroundColor: '#161B22',
    borderRadius: 10, borderWidth: 1.5, borderColor: '#2a2a3a',
    padding: 12, alignItems: 'center', gap: 10,
  },
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

  // Sensor inventory
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
  inventoryIcon: { fontSize: 22 },
  inventoryName: { color: '#888', fontSize: 10, fontWeight: '700' },
  inventoryNameActive: { color: '#FFD700' },

  // Run button
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

  // ── Intro ──────────────────────────────────────
  introRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 12,
  },
  chapterLabel: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  chapterIconRow: { fontSize: 28 },
  chapterTitle: {
    color: '#d4c9a8',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
  introBox: {
    width: '100%',
    backgroundColor: '#1c1c30',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#3a3a5c',
    padding: 14,
    gap: 12,
  },
  introDesc: {
    color: '#ccc',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  npcLineup: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  npcChip: {
    alignItems: 'center',
    backgroundColor: '#2a2a45',
    borderRadius: 8,
    padding: 8,
    minWidth: 52,
    borderWidth: 1,
    borderColor: '#4a4a6a',
  },
  npcChipBoss: {
    borderColor: '#D94040',
    backgroundColor: '#3a1a1a',
  },
  npcChipIcon: { fontSize: 20 },
  npcChipTxt: { color: '#aaa', fontSize: 10, fontWeight: '700', marginTop: 2 },
  npcChipBossTxt: { color: '#D94040' },
  introStarRow: {
    alignItems: 'center',
    gap: 4,
  },
  introStarTxt: { color: '#E8A020', fontSize: 15, fontWeight: '700' },
  introRewardTxt: { color: '#aaa', fontSize: 13 },

  // ── Clear ──────────────────────────────────────
  clearRoot: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
    gap: 12,
  },
  clearTitle: {
    color: '#4CAF50',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  clearParty: { fontSize: 48 },
  clearBadgeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  clearBadge: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  clearBadgeTxt: { fontWeight: 'bold', fontSize: 14 },
  clearSubtitle: {
    color: '#d4c9a8',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  scoreBox: {
    flex: 1,
    backgroundColor: '#1c1c30',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a5c',
    alignItems: 'center',
    paddingVertical: 10,
  },
  scoreLabel: { color: '#aaa', fontSize: 12 },
  scoreValue: { fontSize: 22, fontWeight: 'bold', marginTop: 2 },
  clearPanel: {
    width: '100%',
    backgroundColor: '#1c1c30',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a5c',
    padding: 14,
  },
  clearPanelTxt: { color: '#ccc', fontSize: 13, lineHeight: 20 },
  clearAnswer: { color: '#D94040', fontSize: 13, fontWeight: '600', marginTop: 8 },
  clearCorrect: { color: '#4CAF50', fontSize: 13, fontWeight: '600' },
  clearExplain: { color: '#aaa', fontSize: 12, lineHeight: 18 },
  clearHintRow: {
    width: '100%',
    backgroundColor: '#1a2a1a',
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  clearHintTxt: { color: '#aaa', fontSize: 12 },
  clearHintLink: { color: '#D94040', fontSize: 12 },

  // ── Shared button ──────────────────────────────
  orangeBtn: {
    width: '100%',
    backgroundColor: '#C97D10',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  orangeBtnTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  backLink: { color: '#888', fontSize: 14, marginTop: 4 },

  // ── Battle ─────────────────────────────────────
  root: { flex: 1 },
  scene: { width: SW, height: SCENE_H, overflow: 'hidden' },
  starBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#E8A020',
    gap: 4,
  },
  starEmoji: { fontSize: 14 },
  starCount: { fontWeight: 'bold', fontSize: 15, color: '#555' },
  playerPos: { position: 'absolute', left: SW * 0.13, bottom: GROUND_PX },
  catClip: { width: CAT_W, height: CAT_H, overflow: 'hidden' },
  catSheet: { width: CAT_W * CAT_FRAMES, height: CAT_H },
  bossPos: { position: 'absolute', right: SW * 0.10, bottom: GROUND_PX },
  orcClip: { width: ORC_W, height: ORC_H, overflow: 'hidden' },
  orcSheet: { width: ORC_W * ORC_FRAMES, height: ORC_H },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F7F1E5',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  statCard: {
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 88,
  },
  statLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  statValue: { fontSize: 20, fontWeight: 'bold', marginTop: 1 },
  panel: {
    flex: 1,
    backgroundColor: '#F7F1E5',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  npcRow: { flex: 1, flexDirection: 'row', gap: 10 },
  avatarWrap: { alignItems: 'center', gap: 4 },
  avatarBox: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#f2f2f2',
    borderWidth: 1.5,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: { fontSize: 28 },
  npcName: { fontSize: 11, fontWeight: '700', color: '#333', textAlign: 'center' },
  textScroll: { flex: 1 },
  dialogueTxt: { fontSize: 13, color: '#333', lineHeight: 20 },
  actionArea: { backgroundColor: '#F7F1E5', paddingHorizontal: 12, paddingVertical: 12 },
  acceptBtn: {
    backgroundColor: '#C97D10',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  acceptBtnTxt: { color: '#fff', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  inputRow: { flexDirection: 'row', gap: 8 },
  answerInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    backgroundColor: '#fafafa',
    color: '#333',
  },
  submitBtn: {
    width: 48,
    backgroundColor: '#C97D10',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  submitBtnTxt: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // ── Circuit board overlay ───────────────────────────────────────
});