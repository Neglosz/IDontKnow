import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';

const { width: SW } = Dimensions.get('window');
const BORDER = { borderWidth: 3, borderColor: '#2C1B10' };
const MONO = { fontFamily: 'monospace' };
const TYPE_COLOR = {
  event: '#C97D10',
  sensor: '#3A8FE8',
  cond: '#C9A227',
  action: '#2E7D32',
};

const LEVELS = [
  {
    npc: 'ศาสตราจารย์ฮิปโป',
    emoji: '🦛',
    title: 'เปิดประตูเมื่อเจอคน',
    brief:
      'ภารกิจแรก! ต่อโปรแกรมให้ ESP32 อ่านค่าจากเซนเซอร์ PIR\n\n' +
      'ถ้าตรวจเจอมนุษย์ (HIGH) ให้สั่งเปิดประตูโรงเรือนทันที\n' +
      'ลากบล็อกจากคลังด้านซ้ายมาเรียงในวงจรให้ถูกลำดับ แล้วกด RUN',
    blocks: [
      { id: 'start', type: 'event', icon: '▶', label: 'เริ่มทำงาน', code: 'void setup()' },
      { id: 'if_pir', type: 'cond', icon: '◇', label: 'ถ้าเจอคน', code: 'if (PIR == HIGH)' },
      { id: 'open_gate', type: 'action', icon: '🚪', label: 'เปิดประตู', code: 'openGate()' },
      { id: 'water_pump', type: 'action', icon: '💧', label: 'รดน้ำ', code: 'waterPump()' },
    ],
    correct: ['start', 'if_pir', 'open_gate'],
    success: [
      'วงจรทำงานสมบูรณ์!',
      'PIR ตรวจจับมนุษย์ได้',
      'ประตูโรงเรือนเปิดอัตโนมัติ...',
    ],
    error: [
      'โปรแกรมลำดับผิด!',
      'ประตูไม่เปิด แถมน้ำท่วมโรงเรือน',
      'ต้องตรวจจับคนก่อนเปิดประตูนะ',
    ],
  },
  {
    npc: 'Skeleton Coder',
    emoji: '💀',
    title: 'เปิดพัดลมเมื่ออากาศร้อน',
    brief:
      'เฮ้! ลูปนี้ถูกสาป โรงเรือนร้อนเกินไป\n\n' +
      'ให้ ESP32 อ่านอุณหภูมิจาก DHT11 ถ้าเกิน 35°C ให้เปิดพัดลม\n' +
      'ระวังบล็อกหลอก — ไม่ใช่ทุกอย่างที่ต้องใช้!',
    blocks: [
      { id: 'start', type: 'event', icon: '▶', label: 'เริ่มทำงาน', code: 'void setup()' },
      { id: 'read_dht', type: 'sensor', icon: '🌡', label: 'อ่านอุณหภูมิ', code: 't = readDHT11()' },
      { id: 'if_hot', type: 'cond', icon: '◇', label: 'ถ้าร้อน > 35°', code: 'if (t > 35)' },
      { id: 'fan_on', type: 'action', icon: '🌀', label: 'เปิดพัดลม', code: 'fanON()' },
      { id: 'led_on', type: 'action', icon: '💡', label: 'เปิดไฟ', code: 'ledON()' },
    ],
    correct: ['start', 'read_dht', 'if_hot', 'fan_on'],
    success: [
      'อ่านค่า DHT11 สำเร็จ',
      'อุณหภูมิเกินเกณฑ์ → พัดลมหมุน',
      'โรงเรือนเย็นลงแล้ว...',
    ],
    error: [
      'ลอจิกผิดพลาด!',
      'เปิดไฟแทนพัดลม อากาศยิ่งร้อน',
      'ต้องอ่านค่าก่อน แล้วค่อยเช็คเงื่อนไข',
    ],
  },
  {
    npc: 'Orc Compiler',
    emoji: '👹',
    title: 'BOSS: ระบบรดน้ำอัตโนมัติ',
    brief:
      'กู Orc ผู้คุม Compiler! ด่านสุดท้ายต้องเป๊ะทุกบรรทัด\n\n' +
      'อ่านความชื้นในดินจาก Soil Sensor ถ้าดินแห้ง (< 30)\n' +
      'ให้เปิดปั๊มน้ำ แล้ว "หน่วงเวลา" 3 วินาทีก่อนจบ — 5 บล็อก!',
    blocks: [
      { id: 'start', type: 'event', icon: '▶', label: 'เริ่มทำงาน', code: 'void setup()' },
      { id: 'read_soil', type: 'sensor', icon: '🌱', label: 'อ่านความชื้นดิน', code: 'm = readSoil()' },
      { id: 'if_dry', type: 'cond', icon: '◇', label: 'ถ้าดินแห้ง < 30', code: 'if (m < 30)' },
      { id: 'pump_on', type: 'action', icon: '💧', label: 'เปิดปั๊มน้ำ', code: 'pumpON()' },
      { id: 'delay', type: 'action', icon: '⏱', label: 'หน่วงเวลา 3 วิ', code: 'delay(3000)' },
      { id: 'gate_open', type: 'action', icon: '🚪', label: 'เปิดประตู', code: 'openGate()' },
    ],
    correct: ['start', 'read_soil', 'if_dry', 'pump_on', 'delay'],
    success: [
      'Boss circuit COMPILED!',
      'ดินแห้ง → ปั๊มน้ำทำงาน 3 วินาที',
      'โรงเรือนได้รับน้ำครบถ้วน...',
    ],
    error: [
      'COMPILE ERROR!',
      'เปิดประตูทิ้งไว้ ปั๊มไม่หน่วงเวลา',
      'อ่าน → เช็ค → ปั๊ม → หน่วงเวลา',
    ],
  },
];

const CLEAR_STEP = LEVELS.length + 1;

const arraysEqual = (a, b) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

export default function SoftwareGame() {
  const [step, setStep] = useState(0);
  const [placed, setPlaced] = useState([]);
  const [overlay, setOverlay] = useState('idle');

  const [stars, setStars] = useState(1200);
  const [combo, setCombo] = useState(2);
  const [bestCombo, setBestCombo] = useState(6);
  const [totalGained, setTotalGained] = useState(0);
  const [lastReward, setLastReward] = useState(0);
  const [isRecord, setIsRecord] = useState(false);

  const multiplier = 1 + (combo - 1) * 0.2;

  const boardRef = useRef(null);
  const dropZone = useRef(null);
  const [dragActive, setDragActive] = useState(false);

  const measureDropZone = () => {
    boardRef.current?.measureInWindow?.((x, y, w, h) => {
      if (w && h) dropZone.current = { x, y, w, h };
    });
  };

  const dropBlock = (block) => {
    setPlaced((prev) => (prev.includes(block.id) ? prev : [...prev, block.id]));
  };
  const removeBlock = (id) =>
    setPlaced((prev) => prev.filter((b) => b !== id));

  const level = step >= 1 && step <= LEVELS.length ? LEVELS[step - 1] : null;

  const handleRun = () => {
    if (!level || placed.length === 0) return;
    if (arraysEqual(placed, level.correct)) {
      const reward = Math.round(multiplier * 10);
      const newCombo = combo + 1;
      const record = newCombo > bestCombo;
      setLastReward(reward);
      setIsRecord(record);
      setStars((s) => s + reward);
      setTotalGained((t) => t + reward);
      setCombo(newCombo);
      if (record) setBestCombo(newCombo);
      setOverlay('success');
    } else {
      setStars((s) => Math.max(0, s - 5));
      setCombo(1);
      setOverlay('error');
    }
  };

  const handleNext = () => {
    setOverlay('idle');
    setPlaced([]);
    setStep((s) => (s >= LEVELS.length ? CLEAR_STEP : s + 1));
  };
  const handleRetry = () => {
    setOverlay('idle');
    setPlaced([]);
  };
  const resetGame = () => {
    setStep(0);
    setStars(1200);
    setCombo(2);
    setBestCombo(6);
    setTotalGained(0);
    setPlaced([]);
  };

  if (step === 0) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.introRoot}>
          <Text style={s.chapterLabel}>CHAPTER 4</Text>
          <Text style={s.chapterIconRow}>[ {'</>'} ]  [ ⚡ ]</Text>
          <Text style={s.chapterTitle}>Block Coding Forge{'\n'}DUNGEON</Text>

          <View style={s.introBox}>
            <Text style={s.introDesc}>
              ช่างกลเวทมนตร์ต้องเขียนโปรแกรมให้ ESP32{'\n'}
              ลากบล็อกคำสั่งมาเรียงเป็นโค้ดที่ถูกต้อง{'\n'}
              ก่อนเผชิญหน้ากับ Orc Compiler.....
            </Text>
            <View style={s.npcLineup}>
              {[
                { label: 'LV1', icon: '🦛' },
                { label: 'LV2', icon: '💀' },
                { label: 'BOSS', icon: '👹' },
              ].map((item, i) => (
                <View
                  key={i}
                  style={[s.npcChip, item.label === 'BOSS' && s.npcChipBoss]}
                >
                  <Text style={s.npcChipIcon}>{item.icon}</Text>
                  <Text
                    style={[
                      s.npcChipTxt,
                      item.label === 'BOSS' && s.npcChipBossTxt,
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={s.introStarRow}>
            <Text style={s.introStarTxt}>* Your Stars:  {stars}</Text>
            <Text style={s.introRewardTxt}>Max Reward: +14</Text>
          </View>

          <TouchableOpacity
            style={s.orangeBtn}
            activeOpacity={0.8}
            onPress={() => setStep(1)}
          >
            <Text style={s.orangeBtnTxt}>[ เริ่มเลย !!! ]</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.6}>
            <Text style={s.backLink}>{'<<'} BACK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === CLEAR_STEP) {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView
          contentContainerStyle={s.clearRoot}
          showsVerticalScrollIndicator={false}
        >
          <Text style={s.clearTitle}>CHAPTER 4  CLEAR !</Text>
          <Text style={s.clearParty}>[ * * * ]</Text>

          <View style={s.clearBadgeRow}>
            <View style={[s.clearBadge, { borderColor: '#E8A020' }]}>
              <Text style={[s.clearBadgeTxt, { color: '#E8A020' }]}>
                * +{totalGained} STARS
              </Text>
            </View>
            <View style={[s.clearBadge, { borderColor: '#D94040' }]}>
              <Text style={[s.clearBadgeTxt, { color: '#D94040' }]}>
                COMBO {bestCombo}
              </Text>
            </View>
          </View>

          <Text style={s.clearSubtitle}>Block Coding Forge DUNGEON</Text>

          <View style={s.scoreRow}>
            <View style={s.scoreBox}>
              <Text style={s.scoreLabel}>TOTAL STARS</Text>
              <Text style={[s.scoreValue, { color: '#E8A020' }]}>{stars}</Text>
            </View>
            <View style={s.scoreBox}>
              <Text style={s.scoreLabel}>LEVELS DONE</Text>
              <Text style={[s.scoreValue, { color: '#27AE60' }]}>
                {LEVELS.length}/{LEVELS.length}
              </Text>
            </View>
          </View>

          <View style={s.clearPanel}>
            <Text style={s.clearPanelHeader}>[ CODE REPORT ]</Text>
            <Text style={s.clearPanelTxt}>
              {'> '}LV1  PIR → openGate()  ✓{'\n'}
              {'> '}LV2  DHT11 → if(t{'>'}35) → fanON()  ✓{'\n'}
              {'> '}BOSS Soil → if(m{'<'}30) → pump+delay  ✓{'\n\n'}
              {'> '}หลักการ: อ่านค่า → ตรวจเงื่อนไข → สั่งงาน{'\n'}
              {'  '}ลำดับของโค้ดสำคัญเสมอ!
            </Text>
          </View>

          <TouchableOpacity
            style={[s.orangeBtn, { marginTop: 16 }]}
            activeOpacity={0.8}
            onPress={resetGame}
          >
            <Text style={s.orangeBtnTxt}>[ กลับ SKILL TREE {'>>>'} ]</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.root}>
        <View style={s.scene}>
          <View style={s.sceneBg}>
            {[...Array(3)].map((_, i) => (
              <View key={`h${i}`} style={[s.gridLineH, { top: `${(i + 1) * 25}%` }]} />
            ))}
            {[...Array(6)].map((_, i) => (
              <View key={`v${i}`} style={[s.gridLineV, { left: `${(i + 1) * 14}%` }]} />
            ))}
          </View>

          <View style={s.esp32Box}>
            <Text style={s.pcbCompIcon}>⚙</Text>
            <Text style={s.esp32Name}>ESP32</Text>
            <Text style={s.esp32Sub}>CORE</Text>
          </View>

          <View style={s.sceneCenter}>
            <Text style={s.sceneLevel}>
              LV {step}/{LEVELS.length}
            </Text>
            <Text style={s.sceneTitle}>{level.title}</Text>
          </View>

          <View style={s.starBadge}>
            <Text style={s.starTxt}>* {stars}</Text>
          </View>
        </View>
        <View style={s.statsBar}>
          <StatChip label="COMBO NOW" value={String(combo)} color="#E8A020" />
          <StatChip
            label="MULTIPLIER"
            value={`x${multiplier.toFixed(1)}`}
            color="#3A8FE8"
          />
          <StatChip label="BEST COMBO" value={String(bestCombo)} color="#D94040" />
        </View>
        <View style={s.missionScroll}>
          <View style={s.npcAvatarCol}>
            <View style={s.avatarBox}>
              <Text style={s.avatarEmoji}>{level.emoji}</Text>
            </View>
            <Text style={s.npcName}>{level.npc}</Text>
          </View>
          <ScrollView style={s.missionTextScroll} showsVerticalScrollIndicator={false}>
            <Text style={s.missionText}>{level.brief}</Text>
          </ScrollView>
        </View>
        <View style={s.workspace}>
          <View style={s.vault}>
            <Text style={s.sectionLabel}>[ BLOCK VAULT ]</Text>
            {level.blocks.map((block) => (
              <DraggableBlock
                key={block.id}
                block={block}
                used={placed.includes(block.id)}
                dropZone={dropZone}
                measureDropZone={measureDropZone}
                onDragStart={() => setDragActive(true)}
                onDragEnd={() => setDragActive(false)}
                onDrop={dropBlock}
              />
            ))}
          </View>
          <View style={s.circuitCol}>
            <Text style={[s.sectionLabel, { color: '#4CAF50' }]}>
              [ CIRCUIT BOARD ]
            </Text>
            <View
              ref={boardRef}
              onLayout={measureDropZone}
              style={[s.board, dragActive && s.boardActive]}
            >
              {placed.length === 0 ? (
                <Text style={s.boardHint}>
                  {'ลากบล็อกจากซ้าย\nมาวางที่นี่ ⤵'}
                </Text>
              ) : (
                placed.map((id, idx) => {
                  const b = level.blocks.find((x) => x.id === id);
                  const c = TYPE_COLOR[b.type];
                  return (
                    <View key={id}>
                      {idx > 0 && <View style={s.wire} />}
                      <TouchableOpacity
                        style={[s.placedBlock, { borderColor: c }]}
                        activeOpacity={0.8}
                        onPress={() => removeBlock(id)}
                      >
                        <View style={[s.placedNum, { backgroundColor: c }]}>
                          <Text style={s.placedNumTxt}>{idx + 1}</Text>
                        </View>
                        <Text style={[s.placedCode, { color: c }]} numberOfLines={1}>
                          {b.code}
                        </Text>
                        <Text style={s.placedRemove}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        </View>
        <View style={s.actionArea}>
          <TouchableOpacity
            style={[s.runBtn, placed.length === 0 && s.btnDisabled]}
            activeOpacity={0.85}
            onPress={handleRun}
            disabled={placed.length === 0}
          >
            <Text style={s.runBtnTxt}>[ ⚡ RUN CODE ]</Text>
          </TouchableOpacity>
        </View>
        {overlay !== 'idle' && (
          <View style={s.overlay}>
            <View
              style={[
                s.resultPanel,
                overlay === 'success' ? s.successPanel : s.errorPanel,
              ]}
            >
              {overlay === 'success' ? (
                <>
                  <Text style={s.resultTitle}>[ CODE OK ]</Text>
                  <Text style={s.resultIcon}>✓</Text>
                  <Text style={s.resultText}>
                    {level.success.map((l) => `> ${l}`).join('\n')}
                  </Text>
                  <View style={s.rewardRow}>
                    <RewardChip text={`* +${lastReward}`} color="#E8A020" />
                    <RewardChip text={`COMBO ${combo}`} color="#3A8FE8" />
                    {isRecord && <RewardChip text="NEW RECORD!" color="#D94040" />}
                  </View>
                  <TouchableOpacity style={s.orangeBtn} onPress={handleNext}>
                    <Text style={s.orangeBtnTxt}>
                      [ {step >= LEVELS.length ? 'จบบท' : 'ต่อไป'} {'>>>'} ]
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={s.resultTitle}>[ RUNTIME ERROR ]</Text>
                  <Text style={[s.resultIcon, { color: '#D94040' }]}>✗</Text>
                  <Text style={s.resultText}>
                    {level.error.map((l) => `> ${l}`).join('\n')}
                  </Text>
                  <View style={s.penaltyRow}>
                    <Text style={s.penaltyTxt}>* -5</Text>
                    <Text style={s.penaltyTxt}>COMBO x0</Text>
                  </View>
                  <TouchableOpacity
                    style={[s.orangeBtn, { borderColor: '#D94040' }]}
                    onPress={handleRetry}
                  >
                    <Text style={s.orangeBtnTxt}>[ RETRY ]</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function DraggableBlock({
  block,
  used,
  dropZone,
  measureDropZone,
  onDragStart,
  onDragEnd,
  onDrop,
}) {
  const pan = useRef(new Animated.ValueXY()).current;
  const [dragging, setDragging] = useState(false);
  const usedRef = useRef(used);
  usedRef.current = used;
  const dropRef = useRef(onDrop);
  dropRef.current = onDrop;

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !usedRef.current,
      onMoveShouldSetPanResponder: (_e, g) =>
        !usedRef.current && (Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2),
      onPanResponderGrant: () => {
        measureDropZone();
        setDragging(true);
        onDragStart?.();
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_e, g) => {
        const dz = dropZone.current;
        const inside =
          dz &&
          g.moveX >= dz.x &&
          g.moveX <= dz.x + dz.w &&
          g.moveY >= dz.y &&
          g.moveY <= dz.y + dz.h;
        if (inside) dropRef.current?.(block);
        setDragging(false);
        onDragEnd?.();
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          friction: 6,
        }).start();
      },
      onPanResponderTerminate: () => {
        setDragging(false);
        onDragEnd?.();
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  const color = TYPE_COLOR[block.type];

  return (
    <Animated.View
      {...responder.panHandlers}
      style={[
        s.vaultBlock,
        { borderColor: color },
        used && s.vaultBlockUsed,
        {
          transform: [...pan.getTranslateTransform(), { scale: dragging ? 1.06 : 1 }],
          zIndex: dragging ? 999 : 1,
          elevation: dragging ? 14 : 3,
        },
      ]}
    >
      <Text style={s.vaultIcon}>{block.icon}</Text>
      <View style={s.vaultTextWrap}>
        <Text style={[s.vaultLabel, { color }]} numberOfLines={1}>
          {block.label}
        </Text>
        <Text style={s.vaultCode} numberOfLines={1}>
          {block.code}
        </Text>
      </View>
      {used ? (
        <Text style={s.vaultUsedMark}>●</Text>
      ) : (
        <Text style={s.vaultGrip}>⋮⋮</Text>
      )}
    </Animated.View>
  );
}

function StatChip({ label, value, color }) {
  return (
    <View style={[s.statCard, { borderColor: color }]}>
      <Text style={[s.statLabel, { color }]}>{label}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
    </View>
  );
}

function RewardChip({ text, color }) {
  return (
    <View style={[s.rewardChip, { borderColor: color }]}>
      <Text style={[s.rewardChipTxt, { color }]}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0e0e1a' },
  root: { flex: 1 },
  introRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 14,
  },
  chapterLabel: { ...MONO, color: '#F5F2EB', fontSize: 20, fontWeight: 'bold', letterSpacing: 3 },
  chapterIconRow: { ...MONO, color: '#E8A020', fontSize: 18 },
  chapterTitle: { ...MONO, color: '#d4c9a8', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  introBox: { width: '100%', backgroundColor: '#1c1c30', ...BORDER, padding: 14, gap: 12 },
  introDesc: { ...MONO, color: '#ccc', fontSize: 12, lineHeight: 20, textAlign: 'center' },
  npcLineup: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  npcChip: {
    alignItems: 'center',
    backgroundColor: '#2a2a45',
    ...BORDER,
    borderWidth: 2,
    padding: 8,
    minWidth: 60,
  },
  npcChipBoss: { borderColor: '#D94040', backgroundColor: '#3a1a1a' },
  npcChipIcon: { fontSize: 20 },
  npcChipTxt: { ...MONO, color: '#aaa', fontSize: 9, fontWeight: '700', marginTop: 2 },
  npcChipBossTxt: { color: '#D94040' },
  introStarRow: { alignItems: 'center', gap: 4 },
  introStarTxt: { ...MONO, color: '#E8A020', fontSize: 14, fontWeight: '700' },
  introRewardTxt: { ...MONO, color: '#aaa', fontSize: 12 },
  backLink: { ...MONO, color: '#888', fontSize: 13, marginTop: 4 },

  clearRoot: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 40,
    gap: 12,
  },
  clearTitle: { ...MONO, color: '#4CAF50', fontSize: 20, fontWeight: 'bold', letterSpacing: 2 },
  clearParty: { ...MONO, color: '#E8A020', fontSize: 24 },
  clearBadgeRow: { flexDirection: 'row', gap: 10 },
  clearBadge: { ...BORDER, borderWidth: 2, paddingHorizontal: 12, paddingVertical: 4 },
  clearBadgeTxt: { ...MONO, fontWeight: 'bold', fontSize: 13 },
  clearSubtitle: { ...MONO, color: '#d4c9a8', fontSize: 13, textAlign: 'center' },
  scoreRow: { flexDirection: 'row', gap: 10, width: '100%' },
  scoreBox: {
    flex: 1,
    backgroundColor: '#1c1c30',
    ...BORDER,
    borderWidth: 2,
    alignItems: 'center',
    paddingVertical: 10,
  },
  scoreLabel: { ...MONO, color: '#aaa', fontSize: 11 },
  scoreValue: { ...MONO, fontSize: 22, fontWeight: 'bold', marginTop: 2 },
  clearPanel: {
    width: '100%',
    backgroundColor: '#0d1a0d',
    borderWidth: 2,
    borderColor: '#2E7D32',
    padding: 12,
  },
  clearPanelHeader: { ...MONO, color: '#4CAF50', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  clearPanelTxt: { ...MONO, color: '#a5d6a7', fontSize: 12, lineHeight: 20 },
  orangeBtn: {
    width: '100%',
    backgroundColor: '#C97D10',
    ...BORDER,
    paddingVertical: 14,
    alignItems: 'center',
  },
  orangeBtnTxt: { ...MONO, color: '#fff', fontSize: 15, fontWeight: 'bold' },
  scene: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 74,
    backgroundColor: '#1E222A',
    borderBottomWidth: 3,
    borderBottomColor: '#2C1B10',
    paddingHorizontal: 10,
    gap: 10,
    overflow: 'hidden',
  },
  sceneBg: { ...StyleSheet.absoluteFillObject },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(46,125,50,0.18)' },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(46,125,50,0.18)' },
  esp32Box: {
    backgroundColor: '#0d200d',
    borderWidth: 2,
    borderColor: '#2E7D32',
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: 'center',
  },
  pcbCompIcon: { fontSize: 16 },
  esp32Name: { ...MONO, color: '#4CAF50', fontSize: 9, fontWeight: '700' },
  esp32Sub: { ...MONO, color: '#81C784', fontSize: 8 },
  sceneCenter: { flex: 1 },
  sceneLevel: { ...MONO, color: '#E8A020', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  sceneTitle: { ...MONO, color: '#F5F2EB', fontSize: 13, fontWeight: 'bold' },
  starBadge: {
    backgroundColor: '#1a1a0a',
    ...BORDER,
    borderWidth: 2,
    borderColor: '#E8A020',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  starTxt: { ...MONO, color: '#E8A020', fontWeight: 'bold', fontSize: 13 },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F5F2EB',
    borderBottomWidth: 3,
    borderBottomColor: '#2C1B10',
    paddingVertical: 7,
    paddingHorizontal: 4,
  },
  statCard: {
    alignItems: 'center',
    borderWidth: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    minWidth: 92,
  },
  statLabel: { ...MONO, fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },
  statValue: { ...MONO, fontSize: 18, fontWeight: 'bold' },
  missionScroll: {
    flexDirection: 'row',
    gap: 10,
    height: 96,
    backgroundColor: '#F7E7C4',
    borderBottomWidth: 3,
    borderBottomColor: '#2C1B10',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  npcAvatarCol: { alignItems: 'center', gap: 3, width: 52 },
  avatarBox: {
    width: 48,
    height: 48,
    backgroundColor: '#e8d5a0',
    ...BORDER,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: { fontSize: 26 },
  npcName: { ...MONO, fontSize: 9, fontWeight: '700', color: '#2C1B10', textAlign: 'center' },
  missionTextScroll: { flex: 1 },
  missionText: { ...MONO, fontSize: 12, color: '#2C1B10', lineHeight: 18 },
  workspace: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#F5F2EB',
    padding: 10,
  },
  sectionLabel: {
    ...MONO,
    color: '#2C1B10',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  vault: { flex: 1, gap: 8 },
  vaultBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffdf7',
    borderWidth: 3,
    paddingHorizontal: 7,
    paddingVertical: 8,
    gap: 6,
  },
  vaultBlockUsed: { opacity: 0.32, backgroundColor: '#e9e4d6' },
  vaultIcon: { fontSize: 16 },
  vaultTextWrap: { flex: 1 },
  vaultLabel: { ...MONO, fontSize: 10, fontWeight: '700' },
  vaultCode: { ...MONO, fontSize: 8, color: '#7B5B3A', marginTop: 1 },
  vaultGrip: { ...MONO, fontSize: 12, color: '#bbb', fontWeight: '700' },
  vaultUsedMark: { ...MONO, fontSize: 10, color: '#27AE60' },
  circuitCol: { flex: 1 },
  board: {
    flex: 1,
    backgroundColor: '#120e08',
    borderWidth: 3,
    borderColor: '#6B4226',
    padding: 8,
    gap: 0,
  },
  boardActive: { borderColor: '#4CAF50', backgroundColor: '#0d1a0d' },
  boardHint: {
    ...MONO,
    color: '#5a4a2a',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 40,
  },
  placedBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a150d',
    borderWidth: 2,
    paddingHorizontal: 6,
    paddingVertical: 7,
    gap: 6,
  },
  placedNum: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placedNumTxt: { ...MONO, fontSize: 10, fontWeight: '900', color: '#fff' },
  placedCode: { ...MONO, fontSize: 10, fontWeight: '700', flex: 1 },
  placedRemove: { ...MONO, fontSize: 11, color: '#8a7a5a' },
  wire: { width: 3, height: 10, backgroundColor: '#E8A020', alignSelf: 'center' },
  actionArea: {
    backgroundColor: '#F5F2EB',
    borderTopWidth: 3,
    borderTopColor: '#2C1B10',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  runBtn: { backgroundColor: '#1E8449', ...BORDER, paddingVertical: 13, alignItems: 'center' },
  runBtnTxt: { ...MONO, color: '#fff', fontSize: 15, fontWeight: 'bold', letterSpacing: 1 },
  btnDisabled: { opacity: 0.4 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 22,
  },
  resultPanel: { width: '100%', ...BORDER, padding: 20, alignItems: 'center', gap: 10 },
  successPanel: { backgroundColor: '#0d2a0d' },
  errorPanel: { backgroundColor: '#2a0d0d' },
  resultTitle: { ...MONO, color: '#F5F2EB', fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  resultIcon: { ...MONO, fontSize: 36, color: '#4CAF50' },
  resultText: { ...MONO, color: '#ccc', fontSize: 12, lineHeight: 20, alignSelf: 'flex-start' },
  rewardRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  rewardChip: { borderWidth: 2, paddingHorizontal: 8, paddingVertical: 3 },
  rewardChipTxt: { ...MONO, fontSize: 11, fontWeight: '900' },
  penaltyRow: { flexDirection: 'row', gap: 12 },
  penaltyTxt: { ...MONO, fontSize: 12, fontWeight: '900', color: '#D94040' },
});