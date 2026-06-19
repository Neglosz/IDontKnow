// simEngine.js
// ─────────────────────────────────────────────────────────────────────────
// แกนกลางของระบบประเมินแบบ simulation — ทุก archetype ปล่อย "evidence packet"
// หน้าตาเดียวกัน แล้วป้อนเข้า scoreEvidence() ที่ map ตรงกับสูตรใน proposal
//
//   archetype 5 แบบ ──▶ useSimSession ──▶ Evidence Packet ──▶ scoreEvidence
//   Tune / Connect / Sequence / Select / Diagnose
//
// รอบ mockup: misconception ฝังในแต่ละ sim, packet เก็บใน memory (Tracker)
// ภายหลังค่อยย้าย Tracker ไป AsyncStorage → Supabase ได้โดยไม่แตะ sim เลย
// ─────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// ════════════════════════════════════════════════════════════════════
//  TRACKER  — เก็บ event ดิบ + packet สรุป (in-memory)
// ════════════════════════════════════════════════════════════════════
const _events = [];
const _packets = [];

export const Tracker = {
  log(type, p = {}) { _events.push({ type, ts: Date.now(), ...p }); },
  savePacket(p) { _packets.push(p); },
  packets() { return _packets.slice(); },
  events() { return _events.slice(); },
  clear() { _events.length = 0; _packets.length = 0; },
};

// ════════════════════════════════════════════════════════════════════
//  SCORING  — แปลง packet → คะแนนตามสูตร proposal
// ════════════════════════════════════════════════════════════════════
// ความถูกต้อง 30% : full=30 / partial=18 / none=6  (= keyword ครบ/บางส่วน/ไม่ครบ)
// ความเร็ว   30% : เทียบกับเวลามาตรฐาน (parMs)
const COMPLETENESS_PTS = { full: 30, partial: 18, none: 6 };

export function scoreEvidence(packet, parMs = 20000) {
  const correctness = COMPLETENESS_PTS[packet.completeness] ?? 6;
  let speed;
  if (packet.timeMs <= parMs) speed = 30;
  else speed = Math.max(8, Math.round(30 * (parMs / packet.timeMs)));

  return {
    correctness,                       // /30
    speed,                             // /30
    quizAccuracy: correctness + speed, // /60  → ป้อน Quiz Accuracy ใน proposal
    nodeTrigger: packet.completeness !== 'full', // เข้าใจไม่ครบ → สร้าง Node เสริม
    misconceptions: packet.misconceptions,
    approach: packet.approach,
    slowFlag: packet.slowFlag,         // ถูกแต่ช้าผิดปกติ → proposal ให้ทบทวนเพิ่ม
  };
}

// รวม Quiz Accuracy เป็น % (0–100) จาก packet ของด่านที่เล่นจริง (ไม่นับ calibration)
export function aggregateQuizAccuracy(packets = Tracker.packets()) {
  const sims = packets.filter(p => p.archetype !== 'calibrate');
  if (!sims.length) return null;
  const sum = sims.reduce((a, p) => a + (scoreEvidence(p).quizAccuracy / 60) * 100, 0);
  return Math.round(sum / sims.length);
}

// Level Score รวม 100% ตาม proposal: Calibration 20% + Quiz Accuracy 60% + Consistency 20%
// แต่ละ input เป็น % (0–100) แล้วถ่วงน้ำหนัก → จัด band ตามหน้า 12
export function computeLevelScore({ calibrationScore = 0, quizAccuracyPct = 0, consistencyScore = 0 }) {
  const levelScore = Math.round(
    calibrationScore * 0.2 + quizAccuracyPct * 0.6 + consistencyScore * 0.2
  );
  let band, pace, advice;
  if (levelScore >= 91)      { band = '91-100'; pace = 'fast';   advice = 'เพิ่มเร็ว เนื้อหาถัดไปท้าทายขึ้น'; }
  else if (levelScore >= 76) { band = '76-90';  pace = 'normal'; advice = 'ระดับเพิ่มปกติ'; }
  else if (levelScore >= 60) { band = '60-75';  pace = 'slow';   advice = 'เพิ่มช้าลง เนื้อหาง่ายลง'; }
  else                       { band = '<60';    pace = 'review'; advice = 'แนะนำให้ทบทวนเนื้อหาเดิม'; }
  return { levelScore, band, pace, advice };
}

// แยก "เข้าใจชัด / ลองแล้วเจอ / เดา / เข้าใจผิด" จากพฤติกรรม (ใช้ร่วมทุก archetype)
function deriveApproach({ firstCorrect, attempts, misconceptions, behavior }) {
  const noise = (behavior.reversals || 0) + (behavior.resets || 0);
  if (firstCorrect && noise <= 1) return 'confident';
  if (firstCorrect)               return 'explored';
  if (misconceptions.length >= 1 && attempts >= 2) return 'misconception';
  return 'guessing';
}

// ════════════════════════════════════════════════════════════════════
//  useSimSession  — hook ที่ทุก sim เรียกใช้ → ปล่อย packet มาตรฐานให้เอง
// ════════════════════════════════════════════════════════════════════
export function useSimSession({ questId, archetype, topicTags = [], parMs = 20000 }) {
  const start = useRef(Date.now());
  const attempts = useRef(0);
  const firstCorrect = useRef(null);
  const misSet = useRef(new Set());
  const behavior = useRef({ reversals: 0, resets: 0, dangerousActions: 0, hintsUsed: 0, probes: 0 });

  useEffect(() => { Tracker.log('quest_enter', { questId, archetype }); }, []);

  // เพิ่มสัญญาณพฤติกรรม เช่น bump('reversals'), bump('probes')
  const bump = useCallback((key, n = 1) => {
    behavior.current[key] = (behavior.current[key] || 0) + n;
  }, []);

  // เรียกทุกครั้งที่ผู้เล่นกด "ตรวจ"
  const submit = useCallback(({ correct, misconceptions = [] }) => {
    attempts.current += 1;
    if (firstCorrect.current === null) firstCorrect.current = correct;
    misconceptions.forEach(m => misSet.current.add(m));
    Tracker.log('answer_submit', {
      questId, attemptNo: attempts.current, correct, misconceptions,
    });
    return correct;
  }, [questId]);

  // เรียกตอนผ่านด่าน → สร้าง + เก็บ packet
  const complete = useCallback(({ completeness, accuracy = 1 }) => {
    const timeMs = Date.now() - start.current;
    const mis = [...misSet.current];
    const approach = deriveApproach({
      firstCorrect: firstCorrect.current,
      attempts: attempts.current,
      misconceptions: mis,
      behavior: behavior.current,
    });
    const packet = {
      questId, archetype, topicTags,
      completeness, accuracy, timeMs,
      slowFlag: timeMs > parMs * 1.8 && completeness === 'full',
      attempts: attempts.current,
      misconceptions: mis,
      behavior: { ...behavior.current },
      approach,
    };
    Tracker.savePacket(packet);
    Tracker.log('quest_complete', { questId, ...packet });
    return packet;
  }, [questId, archetype, parMs]);

  return { bump, submit, complete };
}

// ════════════════════════════════════════════════════════════════════
//  SHARED UI  — ใช้ร่วมกันทุก sim เพื่อให้หน้าตาเป็นชุดเดียว
// ════════════════════════════════════════════════════════════════════
function TopBar({ title, onClose }) {
  return (
    <View style={S.topBar}>
      <TouchableOpacity onPress={onClose} style={S.backBtn}><Text style={S.backTxt}>◄ ออก</Text></TouchableOpacity>
      <Text style={S.title}>{title}</Text>
      <View style={{ width: 54 }} />
    </View>
  );
}
function Mission({ npc, emoji, text }) {
  return (
    <View style={S.parchment}>
      <Text style={S.parLabel}>{emoji}  {npc}</Text>
      <Text style={S.parTxt}>{text}</Text>
    </View>
  );
}
function ResultBar({ result, okText, badText, onNext, onRetry }) {
  if (!result) return null;
  return (
    <View style={S.resultBox}>
      {result === 'correct' ? (
        <>
          <Text style={S.okTxt}>✅ {okText}</Text>
          <TouchableOpacity style={S.nextBtn} onPress={onNext}><Text style={S.nextTxt}>ต่อไป ▶</Text></TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={S.wrongTxt}>❌ {badText}</Text>
          <TouchableOpacity style={S.retryBtn} onPress={onRetry}><Text style={S.retryTxt}>ลองอีกครั้ง</Text></TouchableOpacity>
        </>
      )}
    </View>
  );
}
function RunBtn({ label, disabled, onPress }) {
  return (
    <TouchableOpacity style={[S.runBtn, disabled && S.runDim]} onPress={onPress} disabled={disabled}>
      <Text style={S.runTxt}>{label}</Text>
    </TouchableOpacity>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ARCHETYPE 3: SEQUENCE  — เรียงลำดับขั้นตอน (เช่น ขั้นตอนทำ PCB)
// ════════════════════════════════════════════════════════════════════
const SEQ_CORRECT = [
  { id: 'design', label: 'ออกแบบวงจร (Schematic)', icon: '✏️' },
  { id: 'place',  label: 'วางตำแหน่งอุปกรณ์ (Placement)', icon: '📍' },
  { id: 'route',  label: 'เดินลายทองแดง (Routing)', icon: '🛣️' },
  { id: 'fab',    label: 'ส่งผลิต (Fabrication)', icon: '🏭' },
];
const SEQ_START = ['route', 'design', 'fab', 'place']; // สลับไว้ให้เรียงใหม่

export function SequenceSim({ onSuccess, onClose }) {
  const sess = useSimSession({ questId: 'seq_pcb_flow', archetype: 'sequence', topicTags: ['pcb', 'workflow'], parMs: 25000 });
  const [order, setOrder] = useState(() => SEQ_START.map(id => SEQ_CORRECT.find(s => s.id === id)));
  const [sel, setSel] = useState(null);
  const [result, setResult] = useState(null);

  const tap = (i) => {
    if (result) return;
    if (sel === null) { setSel(i); return; }
    if (sel === i) { setSel(null); return; }
    const next = order.slice();
    [next[sel], next[i]] = [next[i], next[sel]];
    setOrder(next);
    sess.bump('reversals'); // ทุกการสลับ = สัญญาณว่ายังไม่แน่ใจลำดับ
    setSel(null);
  };

  const run = () => {
    const ids = order.map(s => s.id);
    const correctCount = ids.filter((id, i) => id === SEQ_CORRECT[i].id).length;
    const allOk = correctCount === SEQ_CORRECT.length;

    // misconception เฉพาะเจาะจง
    const mis = [];
    if (ids.indexOf('route') < ids.indexOf('place')) mis.push('route_before_place'); // เดินลายก่อนวางอุปกรณ์
    if (ids.indexOf('fab') < ids.indexOf('route'))   mis.push('fab_before_route');   // ส่งผลิตก่อนเดินลาย

    const completeness = allOk ? 'full' : correctCount >= 2 ? 'partial' : 'none';
    sess.submit({ correct: allOk, misconceptions: mis });
    if (allOk) { sess.complete({ completeness: 'full' }); setResult('correct'); }
    else setResult('wrong');
  };

  return (
    <View style={S.screen}>
      <TopBar title="ASSEMBLY ORDER" onClose={onClose} />
      <Mission npc="Skeleton" emoji="💀"
        text="เรียงลำดับขั้นตอนการทำบอร์ดให้ถูกต้อง — แตะสองช่องเพื่อสลับตำแหน่ง" />
      <View style={{ padding: 14, gap: 10 }}>
        {order.map((step, i) => (
          <TouchableOpacity key={step.id} activeOpacity={0.8} onPress={() => tap(i)}
            style={[S.seqRow, sel === i && S.seqRowSel]}>
            <Text style={S.seqNum}>{i + 1}</Text>
            <Text style={S.seqIcon}>{step.icon}</Text>
            <Text style={S.seqLabel}>{step.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flex: 1 }} />
      {!result
        ? <RunBtn label="⚡ ตรวจลำดับ" onPress={run} />
        : <ResultBar result={result}
            okText="ลำดับถูกต้อง! ออกแบบ → วาง → เดินลาย → ผลิต"
            badText="ลำดับยังไม่ถูก — ต้องวางอุปกรณ์ก่อนเดินลาย และเดินลายก่อนส่งผลิต"
            onNext={onSuccess} onRetry={() => { setResult(null); sess.bump('resets'); }} />}
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ARCHETYPE 4: SELECT  — เลือกอุปกรณ์ให้ตรงเงื่อนไข (เช่น ตัวแปลงไฟ)
// ════════════════════════════════════════════════════════════════════
const SEL_OPTIONS = [
  { id: 'buck', name: 'Buck Converter', icon: '🔋',
    desc: 'สวิตชิ่ง ลดแรงดัน ประสิทธิภาพสูง',
    correct: true },
  { id: 'ldo', name: 'LDO Regulator', icon: '🔥',
    desc: 'ลดแรงดันแบบเชิงเส้น ร้อนเมื่อกระแสสูง',
    correct: false, mis: 'ldo_ignores_heat' },
  { id: 'boost', name: 'Boost Converter', icon: '⬆️',
    desc: 'เพิ่มแรงดัน (step-up)',
    correct: false, mis: 'confused_step_direction' },
];

export function SelectSim({ onSuccess, onClose }) {
  const sess = useSimSession({ questId: 'sel_power_ic', archetype: 'select', topicTags: ['power', 'component'], parMs: 18000 });
  const [pick, setPick] = useState(null);
  const [result, setResult] = useState(null);
  const [badId, setBadId] = useState(null);

  const run = () => {
    const opt = SEL_OPTIONS.find(o => o.id === pick);
    if (!opt) return;
    if (opt.correct) {
      sess.submit({ correct: true });
      sess.complete({ completeness: 'full' });
      setResult('correct');
    } else {
      sess.submit({ correct: false, misconceptions: [opt.mis] });
      setBadId(opt.id);
      setResult('wrong');
    }
  };

  return (
    <View style={S.screen}>
      <TopBar title="PICK THE RIGHT IC" onClose={onClose} />
      <Mission npc="Professor" emoji="🧑‍🏫"
        text={'ต้องแปลง 12V → 5V จ่าย 2A โดยให้ร้อนน้อยและประหยัดพลังงาน\nเลือกอุปกรณ์ที่เหมาะที่สุด'} />
      <View style={{ padding: 14, gap: 10 }}>
        {SEL_OPTIONS.map(o => (
          <TouchableOpacity key={o.id} activeOpacity={0.8}
            onPress={() => { if (!result) { setPick(o.id); setBadId(null); } }}
            style={[
              S.selCard,
              pick === o.id && S.selCardSel,
              badId === o.id && S.selCardBad,
            ]}>
            <Text style={S.selIcon}>{o.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={S.selName}>{o.name}</Text>
              <Text style={S.selDesc}>{o.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flex: 1 }} />
      {!result
        ? <RunBtn label="⚡ ยืนยันตัวเลือก" disabled={!pick} onPress={run} />
        : <ResultBar result={result}
            okText="Buck ถูกต้อง! สวิตชิ่งลดแรงดันได้ประสิทธิภาพสูง ร้อนน้อย"
            badText={badId === 'ldo'
              ? 'LDO ลดไฟแบบเชิงเส้น ที่ 2A จะร้อนจัด (เปลืองเป็นความร้อน)'
              : 'Boost ใช้เพิ่มแรงดัน แต่โจทย์คือลดแรงดัน 12→5V'}
            onNext={onSuccess} onRetry={() => { setResult(null); setPick(null); setBadId(null); sess.bump('resets'); }} />}
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════
//  ARCHETYPE 5: DIAGNOSE  — หาจุดเสียในวงจร (แตะวัด แล้วระบุปัญหา)
// ════════════════════════════════════════════════════════════════════
const DIAG_PROBES = [
  { id: 'vcc',  label: 'ขา VCC',  reading: '3.30 V', ok: true },
  { id: 'gnd',  label: 'ขา GND',  reading: 'ลอย (ไม่ต่อ)', ok: false },
  { id: 'sig',  label: 'ขาสัญญาณ', reading: '0 V', ok: true },
];
const DIAG_FAULTS = [
  { id: 'no_gnd',  label: 'GND ไม่ได้ต่อ', correct: true },
  { id: 'no_vcc',  label: 'ไม่มีไฟเลี้ยง', mis: 'misread_vcc' },
  { id: 'bad_sig', label: 'ขาสัญญาณเสีย', mis: 'ignored_ground' },
];

export function DiagnoseSim({ onSuccess, onClose }) {
  const sess = useSimSession({ questId: 'diag_sensor_dead', archetype: 'diagnose', topicTags: ['debug', 'wiring'], parMs: 30000 });
  const [revealed, setRevealed] = useState({});
  const [pick, setPick] = useState(null);
  const [result, setResult] = useState(null);

  const probe = (id) => {
    if (result || revealed[id]) return;
    setRevealed(r => ({ ...r, [id]: true }));
    sess.bump('probes'); // วัดกี่จุดก่อนตอบ = สัญญาณว่าวิเคราะห์จริงไหม
  };

  const run = () => {
    const f = DIAG_FAULTS.find(x => x.id === pick);
    if (!f) return;
    if (f.correct) {
      sess.submit({ correct: true });
      sess.complete({ completeness: 'full' });
      setResult('correct');
    } else {
      sess.submit({ correct: false, misconceptions: [f.mis] });
      setResult('wrong');
    }
  };

  return (
    <View style={S.screen}>
      <TopBar title="DEBUG THE CIRCUIT" onClose={onClose} />
      <Mission npc="Orc แห่งความสับสน" emoji="👹"
        text={'เซนเซอร์ไม่ทำงาน! แตะแต่ละขาเพื่อวัดค่า แล้วเลือกว่าปัญหาคืออะไร'} />
      <Text style={S.sectionTxt}>🔍 จุดวัด (แตะเพื่อวัด)</Text>
      <View style={{ paddingHorizontal: 14, gap: 8 }}>
        {DIAG_PROBES.map(p => (
          <TouchableOpacity key={p.id} activeOpacity={0.8} onPress={() => probe(p.id)}
            style={[S.probeRow, revealed[p.id] && (p.ok ? S.probeOk : S.probeBad)]}>
            <Text style={S.probeLabel}>{p.label}</Text>
            <Text style={S.probeVal}>{revealed[p.id] ? p.reading : '—— แตะวัด ——'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={S.sectionTxt}>🧠 วินิจฉัย</Text>
      <View style={{ paddingHorizontal: 14, gap: 8 }}>
        {DIAG_FAULTS.map(f => (
          <TouchableOpacity key={f.id} activeOpacity={0.8}
            onPress={() => { if (!result) setPick(f.id); }}
            style={[S.diagCard, pick === f.id && S.diagCardSel]}>
            <Text style={S.diagTxt}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={{ flex: 1 }} />
      {!result
        ? <RunBtn label="⚡ ยืนยันการวินิจฉัย" disabled={!pick} onPress={run} />
        : <ResultBar result={result}
            okText="ถูกต้อง! GND ลอยอยู่ — ต่อกราวด์แล้วเซนเซอร์ทำงาน"
            badText="ยังไม่ใช่ — ลองวัดทุกขาแล้วดูว่าค่าไหนผิดปกติ (ขาที่ลอยคือเบาะแส)"
            onNext={onSuccess} onRetry={() => { setResult(null); setPick(null); sess.bump('resets'); }} />}
    </View>
  );
}

// ── styles (ชุดเดียว ใช้ร่วมทุก sim) ────────────────────────────────────
const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0D1117' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#161B22', paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: '#C97D10' },
  backBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1.5, borderColor: '#555' },
  backTxt: { color: '#aaa', fontSize: 12, fontWeight: '600' },
  title: { fontSize: 14, fontWeight: 'bold', color: '#FFD700', letterSpacing: 1 },

  parchment: { backgroundColor: '#F7E7C4', marginHorizontal: 14, marginTop: 12, borderRadius: 8, borderWidth: 2, borderColor: '#C97D10', padding: 10 },
  parLabel: { fontSize: 12, fontWeight: '800', color: '#8B4513', marginBottom: 3 },
  parTxt: { fontSize: 13, color: '#3B2010', lineHeight: 19 },

  sectionTxt: { color: '#8FE6A8', fontSize: 12, fontWeight: '700', marginHorizontal: 14, marginTop: 14, marginBottom: 6 },

  // Sequence
  seqRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1C2530', borderRadius: 10, borderWidth: 1.5, borderColor: '#2a3744', paddingVertical: 12, paddingHorizontal: 12 },
  seqRowSel: { borderColor: '#FFD700', backgroundColor: '#2a2410' },
  seqNum: { color: '#C97D10', fontSize: 16, fontWeight: '800', width: 20 },
  seqIcon: { fontSize: 20 },
  seqLabel: { color: '#ddd', fontSize: 13, fontWeight: '600', flex: 1 },

  // Select
  selCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1C2530', borderRadius: 10, borderWidth: 1.5, borderColor: '#2a3744', padding: 12 },
  selCardSel: { borderColor: '#FFD700', backgroundColor: '#2a2410' },
  selCardBad: { borderColor: '#D94040', backgroundColor: '#2a1212' },
  selIcon: { fontSize: 26 },
  selName: { color: '#fff', fontSize: 14, fontWeight: '700' },
  selDesc: { color: '#9aa7b5', fontSize: 11.5, marginTop: 2 },

  // Diagnose
  probeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1C2530', borderRadius: 8, borderWidth: 1.5, borderColor: '#2a3744', paddingVertical: 10, paddingHorizontal: 12 },
  probeOk: { borderColor: '#2E7D32' },
  probeBad: { borderColor: '#D94040', backgroundColor: '#2a1212' },
  probeLabel: { color: '#ddd', fontSize: 13, fontWeight: '600' },
  probeVal: { color: '#8FE6A8', fontSize: 12, fontFamily: 'monospace' },
  diagCard: { backgroundColor: '#1C2530', borderRadius: 8, borderWidth: 1.5, borderColor: '#2a3744', paddingVertical: 11, paddingHorizontal: 12 },
  diagCardSel: { borderColor: '#FFD700', backgroundColor: '#2a2410' },
  diagTxt: { color: '#ddd', fontSize: 13, fontWeight: '600' },

  // shared bottom
  runBtn: { backgroundColor: '#C97D10', marginHorizontal: 14, marginBottom: 20, marginTop: 10, borderRadius: 10, paddingVertical: 15, alignItems: 'center' },
  runDim: { opacity: 0.35 },
  runTxt: { color: '#fff', fontSize: 15, fontWeight: 'bold', letterSpacing: 0.5 },
  resultBox: { marginHorizontal: 14, marginBottom: 20, gap: 10, alignItems: 'center' },
  okTxt: { color: '#4CAF50', fontSize: 13, fontWeight: '700', textAlign: 'center' },
  wrongTxt: { color: '#E8908F', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  nextBtn: { width: '100%', backgroundColor: '#C97D10', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  nextTxt: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  retryBtn: { paddingHorizontal: 24, paddingVertical: 9, borderRadius: 8, borderWidth: 1.5, borderColor: '#D94040' },
  retryTxt: { color: '#D94040', fontSize: 13, fontWeight: '600' },
});