
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';

const { width: SW } = Dimensions.get('window');
const CAT_FRAMES = 3;
const CAT_W = 80;
const CAT_H = 80;
const CAT_FPS = 6;

const ORC_W = 150;
const ORC_H = 175;
const _orcAsset = Image.resolveAssetSource(require('../../assets/npc_orc-sheet.png'));
const ORC_FRAMES = Math.round(_orcAsset.width / ORC_W);
const ORC_FPS = 5;
const SCENE_H = SW * 0.52;
const GROUND_PX = SCENE_H * 0.08;
const SENSORS = {
  pir:   { name: 'PIR',   full: 'PIR SENSOR',  desc: 'ตรวจจับการเคลื่อนไหว',  color: '#C0392B', correct: true,  icon: '👁' },
  dht11: { name: 'DHT11', full: 'DHT11',        desc: 'วัดอุณหภูมิ/ความชื้น',  color: '#2980B9', correct: false, icon: '🌡' },
  soil:  { name: 'SOIL',  full: 'SOIL SENSOR',  desc: 'วัดความชื้นในดิน',      color: '#27AE60', correct: false, icon: '🌱' },
  ldr:   { name: 'LDR',   full: 'LDR SENSOR',   desc: 'ตรวจจับความเข้มแสง',   color: '#D4AC0D', correct: false, icon: '💡' },
};
const BATTLE_FRAMES = [
  {
    npc: 'ช่างกล Pippo',
    emoji: '🧑‍🔧',
    text:
      'ประตูโรงเรือนอัจฉริยะพัง! ESP32 บนบอร์ดหลักต้องการเซนเซอร์ที่ตรวจจับ' +
      'ได้ว่ามีชาวนาเดินเข้ามา\n\nดูที่คลังไอเทมด้านล่าง แล้วเลือกเซนเซอร์' +
      'ที่ถูกต้อง จากนั้น PLUG IN และกด RUN เพื่อทดสอบ',
    isDialogue: true,
  },
  {
    npc: 'Skeleton Guard',
    emoji: '💀',
    text:
      'เฮ้! วงจรที่นี่ถูกคำสาป ถ้าอยากผ่านต้องพิสูจน์ตัวเอง\n\n' +
      'บอร์ด ESP32 ตรงหน้าต้องการเซนเซอร์ที่รู้ว่ามีคนเดินผ่าน\n' +
      'เลือกผิดระบบล่ม เลือกถูกประตูเปิด!',
    isDialogue: false,
    correctSensor: 'pir',
  },
  {
    npc: 'Orc Boss',
    emoji: '👹',
    text:
      'กู Orc ผู้คุมวงจร! ระบบกลไกขั้นสูงสุดอยู่ตรงนี้\n\n' +
      'ต้องการเซนเซอร์ที่ตรวจจับการเคลื่อนไหวของสิ่งมีชีวิต\n' +
      'ต่อสายให้ถูกต้อง แล้วพิสูจน์ว่าแกเป็นช่างกลเวทมนตร์ตัวจริง!',
    isDialogue: false,
    correctSensor: 'pir',
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
export default function GameHardware({ onNavigate }) {
  const [step, setStep]                   = useState(0);
  const [selectedSensor, setSelected]     = useState(null);
  const [pluggedSensor, setPlugged]       = useState(null);
  const [currentView, setCurrentView]     = useState('idle'); // 'idle'|'success'|'error'
  const [combo, setCombo]                 = useState(2);
  const [bestCombo]                       = useState(6);
  const [stars, setStars]                 = useState(1);

  const catFrame = useSpriteAnim(CAT_FRAMES, CAT_FPS);
  const orcFrame = useSpriteAnim(ORC_FRAMES, ORC_FPS);

  const multiplier = (1 + (combo - 1) * 0.2).toFixed(1);

  const handlePlug = () => {
    if (!selectedSensor) return;
    setPlugged(selectedSensor);
  };

  const handleRun = () => {
    if (!pluggedSensor) return;
    const frame = BATTLE_FRAMES[step - 1];
    const isCorrect = !frame.correctSensor || SENSORS[pluggedSensor].correct;
    setCurrentView(isCorrect ? 'success' : 'error');
  };

  const handleNext = () => {
    setCurrentView('idle');
    setSelected(null);
    setPlugged(null);
    if (step === 2) { setCombo(c => c + 1); setStars(2); }
    if (step === 3) { setCombo(c => c + 1); }
    setStep(s => s + 1);
  };

  const handleRetry = () => {
    setCurrentView('idle');
    setSelected(null);
    setPlugged(null);
  };
  if (step === 0) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.introRoot}>
          <Text style={s.chapterLabel}>CHAPTER 3</Text>
          <Text style={s.chapterIconRow}>[ ⚙ ]  [ 💡 ]</Text>
          <Text style={s.chapterTitle}>IoT Circuit Sandbox{'\n'}DUNGEON</Text>

          <View style={s.introBox}>
            <Text style={s.introDesc}>
              ช่างกลเวทมนตร์ต้องซ่อมประตูโรงเรือนอัจฉริยะ{'\n'}
              เลือกเซนเซอร์ที่ถูกต้อง ต่อสาย และ RUN วงจร{'\n'}
              ก่อนเผชิญหน้ากับ Boss Monster.....
            </Text>
            <View style={s.npcLineup}>
              {[
                { label: 'PRO',  icon: '🧑‍🔧' },
                { label: 'PRO',  icon: '🧑‍🔧' },
                { label: 'PRO',  icon: '🧑‍🔧' },
                { label: 'BOSS', icon: '👹'   },
              ].map((item, i) => (
                <View key={i} style={[s.npcChip, item.label === 'BOSS' && s.npcChipBoss]}>
                  <Text style={s.npcChipIcon}>{item.icon}</Text>
                  <Text style={[s.npcChipTxt, item.label === 'BOSS' && s.npcChipBossTxt]}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={s.introStarRow}>
            <Text style={s.introStarTxt}>* Your Stars:  1200</Text>
            <Text style={s.introRewardTxt}>Max Reward: +10</Text>
          </View>

          <TouchableOpacity style={s.orangeBtn} activeOpacity={0.8} onPress={() => setStep(1)}>
            <Text style={s.orangeBtnTxt}>[ เริ่มเลย !!! ]</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.6} onPress={() => onNavigate?.('skill-tree')}>
            <Text style={s.backLink}>{'<<'} BACK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  if (step === 4) {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView contentContainerStyle={s.clearRoot} showsVerticalScrollIndicator={false}>
          <Text style={s.clearTitle}>CHAPTER 3  CLEAR !</Text>
          <Text style={s.clearParty}>[ * * * ]</Text>

          <View style={s.clearBadgeRow}>
            <View style={[s.clearBadge, { borderColor: '#E8A020' }]}>
              <Text style={[s.clearBadgeTxt, { color: '#E8A020' }]}>* +7 STARS</Text>
            </View>
            <View style={[s.clearBadge, { borderColor: '#D94040' }]}>
              <Text style={[s.clearBadgeTxt, { color: '#D94040' }]}>COMBO {bestCombo}</Text>
            </View>
          </View>

          <Text style={s.clearSubtitle}>IoT Circuit Sandbox DUNGEON</Text>

          <View style={s.scoreRow}>
            <View style={s.scoreBox}>
              <Text style={s.scoreLabel}>WRONG SENSOR</Text>
              <Text style={[s.scoreValue, { color: '#D94040' }]}>-15</Text>
            </View>
            <View style={s.scoreBox}>
              <Text style={s.scoreLabel}>BOSS BONUS</Text>
              <Text style={[s.scoreValue, { color: '#27AE60' }]}>+3</Text>
            </View>
          </View>

          <View style={s.clearPanel}>
            <Text style={s.clearPanelHeader}>[ CIRCUIT REPORT ]</Text>
            <Text style={s.clearPanelTxt}>
              {'> '}ประตูโรงเรือนต้องการเซนเซอร์ตรวจจับการเคลื่อนไหว{'\n'}
              {'> '}คำตอบที่ถูก: PIR SENSOR{'\n'}
              {'> '}PIR = Passive Infrared Sensor{'\n'}
              {'  '}ตรวจจับรังสีอินฟราเรดจากร่างกายมนุษย์{'\n\n'}
              {'> '}DHT11 = วัดอุณหภูมิ/ความชื้น  ❌{'\n'}
              {'> '}SOIL  = วัดความชื้นดิน         ❌{'\n'}
              {'> '}LDR   = ตรวจจับแสง             ❌
            </Text>
          </View>

          <TouchableOpacity
            style={[s.orangeBtn, { marginTop: 16 }]}
            activeOpacity={0.8}
            onPress={() => { setStep(0); setStars(1); setCombo(2); onNavigate?.('skill-tree'); }}
          >
            <Text style={s.orangeBtnTxt}>[ กลับ SKILL TREE {'>>>'} ]</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }
  const frame = BATTLE_FRAMES[step - 1];
  const showOrc = step === 3;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.root}>
        <View style={s.scene}>
          <View style={s.sceneBg}>
            {[...Array(6)].map((_, i) => (
              <View key={`h${i}`} style={[s.gridLineH, { top: `${(i + 1) * 14}%` }]} />
            ))}
            {[...Array(8)].map((_, i) => (
              <View key={`v${i}`} style={[s.gridLineV, { left: `${(i + 1) * 11}%` }]} />
            ))}
          </View>
          <View style={s.pcbPanel}>
            <View style={[s.boltDot, { top: 5, left: 5 }]} />
            <View style={[s.boltDot, { top: 5, right: 5 }]} />
            <View style={[s.boltDot, { bottom: 5, left: 5 }]} />
            <View style={[s.boltDot, { bottom: 5, right: 5 }]} />

            <View style={s.pcbRow}>
              {/* ESP32 box */}
              <View style={s.esp32Box}>
                <Text style={s.pcbCompIcon}>⚙</Text>
                <Text style={s.esp32Name}>ESP32</Text>
                <Text style={s.esp32Sub}>CORE</Text>
              </View>
              <View style={s.pcbWires}>
                {[
                  { l: 'GPIO 2', r: 'SIG' },
                  { l: '3V3',    r: 'VCC' },
                  { l: 'GND',    r: 'GND' },
                ].map(({ l, r }) => (
                  <View key={l} style={s.pcbWireRow}>
                    <Text style={s.pcbPinL}>{l}</Text>
                    <View style={s.pcbDotL} />
                    <View style={[s.pcbSeg, pluggedSensor ? s.pcbSegOn : s.pcbSegOff]} />
                    <View style={[s.pcbDotR, !pluggedSensor && s.pcbDotDim]} />
                    <Text style={[s.pcbPinR, !pluggedSensor && s.pcbPinDim]}>{r}</Text>
                  </View>
                ))}
              </View>
              <View style={[s.sensorBox, { borderColor: pluggedSensor ? SENSORS[pluggedSensor].color : '#444' }]}>
                <Text style={s.pcbCompIcon}>
                  {pluggedSensor ? SENSORS[pluggedSensor].icon : '?'}
                </Text>
                <Text style={[s.sensorBoxName, { color: pluggedSensor ? SENSORS[pluggedSensor].color : '#555' }]}>
                  {pluggedSensor ? SENSORS[pluggedSensor].name : '???'}
                </Text>
                <Text style={s.sensorBoxSub}>SENSOR</Text>
              </View>
            </View>
          </View>
          <View style={s.playerPos}>
            <View style={s.catClip}>
              <Image
                source={require('../../assets/player_cat-sheet.png')}
                style={[s.catSheet, { transform: [{ translateX: -catFrame * CAT_W }] }]}
                resizeMode="stretch"
              />
            </View>
          </View>
          {showOrc && (
            <View style={s.bossPos}>
              <View style={s.orcClip}>
                <Image
                  source={require('../../assets/npc_orc-sheet.png')}
                  style={[s.orcSheet, { transform: [{ translateX: -orcFrame * ORC_W }] }]}
                  resizeMode="stretch"
                />
              </View>
            </View>
          )}
          <View style={s.starBadge}>
            <Text style={s.starTxt}>* {stars}</Text>
          </View>
        </View>
        <View style={s.statsBar}>
          <StatChip label="COMBO NOW"  value={String(combo)}      color="#E8A020" />
          <StatChip label="MULTIPLIER" value={`x${multiplier}`}  color="#3A8FE8" />
          <StatChip label="BEST COMBO" value={String(bestCombo)} color="#D94040" />
        </View>
        <View style={s.missionScroll}>
          <View style={s.npcAvatarCol}>
            <View style={s.avatarBox}>
              <Text style={s.avatarEmoji}>{frame.emoji}</Text>
            </View>
            <Text style={s.npcName}>{frame.npc}</Text>
          </View>
          <ScrollView style={s.missionTextScroll} showsVerticalScrollIndicator={false}>
            <Text style={s.missionText}>{frame.text}</Text>
          </ScrollView>
        </View>
        {!frame.isDialogue && (
          <View style={s.inventory}>
            <Text style={s.inventoryLabel}>[ ITEM INVENTORY ]</Text>
            <View style={s.sensorRow}>
              {Object.entries(SENSORS).map(([id, sensor]) => (
                <TouchableOpacity
                  key={id}
                  style={[
                    s.sensorCard,
                    { borderColor: sensor.color },
                    selectedSensor === id && s.sensorCardSelected,
                    pluggedSensor === id && s.sensorCardPlugged,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => !pluggedSensor && setSelected(id)}
                >
                  <Text style={[s.sensorCardName, { color: sensor.color }]}>{sensor.name}</Text>
                  <Text style={s.sensorCardDesc}>{sensor.desc}</Text>
                  {pluggedSensor === id && <Text style={s.pluggedMark}>PLUGGED</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        <View style={s.actionArea}>
          {frame.isDialogue ? (
            <TouchableOpacity style={s.orangeBtn} activeOpacity={0.8} onPress={handleNext}>
              <Text style={s.orangeBtnTxt}>[ รับทราบ {'>>>'} ]</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.btnRow}>
              <TouchableOpacity
                style={[s.plugBtn, !selectedSensor && s.btnDisabled]}
                activeOpacity={0.8}
                onPress={handlePlug}
                disabled={!selectedSensor || !!pluggedSensor}
              >
                <Text style={s.plugBtnTxt}>
                  {pluggedSensor
                    ? `[+] ${SENSORS[pluggedSensor].name} CONNECTED`
                    : selectedSensor
                    ? `[+] PLUG IN ${SENSORS[selectedSensor].name}`
                    : '[+] SELECT SENSOR'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.runBtn, !pluggedSensor && s.btnDisabled]}
                activeOpacity={0.8}
                onPress={handleRun}
                disabled={!pluggedSensor}
              >
                <Text style={s.runBtnTxt}>[ RUN CIRCUIT ]</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        {currentView !== 'idle' && (
          <View style={s.overlay}>
            <View style={[s.resultPanel, currentView === 'success' ? s.successPanel : s.errorPanel]}>
              {currentView === 'success' ? (
                <>
                  <Text style={s.resultTitle}>[ CIRCUIT OK ]</Text>
                  <Text style={s.resultIcon}>✓</Text>
                  <Text style={s.resultText}>
                    {'> '}วงจรทำงานสมบูรณ์!{'\n'}
                    {'> '}PIR ตรวจจับชาวนาได้{'\n'}
                    {'> '}ประตูเปิดอัตโนมัติ...
                  </Text>
                  <TouchableOpacity style={s.orangeBtn} onPress={handleNext}>
                    <Text style={s.orangeBtnTxt}>[ ต่อไป {'>>>'} ]</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={s.resultTitle}>[ CIRCUIT ERROR ]</Text>
                  <Text style={[s.resultIcon, { color: '#D94040' }]}>✗</Text>
                  <Text style={s.resultText}>
                    {'> '}เซนเซอร์ไม่ถูกต้อง!{'\n'}
                    {'> '}{SENSORS[pluggedSensor]?.full} ใช้ไม่ได้{'\n'}
                    {'> '}ลองใหม่อีกครั้ง...
                  </Text>
                  <TouchableOpacity style={[s.orangeBtn, { borderColor: '#D94040' }]} onPress={handleRetry}>
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

function StatChip({ label, value, color }) {
  return (
    <View style={[s.statCard, { borderColor: color }]}>
      <Text style={[s.statLabel, { color }]}>{label}</Text>
      <Text style={[s.statValue, { color }]}>{value}</Text>
    </View>
  );
}
const BORDER = { borderWidth: 3, borderColor: '#2C1B10' };
const MONO   = { fontFamily: 'monospace' };

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0e0e1a' },
  introRoot: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 24, gap: 14,
  },
  chapterLabel: { ...MONO, color: '#F5F2EB', fontSize: 20, fontWeight: 'bold', letterSpacing: 3 },
  chapterIconRow: { ...MONO, color: '#E8A020', fontSize: 18 },
  chapterTitle: { ...MONO, color: '#d4c9a8', fontSize: 15, textAlign: 'center', lineHeight: 24 },
  introBox: {
    width: '100%', backgroundColor: '#1c1c30',
    ...BORDER, padding: 14, gap: 12,
  },
  introDesc: { ...MONO, color: '#ccc', fontSize: 12, lineHeight: 20, textAlign: 'center' },
  npcLineup: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  npcChip: {
    alignItems: 'center', backgroundColor: '#2a2a45',
    ...BORDER, borderWidth: 2, padding: 8, minWidth: 52,
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
    alignItems: 'center', paddingHorizontal: 20, paddingTop: 32, paddingBottom: 40, gap: 12,
  },
  clearTitle: { ...MONO, color: '#4CAF50', fontSize: 20, fontWeight: 'bold', letterSpacing: 2 },
  clearParty: { ...MONO, color: '#E8A020', fontSize: 24 },
  clearBadgeRow: { flexDirection: 'row', gap: 10 },
  clearBadge: { ...BORDER, borderWidth: 2, paddingHorizontal: 12, paddingVertical: 4 },
  clearBadgeTxt: { ...MONO, fontWeight: 'bold', fontSize: 13 },
  clearSubtitle: { ...MONO, color: '#d4c9a8', fontSize: 13, textAlign: 'center' },
  scoreRow: { flexDirection: 'row', gap: 10, width: '100%' },
  scoreBox: {
    flex: 1, backgroundColor: '#1c1c30', ...BORDER,
    borderWidth: 2, alignItems: 'center', paddingVertical: 10,
  },
  scoreLabel: { ...MONO, color: '#aaa', fontSize: 11 },
  scoreValue: { ...MONO, fontSize: 22, fontWeight: 'bold', marginTop: 2 },
  clearPanel: {
    width: '100%', backgroundColor: '#0d1a0d',
    borderWidth: 2, borderColor: '#2E7D32', padding: 12,
  },
  clearPanelHeader: { ...MONO, color: '#4CAF50', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  clearPanelTxt: { ...MONO, color: '#a5d6a7', fontSize: 12, lineHeight: 20 },
  orangeBtn: {
    width: '100%', backgroundColor: '#C97D10',
    ...BORDER, paddingVertical: 14, alignItems: 'center',
  },
  orangeBtnTxt: { ...MONO, color: '#fff', fontSize: 15, fontWeight: 'bold' },
  root: { flex: 1 },
  scene: { width: SW, height: SCENE_H, backgroundColor: '#1E222A', overflow: 'hidden' },
  sceneBg: { ...StyleSheet.absoluteFillObject },
  gridLineH: {
    position: 'absolute', left: 0, right: 0, height: 1,
    backgroundColor: 'rgba(46,125,50,0.2)',
  },
  gridLineV: {
    position: 'absolute', top: 0, bottom: 0, width: 1,
    backgroundColor: 'rgba(46,125,50,0.2)',
  },
  pcbPanel: {
    position: 'absolute',
    top: 8, left: 8, right: 8,
    height: SCENE_H * 0.54,
    backgroundColor: '#120e08',
    borderWidth: 3, borderColor: '#6B4226',
    padding: 10,
    justifyContent: 'center',
  },
  boltDot: {
    position: 'absolute',
    width: 8, height: 8,
    backgroundColor: '#8B6914',
    borderWidth: 1, borderColor: '#5a4010',
  },
  pcbRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  esp32Box: {
    backgroundColor: '#0d200d',
    borderWidth: 2, borderColor: '#2E7D32',
    paddingHorizontal: 8, paddingVertical: 8,
    alignItems: 'center', gap: 2,
    minWidth: SW * 0.18,
  },
  pcbCompIcon: { fontSize: 18 },
  esp32Name: { ...MONO, color: '#4CAF50', fontSize: 9, fontWeight: '700' },
  esp32Sub:  { ...MONO, color: '#81C784', fontSize: 8 },
  pcbWires: { flex: 1, gap: 8 },
  pcbWireRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  pcbPinL: { ...MONO, color: '#4CAF50', fontSize: 7, fontWeight: '700', width: 36, textAlign: 'right' },
  pcbPinR: { ...MONO, color: '#ccc', fontSize: 7, width: 24 },
  pcbPinDim: { color: '#333' },
  pcbDotL: { width: 8, height: 8, backgroundColor: '#2E7D32', borderWidth: 1, borderColor: '#4CAF50' },
  pcbDotR: { width: 8, height: 8, backgroundColor: '#8B2020', borderWidth: 1, borderColor: '#D94040' },
  pcbDotDim: { opacity: 0.3 },
  pcbSeg: { flex: 1, height: 3 },
  pcbSegOn: { backgroundColor: '#E8A020' },
  pcbSegOff: { backgroundColor: '#2a2a2a' },
  sensorBox: {
    borderWidth: 2,
    paddingHorizontal: 8, paddingVertical: 8,
    alignItems: 'center', gap: 2,
    minWidth: SW * 0.18,
    backgroundColor: '#1a0808',
  },
  sensorBoxName: { ...MONO, fontSize: 9, fontWeight: '700' },
  sensorBoxSub:  { ...MONO, color: '#888', fontSize: 8 },
  playerPos: { position: 'absolute', left: SW * 0.05, bottom: GROUND_PX },
  catClip: { width: CAT_W, height: CAT_H, overflow: 'hidden' },
  catSheet: { width: CAT_W * CAT_FRAMES, height: CAT_H },
  bossPos: { position: 'absolute', right: SW * 0.44, bottom: GROUND_PX },
  orcClip: { width: ORC_W, height: ORC_H, overflow: 'hidden' },
  orcSheet: { width: ORC_W * ORC_FRAMES, height: ORC_H },
  starBadge: {
    position: 'absolute', top: 8, right: 10,
    backgroundColor: '#1a1a0a', ...BORDER, borderWidth: 2, borderColor: '#E8A020',
    paddingHorizontal: 8, paddingVertical: 3,
  },
  starTxt: { ...MONO, color: '#E8A020', fontWeight: 'bold', fontSize: 13 },
  statsBar: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    backgroundColor: '#F5F2EB',
    borderBottomWidth: 3, borderBottomColor: '#2C1B10',
    paddingVertical: 7, paddingHorizontal: 4,
  },
  statCard: {
    alignItems: 'center', borderWidth: 2,
    paddingHorizontal: 8, paddingVertical: 3, minWidth: 82,
  },
  statLabel: { ...MONO, fontSize: 8, fontWeight: '700', letterSpacing: 0.5 },
  statValue: { ...MONO, fontSize: 18, fontWeight: 'bold' },
  missionScroll: {
    flex: 1, flexDirection: 'row', gap: 10,
    backgroundColor: '#F7E7C4',
    borderBottomWidth: 3, borderBottomColor: '#2C1B10',
    paddingHorizontal: 12, paddingVertical: 10,
  },
  npcAvatarCol: { alignItems: 'center', gap: 3 },
  avatarBox: {
    width: 48, height: 48, backgroundColor: '#e8d5a0',
    ...BORDER, borderWidth: 2, justifyContent: 'center', alignItems: 'center',
  },
  avatarEmoji: { fontSize: 26 },
  npcName: { ...MONO, fontSize: 10, fontWeight: '700', color: '#2C1B10', textAlign: 'center' },
  missionTextScroll: { flex: 1 },
  missionText: { ...MONO, fontSize: 12, color: '#2C1B10', lineHeight: 19 },
  inventory: {
    backgroundColor: '#F5F2EB',
    borderBottomWidth: 3, borderBottomColor: '#2C1B10',
    paddingHorizontal: 10, paddingTop: 6, paddingBottom: 8,
  },
  inventoryLabel: { ...MONO, color: '#2C1B10', fontSize: 9, fontWeight: '700', marginBottom: 6 },
  sensorRow: { flexDirection: 'row', gap: 6 },
  sensorCard: {
    flex: 1, borderWidth: 2, backgroundColor: '#F5F2EB',
    padding: 6, alignItems: 'center', gap: 2,
  },
  sensorCardSelected: { backgroundColor: '#e8d5a0' },
  sensorCardPlugged:  { backgroundColor: '#d4f0d4' },
  sensorCardName: { ...MONO, fontSize: 10, fontWeight: '700' },
  sensorCardDesc: { ...MONO, fontSize: 8, color: '#555', textAlign: 'center' },
  pluggedMark: { ...MONO, fontSize: 8, color: '#27AE60', fontWeight: '700' },
  actionArea: {
    backgroundColor: '#F5F2EB',
    borderTopWidth: 0,
    paddingHorizontal: 10, paddingVertical: 10,
  },
  btnRow: { gap: 8 },
  plugBtn: {
    backgroundColor: '#1E222A', ...BORDER,
    paddingVertical: 10, alignItems: 'center',
  },
  plugBtnTxt: { ...MONO, color: '#4CAF50', fontSize: 13, fontWeight: '700' },
  runBtn: {
    backgroundColor: '#C97D10', ...BORDER,
    paddingVertical: 12, alignItems: 'center',
  },
  runBtnTxt: { ...MONO, color: '#fff', fontSize: 14, fontWeight: 'bold' },
  btnDisabled: { opacity: 0.4 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 20,
  },
  resultPanel: {
    width: '100%', ...BORDER, padding: 20,
    alignItems: 'center', gap: 10,
  },
  successPanel: { backgroundColor: '#0d2a0d' },
  errorPanel:   { backgroundColor: '#2a0d0d' },
  resultTitle: { ...MONO, color: '#F5F2EB', fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  resultIcon: { ...MONO, fontSize: 36, color: '#4CAF50' },
  resultText: { ...MONO, color: '#ccc', fontSize: 12, lineHeight: 20, alignSelf: 'flex-start' },
});
