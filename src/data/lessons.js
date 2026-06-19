// ============================================================================
// แหล่งข้อมูลบทเรียน "ชุดเดียว" ของเกมทั้งหมด  (โมเดล: knowledge DAG)
// ----------------------------------------------------------------------------
// เพิ่มบทเรียนใหม่ = เพิ่ม object ใน nodes[] ของ topic ไม่ต้องแตะโค้ดเกม
// จำนวน node และจำนวน "tier" ไม่จำกัด — tier คำนวณจากกราฟ (ดู computeTiers)
//
// โครงสร้าง:
//   TOPIC (หัวข้อ — แท็บใน SkillTree)
//     └─ nodes: [ ... ]   ← array อิสระ ลึก/กว้างเท่าไหร่ก็ได้
//
// node แต่ละตัว:
//   id        : string ไม่ซ้ำ (kebab-case)
//   en, th    : ชื่อสั้นบนปุ่ม | fullTh, desc : ชื่อ/คำอธิบายในแผง
//   teaches[] : concept ที่ node นี้ "สอน" (เป็นปลายทางของเส้นในกราฟ)
//   requires[]: concept ที่ "ต้องรู้ก่อน" (เป็น prereq — อ้าง teaches ของ node อื่น)
//   pretest   : { q, choices:[...], answer:<index> } ข้อสอบ calibration — ตอบถูก = ข้าม node ได้
//   steps[]   : บทเรียนเต็ม — **ทุก node ควรมี** (จะรู้หรือไม่ ค่อยตัดสินด้วย calibration)
//
// ❗ ไม่มี assumeKnown แล้ว: data ไม่ตัดสินแทนผู้เล่นว่า "รู้อะไรแล้ว"
//    การข้ามทำผ่าน calibration ตอน runtime (ดู masteryFromCalibration)
//
// step.kind:
//   'dialogue'  → ผู้เชี่ยวชาญสอน (กดรับทราบ)
//   'sim'       → sim:'tune' | 'sequence' | 'select' | 'diagnose'  (hardware)
//   'blockcode' → ลากบล็อกโค้ด (software)
//   'boss'      → puzzle:'circuit' (ต่อวงจร)
//
// status (done/available/locked) ไม่เก็บใน data แล้ว — computeStatus() คำนวณ
// จาก "mastery ของผู้เล่นแต่ละคน" → นี่คือสิ่งที่ทำให้ skill tree เป็น dynamic
// และ "ข้ามไปอันที่เหมาะกับเรา" ได้ (frontier = node ที่ prereq ครบแต่ยังไม่รู้)

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

// helper สร้าง node ที่ยังไม่เปิด (ไม่มี steps) — มีไว้ให้กราฟครบเส้น
const stub = (id, en, th, fullTh, desc, teaches, requires) => ({
  id, en, th, fullTh, desc, teaches, requires,
});

// ============================================================================
export const TOPICS = [
  // ── 1) การต่อวงจร ─────────────────────────────────────────────────────────
  {
    key: 'circuit', th: 'การต่อวงจร',
    quest: 'เรียนรู้ขั้นตอนการต่อวงจรเซนเซอร์',
    nodes: [
      { id: 'parts', en: 'Basic Parts', th: 'รู้จักอุปกรณ์', fullTh: 'รู้จักอุปกรณ์พื้นฐาน',
        desc: 'แยกแยะเซนเซอร์และบอร์ดควบคุม',
        teaches: ['basic_parts'], requires: [],
        pretest: { q: 'อุปกรณ์ใดทำหน้าที่ "ประมวลผล" ในระบบ IoT?',
          choices: ['เซนเซอร์', 'ESP32', 'สายไฟ'], answer: 1 },
        chapter: 'CHAPTER 0', gameTitle: 'Know Your Parts', maxReward: 4,
        intro: 'รู้จักอุปกรณ์พื้นฐานก่อนลงมือต่อ',
        steps: [
          { kind: 'dialogue', npc: 'Professor', emoji: '🧑‍🏫',
            text: 'ระบบ IoT มีอุปกรณ์หลัก 3 กลุ่ม:\n\n' +
              '• บอร์ดควบคุม (เช่น ESP32) = สมองที่ประมวลผล\n' +
              '• เซนเซอร์ = ตัวรับรู้ เช่น วัดอุณหภูมิ / แสง / ความชื้น\n' +
              '• สายไฟ / เบรดบอร์ด = ทางเชื่อมให้ไฟและสัญญาณวิ่งถึงกัน\n\n' +
              'แยกสามอย่างนี้ออกให้ได้ก่อน เดี๋ยวต่อวงจรจะไม่งง' },
        ] },

      { id: 'pinout', en: 'Pin Mapping', th: 'อ่านขาสัญญาณ', fullTh: 'อ่านขาสัญญาณ (Pinout)',
        desc: 'เข้าใจขา VCC / GND / SIG',
        teaches: ['pin_mapping'], requires: ['basic_parts'],
        pretest: { q: 'ขาใดคือ "ไฟเลี้ยง" ของเซนเซอร์?',
          choices: ['GND', 'SIG', 'VCC'], answer: 2 },
        chapter: 'CHAPTER 0', gameTitle: 'Read the Pins', maxReward: 4,
        intro: 'รู้ว่าขาไหนคืออะไร ก่อนต่อสาย',
        steps: [
          { kind: 'dialogue', npc: 'Professor', emoji: '🧑‍🏫',
            text: 'เซนเซอร์ส่วนใหญ่มี 3 ขาหลัก:\n\n' +
              '• VCC = รับไฟเลี้ยง\n' +
              '• GND = ต่อกราวด์ (0V)\n' +
              '• SIG (บางตัวเขียน OUT/DATA) = ส่งค่าที่วัดได้ออกมา\n\n' +
              'ดูชื่อขาจากตัวอักษรบนบอร์ดหรือ datasheet อย่าเดา เพราะต่อผิดขาอาจพังได้' },
        ] },

      { id: 'wiring',
        en: 'Wiring', th: 'ต่อสายวงจร', fullTh: 'ต่อสายวงจรเซนเซอร์',
        desc: 'ต่อสายไฟเลี้ยงและสัญญาณให้ถูกขั้ว',
        teaches: ['wiring'], requires: ['pin_mapping'],
        pretest: { q: 'ต่อ VCC สลับกับ GND จะเกิดอะไร?',
          choices: ['ทำงานปกติ', 'ลัดวงจร อุปกรณ์ไหม้', 'อ่านค่าช้าลง'], answer: 1 },
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

      stub('multi', 'Multi Sensor', 'หลายเซนเซอร์', 'ต่อหลายเซนเซอร์พร้อมกัน',
        'จัดการหลายเซนเซอร์บนบอร์ดเดียว', ['multi_sensor'], ['wiring']),
      stub('noise', 'Noise Filter', 'กรองสัญญาณ', 'จัดการสัญญาณรบกวน',
        'ลด noise ในสายสัญญาณ', ['noise_filter'], ['wiring']),
      stub('rig', 'Full Rig', 'ต่อระบบเต็ม', 'ต่อระบบครบวงจร',
        'ประกอบระบบจริงครบชุด', ['full_rig'], ['multi_sensor', 'noise_filter']),
    ],
  },

  // ── 2) ออกแบบบอร์ด ────────────────────────────────────────────────────────
  {
    key: 'board', th: 'ออกแบบบอร์ด',
    quest: 'เรียนรู้ขั้นตอนการออกแบบบอร์ด',
    nodes: [
      { id: 'design', en: 'Basic Design', th: 'พื้นฐานออกแบบ', fullTh: 'พื้นฐานการออกแบบ',
        desc: 'ทำความเข้าใจหลักการออกแบบวงจรเบื้องต้น',
        teaches: ['design_principle'], requires: [],
        pretest: { q: 'ขั้นแรกของการออกแบบวงจรที่ดีคือ?',
          choices: ['ลงมือต่อสายทันที', 'เข้าใจโจทย์/สิ่งที่ต้องการก่อน', 'สั่งผลิตบอร์ดก่อน'], answer: 1 },
        chapter: 'CHAPTER 0', gameTitle: 'Design Basics', maxReward: 4,
        intro: 'หลักคิดก่อนเริ่มออกแบบวงจร',
        steps: [
          { kind: 'dialogue', npc: 'Professor', emoji: '🧑‍🏫',
            text: 'การออกแบบวงจรที่ดีไม่ได้เริ่มที่การต่อสาย แต่เริ่มที่ "เข้าใจโจทย์" ก่อน:\n\n' +
              '• ระบบนี้ต้องทำอะไร? วัดอะไร สั่งงานอะไร\n' +
              '• ต้องใช้อุปกรณ์อะไรบ้าง ใช้ไฟเท่าไร\n\n' +
              'รู้เป้าหมายชัดก่อน แล้วค่อยเลือกอุปกรณ์และวางวงจร จะแก้ทีหลังน้อยลงมาก' },
        ] },

      { id: 'schematic', en: 'Circuit Reading', th: 'อ่านวงจร', fullTh: 'อ่านวงจรไฟฟ้า',
        desc: 'อ่านและตีความสัญลักษณ์ในแผนผังวงจร',
        teaches: ['schematic'], requires: ['design_principle'],
        pretest: { q: 'สัญลักษณ์ในแผนผังวงจร (schematic) มีไว้เพื่อ?',
          choices: ['ตกแต่งให้สวย', 'แทนอุปกรณ์จริงและการต่อถึงกัน', 'บอกราคาอุปกรณ์'], answer: 1 },
        chapter: 'CHAPTER 0', gameTitle: 'Read the Schematic', maxReward: 4,
        intro: 'อ่านพิมพ์เขียวของวงจรให้ออก',
        steps: [
          { kind: 'dialogue', npc: 'Professor', emoji: '🧑‍🏫',
            text: '"แผนผังวงจร" (schematic) คือพิมพ์เขียวที่ใช้สัญลักษณ์แทนอุปกรณ์จริง\n\n' +
              '• เส้น = สายไฟที่ต่อถึงกัน\n' +
              '• สัญลักษณ์ = อุปกรณ์ เช่น ตัวต้านทาน แบตเตอรี่ LED\n\n' +
              'อ่าน schematic ออก = รู้ว่าอะไรต่อกับอะไร ก่อนจะลงมือต่อจริงบนบอร์ด' },
        ] },

      { id: 'pcb',
        en: 'PCB Layout', th: 'ออกแบบ PCB', fullTh: 'ออกแบบแผ่นวงจร PCB',
        desc: 'การแปลงพิมพ์เขียวให้กลายเป็นลายวงจรพิมพ์',
        teaches: ['pcb_layout', 'trace_width'], requires: ['schematic'],
        pretest: { q: 'กระแสมากขึ้น เส้นทองแดงควรเป็นอย่างไร?',
          choices: ['แคบลง', 'กว้างขึ้น', 'เท่าเดิม'], answer: 1 },
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
          BC_DOOR,
          { kind: 'sim', sim: 'diagnose', npc: 'Ghost', emoji: '👻',
            text: 'เซนเซอร์ไม่ทำงาน! วัดแต่ละขาแล้วหาให้เจอว่าพังตรงไหน' },
          { kind: 'boss', puzzle: 'circuit', npc: 'Orc แห่งความสับสน', emoji: '👹',
            text: 'กี่! ต่อวงจรเซนเซอร์ให้ถูกต้องสิ ไม่งั้นประตูไม่เปิดหรอก!' },
        ],
      },

      stub('power', 'Power Management', 'ระบบจ่ายไฟ', 'ระบบจ่ายไฟ',
        'ออกแบบการจ่ายไฟบนบอร์ด', ['power_mgmt'], ['pcb_layout']),
      stub('signal', 'Signal Integrity', 'การวัดกระแส', 'การวัดกระแส',
        'รักษาคุณภาพสัญญาณบนบอร์ด', ['signal_integrity'], ['pcb_layout']),
      stub('adv-design', 'Advanced Design', 'ออกแบบขั้นสูง', 'ออกแบบขั้นสูง',
        'ออกแบบบอร์ดซับซ้อน', ['adv_design'], ['power_mgmt', 'signal_integrity']),
    ],
  },

  // ── 3) เขียนโค้ดคุม ───────────────────────────────────────────────────────
  {
    key: 'code', th: 'เขียนโค้ดคุม',
    quest: 'เรียนรู้การเขียนโค้ดควบคุม ESP32',
    nodes: [
      { id: 'vars', en: 'Variables', th: 'ตัวแปร', fullTh: 'รู้จักตัวแปร',
        desc: 'เก็บค่าจากเซนเซอร์ลงตัวแปร',
        teaches: ['variables'], requires: [],
        pretest: { q: 'ตัวแปร (variable) ในโปรแกรมใช้ทำอะไร?',
          choices: ['เก็บค่าไว้ใช้งานต่อ', 'ปิดเครื่อง', 'ต่อสายไฟ'], answer: 0 },
        chapter: 'CHAPTER 0', gameTitle: 'Store the Value', maxReward: 4,
        intro: 'ที่เก็บค่าระหว่างที่โปรแกรมทำงาน',
        steps: [
          { kind: 'dialogue', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
            text: '"ตัวแปร" (variable) เหมือนกล่องที่ตั้งชื่อไว้สำหรับเก็บค่า\n\n' +
              'เช่น อ่านอุณหภูมิจากเซนเซอร์มาได้ ก็เก็บไว้ในตัวแปรชื่อ t:\n' +
              '   t = readDHT11();\n\n' +
              'พอเก็บไว้แล้ว เราก็เอา t ไปเช็คเงื่อนไขหรือคำนวณต่อได้เรื่อย ๆ ' +
              'โดยไม่ต้องอ่านค่าใหม่ทุกครั้ง' },
        ] },

      { id: 'cond', en: 'Conditions', th: 'เงื่อนไข', fullTh: 'การใช้เงื่อนไข if',
        desc: 'สั่งงานตามเงื่อนไขที่กำหนด',
        teaches: ['conditions'], requires: ['variables'],
        pretest: { q: 'คำสั่ง if ใช้เพื่ออะไร?',
          choices: ['ทำงานซ้ำตลอดเวลา', 'ทำงานเฉพาะเมื่อเงื่อนไขเป็นจริง', 'เก็บค่าตัวแปร'], answer: 1 },
        chapter: 'CHAPTER 0', gameTitle: 'Make a Decision', maxReward: 4,
        intro: 'ให้โปรแกรมตัดสินใจตามเงื่อนไข',
        steps: [
          { kind: 'dialogue', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
            text: 'คำสั่ง "if" ทำให้โปรแกรมตัดสินใจได้ — สั่งงานเฉพาะเมื่อเงื่อนไขเป็นจริง\n\n' +
              '   if (t > 35) { fanON(); }\n\n' +
              'อ่านว่า "ถ้าอุณหภูมิเกิน 35 องศา ให้เปิดพัดลม"\n\n' +
              'ถ้าเงื่อนไขไม่จริง โปรแกรมก็ข้ามคำสั่งในวงเล็บไป — นี่คือหัวใจของการสั่งงานอัตโนมัติ' },
        ] },

      { id: 'sensor-logic',
        en: 'Sensor Logic', th: 'ลอจิกเซนเซอร์', fullTh: 'เขียนลอจิกควบคุมเซนเซอร์',
        desc: 'อ่านค่า → ตรวจเงื่อนไข → สั่งงาน',
        teaches: ['sensor_logic'], requires: ['conditions'],
        pretest: { q: 'ลำดับที่ถูกต้องของลอจิกควบคุมคือ?',
          choices: ['สั่งงาน → อ่านค่า → เช็ค', 'อ่านค่า → เช็คเงื่อนไข → สั่งงาน', 'เช็ค → สั่งงาน → อ่านค่า'], answer: 1 },
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

      stub('loops', 'Loops', 'การวนซ้ำ', 'การใช้ลูป (loop)',
        'ทำงานซ้ำด้วยลูป', ['loops'], ['sensor_logic']),
      stub('funcs', 'Functions', 'ฟังก์ชัน', 'แยกโค้ดเป็นฟังก์ชัน',
        'จัดระเบียบโค้ดด้วยฟังก์ชัน', ['functions'], ['sensor_logic']),
      stub('fsm', 'State Machine', 'ระบบสถานะ', 'ออกแบบ State Machine',
        'จัดการสถานะของระบบ', ['state_machine'], ['loops', 'functions']),
    ],
  },

  // ── 4) เชื่อมต่อระบบ ──────────────────────────────────────────────────────
  {
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
  },
];

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
//   • ก่อน calibration → ว่าง (ผู้เล่นเริ่มจาก node ราก ทุก node มีบทเรียนรองรับ)
//   • หลัง calibration / เล่นจบ node → เติม concept เข้าไป → frontier ขยับ/ข้ามให้เอง
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

// ใช้เป็น fallback เผื่อเข้าเกมโดยไม่ได้ส่ง lesson มา
export const FALLBACK_LESSON = TOPICS[1].nodes.find(n => n.id === 'pcb');
