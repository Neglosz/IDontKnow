// ============================================================================
//  paste ทับ topic 'code' ตัวเดิมใน TOPICS[]  (ของที่สแกน: จอยคอนโทรลเลอร์ไร้สาย)
//  ทุก node = dialogue(สอน) → มอนสเตอร์อ่อน → บอส(boss:true) ; ใช้แค่ 6 engine
//  สอน "โค้ด" ด้วย engine จริง: sequence=เรียงโค้ด, sort=แยกชนิด, select=เลือกวิธี,
//  wire=จับคู่ความหมาย, diagnose=หาบั๊ก, tune=ปรับค่า (deadzone/PWM/debounce)
// ============================================================================
export default {
  key: 'code', th: 'เขียนโค้ดควบคุม',
  quest: 'เขียนเฟิร์มแวร์จอยไร้สาย ตั้งแต่ตัวแปร–เงื่อนไข–อ่านอนาล็อก–กันดริฟต์–สั่งมอเตอร์ PWM จนประกอบ loop ครบ',
  nodes: [

    // ── tier 0 (ราก) ───────────────────────────────────────────────────────
    { id: 'variables', en: 'Variables', th: 'ตัวแปร', fullTh: 'รู้จักตัวแปรและชนิดข้อมูล',
      desc: 'เก็บค่าจากจอยลงตัวแปรให้ถูกชนิด',
      teaches: ['variables'], requires: [],
      pretest: { q: 'ตัวแปร (variable) ในโปรแกรมใช้ทำอะไร?',
        choices: ['เก็บค่าไว้ใช้งานต่อ', 'ปิดเครื่อง', 'ต่อสายไฟ'], answer: 0 },
      chapter: 'CHAPTER 0', gameTitle: 'เก็บค่าให้ถูกชนิด', maxReward: 8,
      intro: 'จอยต้องจำค่าหลายอย่าง: ค่าสติ๊ก สถานะปุ่ม ความแรงสั่น — เก็บให้ถูกชนิดก่อน',
      steps: [
        { kind: 'dialogue', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
          text: '"ตัวแปร" คือกล่องตั้งชื่อไว้เก็บค่า เช่นในจอย:\n\n' +
            '• int stickX = ค่าอนาล็อกสติ๊ก (จำนวนเต็ม เช่น 0–4095)\n' +
            '• bool buttonA = ปุ่มถูกกดไหม (true/false)\n' +
            '• int vibration = ความแรงสั่น (0–100%)\n\n' +
            'เลือกชนิดให้ตรงกับค่า → ประหยัดหน่วยความจำและไม่ผิดพลาด' },

        { kind: 'sort', questId: 'var_sort', npc: 'สไลม์เขียว', emoji: '🟢',
          title: 'แยกค่าเข้าชนิดตัวแปร', brief: 'แตะค่าที่ต้องเก็บ แล้วแตะกล่องชนิดที่เหมาะ',
          bins: [
            { id: 'int',  label: 'จำนวนเต็ม (int)', icon: '🔢' },
            { id: 'bool', label: 'ตรรกะ (bool)', icon: '✅' },
          ],
          items: [
            { id: 'sx',   label: 'ค่าสติ๊กแกน X (0–4095)', icon: '🕹', bin: 'int' },
            { id: 'btn',  label: 'ปุ่ม A ถูกกด (จริง/เท็จ)', icon: '🅰', bin: 'bool' },
            { id: 'vib',  label: 'ความแรงสั่น (0–100)', icon: '📳', bin: 'int' },
            { id: 'conn', label: 'จอยเชื่อมต่อแล้ว (จริง/เท็จ)', icon: '📶', bin: 'bool' },
          ],
          success: ['แยกชนิดได้ครบ!'],
          error: ['ดูว่าค่าเป็นเลข หรือ จริง/เท็จ แล้วจัดใหม่'] },

        { kind: 'wire', questId: 'var_wire_boss', boss: true, npc: 'ออร์คตั้งชื่อตัวแปร', emoji: '👹',
          title: 'BOSS: ชื่อตัวแปร→ค่าที่เก็บ', brief: 'อ่านชื่อตัวแปรในโค้ดจอย แล้วจับคู่ว่ามันเก็บอะไร',
          left: [
            { id: 'sx',   label: 'int stickX', icon: '🕹' },
            { id: 'ba',   label: 'bool buttonA', icon: '🅰' },
            { id: 'vib',  label: 'int vibration', icon: '📳' },
            { id: 'conn', label: 'bool connected', icon: '📶' },
          ],
          right: [
            { id: 'm_stick', label: 'ค่าสติ๊กแกน X', icon: '🕹' },
            { id: 'm_btn',   label: 'ปุ่ม A กดอยู่ไหม', icon: '🅰' },
            { id: 'm_vib',   label: 'ความแรงสั่น', icon: '📳' },
            { id: 'm_conn',  label: 'เชื่อมต่ออยู่ไหม', icon: '📶' },
          ],
          pairs: [['sx', 'm_stick'], ['ba', 'm_btn'], ['vib', 'm_vib'], ['conn', 'm_conn']],
          traps: { 'sx->m_btn': 'name_misread', 'ba->m_stick': 'name_misread' },
          success: ['อ่านชื่อตัวแปรออกครบ!'],
          error: ['ชื่อบอกความหมาย: stickX=สติ๊ก, buttonA=ปุ่ม อย่าสลับกัน'] },
      ],
    },

    // ── tier 1 (แตกสองกิ่งจาก variables) ────────────────────────────────────
    { id: 'conditions', en: 'Conditions', th: 'เงื่อนไข', fullTh: 'การใช้เงื่อนไข if',
      desc: 'สั่งงานเฉพาะเมื่อเงื่อนไขเป็นจริง',
      teaches: ['conditions'], requires: ['variables'],
      pretest: { q: 'คำสั่ง if ใช้เพื่ออะไร?',
        choices: ['ทำงานซ้ำตลอดเวลา', 'ทำงานเฉพาะเมื่อเงื่อนไขเป็นจริง', 'เก็บค่าตัวแปร'], answer: 1 },
      chapter: 'CHAPTER 0', gameTitle: 'ตัดสินใจด้วย if', maxReward: 10,
      intro: 'จอยต้อง "สั่นเฉพาะตอนกดปุ่ม" — นี่คืองานของ if',
      steps: [
        { kind: 'dialogue', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
          text: 'คำสั่ง if ทำให้โปรแกรมตัดสินใจ — ทำเฉพาะเมื่อเงื่อนไขจริง:\n\n' +
            '   if (buttonA == true) { startVibration(); }\n\n' +
            'อ่านว่า "ถ้าปุ่ม A ถูกกด ให้เริ่มสั่น"\n\n' +
            'ระวัง == (เปรียบเทียบ) กับ = (กำหนดค่า) คนละความหมาย!' },

        { kind: 'codefill', questId: 'cond_fill', npc: 'ค้างคาวเงื่อนไข', emoji: '🦇',
          title: 'เติมเงื่อนไข if',
          prompt: 'อยากให้จอยสั่นเฉพาะตอนปุ่ม A ถูกกด — เติมตัวดำเนินการลงในช่องว่าง',
          before: 'if (buttonA', after: 'true) {\n  motor.start();\n}',
          options: [
            { id: 'eq', token: '==', correct: true },
            { id: 'assign', token: '=', mis: 'assign_vs_compare' },
            { id: 'not', token: '!=', mis: 'inverted_logic' },
          ],
          success: ['ถูก! == คือเปรียบเทียบ จอยสั่นเมื่อปุ่มถูกกดจริง'],
          error: ['ระวัง = (กำหนดค่า, จริงเสมอ) กับ == (เปรียบเทียบ) ส่วน != คือ "เมื่อไม่ได้กด"'] },

        { kind: 'wire', questId: 'cond_wire_boss', boss: true, npc: 'ออร์คเหตุการณ์', emoji: '👹',
          title: 'BOSS: เหตุการณ์→การกระทำ', brief: 'จับคู่ "เงื่อนไขที่เกิด" กับ "สิ่งที่โค้ดควรสั่ง" ให้ตรง',
          left: [
            { id: 'e_a',    label: 'ปุ่ม A ถูกกด', icon: '🅰' },
            { id: 'e_move', label: 'ดันสติ๊ก', icon: '🕹' },
            { id: 'e_hit',  label: 'ตัวละครโดนโจมตี', icon: '💥' },
            { id: 'e_low',  label: 'แบตต่ำ', icon: '🔋' },
          ],
          right: [
            { id: 'a_a',    label: 'ส่งสัญญาณปุ่ม A', icon: '📡' },
            { id: 'a_move', label: 'ส่งค่าทิศทางสติ๊ก', icon: '🧭' },
            { id: 'a_vib',  label: 'สั่งมอเตอร์สั่น', icon: '📳' },
            { id: 'a_warn', label: 'แจ้งเตือนแบตต่ำ', icon: '⚠' },
          ],
          pairs: [['e_a', 'a_a'], ['e_move', 'a_move'], ['e_hit', 'a_vib'], ['e_low', 'a_warn']],
          traps: { 'e_a->a_vib': 'event_action_swap', 'e_hit->a_a': 'event_action_swap' },
          success: ['จับคู่เงื่อนไขกับการกระทำครบถูกต้อง!'],
          error: ['ดูให้ตรง: โดนโจมตี→สั่น, กดปุ่ม→ส่งปุ่ม อย่าสลับ'] },
      ],
    },

    { id: 'read_analog', en: 'Read Analog', th: 'อ่านอนาล็อก', fullTh: 'อ่านค่าอนาล็อกสติ๊ก (ADC)',
      desc: 'อ่านค่าตัวเลขจากสติ๊กด้วย analogRead',
      teaches: ['read_analog'], requires: ['variables'],
      pretest: { q: 'อ่านอนาล็อกสติ๊กด้วย analogRead ได้ค่าอะไร?',
        choices: ['ตัวเลขช่วงหนึ่ง (เช่น 0–4095) ตามตำแหน่ง', 'จริง/เท็จ', 'ชื่อปุ่ม'], answer: 0 },
      chapter: 'CHAPTER 0', gameTitle: 'อ่านค่าสติ๊ก', maxReward: 10,
      intro: 'สติ๊กไม่ได้บอกแค่ "กด/ไม่กด" แต่บอก "ดันไปแค่ไหน" เป็นตัวเลข',
      steps: [
        { kind: 'dialogue', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
          text: 'ปุ่มให้ค่าแค่ จริง/เท็จ แต่อนาล็อกสติ๊กให้ "ตัวเลขต่อเนื่อง"\n\n' +
            '   int stickX = analogRead(PIN_X);\n\n' +
            '• ค่าอยู่ในช่วง เช่น 0–4095\n' +
            '• ดันสุดทางหนึ่ง = 0, อีกทาง = 4095, ตรงกลาง = ~2048\n\n' +
            'เอาตัวเลขนี้ไปบอกทิศทาง/ความแรงในเกมได้' },

        { kind: 'codefill', questId: 'ra_fill', npc: 'โครงกระดูกอ่านค่า', emoji: '💀',
          title: 'อ่านค่าอนาล็อก',
          prompt: 'ดันสติ๊กไปขวาสุดแล้วอ่านค่า — เติมค่าที่ analogRead ควรคืนมา',
          before: 'int x = analogRead(stickX);\n// ดันขวาสุด → x ==', after: '',
          options: [
            { id: 'max', token: '4095', correct: true },
            { id: 'bool', token: 'true', mis: 'analog_as_digital' },
            { id: 'zero', token: '0', mis: 'misread_range' },
          ],
          success: ['ถูก! ขวาสุด = ค่าสูงสุดของช่วง (4095)'],
          error: ['อนาล็อกให้ตัวเลขช่วงกว้าง (0–4095) ตามตำแหน่ง ไม่ใช่ true/false หรือ 0 เสมอ'] },

        { kind: 'wire', questId: 'ra_wire_boss', boss: true, npc: 'ออร์คค่าสติ๊ก', emoji: '👹',
          title: 'BOSS: ค่าตัวเลข→ตำแหน่งสติ๊ก', brief: 'จับคู่ค่าที่ analogRead คืนมา กับตำแหน่งจริงของสติ๊ก',
          left: [
            { id: 'v0',   label: 'ค่า 0', icon: '0️⃣' },
            { id: 'vmid', label: 'ค่า ~2048', icon: '🔵' },
            { id: 'vmax', label: 'ค่า 4095', icon: '🔺' },
          ],
          right: [
            { id: 'p_min', label: 'สุดทางหนึ่ง', icon: '⬅' },
            { id: 'p_mid', label: 'อยู่ตรงกลาง', icon: '⏺' },
            { id: 'p_max', label: 'สุดอีกทาง', icon: '➡' },
          ],
          pairs: [['v0', 'p_min'], ['vmid', 'p_mid'], ['vmax', 'p_max']],
          traps: { 'vmid->p_min': 'center_misread', 'vmid->p_max': 'center_misread' },
          success: ['จับคู่ครบ! ค่ากลาง = สติ๊กอยู่กลาง'],
          error: ['ค่าน้อย=สุดทางหนึ่ง, กลาง=ตรงกลาง, มาก=สุดอีกทาง'] },
      ],
    },

    // ── tier 2 ──────────────────────────────────────────────────────────────
    { id: 'read_button', en: 'Read Button', th: 'อ่านปุ่ม', fullTh: 'อ่านปุ่มและกันปุ่มเด้ง',
      desc: 'อ่านปุ่มดิจิทัล และกรองสัญญาณเด้ง (debounce)',
      teaches: ['read_button'], requires: ['conditions'],
      pretest: { q: 'ปุ่มกดทีเดียวแต่โปรแกรมนับหลายครั้ง แก้ด้วยอะไร?',
        choices: ['เพิ่มไฟเลี้ยง', 'ใส่ debounce (กรองสัญญาณเด้ง)', 'เปลี่ยนปุ่มใหม่'], answer: 1 },
      chapter: 'CHAPTER 1', gameTitle: 'อ่านปุ่มให้นิ่ง DUNGEON', maxReward: 10,
      intro: 'กดปุ่มทีเดียวกลายเป็นยิงรัว? นั่นคือปุ่มเด้ง',
      steps: [
        { kind: 'dialogue', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
          text: 'อ่านปุ่มด้วย digitalRead — ปุ่มต่อแบบ pull-up จะอ่านได้ LOW ตอนกด\n\n' +
            'แต่หน้าสัมผัสปุ่มตอนกดจะ "เด้ง" สั้น ๆ ทำให้อ่านได้ กด-ปล่อย-กด หลายครั้ง\n\n' +
            'วิธีแก้ = debounce: เจอการเปลี่ยนแล้วรอสักนิด (~20ms) ค่อยยืนยันค่า\n\n' +
            'จอยที่ดีต้องกดทีเดียวนับครั้งเดียว' },

        { kind: 'codefill', questId: 'rb_fill', npc: 'ค้างคาวปุ่มเด้ง', emoji: '🦇',
          title: 'อุดปุ่มเด้ง',
          prompt: 'กดทีเดียวแต่ระบบนับสองครั้ง — เติมวิธีแก้ลงในโค้ดให้กดทีเดียวนับครั้งเดียว',
          before: '// ปุ่มเด้ง: กดทีเดียวนับครั้งเดียว\nbtn =', after: '(rawRead);',
          options: [
            { id: 'deb', token: 'debounce', correct: true },
            { id: 'fast', token: 'readFaster', mis: 'faster_worse' },
            { id: 'power', token: 'morePower', mis: 'power_not_bounce' },
          ],
          success: ['ใช่! debounce กรองช่วงเด้งออก กดทีเดียวนับครั้งเดียว'],
          error: ['สัญญาณเด้งเป็นช่วงสั้น ต้องกรอง/หน่วง (debounce) ไม่ใช่อ่านถี่ขึ้นหรือเพิ่มไฟ'] },

        { kind: 'sequence', questId: 'rb_seq_boss', boss: true, npc: 'ออร์คปุ่มรัว', emoji: '👹',
          title: 'BOSS: เรียงขั้นตอนอ่านปุ่ม', brief: 'เรียงลำดับการอ่านปุ่มแบบกันเด้งให้ถูก',
          items: [
            { id: 'rd',  label: 'อ่านค่าดิบ digitalRead', art: 'read' },
            { id: 'chg', label: 'ถ้าค่าเปลี่ยน เริ่มจับเวลา', art: 'timer' },
            { id: 'wait', label: 'รอ ~20ms ให้ค่านิ่ง', art: 'wait' },
            { id: 'set', label: 'ยืนยัน/อัปเดตสถานะปุ่ม', art: 'test' },
          ],
          correctOrder: ['rd', 'chg', 'wait', 'set'],
          success: ['ลำดับถูก! อ่าน→จับเวลา→รอ→ยืนยัน'],
          error: ['ต้องรอให้ผ่านช่วงเด้งก่อน ค่อยยืนยันสถานะ'] },
      ],
    },

    { id: 'deadzone', en: 'Deadzone', th: 'กันสติ๊กดริฟต์', fullTh: 'ใส่ deadzone กันค่าสติ๊กดริฟต์',
      desc: 'ถ้าสติ๊กใกล้กลางให้ถือว่าไม่ขยับ',
      teaches: ['deadzone'], requires: ['read_analog'],
      pretest: { q: 'อนาล็อกสติ๊กวางเฉย ๆ แต่ค่ายังขยับนิด ๆ (ดริฟต์) แก้ยังไง?',
        choices: ['ใส่ deadzone: ใกล้กลางให้ถือว่า 0', 'เพิ่มไฟเลี้ยง', 'อ่านให้ถี่ขึ้น'], answer: 0 },
      chapter: 'CHAPTER 1', gameTitle: 'กันสติ๊กดริฟต์ DUNGEON', maxReward: 12,
      intro: 'วางสติ๊กเฉย ๆ แต่ตัวละครเดินเอง? นั่นคือดริฟต์ ต้องมี deadzone',
      steps: [
        { kind: 'dialogue', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
          text: 'อนาล็อกสติ๊กตรงกลางไม่ได้อ่านได้ ~2048 เป๊ะเสมอ มันแกว่งนิด ๆ (ดริฟต์)\n\n' +
            'ถ้าไม่กรอง ตัวละครจะเดินเองทั้งที่ไม่ได้ดัน\n\n' +
            'วิธีแก้ = deadzone: กำหนด "โซนตาย" รอบจุดกลาง ถ้าค่าใกล้กลางในระยะนี้ ให้ถือว่า = 0\n\n' +
            'เล็กไป → ยังดริฟต์ ; ใหญ่ไป → ต้องดันเยอะกว่าเกมจะตอบสนอง' },

        { kind: 'codefill', questId: 'dz_fill', npc: 'โครงกระดูกจูนสติ๊ก', emoji: '💀',
          title: 'เติม deadzone',
          prompt: 'สติ๊กวางเฉย ๆ แต่ค่าอ่านได้ 2060 ตัวละครเดินเอง — เติมโค้ดในโซนตายให้ถือว่าไม่ขยับ',
          before: '// ใกล้กลาง = ไม่ขยับ\nif (abs(x - 2048) < DEADZONE) x =', after: ';',
          options: [
            { id: 'zero', token: '0', correct: true },
            { id: 'keep', token: 'x', mis: 'ignore_drift' },
            { id: 'force', token: '2048', mis: 'force_center' },
          ],
          success: ['ถูก! ในโซนตายตัดค่าเป็น 0 ตัวละครจึงนิ่งเมื่อไม่ได้ดัน'],
          error: ['ในโซนตายต้องให้ค่าเป็น 0 ไม่ใช่ปล่อยค่าดริฟต์ (x) หรือบังคับ 2048'] },

        { kind: 'tune', questId: 'dz_tune_boss', boss: true, npc: 'ออร์คสติ๊กดริฟต์', emoji: '👹',
          title: 'BOSS: ตั้งระยะ deadzone',
          unit: 'หน่วย', min: 0, max: 500, step: 10, target: 100, tolerance: 30,
          prompt: 'ตั้งระยะ deadzone รอบจุดกลาง — เล็กไปสติ๊กยังดริฟต์ ใหญ่ไปต้องดันเยอะกว่าจะติด',
          success: ['พอดี! deadzone ~100 หน่วย ตัดดริฟต์ได้โดยยังคุมง่าย'],
          error: ['ยังไม่พอดี: แคบไปยังดริฟต์ กว้างไปสติ๊กตอบสนองช้า ลองใกล้ ~100'] },
      ],
    },

    // ── tier 3 (แตกสองกิ่ง) ─────────────────────────────────────────────────
    { id: 'control_logic', en: 'Control Logic', th: 'ลอจิกควบคุม', fullTh: 'เขียนลอจิก อ่าน→เช็ค→สั่ง',
      desc: 'รวมอ่านสติ๊ก+ปุ่ม เป็นลำดับที่ถูก',
      teaches: ['control_logic'], requires: ['read_button', 'deadzone'],
      pretest: { q: 'ลำดับลอจิกควบคุมที่ถูกต้องคือ?',
        choices: ['สั่งงาน→อ่านค่า→เช็ค', 'อ่านค่า→เช็คเงื่อนไข→สั่งงาน', 'เช็ค→สั่งงาน→อ่านค่า'], answer: 1 },
      chapter: 'CHAPTER 2', gameTitle: 'ลอจิกควบคุม DUNGEON', maxReward: 12,
      intro: 'รวมความรู้อ่านปุ่ม + อ่านสติ๊ก(ผ่าน deadzone) มาเรียงเป็นลอจิกที่ทำงานจริง',
      steps: [
        { kind: 'dialogue', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
          text: 'หัวใจของการคุมคือลำดับ:\n\n' +
            '   อ่านค่า → ตรวจเงื่อนไข → สั่งงาน\n\n' +
            'เช่น: อ่านสติ๊ก (ผ่าน deadzone) + อ่านปุ่ม → ตัดสินใจ → เตรียมส่ง\n\n' +
            'สลับลำดับไม่ได้ — จะตัดสินใจก่อนอ่านค่าไม่ได้ เพราะยังไม่มีค่าให้ตัดสิน' },

        { kind: 'sequence', questId: 'cl_seq', npc: 'ผีน้อยเรียงโค้ด', emoji: '👻',
          title: 'เรียงลอจิกพื้นฐาน', brief: 'เรียง 3 ขั้นของการคุมให้ถูก',
          items: [
            { id: 'rd',  label: 'อ่านค่า (read)', art: 'read' },
            { id: 'ck',  label: 'เช็คเงื่อนไข (if)', art: 'logic' },
            { id: 'act', label: 'สั่งงาน (send/act)', art: 'send' },
          ],
          correctOrder: ['rd', 'ck', 'act'],
          success: ['ลำดับถูก! อ่าน→เช็ค→สั่ง'],
          error: ['ต้องอ่านค่ามาก่อน ถึงจะเอาไปเช็คเงื่อนไขได้'] },

        { kind: 'sequence', questId: 'cl_seq_boss', boss: true, npc: 'ออร์คลอจิกซ้อน', emoji: '👹',
          title: 'BOSS: ลอจิกรวมสติ๊ก+ปุ่ม', brief: 'เรียงลอจิก 1 รอบของจอย ที่อ่านทั้งสติ๊กและปุ่ม',
          items: [
            { id: 'rstick', label: 'อ่านสติ๊ก (ผ่าน deadzone)', art: 'stick' },
            { id: 'rbtn',   label: 'อ่านสถานะปุ่ม (ผ่าน debounce)', art: 'button' },
            { id: 'decide', label: 'ตัดสินใจจากค่าที่อ่าน', art: 'logic' },
            { id: 'prep',   label: 'เตรียมข้อมูลส่ง', art: 'packet' },
            { id: 'send',   label: 'ส่งรายงานไร้สาย', art: 'send' },
          ],
          correctOrder: ['rstick', 'rbtn', 'decide', 'prep', 'send'],
          success: ['เยี่ยม! อ่านให้ครบก่อน ตัดสินใจ แล้วค่อยส่ง'],
          error: ['อ่านค่าทั้งหมดก่อน → ตัดสินใจ → ส่งเป็นขั้นสุดท้าย'] },
      ],
    },

    { id: 'pwm_motor', en: 'PWM Vibration', th: 'สั่งมอเตอร์ PWM', fullTh: 'สั่งความแรงสั่นด้วย PWM',
      desc: 'ปรับความแรงมอเตอร์ด้วย duty cycle ของ PWM',
      teaches: ['pwm_output'], requires: ['read_button'],
      pretest: { q: 'จะสั่งให้มอเตอร์สั่น "แรงครึ่งเดียว" ควรใช้อะไร?',
        choices: ['PWM ปรับ duty cycle ~50%', 'เปิด/ปิดอย่างเดียว', 'เพิ่มแรงดันเป็นสองเท่า'], answer: 0 },
      chapter: 'CHAPTER 2', gameTitle: 'สั่งมอเตอร์ PWM DUNGEON', maxReward: 14,
      intro: 'มอเตอร์ไม่ได้มีแค่ "สั่น/ไม่สั่น" — สั่งให้สั่นแรงแค่ไหนก็ได้ด้วย PWM',
      steps: [
        { kind: 'dialogue', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
          text: 'PWM (Pulse Width Modulation) = วิธีสั่ง "ความแรง" ให้มอเตอร์\n\n' +
            'มันเปิด-ปิดไฟเร็วมาก แล้วปรับสัดส่วนเวลาเปิด (duty cycle):\n' +
            '• duty 0% = หยุด\n' +
            '• duty 50% = สั่นปานกลาง\n' +
            '• duty 100% = สั่นแรงสุด\n\n' +
            'โค้ดสั่งที่ขาซึ่งต่อกับทรานซิสเตอร์ขับมอเตอร์ (ไม่ได้ขับมอเตอร์ตรง ๆ)' },

        { kind: 'codefill', questId: 'pm_fill', npc: 'ค้างคาว PWM', emoji: '🦇',
          title: 'สั่งความแรงสั่น',
          prompt: 'อยากให้มอเตอร์สั่น "เบา ๆ" ตอนเดินในเกม — เติมค่า duty ที่สั่งมอเตอร์ (0–255)',
          before: '// สั่นเบา ๆ\nanalogWrite(motorPin,', after: ');',
          options: [
            { id: 'pwm', token: '70', correct: true },
            { id: 'onoff', token: '255', mis: 'onoff_only' },
            { id: 'off', token: '0', mis: 'lower_vcc' },
          ],
          success: ['ใช่! duty ต่ำ (~70/255) = สั่นเบา'],
          error: ['ความแรงคุมด้วยค่า duty (0–255): ต่ำ=เบา, 255=แรงสุด, 0=ไม่สั่น'] },

        { kind: 'tune', questId: 'pm_tune_boss', boss: true, npc: 'ออร์คมอเตอร์สั่น', emoji: '👹',
          title: 'BOSS: ตั้ง duty cycle',
          unit: '%', min: 0, max: 100, step: 5, target: 70, tolerance: 10,
          prompt: 'ตั้ง duty cycle ของ PWM ให้มอเตอร์สั่น "แรงพอรู้สึกชัดแต่ไม่กระชาก" ~70%',
          success: ['พอดี ~70%! สั่นชัดกำลังดี'],
          error: ['ยังไม่พอดี: ต่ำไปสั่นเบาไม่รู้สึก สูงไปกระชากแรง ลองใกล้ ~70%'] },
      ],
    },

    // ── tier 4 (บอสใหญ่สุดของ topic) ────────────────────────────────────────
    { id: 'firmware', en: 'Full Firmware', th: 'ประกอบเฟิร์มแวร์', fullTh: 'ประกอบเฟิร์มแวร์จอยทั้งโปรแกรม',
      desc: 'รวม setup + loop เป็นโปรแกรมจอยที่ใช้งานได้',
      teaches: ['firmware'], requires: ['control_logic', 'pwm_output'],
      pretest: { q: 'ใน loop ของจอย ควรทำสิ่งใดก่อน "ส่งสัญญาณ"?',
        choices: ['อ่านสติ๊ก/ปุ่มให้ครบก่อน', 'ส่งก่อนแล้วค่อยอ่าน', 'ไม่ต้องอ่านเลย'], answer: 0 },
      chapter: 'CHAPTER 3', gameTitle: 'ประกอบเฟิร์มแวร์ FINAL BOSS', maxReward: 20,
      intro: 'ด่านรวมทุกความรู้! ประกอบโปรแกรมจอยทั้ง setup และ loop ให้ทำงานครบ',
      steps: [
        { kind: 'dialogue', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
          text: 'ถึงด่านสุดท้าย — ประกอบเฟิร์มแวร์จอยทั้งตัว\n\n' +
            'โครงที่ถูก:\n' +
            '• setup() ครั้งเดียว: ตั้งขาปุ่ม/ADC → ตั้งช่อง PWM มอเตอร์ → เริ่ม RF\n' +
            '• loop() วนซ้ำ: อ่านสติ๊ก(deadzone) → อ่านปุ่ม(debounce) → ตัดสินใจ+สั่งมอเตอร์ → ส่ง\n\n' +
            'ระวังบั๊กยอดฮิต: ส่งรายงานก่อนอ่านค่า จะส่งแต่ค่าเก่า/ศูนย์' },

        { kind: 'diagnose', questId: 'fw_diag', npc: 'โครงกระดูกดีบัก', emoji: '💀',
          title: 'สติ๊กไม่ขยับในเกม', brief: 'จอยเชื่อมต่อแล้วแต่ตัวละครไม่เดิน แตะตรวจโค้ดหาบั๊ก',
          probes: [
            { id: 'rd',  label: 'loop มีอ่าน stickX ไหม', reading: 'ไม่มี (ลืมอ่าน)', ok: false, fault: true },
            { id: 'rf',  label: 'การเชื่อมต่อไร้สาย', reading: 'เชื่อมแล้ว', ok: true },
            { id: 'snd', label: 'ค่าที่ส่งออก', reading: 'ส่งแต่ค่ากลาง (ไม่เปลี่ยน)', ok: false },
          ],
          faults: [
            { id: 'no_read', label: 'ลืมอ่านค่าสติ๊กก่อนส่ง (ส่งแต่ค่าเดิม)', correct: true },
            { id: 'rf_bad',  label: 'RF ยังไม่เชื่อม', mis: 'misread_rf' },
            { id: 'hw',      label: 'สติ๊กพัง', mis: 'blame_part' },
          ],
          success: ['ถูก! RF เชื่อมแล้วแต่ลืมอ่าน stickX เลยส่งแต่ค่ากลาง — เพิ่มการอ่านก่อนส่ง'],
          error: ['RF ปกติ ค่าที่ส่งไม่เปลี่ยน แปลว่าไม่ได้อ่านค่ามาก่อนส่ง'] },

        { kind: 'sequence', questId: 'fw_seq_boss', boss: true, npc: 'จอมมารเฟิร์มแวร์', emoji: '🐲',
          title: 'FINAL BOSS: ประกอบทั้งโปรแกรม', brief: 'เรียงทั้ง setup และ loop ให้ครบถูกลำดับ ผิดขั้นเดียวจอยก็เพี้ยน',
          items: [
            { id: 'su_pin', label: 'setup: ตั้งขาปุ่ม/ADC', art: 'config' },
            { id: 'su_pwm', label: 'setup: ตั้งช่อง PWM มอเตอร์', art: 'motor' },
            { id: 'su_rf',  label: 'setup: เริ่มการเชื่อมต่อไร้สาย', art: 'wireless' },
            { id: 'lp_stick', label: 'loop: อ่านสติ๊ก (ผ่าน deadzone)', art: 'stick' },
            { id: 'lp_btn',   label: 'loop: อ่านปุ่ม (ผ่าน debounce)', art: 'button' },
            { id: 'lp_act',   label: 'loop: ตัดสินใจ + สั่งมอเตอร์ (PWM)', art: 'logic' },
            { id: 'lp_send',  label: 'loop: ส่งรายงานไร้สาย', art: 'send' },
          ],
          correctOrder: ['su_pin', 'su_pwm', 'su_rf', 'lp_stick', 'lp_btn', 'lp_act', 'lp_send'],
          success: ['สำเร็จ! setup ครบ แล้ววน loop: อ่านสติ๊ก→อ่านปุ่ม→สั่งมอเตอร์→ส่ง จอยพร้อมเล่น!'],
          error: ['setup (ขา→PWM→RF) ต้องมาก่อน loop เสมอ และใน loop ต้องอ่านก่อนส่ง'] },
      ],
    },

  ],
}
