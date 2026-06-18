// ============================================================================
// แหล่งข้อมูลบทเรียน "ชุดเดียว" ของเกมทั้งหมด
// ----------------------------------------------------------------------------
// เพิ่มบทเรียนใหม่ = เพิ่ม object ที่ไฟล์นี้ที่เดียว ไม่ต้องแตะโค้ดเกม
//
// โครงสร้าง 3 ชั้น:
//   TOPIC (หัวข้อ — ตรงกับแท็บใน SkillTree / popup ใน SelectLens)
//     └─ nodes (t0..t4 = ปุ่มใน SkillTree)
//          └─ steps[] (เฉพาะ node ที่เล่นได้ — ด่านในเกม ผสมชนิดได้)
//
// step.kind:
//   'dialogue'  → ผู้เชี่ยวชาญสอน (กดรับทราบ)
//   'sim'       → sim:'tune' | 'sequence' | 'select' | 'diagnose'  (hardware)
//   'blockcode' → ลากบล็อกโค้ด (software)
//   'boss'      → puzzle:'circuit' (ต่อวงจร)
//
// ทุก topic ต้องมี node ครบ 6 ตัว: t0, t1, t2, t3a, t3b, t4
// (เพราะ SkillTree วาดต้นไม้ตามตำแหน่งคงที่ T0→T1→T2→[T3a,T3b]→T4)
// ============================================================================

// ── บล็อกโค้ดสำเร็จรูป (software) — reuse ข้าม node ได้ ──────────────────────
const BC_DOOR = {
  kind: 'blockcode', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
  title: 'เปิดประตูเมื่อเจอคน',
  brief:
    'ต่อโปรแกรมให้ ESP32 อ่านค่าจากเซนเซอร์ PIR\n' +
    'ถ้าตรวจเจอมนุษย์ (HIGH) ให้สั่งเปิดประตูทันที',
  blocks: [
    { id: 'start',     type: 'event',  icon: '▶',  label: 'เริ่มทำงาน', code: 'void setup()' },
    { id: 'if_pir',    type: 'cond',   icon: '◇',  label: 'ถ้าเจอคน',   code: 'if (PIR == HIGH)' },
    { id: 'open_gate', type: 'action', icon: '🚪', label: 'เปิดประตู',  code: 'openGate()' },
    { id: 'water',     type: 'action', icon: '💧', label: 'รดน้ำ',      code: 'waterPump()' },
  ],
  correct: ['start', 'if_pir', 'open_gate'],
  success: ['PIR ตรวจจับมนุษย์ได้', 'ประตูโรงเรือนเปิดอัตโนมัติ...'],
  error:   ['ลำดับผิด! ต้องตรวจเจอคนก่อนเปิดประตู'],
};

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

const BC_SOIL = {
  kind: 'blockcode', npc: 'Orc Compiler', emoji: '👹',
  title: 'BOSS: ระบบรดน้ำอัตโนมัติ',
  brief:
    'อ่านความชื้นในดินจาก Soil Sensor ถ้าดินแห้ง (< 30)\n' +
    'ให้เปิดปั๊มน้ำ แล้วหน่วงเวลา 3 วินาทีก่อนจบ — 5 บล็อก!',
  blocks: [
    { id: 'start',     type: 'event',  icon: '▶',  label: 'เริ่มทำงาน',    code: 'void setup()' },
    { id: 'read_soil', type: 'sensor', icon: '🌱', label: 'อ่านความชื้นดิน', code: 'm = readSoil()' },
    { id: 'if_dry',    type: 'cond',   icon: '◇',  label: 'ถ้าดินแห้ง < 30', code: 'if (m < 30)' },
    { id: 'pump_on',   type: 'action', icon: '💧', label: 'เปิดปั๊มน้ำ',    code: 'pumpON()' },
    { id: 'delay',     type: 'action', icon: '⏱',  label: 'หน่วงเวลา 3 วิ',  code: 'delay(3000)' },
    { id: 'gate_open', type: 'action', icon: '🚪', label: 'เปิดประตู',      code: 'openGate()' },
  ],
  correct: ['start', 'read_soil', 'if_dry', 'pump_on', 'delay'],
  success: ['Boss circuit COMPILED!', 'ดินแห้ง → ปั๊มน้ำทำงาน 3 วินาที'],
  error:   ['COMPILE ERROR! ลำดับ: อ่าน → เช็ค → ปั๊ม → หน่วงเวลา'],
};

// ── โครง node ที่ยังไม่เล่นได้ (done/locked) — ไม่มี steps ──────────────────
const lockedNode = (tier, en, th, fullTh, requiredId) => ({
  tier, en, th, fullTh, status: 'locked', requiredId,
});
const doneNode = (tier, en, th, fullTh, desc) => ({
  tier, en, th, fullTh, desc, status: 'done',
});

// ============================================================================
export const TOPICS = [
  // ── 1) การต่อวงจร ─────────────────────────────────────────────────────────
  {
    key: 'circuit', th: 'การต่อวงจร',
    quest: 'เรียนรู้ขั้นตอนการต่อวงจรเซนเซอร์',
    nodes: {
      t0: doneNode('T0', 'Basic Parts', 'รู้จักอุปกรณ์', 'รู้จักอุปกรณ์พื้นฐาน', 'แยกแยะเซนเซอร์และบอร์ดควบคุม'),
      t1: doneNode('T1', 'Pin Mapping', 'อ่านขาสัญญาณ', 'อ่านขาสัญญาณ (Pinout)', 'เข้าใจขา VCC / GND / SIG'),
      t2: {
        tier: 'T2', en: 'Wiring', th: 'ต่อสายวงจร', status: 'available',
        fullTh: 'ต่อสายวงจรเซนเซอร์', desc: 'ต่อสายไฟเลี้ยงและสัญญาณให้ถูกขั้ว',
        chapter: 'CHAPTER 1', gameTitle: 'Sensor Wiring DUNGEON',
        intro: 'Hippo ต้องต่อสายเซนเซอร์ให้ถูกก่อนผ่านประตู ระวังต่อกลับขั้วไฟ!',
        maxReward: 8,
        steps: [
          { kind: 'dialogue', npc: 'Professor', emoji: '🧑‍🏫',
            text: 'การต่อเซนเซอร์มี 3 สายหลัก:\n\nVCC = ไฟเลี้ยง, GND = กราวด์, SIG = สัญญาณ\n\nถ้าต่อ VCC กับ GND สลับกัน → ลัดวงจร อุปกรณ์ไหม้!' },
          { kind: 'sim', sim: 'diagnose', npc: 'Ghost', emoji: '👻',
            text: 'เซนเซอร์ไม่ทำงาน! วัดแต่ละขาแล้วหาให้เจอว่าพังตรงไหน' },
          { kind: 'boss', puzzle: 'circuit', npc: 'Orc แห่งความสับสน', emoji: '👹',
            text: 'ต่อวงจรเซนเซอร์ให้ถูกต้องสิ ไม่งั้นประตูไม่เปิดหรอก!' },
        ],
      },
      t3a: lockedNode('T3', 'Multi Sensor', 'หลายเซนเซอร์', 'ต่อหลายเซนเซอร์พร้อมกัน', 't2'),
      t3b: lockedNode('T3', 'Noise Filter', 'กรองสัญญาณรบกวน', 'จัดการสัญญาณรบกวน', 't2'),
      t4: lockedNode('T4', 'Full Rig', 'ต่อระบบเต็ม', 'ต่อระบบครบวงจร', 't2'),
    },
  },

  // ── 2) ออกแบบบอร์ด (ดึง hardware dungeon เดิม + แทรก blockcode โชว์การผสม) ──
  {
    key: 'board', th: 'ออกแบบบอร์ด',
    quest: 'เรียนรู้ขั้นตอนการออกแบบบอร์ด',
    nodes: {
      t0: doneNode('T0', 'Basic Design', 'พื้นฐานการออกแบบ', 'พื้นฐานการออกแบบ', 'ทำความเข้าใจหลักการออกแบบวงจรเบื้องต้น'),
      t1: doneNode('T1', 'Circuit Reading', 'อ่านวงจรไฟฟ้า', 'อ่านวงจรไฟฟ้า', 'อ่านและตีความสัญลักษณ์ในแผนผังวงจร'),
      t2: {
        tier: 'T2', en: 'PCB Layout', th: 'ออกแบบ PCB', status: 'available',
        fullTh: 'ออกแบบแผ่นวงจร PCB', desc: 'การแปลงพิมพ์เขียวให้กลายเป็นลายวงจรพิมพ์',
        chapter: 'CHAPTER 3', gameTitle: 'PCB Layout & Routing DUNGEON',
        intro: 'Hippo จะได้พบผู้เชี่ยวชาญและเหล่ามอนสเตอร์ เพื่อเรียนรู้ก่อนเผชิญหน้ากับ Boss Monster.....',
        maxReward: 10,
        steps: [
          { kind: 'dialogue', npc: 'Professor', emoji: '🧑‍🏫',
            text:
              'การคำนวณขนาดเส้นทองแดง (Trace Width)\n\n' +
              'ยิ่งกระแสไฟฟ้าไหลผ่านมาก เส้นทองแดงยิ่งต้องกว้างขึ้น\n\n' +
              'สูตร: ความกว้าง (mil) = กระแส (A) × 50\n\n' +
              'ถ้าเส้นเล็กเกินไป จะร้อนจนขาดได้!' },
          { kind: 'sim', sim: 'tune', current: 1, questId: 'trace_1A', npc: 'Skeleton', emoji: '💀',
            text: 'แฮ่ บอร์ดนี้มีกระแสผ่าน 1 แอมแปร์ (1A) — ลากปรับความกว้างเส้นทองแดงให้พอดี!' },
          { kind: 'sim', sim: 'sequence', npc: 'Slime', emoji: '🟢',
            text: 'จะทำบอร์ดต้องทำตามลำดับ! เรียงขั้นตอนการผลิต PCB ให้ถูกต้อง' },
          { kind: 'sim', sim: 'select', npc: 'Bat', emoji: '🦇',
            text: 'เลือกตัวแปลงไฟที่เหมาะกับโจทย์ที่สุด — ผิดแล้วบอร์ดร้อนนะ!' },
          // ↓↓↓ ด่าน software แทรกในบทเดียวกัน — โชว์ว่าเอนจินเดียวเล่นได้ทั้งคู่
          BC_DOOR,
          { kind: 'sim', sim: 'diagnose', npc: 'Ghost', emoji: '👻',
            text: 'เซนเซอร์ไม่ทำงาน! วัดแต่ละขาแล้วหาให้เจอว่าพังตรงไหน' },
          { kind: 'boss', puzzle: 'circuit', npc: 'Orc แห่งความสับสน', emoji: '👹',
            text: 'กี่! ต่อวงจรเซนเซอร์ให้ถูกต้องสิ ไม่งั้นประตูไม่เปิดหรอก!' },
        ],
      },
      t3a: lockedNode('T3', 'Power Management', 'ระบบจ่ายไฟ', 'ระบบจ่ายไฟ', 't2'),
      t3b: lockedNode('T3', 'Signal Integrity', 'การวัดกระแส', 'การวัดกระแส', 't2'),
      t4: lockedNode('T4', 'Advanced Design', 'ออกแบบขั้นสูง', 'ออกแบบขั้นสูง', 't2'),
    },
  },

  // ── 3) เขียนโค้ดคุม (ดึง software LEVELS เดิมมาเป็นด่าน blockcode ล้วน) ──────
  {
    key: 'code', th: 'เขียนโค้ดคุม',
    quest: 'เรียนรู้การเขียนโค้ดควบคุม ESP32',
    nodes: {
      t0: doneNode('T0', 'Variables', 'ตัวแปร', 'รู้จักตัวแปร', 'เก็บค่าจากเซนเซอร์ลงตัวแปร'),
      t1: doneNode('T1', 'Conditions', 'เงื่อนไข', 'การใช้เงื่อนไข if', 'สั่งงานตามเงื่อนไขที่กำหนด'),
      t2: {
        tier: 'T2', en: 'Sensor Logic', th: 'ลอจิกเซนเซอร์', status: 'available',
        fullTh: 'เขียนลอจิกควบคุมเซนเซอร์', desc: 'อ่านค่า → ตรวจเงื่อนไข → สั่งงาน',
        chapter: 'CHAPTER 4', gameTitle: 'Block Coding Forge DUNGEON',
        intro: 'ช่างกลเวทมนตร์ต้องเขียนโปรแกรมให้ ESP32 ลากบล็อกคำสั่งมาเรียงให้ถูก ก่อนเจอ Orc Compiler.....',
        maxReward: 14,
        steps: [
          { kind: 'dialogue', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
            text: 'หลักการเขียนโค้ดคุม:\n\nอ่านค่า → ตรวจเงื่อนไข → สั่งงาน\n\nลำดับของโค้ดสำคัญเสมอ!' },
          BC_DOOR,
          BC_FAN,
          BC_SOIL,
        ],
      },
      t3a: lockedNode('T3', 'Loops', 'การวนซ้ำ', 'การใช้ลูป (loop)', 't2'),
      t3b: lockedNode('T3', 'Functions', 'ฟังก์ชัน', 'แยกโค้ดเป็นฟังก์ชัน', 't2'),
      t4: lockedNode('T4', 'State Machine', 'ระบบสถานะ', 'ออกแบบ State Machine', 't2'),
    },
  },

  // ── 4) เชื่อมต่อระบบ ──────────────────────────────────────────────────────
  {
    key: 'integration', th: 'เชื่อมต่อระบบ',
    quest: 'เรียนรู้การเชื่อมต่อระบบ IoT',
    nodes: {
      t0: doneNode('T0', 'WiFi Basic', 'พื้นฐาน WiFi', 'เชื่อมต่อ WiFi', 'พา ESP32 เข้าเครือข่าย'),
      t1: {
        tier: 'T1', en: 'Cloud Send', th: 'ส่งขึ้นคลาวด์', status: 'available',
        fullTh: 'ส่งข้อมูลขึ้นคลาวด์', desc: 'รวม hardware + software ในบทเดียว',
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
      t2: lockedNode('T2', 'MQTT', 'โปรโตคอล MQTT', 'รับ-ส่งผ่าน MQTT', 't1'),
      t3a: lockedNode('T3', 'Dashboard', 'แดชบอร์ด', 'แสดงผลบนแดชบอร์ด', 't1'),
      t3b: lockedNode('T3', 'Mobile App', 'ควบคุมผ่านแอป', 'สั่งงานผ่านแอป', 't1'),
      t4: lockedNode('T4', 'Full IoT', 'ระบบ IoT เต็ม', 'ระบบ IoT ครบวงจร', 't1'),
    },
  },
];

// node เริ่มต้นที่ถูกเลือกในแต่ละ topic (ตัวที่ available ตัวแรก, ไม่งั้น t2)
export function defaultNodeId(topic) {
  const found = Object.keys(topic.nodes).find(id => topic.nodes[id].status === 'available');
  return found ?? 't2';
}

// ใช้เป็น fallback เผื่อเข้าเกมโดยไม่ได้ส่ง lesson มา
export const FALLBACK_LESSON = TOPICS[1].nodes.t2;
