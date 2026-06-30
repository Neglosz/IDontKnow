// ============================================================================
// แหล่งข้อมูลบทเรียน "ชุดเดียว" ของเกมทั้งหมด  (โมเดล: knowledge DAG)
// ----------------------------------------------------------------------------
// แต่ละ topic = object { key, th, quest, nodes:[...] }
//   • circuit/board/code = บทเรียนเฉพาะวัตถุ (generate จาก AI) แยกไฟล์ใน lessonAI/
//   • integration        = ชุดเดิม (ยังใช้ boss:'circuit' + blockcode)
//
// node แต่ละตัว: id, en, th, fullTh, desc, teaches[], requires[],
//   pretest{q,choices,answer} (calibration), chapter, gameTitle, intro, maxReward, steps[]
// tier ไม่เก็บใน data — computeTiers() คำนวณจาก requires (1 tier มีหลาย node ได้)
// status (done/available/locked) — computeStatus() คำนวณจาก mastery ของผู้เล่น
//
// step.kind ที่เล่นได้:
//   'dialogue'  → สอน (กดรับทราบ)
//   เครื่องเกมกลาง (MiniGames.js): 'wire' | 'sort' | 'sequence' | 'select' | 'diagnose' | 'tune'
//   'blockcode' → ลากบล็อกโค้ด (SoftwareGame.js)
//   'boss'      → puzzle:'circuit' (CircuitPuzzle — hardcode PIR ; ใช้ใน integration)
//   หมายเหตุ: บอสของแต่ละ node = เครื่องเกมกลาง + boss:true (data ยาก) — object-specific
// ============================================================================
import TOPIC_CIRCUIT from './lessonAI/topic_circuit_controller';
import TOPIC_BOARD from './lessonAI/topic_board_controller';
import TOPIC_CODE from './lessonAI/topic_code_controller';

// ── บล็อกโค้ดสำเร็จรูป (ใช้ใน topic integration) ────────────────────────────
const BC_FAN = {
  kind: 'blockcode', npc: 'Skeleton Coder', emoji: '💀',
  title: 'เปิดพัดลมเมื่ออากาศร้อน',
  brief:
    'อ่านอุณหภูมิจาก DHT11 ถ้าเกิน 35°C ให้เปิดพัดลม\n' +
    'ระวังบล็อกหลอก — ไม่ใช่ทุกอย่างที่ต้องใช้!',
  blocks: [
    { id: 'start',    type: 'event',  icon: '▶',  label: 'เริ่มทำงาน',  code: 'void setup()' },
    { id: 'read_dht', type: 'sensor', icon: '🌡', label: 'อ่านอุณหภูมิ', code: 't = readDHT11()' },
    { id: 'if_hot',   type: 'cond',   icon: '◇',  label: 'ถ้าร้อน > 35°', code: 'if (t > 35)' },
    { id: 'fan_on',   type: 'action', icon: '🌀', label: 'เปิดพัดลม',   code: 'fanON()' },
    { id: 'led_on',   type: 'action', icon: '💡', label: 'เปิดไฟ',      code: 'ledON()' },
  ],
  correct: ['start', 'read_dht', 'if_hot', 'fan_on'],
  success: ['อ่านค่า DHT11 สำเร็จ', 'อุณหภูมิเกินเกณฑ์ → พัดลมหมุน'],
  error:   ['ลอจิกผิด! ต้องอ่านค่าก่อน แล้วค่อยเช็คเงื่อนไข'],
};

// helper สร้าง node ที่ยังไม่เปิด (ไม่มี steps) — มีไว้ให้กราฟครบเส้น
const stub = (id, en, th, fullTh, desc, teaches, requires) => ({
  id, en, th, fullTh, desc, teaches, requires,
});

// ── topic เดิม: เชื่อมต่อระบบ ───────────────────────────────────────────────
const TOPIC_INTEGRATION = {
  key: 'integration', th: 'เชื่อมต่อระบบ',
  quest: 'เรียนรู้การเชื่อมต่อระบบ IoT',
  nodes: [
    { id: 'wifi', en: 'WiFi Basic', th: 'พื้นฐาน WiFi', fullTh: 'เชื่อมต่อ WiFi',
      desc: 'พา ESP32 เข้าเครือข่าย',
      teaches: ['wifi'], requires: [],
      pretest: { q: 'ESP32 ต่อ WiFi เพื่ออะไร?',
        choices: ['ให้บอร์ดร้อนขึ้น', 'เข้าเครือข่ายเพื่อรับ-ส่งข้อมูล', 'เพิ่มแรงดันไฟ'], answer: 1 },
      chapter: 'CHAPTER 0', gameTitle: 'Get Online', maxReward: 4,
      intro: 'พา ESP32 เข้าอินเทอร์เน็ตก่อนส่งข้อมูล',
      steps: [
        { kind: 'dialogue', npc: 'Professor', emoji: '🧑‍🏫',
          text: 'ESP32 มี WiFi ในตัว ใช้พาบอร์ดเข้าเครือข่ายเพื่อรับ-ส่งข้อมูลกับอินเทอร์เน็ต\n\n' +
            'แค่บอกชื่อเครือข่าย (SSID) กับรหัสผ่าน:\n' +
            '   WiFi.begin("ชื่อWiFi", "รหัสผ่าน");\n\n' +
            'พอเชื่อมสำเร็จ บอร์ดก็ส่งค่าเซนเซอร์ขึ้น server หรือรับคำสั่งจากแอปได้' },
      ] },

    { id: 'cloud',
      en: 'Cloud Send', th: 'ส่งขึ้นคลาวด์', fullTh: 'ส่งข้อมูลขึ้นคลาวด์',
      desc: 'รวม hardware + software ในบทเดียว',
      teaches: ['cloud_send'], requires: ['wifi'],
      pretest: { q: 'ก่อนส่งข้อมูลขึ้นคลาวด์ ต้องทำอะไรก่อน?',
        choices: ['ต่อ hardware + เชื่อม WiFi ให้ครบ', 'รีบูตบอร์ด', 'ลบโค้ดเก่า'], answer: 0 },
      chapter: 'CHAPTER 5', gameTitle: 'IoT Bridge DUNGEON',
      intro: 'ด่านผสม! ต่อสายให้ครบ แล้วเขียนโค้ดส่งข้อมูลขึ้นคลาวด์',
      maxReward: 12,
      steps: [
        { kind: 'dialogue', npc: 'Professor', emoji: '🧑‍🏫',
          text: 'การส่งข้อมูล IoT: อ่านเซนเซอร์ → เชื่อมต่อ WiFi → ส่งขึ้น server\n\nต้องต่อ hardware ให้ครบก่อนถึงจะส่งข้อมูลได้!' },
        { kind: 'boss', puzzle: 'circuit', npc: 'Orc แห่งความสับสน', emoji: '👹',
          text: 'ต่อเซนเซอร์ให้ครบก่อน ไม่งั้นไม่มีข้อมูลส่ง!' },
        BC_FAN,
      ],
    },

    stub('mqtt', 'MQTT', 'โปรโตคอล MQTT', 'รับ-ส่งผ่าน MQTT',
      'สื่อสารด้วย MQTT', ['mqtt'], ['cloud_send']),
    stub('dashboard', 'Dashboard', 'แดชบอร์ด', 'แสดงผลบนแดชบอร์ด',
      'แสดงข้อมูลบนแดชบอร์ด', ['dashboard'], ['mqtt']),
    stub('mobile', 'Mobile App', 'ควบคุมผ่านแอป', 'สั่งงานผ่านแอป',
      'สั่งงานจากมือถือ', ['mobile_app'], ['mqtt']),
    stub('full-iot', 'Full IoT', 'ระบบ IoT เต็ม', 'ระบบ IoT ครบวงจร',
      'ประกอบระบบ IoT ครบวงจร', ['full_iot'], ['dashboard', 'mobile_app']),
  ],
};

// ============================================================================
export const TOPICS = [TOPIC_CIRCUIT, TOPIC_BOARD, TOPIC_CODE, TOPIC_INTEGRATION];

// ============================================================================
//  HELPERS — ทำให้ skill tree เป็น dynamic (tier/status คำนวณจากกราฟ + ผู้เล่น)
// ============================================================================

// map: concept → id ของ node ที่สอน concept นั้น
function teacherIndex(nodes) {
  const idx = {};
  nodes.forEach(n => (n.teaches || []).forEach(c => { idx[c] = n.id; }));
  return idx;
}

// ความลึกของ node ในกราฟ = longest path ตาม requires (กันลูปไว้ด้วย)
function depthMap(nodes) {
  const byId = Object.fromEntries(nodes.map(n => [n.id, n]));
  const tIdx = teacherIndex(nodes);
  const cache = {};
  const depth = (node, seen = new Set()) => {
    if (cache[node.id] != null) return cache[node.id];
    if (seen.has(node.id)) return 0;           // cycle guard
    seen.add(node.id);
    const reqNodes = (node.requires || [])
      .map(c => byId[tIdx[c]]).filter(Boolean);
    const d = reqNodes.length ? 1 + Math.max(...reqNodes.map(r => depth(r, seen))) : 0;
    cache[node.id] = d;
    return d;
  };
  const out = {};
  nodes.forEach(n => { out[n.id] = depth(n); });
  return out;
}

// จัด node เป็นชั้น ๆ ตามความลึก → [[ชั้น0], [ชั้น1], ...]  (= "tier" ที่ได้มาจากกราฟ)
export function computeTiers(nodes) {
  const dm = depthMap(nodes);
  const maxD = Math.max(0, ...nodes.map(n => dm[n.id]));
  const tiers = [];
  for (let i = 0; i <= maxD; i++) tiers.push(nodes.filter(n => dm[n.id] === i));
  return tiers;
}

// mastery = "concept ที่ผู้เล่นรู้แล้ว" — ตัดสินตอน runtime ไม่ใช่ใน data
// แปลงผล calibration (concept ที่ผ่าน pretest) เป็น mastery set
export function masteryFromCalibration(passedConcepts = []) {
  return new Set(passedConcepts);
}

// status ต่อผู้เล่น:
//   done      = รู้ teaches ของ node นี้ครบแล้ว (ข้ามได้)
//   available = prereq ครบแต่ยังไม่รู้ → frontier ที่ควรเล่น
//   locked    = prereq ยังไม่ครบ
export function computeStatus(nodes, mastery = new Set()) {
  const status = {};
  nodes.forEach(n => {
    const teaches = n.teaches || [];
    const requires = n.requires || [];
    const known = teaches.length > 0 && teaches.every(c => mastery.has(c));
    const ready = requires.every(c => mastery.has(c));
    status[n.id] = known ? 'done' : ready ? 'available' : 'locked';
  });
  return status;
}

// node แรกที่ "ควรเริ่ม" = available ตัวแรก (ไม่งั้น node แรกในชุด)
export function firstAvailableId(nodes, mastery = new Set()) {
  const status = computeStatus(nodes, mastery);
  return (nodes.find(n => status[n.id] === 'available') ?? nodes[0])?.id;
}

// หา node prereq ที่ยังขาด (ใช้บอกผู้เล่นว่า "ต้องผ่านอันไหนก่อน")
export function missingPrereqNode(node, nodes, mastery = new Set()) {
  if (!node) return null;
  const tIdx = teacherIndex(nodes);
  const missing = (node.requires || []).find(c => !mastery.has(c));
  return missing ? nodes.find(n => n.id === tIdx[missing]) : null;
}

// ใช้เป็น fallback เผื่อเข้าเกมโดยไม่ได้ส่ง lesson มา (node แรกที่เล่นได้)
export const FALLBACK_LESSON =
  TOPICS[0].nodes.find(n => n.steps?.length) ?? TOPICS[0].nodes[0];
