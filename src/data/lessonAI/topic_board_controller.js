// ============================================================================
//  paste ทับ topic 'board' ตัวเดิมใน TOPICS[]  (ของที่สแกน: จอยคอนโทรลเลอร์ไร้สาย)
//  ทุก node = dialogue(สอน) → มอนสเตอร์อ่อน → บอส(boss:true) ; ใช้แค่ 6 engine
//  เลี่ยงศัพท์เฉพาะ: ใช้ "ไฟเลี้ยง (VCC)" / "ฝั่งไฟบวก" แทน "ราง VCC"
// ============================================================================
export default {
  key: 'board', th: 'ออกแบบบอร์ด',
  quest: 'ออกแบบบอร์ดจอยไร้สาย ตั้งแต่เข้าใจโจทย์–อ่านวงจร–เลือกของ–วางผัง–เดินเส้น จนตรวจก่อนผลิต',
  nodes: [

    // ── tier 0 (ราก) ───────────────────────────────────────────────────────
    { id: 'requirement', en: 'Define the Goal', th: 'เข้าใจโจทย์', fullTh: 'เข้าใจโจทย์ก่อนออกแบบ',
      desc: 'รู้ว่าบอร์ดจอยต้องทำอะไร มีอะไรพิเศษ ก่อนลงมือ',
      teaches: ['requirement'], requires: [],
      pretest: { q: 'ขั้นแรกของการออกแบบบอร์ดที่ดีคือ?',
        choices: ['ลงมือวาดเส้นทันที', 'เข้าใจโจทย์/สิ่งที่บอร์ดต้องทำก่อน', 'สั่งผลิตบอร์ดก่อน'], answer: 1 },
      chapter: 'CHAPTER 0', gameTitle: 'ตั้งโจทย์บอร์ดจอย', maxReward: 6,
      intro: 'ก่อนจะวาดบอร์ด ต้องรู้ก่อนว่าบอร์ดจอยนี้ "ต้องทำอะไรได้บ้าง"',
      steps: [
        { kind: 'dialogue', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
          text: 'การออกแบบบอร์ดที่ดีเริ่มที่ "เข้าใจโจทย์":\n\n' +
            'บอร์ดจอยไร้สายต้อง:\n' +
            '• อ่านอนาล็อกสติ๊ก (ค่าแรงดันที่เปลี่ยนต่อเนื่อง — ไวต่อสัญญาณรบกวน)\n' +
            '• อ่านปุ่มหลายปุ่ม\n' +
            '• สั่งมอเตอร์สั่น (กินกระแสเยอะ มี noise)\n' +
            '• ส่งสัญญาณไร้สาย (RF) ออกไป\n' +
            '• ใช้แบต กินไฟประหยัด\n\n' +
            'จุดท้าทาย: มอเตอร์ที่ noise เยอะ ต้องไม่ไปกวนสัญญาณอนาล็อกที่ละเอียดอ่อน' },

        { kind: 'sort', questId: 'req_sort', npc: 'สไลม์เขียว', emoji: '🟢',
          title: 'อะไรคือหัวใจของบอร์ดจอย',
          brief: 'แตะแต่ละเรื่อง แล้วหย่อนลงกล่องว่า "สำคัญจริง" หรือ "ไม่เกี่ยว"',
          bins: [
            { id: 'key', label: 'สำคัญจริง', icon: '🎯' },
            { id: 'no', label: 'ไม่เกี่ยว', icon: '🚫' },
          ],
          items: [
            { id: 'sep', label: 'แยก noise มอเตอร์ออกจากอนาล็อก', art: 'shield', bin: 'key' },
            { id: 'route', label: 'จัดวาง + เดินเส้นให้ดี', art: 'trace', bin: 'key' },
            { id: 'big', label: 'ทำบอร์ดให้ใหญ่ที่สุด', art: 'ruler', bin: 'no' },
            { id: 'color', label: 'เลือกสีบอร์ดให้สวย', art: 'palette', bin: 'no' },
          ],
          success: ['ถูก! แยก noise มอเตอร์ + จัดวาง/เดินเส้น คือหัวใจ ส่วนขนาด/สีไม่ใช่ประเด็น'],
          error: ['คิดถึงสิ่งที่ "กวนกันได้" และการจัดวาง ไม่ใช่ขนาดหรือสีบอร์ด'] },

        { kind: 'sequence', questId: 'req_seq_boss', boss: true, npc: 'ออร์คผังงาน', emoji: '👹',
          title: 'BOSS: เรียงลำดับการออกแบบ', brief: 'เรียงขั้นตอนออกแบบบอร์ดให้ถูก ข้ามขั้นไม่ได้!',
          items: [
            { id: 'd_req',   label: 'เข้าใจโจทย์/สเปก', art: 'target' },
            { id: 'd_sch',   label: 'เขียน/อ่าน schematic', art: 'schematic' },
            { id: 'd_parts', label: 'เลือกอุปกรณ์', art: 'parts' },
            { id: 'd_place', label: 'วางตำแหน่งชิ้นส่วน', art: 'place' },
            { id: 'd_route', label: 'เดินเส้นทองแดง', art: 'trace' },
            { id: 'd_check', label: 'ตรวจ (DRC) ก่อนผลิต', art: 'test' },
          ],
          correctOrder: ['d_req', 'd_sch', 'd_parts', 'd_place', 'd_route', 'd_check'],
          success: ['ลำดับการออกแบบถูกต้อง! เข้าใจโจทย์ก่อน ตรวจเป็นขั้นสุดท้าย'],
          error: ['ต้องเข้าใจโจทย์ก่อนเสมอ และวางผังให้เสร็จก่อนค่อยเดินเส้น'] },
      ],
    },

    // ── tier 1 (แตกสองกิ่งจาก requirement) ──────────────────────────────────
    { id: 'schematic', en: 'Read Schematic', th: 'อ่านวงจร', fullTh: 'อ่านสัญลักษณ์ในวงจร',
      desc: 'แปลสัญลักษณ์ schematic เป็นของจริง/หน้าที่',
      teaches: ['schematic'], requires: ['requirement'],
      pretest: { q: 'สัญลักษณ์ใน schematic มีไว้เพื่ออะไร?',
        choices: ['ตกแต่งให้สวย', 'แทนอุปกรณ์จริงและการต่อถึงกัน', 'บอกราคาชิ้นส่วน'], answer: 1 },
      chapter: 'CHAPTER 0', gameTitle: 'อ่านพิมพ์เขียววงจร', maxReward: 8,
      intro: 'schematic คือพิมพ์เขียว อ่านออกก่อน ค่อยลงมือออกแบบจริง',
      steps: [
        { kind: 'dialogue', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
          text: '"schematic" ใช้สัญลักษณ์แทนอุปกรณ์จริง เส้น = สายที่ต่อถึงกัน\n\n' +
            'ในบอร์ดจอยจะเจอสัญลักษณ์เพิ่ม เช่น:\n' +
            '• ทรานซิสเตอร์ = ตัวขับมอเตอร์\n' +
            '• ไดโอด = กันไฟย้อนจากมอเตอร์\n' +
            '• มอเตอร์ = ตัวสั่น\n\n' +
            'อ่านสัญลักษณ์ออก = รู้ว่าอะไรทำหน้าที่อะไร ก่อนวางลงบอร์ดจริง' },

        { kind: 'wire', questId: 'sch_wire', npc: 'ค้างคาวสัญลักษณ์', emoji: '🦇',
          title: 'จับคู่สัญลักษณ์→หน้าที่', brief: 'แตะสัญลักษณ์ฝั่งซ้าย แล้วแตะหน้าที่ฝั่งขวาที่ตรงกัน',
          left: [
            { id: 'r',   label: 'R — ตัวต้านทาน', art: 'resistor' },
            { id: 'c',   label: 'C — คาปาซิเตอร์', art: 'capacitor' },
            { id: 'led', label: 'LED', art: 'led' },
          ],
          right: [
            { id: 'f_lim', label: 'จำกัด/ดึงกระแส', art: 'limit' },
            { id: 'f_flt', label: 'กรองไฟให้นิ่ง', art: 'filter' },
            { id: 'f_ind', label: 'ไฟแสดงสถานะ', art: 'indicator' },
          ],
          pairs: [['r', 'f_lim'], ['c', 'f_flt'], ['led', 'f_ind']],
          success: ['อ่านสัญลักษณ์ออกครบ!'],
          error: ['ลองนึกหน้าที่ของแต่ละชิ้น แล้วจับคู่ใหม่'] },

        { kind: 'wire', questId: 'sch_wire_boss', boss: true, npc: 'ออร์คพิมพ์เขียว', emoji: '👹',
          title: 'BOSS: อ่านสัญลักษณ์จอยให้ครบ', brief: 'สัญลักษณ์เยอะขึ้นและมีตัวคล้ายกัน! ระวังสับสน ไดโอด↔LED',
          left: [
            { id: 'tr',  label: 'ทรานซิสเตอร์', art: 'transistor' },
            { id: 'd',   label: 'ไดโอด', art: 'diode' },
            { id: 'mot', label: 'มอเตอร์', art: 'motor' },
            { id: 'bat', label: 'แบตเตอรี่', art: 'battery' },
            { id: 'gnd', label: 'กราวด์', art: 'gnd' },
          ],
          right: [
            { id: 'f_sw',  label: 'สวิตช์ขับกระแสใหญ่', art: 'relay' },
            { id: 'f_one', label: 'ยอมให้ไฟไหลทางเดียว (กันย้อน)', art: 'oneway' },
            { id: 'f_vib', label: 'หมุน/สั่น', art: 'vibrate' },
            { id: 'f_src', label: 'แหล่งจ่ายไฟ', art: 'vcc' },
            { id: 'f_ref', label: 'จุดอ้างอิง 0V', art: 'gnd' },
          ],
          pairs: [['tr', 'f_sw'], ['d', 'f_one'], ['mot', 'f_vib'], ['bat', 'f_src'], ['gnd', 'f_ref']],
          traps: { 'd->f_vib': 'diode_vs_motor', 'tr->f_one': 'transistor_vs_diode' },
          success: ['อ่านครบ! ทรานซิสเตอร์ขับ ไดโอดกันย้อน แยกออกจากกันได้'],
          error: ['ทรานซิสเตอร์ = สวิตช์ขับกระแส, ไดโอด = ไฟไหลทางเดียว อย่าสลับ'] },
      ],
    },

    { id: 'components', en: 'Pick Parts', th: 'เลือกอุปกรณ์', fullTh: 'เลือกอุปกรณ์ให้ตรงโจทย์',
      desc: 'เลือกชิ้นส่วนที่เหมาะกับบอร์ดจอย โดยเฉพาะตัวขับมอเตอร์',
      teaches: ['components'], requires: ['requirement'],
      pretest: { q: 'จะให้บอร์ดสั่งมอเตอร์สั่น ควรเลือกอุปกรณ์ "ขับ" ตัวใด?',
        choices: ['ทรานซิสเตอร์ (สวิตช์ขับกระแส)', 'ตัวต้านทานเฉย ๆ', 'สาย jumper'], answer: 0 },
      chapter: 'CHAPTER 0', gameTitle: 'เลือกของให้ตรงงาน', maxReward: 10,
      intro: 'เลือกตัวขับมอเตอร์ผิด จอยสั่นไม่ได้ หรือชิปพัง',
      steps: [
        { kind: 'dialogue', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
          text: 'เลือกอุปกรณ์ต้องดู "โจทย์" เป็นหลัก:\n\n' +
            '• ขับมอเตอร์ → ทรานซิสเตอร์ (ขา MCU ขับมอเตอร์ตรงไม่ได้ กระแสไม่พอ)\n' +
            '• กันไฟย้อนจากมอเตอร์ → ไดโอด\n' +
            '• กรองไฟชิป → คาปาดีคัปปลิ้ง\n' +
            '• ของบางอย่างไม่จำเป็นเลย เช่น รีเลย์ไฟบ้าน — อย่าใส่มั่ว\n\n' +
            'เลือกพอดีกับงาน = เล็ก ประหยัด เสถียร' },

        { kind: 'sort', questId: 'cmp_sort', npc: 'โครงกระดูกจัดซื้อ', emoji: '💀',
          title: 'อะไรใช้ขับมอเตอร์ได้',
          brief: 'ขา MCU จ่ายกระแสน้อย — แยกว่าตัวไหน "ขับมอเตอร์ได้" หรือ "ไม่เหมาะ"',
          bins: [
            { id: 'ok', label: 'ขับมอเตอร์ได้', icon: '✅' },
            { id: 'no', label: 'ไม่เหมาะ', icon: '🚫' },
          ],
          items: [
            { id: 'tr', label: 'ทรานซิสเตอร์ (สวิตช์กระแสใหญ่)', art: 'to92', bin: 'ok' },
            { id: 'res', label: 'ตัวต้านทานอนุกรม', art: 'resistorAxial', bin: 'no' },
            { id: 'relay', label: 'รีเลย์ไฟบ้าน 250V', art: 'relayBox', bin: 'no' },
            { id: 'direct', label: 'ต่อมอเตอร์เข้าขา MCU ตรง', art: 'mcu', bin: 'no' },
          ],
          success: ['ใช่! ทรานซิสเตอร์คือตัวขับ — ตัวต้านทาน/รีเลย์/ต่อตรง ใช้ไม่ได้'],
          error: ['ต้องมีตัว "ขับ" ที่รับกระแสแทน MCU ได้ = ทรานซิสเตอร์'] },

        { kind: 'sort', questId: 'cmp_sort_boss', boss: true, npc: 'ออร์คคลังอะไหล่', emoji: '👹',
          title: 'BOSS: แยกอุปกรณ์เข้าบล็อก', brief: 'จัดของเข้าบล็อกหน้าที่ของบอร์ดจอย ของที่ไม่ควรอยู่ ใส่กล่อง "ไม่ใช้"!',
          bins: [
            { id: 'pwr',   label: 'จ่ายไฟ', icon: '⚡' },
            { id: 'brain', label: 'ประมวลผล+RF', icon: '🧠' },
            { id: 'io',    label: 'อินพุต', icon: '👁' },
            { id: 'out',   label: 'ขับเอาต์พุต', icon: '📳' },
            { id: 'no',    label: 'ไม่ใช้ในจอยนี้', icon: '🚫' },
          ],
          items: [
            { id: 'ldo',   label: 'ตัวจ่ายไฟ LDO', art: 'ldo', bin: 'pwr' },
            { id: 'cap',   label: 'คาปาดีคัปปลิ้ง', art: 'capElec', bin: 'pwr' },
            { id: 'mcu',   label: 'ชิป MCU+RF', art: 'mcu', bin: 'brain' },
            { id: 'stick', label: 'อนาล็อกสติ๊ก', art: 'stick', bin: 'io' },
            { id: 'btn',   label: 'ปุ่มกด', art: 'buttons', bin: 'io' },
            { id: 'tr',    label: 'ทรานซิสเตอร์ + ไดโอด (ขับมอเตอร์)', art: 'to92', bin: 'out' },
            { id: 'relay', label: 'รีเลย์ไฟบ้าน 250V', art: 'relayBox', bin: 'no' },
          ],
          success: ['แยกครบ! ทรานซิสเตอร์+ไดโอดอยู่ฝั่งขับเอาต์พุต รีเลย์ไฟบ้านไม่เกี่ยว'],
          error: ['ของที่ไม่เกี่ยวกับ "อ่าน/ขับ/จ่ายไฟ/ส่งสัญญาณ" ของจอย ให้เข้ากล่องไม่ใช้'] },
      ],
    },

    // ── tier 2 (บรรจบ) ──────────────────────────────────────────────────────
    { id: 'placement', en: 'Placement', th: 'วางผังชิ้นส่วน', fullTh: 'วางตำแหน่งชิ้นส่วนบนบอร์ด',
      desc: 'วางแต่ละชิ้นในโซนที่ถูก และแยกมอเตอร์ออกจากอนาล็อก',
      teaches: ['placement'], requires: ['schematic', 'components'],
      pretest: { q: 'มอเตอร์สั่นควรวางอย่างไรเทียบกับอนาล็อกสติ๊ก?',
        choices: ['ชิดกันให้มากที่สุด', 'แยกห่าง ลดการกวนสัญญาณอนาล็อก', 'วางทับกัน'], answer: 1 },
      chapter: 'CHAPTER 1', gameTitle: 'วางผังบอร์ดจอย DUNGEON', maxReward: 10,
      intro: 'วางมอเตอร์ noise สูงชิดอนาล็อก = ค่าสติ๊กเพี้ยน วางผิดมีผลจริง',
      steps: [
        { kind: 'dialogue', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
          text: 'ตำแหน่งชิ้นส่วนบนบอร์ดจอยสำคัญมาก:\n\n' +
            '• อนาล็อกสติ๊ก → ตรงตำแหน่งนิ้วโป้ง\n' +
            '• ปุ่ม → ใต้ปุ่มหน้าจอย\n' +
            '• มอเตอร์สั่น → แยกห่างจากอนาล็อก (มอเตอร์ noise สูง กวนค่าสติ๊กได้)\n' +
            '• เสาอากาศ → ขอบบอร์ด เว้นที่ว่างรอบ ๆ\n' +
            '• คาปาดีคัปปลิ้ง → ชิดขาไฟชิป\n\n' +
            'วางตามหน้าที่ และระวังของที่กวนกัน' },

        { kind: 'sort', questId: 'plc_sort', npc: 'ผีน้อยนักจัดวาง', emoji: '👻',
          title: 'วางชิ้นเข้าโซน', brief: 'แตะชิ้นส่วน แล้วแตะโซนบนบอร์ดที่เหมาะที่สุด',
          bins: [
            { id: 'z_thumb', label: 'ตำแหน่งนิ้วโป้ง', icon: '🕹' },
            { id: 'z_face',  label: 'ใต้ปุ่มหน้าจอย', icon: '🅰' },
            { id: 'z_far',   label: 'มุมห่างจากอนาล็อก', icon: '📳' },
            { id: 'z_edge',  label: 'ขอบบอร์ด (เสาอากาศ)', icon: '📡' },
          ],
          items: [
            { id: 'stick', label: 'อนาล็อกสติ๊ก', art: 'stick', bin: 'z_thumb' },
            { id: 'btn',   label: 'ปุ่ม A/B/X/Y', art: 'buttons', bin: 'z_face' },
            { id: 'motor', label: 'มอเตอร์สั่น', art: 'motor', bin: 'z_far' },
            { id: 'ant',   label: 'เสาอากาศ PCB', art: 'antenna', bin: 'z_edge' },
          ],
          success: ['วางครบทุกชิ้นถูกโซน! มอเตอร์อยู่ห่างอนาล็อก'],
          error: ['คิดจากหน้าที่ + ของที่กวนกัน: มอเตอร์ต้องห่างสติ๊ก'] },

        { kind: 'sort', questId: 'plc_sort_boss', boss: true, npc: 'ออร์คผังบอร์ด', emoji: '👹',
          title: 'BOSS: วางผังบอร์ดให้ครบ',
          brief: 'พื้นที่จำกัด! วางทุกชิ้นลงโซนที่ถูก โดยเฉพาะมอเตอร์ noise สูงต้องอยู่มุมห่าง และคาปาต้องชิดขาไฟชิป',
          bins: [
            { id: 'z_thumb', label: 'ตำแหน่งนิ้วโป้ง', icon: '🕹' },
            { id: 'z_face',  label: 'ใต้ปุ่มหน้าจอย', icon: '🅰' },
            { id: 'z_edge',  label: 'ขอบบอร์ด (เสาอากาศ)', icon: '📡' },
            { id: 'z_far',   label: 'มุมห่าง (noise สูง)', icon: '📳' },
            { id: 'z_near',  label: 'ชิดขาไฟชิป', icon: '🟦' },
          ],
          items: [
            { id: 'stick', label: 'อนาล็อกสติ๊ก', art: 'stick', bin: 'z_thumb' },
            { id: 'btn',   label: 'ปุ่ม A/B/X/Y', art: 'buttons', bin: 'z_face' },
            { id: 'ant',   label: 'เสาอากาศ PCB', art: 'antenna', bin: 'z_edge' },
            { id: 'motor', label: 'มอเตอร์สั่น', art: 'motor', bin: 'z_far' },
            { id: 'cap',   label: 'คาปาดีคัปปลิ้ง', art: 'capElec', bin: 'z_near' },
          ],
          success: ['วางผังครบ! มอเตอร์อยู่มุมห่าง คาปาชิดขาไฟชิป สติ๊ก/ปุ่มตรงตำแหน่ง'],
          error: ['มอเตอร์ noise สูงต้องอยู่มุมห่างอนาล็อก/เสาอากาศ และคาปาต้องชิดขาไฟชิป'] },
      ],
    },

    // ── tier 3 (แตกสองกิ่งจาก placement) ────────────────────────────────────
    { id: 'routing', en: 'Routing', th: 'เดินเส้นทองแดง', fullTh: 'เดินเส้นและแยกเส้นมอเตอร์/อนาล็อก',
      desc: 'เส้นไฟมอเตอร์ต้องกว้าง + แยกเส้นอนาล็อกออกจากเส้นมอเตอร์',
      teaches: ['routing', 'trace_width'], requires: ['placement'],
      pretest: { q: 'เส้นไฟที่จ่ายให้มอเตอร์ (กระแสมาก) ควรเป็นอย่างไร?',
        choices: ['แคบลง', 'กว้างขึ้น', 'เท่าเส้นสัญญาณ'], answer: 1 },
      chapter: 'CHAPTER 2', gameTitle: 'เดินเส้นทองแดง DUNGEON', maxReward: 16,
      intro: 'เส้นมอเตอร์แคบไปร้อนจนขาด เดินชิดเส้นอนาล็อกก็กวนค่าสติ๊ก — งานหินของ node นี้',
      steps: [
        { kind: 'dialogue', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
          text: 'การเดินเส้นบอร์ดจอย:\n\n' +
            '• เส้นไฟมอเตอร์กระแสมาก → ต้องกว้าง — สูตรง่าย ๆ: กว้าง(mil) ≈ กระแส(A) × 50\n' +
            '• เส้นสัญญาณอนาล็อก (ADC) ละเอียดอ่อน → เดินให้ "ห่าง" เส้นมอเตอร์ ไม่ให้ noise กวน\n' +
            '• เส้นป้อนเสาอากาศ → ห้ามวิ่งเข้ากราวด์เพลน\n' +
            '• เดินเส้นไฟกว้างก่อน แล้วค่อยเส้นสัญญาณ' },

        { kind: 'tune', questId: 'rt_tune', npc: 'โครงกระดูกช่างเส้น', emoji: '💀',
          title: 'ตั้งความกว้างเส้นมอเตอร์',
          unit: 'mil', min: 0, max: 100, step: 1, target: 40, tolerance: 4,
          prompt: 'เส้นไฟมอเตอร์มีกระแส 0.8A — ใช้สูตร กว้าง ≈ กระแส × 50 ปรับให้พอดี',
          success: ['พอดี! 0.8A × 50 = 40 mil เส้นไม่ร้อน'],
          error: ['ยังไม่พอดี ลองคิด 0.8 × 50 ดูใหม่ (แคบไปเส้นจะร้อนจนขาด)'] },

        { kind: 'sequence', questId: 'rt_seq', npc: 'ผีน้อยเดินสาย', emoji: '👻',
          title: 'ลำดับการเดินเส้น', brief: 'เรียงขั้นตอน routing ให้ถูก',
          items: [
            { id: 'r_place', label: 'จัดวางชิ้นให้ลงตัวก่อน', art: 'place' },
            { id: 'r_pwr',   label: 'เดินเส้นไฟ/เส้นมอเตอร์ (เส้นกว้าง)', art: 'vcc' },
            { id: 'r_sig',   label: 'เดินเส้นสัญญาณ (อนาล็อกห่างมอเตอร์)', art: 'signal' },
            { id: 'r_pour',  label: 'เทกราวด์ (copper pour)', art: 'pour' },
            { id: 'r_chk',   label: 'ตรวจระยะห่างเส้น', art: 'test' },
          ],
          correctOrder: ['r_place', 'r_pwr', 'r_sig', 'r_pour', 'r_chk'],
          success: ['ลำดับ routing ถูกต้อง!'],
          error: ['วางชิ้นเสร็จก่อน เดินไฟ/มอเตอร์ก่อนสัญญาณ ตรวจเป็นขั้นท้าย'] },

        { kind: 'wire', questId: 'rt_wire_boss', boss: true, npc: 'ออร์คเส้นพันกัน', emoji: '👹',
          title: 'BOSS: เดินเส้นให้ครบ', brief: 'ลากแต่ละ net ไปปลายทางให้ถูก ระวังเส้นอนาล็อกชิดเส้นมอเตอร์/เสาอากาศตาย!',
          left: [
            { id: 'n_mot', label: 'เส้นไฟมอเตอร์ (กระแสมาก)', art: 'motor' },
            { id: 'n_adc', label: 'เส้นสัญญาณอนาล็อก', art: 'signal' },
            { id: 'n_gnd', label: 'เส้น GND', art: 'gnd' },
            { id: 'n_ant', label: 'เส้นป้อนเสาอากาศ', art: 'wireless' },
          ],
          right: [
            { id: 't_wide',  label: 'แนวไฟกว้าง → มอเตอร์', art: 'trace' },
            { id: 't_adc',   label: 'ขา ADC (เดินห่างเส้นมอเตอร์)', art: 'read' },
            { id: 't_plane', label: 'กราวด์เพลน', art: 'pour' },
            { id: 't_rf',    label: 'จุดป้อน RF (เว้นระยะรอบ)', art: 'send' },
          ],
          pairs: [['n_mot', 't_wide'], ['n_adc', 't_adc'], ['n_gnd', 't_plane'], ['n_ant', 't_rf']],
          traps: { 'n_adc->t_wide': 'analog_near_motor', 'n_ant->t_plane': 'antenna_to_ground', 'n_mot->t_adc': 'motor_thin' },
          success: ['เดินเส้นครบ! มอเตอร์เส้นกว้าง อนาล็อกเดินห่าง เสาอากาศเว้นระยะ'],
          error: ['ไฟมอเตอร์→แนวกว้าง, อนาล็อก→ADC (ห่างมอเตอร์), กราวด์→เพลน, เสาอากาศ→จุด RF'] },
      ],
    },

    { id: 'power_decap', en: 'Power & Decap', th: 'จ่ายไฟ+ดีคัปปลิ้ง', fullTh: 'ออกแบบไฟเลี้ยงและคาปาดีคัปปลิ้ง',
      desc: 'วางคาปากรองไฟชิดขาไฟชิป',
      teaches: ['power_design'], requires: ['placement'],
      pretest: { q: 'คาปาซิเตอร์ดีคัปปลิ้งควรวางตรงไหน?',
        choices: ['ใกล้ขาไฟของชิปที่สุด', 'ไกลชิปสุดขอบบอร์ด', 'ตรงไหนก็ได้'], answer: 0 },
      chapter: 'CHAPTER 2', gameTitle: 'กรองไฟให้นิ่ง DUNGEON', maxReward: 12,
      intro: 'มอเตอร์ทำให้ไฟกระเพื่อม คาปาดีคัปปลิ้งช่วยกันไม่ให้ชิปทำงานเพี้ยน',
      steps: [
        { kind: 'dialogue', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
          text: 'คาปาดีคัปปลิ้ง (decoupling) ช่วย "กรองไฟให้นิ่ง" ที่ขาไฟของชิป\n\n' +
            'ในจอย ตอนมอเตอร์สั่นจะกระชากไฟ ทำให้ไฟทั้งบอร์ดกระเพื่อม\n\n' +
            'คาปาที่อยู่ใกล้ขาชิปจะปล่อยไฟสำรองให้ทันที ชิปจึงไม่รวน\n\n' +
            'กฎ: วางคาปาคร่อมระหว่าง ไฟเลี้ยง (VCC) กับ GND และต้อง "ชิดขาชิปที่สุด"' },

        { kind: 'wire', questId: 'pd_wire', npc: 'ค้างคาวกรองไฟ', emoji: '🦇',
          title: 'วางคาปาดีคัปปลิ้ง',
          brief: 'คาปาต้องคร่อม VCC–GND และ "ชิดขาชิป" ลากขาคาปาให้ถูก อย่าวางไกล',
          left: [
            { id: 'capA', label: 'ขาคาปา A', art: 'capacitor' },
            { id: 'capB', label: 'ขาคาปา B', art: 'capacitor' },
          ],
          right: [
            { id: 'vcc_near', label: 'VCC ที่ขาชิป (ใกล้)', art: 'vcc' },
            { id: 'gnd_near', label: 'GND ที่ขาชิป (ใกล้)', art: 'gnd' },
            { id: 'far', label: 'ขอบบอร์ด (ไกล)', art: 'place' },
          ],
          pairs: [['capA', 'vcc_near'], ['capB', 'gnd_near']],
          traps: { 'capA->far': 'decap_far', 'capB->far': 'decap_far' },
          success: ['ใช่! คาปาคร่อม VCC–GND ชิดขาชิป จ่ายไฟสำรองทัน ไฟนิ่ง'],
          error: ['ดีคัปปลิ้งต้องอยู่ "ใกล้" ขาชิป ถึงจะทันตอนมอเตอร์กระชากไฟ'] },

        { kind: 'wire', questId: 'pd_wire_boss', boss: true, npc: 'ออร์คไฟกระเพื่อม', emoji: '👹',
          title: 'BOSS: วางคาปาดีคัปปลิ้ง', brief: 'ต่อคาปาคร่อมไฟเลี้ยง–GND ที่ขาชิป (ใกล้) อย่าต่อทั้งสองขาเข้าไฟ และอย่าวางไกล!',
          left: [
            { id: 'capA', label: 'ขาคาปา A', art: 'capacitor' },
            { id: 'capB', label: 'ขาคาปา B', art: 'capacitor' },
          ],
          right: [
            { id: 'vcc_near', label: 'ไฟเลี้ยงที่ขาชิป (ใกล้)', art: 'vcc' },
            { id: 'gnd_near', label: 'GND ที่ขาชิป (ใกล้)', art: 'gnd' },
            { id: 'vcc_far',  label: 'ไฟเลี้ยงปลายบอร์ด (ไกล)', art: 'place' },
          ],
          pairs: [['capA', 'vcc_near'], ['capB', 'gnd_near']],
          traps: { 'capA->vcc_far': 'decap_far', 'capB->vcc_near': 'decap_short', 'capB->vcc_far': 'decap_far' },
          success: ['คาปาคร่อมไฟเลี้ยง–GND ชิดขาชิป ไฟนิ่งแม้มอเตอร์สั่น!'],
          error: ['ต้องคร่อมไฟเลี้ยงกับ GND (ไม่ใช่ไฟทั้งคู่) และต้องอยู่ใกล้ขาชิป'] },
      ],
    },

    // ── tier 4 (บอสใหญ่สุดของ topic) ────────────────────────────────────────
    { id: 'drc_check', en: 'Board Check', th: 'ตรวจบอร์ด', fullTh: 'ตรวจบอร์ด (DRC) ก่อนผลิต',
      desc: 'ไล่หาจุดผิดบนบอร์ดก่อนส่งโรงงาน',
      teaches: ['board_check'], requires: ['routing', 'power_design'],
      pretest: { q: 'ก่อนส่งบอร์ดไปผลิต ควรทำอะไร?',
        choices: ['ตรวจ (DRC) หาจุดผิด เช่น เส้นแคบ/เส้นกวนกัน', 'ส่งเลยไม่ต้องตรวจ', 'ลบไฟล์เก่าทิ้ง'], answer: 0 },
      chapter: 'CHAPTER 3', gameTitle: 'ตรวจบอร์ด FINAL BOSS', maxReward: 18,
      intro: 'ด่านรวมทุกความรู้! บอร์ดจอยเดินเส้น+จ่ายไฟครบแล้ว แต่ยังมีจุดผิดซ่อนอยู่ หาให้เจอก่อนผลิต',
      steps: [
        { kind: 'dialogue', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
          text: 'DRC (Design Rule Check) = ตรวจกฎก่อนส่งผลิต เช่น:\n\n' +
            '• เส้นไฟมอเตอร์กว้างพอกับกระแสไหม\n' +
            '• เส้นอนาล็อกเดินชิดเส้นมอเตอร์เกินไปไหม (เสี่ยง noise)\n' +
            '• เสาอากาศเว้นที่ว่างรอบครบไหม\n' +
            '• กราวด์ต่อถึงเพลนครบไหม\n\n' +
            'ตรวจให้เจอบนจอ ดีกว่าไปเจอตอนบอร์ดผลิตมาแล้วใช้ไม่ได้' },

        { kind: 'diagnose', questId: 'drc_diag', npc: 'ผีน้อยตรวจกฎ', emoji: '👻',
          title: 'หา error ง่าย ๆ', brief: 'ตรวจค่าด้านล่าง แล้วบอกว่าผิดกฎข้อไหน',
          probes: [
            { id: 'w_mot', label: 'ความกว้างเส้นไฟมอเตอร์', reading: '10 mil (มอเตอร์ 0.8A ต้อง ~40)', ok: false, fault: true },
            { id: 'w_sig', label: 'ความกว้างเส้นสัญญาณ', reading: '8 mil (ปกติ)', ok: true },
          ],
          faults: [
            { id: 'narrow_mot', label: 'เส้นไฟมอเตอร์แคบเกินไป', correct: true },
            { id: 'narrow_sig', label: 'เส้นสัญญาณแคบเกินไป', mis: 'misread_sig' },
          ],
          success: ['ถูก! เส้นมอเตอร์ 0.8A ต้อง ~40 mil ที่ 10 mil จะร้อนจนขาด'],
          error: ['เส้นสัญญาณ 8 mil ปกติ แต่เส้นมอเตอร์กระแสมากต้องกว้างกว่านั้น'] },

        { kind: 'diagnose', questId: 'drc_diag_boss', boss: true, npc: 'จอมมารตรวจบอร์ด', emoji: '🐲',
          title: 'FINAL BOSS: DRC ไม่ผ่าน 1 จุด', brief: 'บอร์ดเกือบสมบูรณ์ แต่ติด DRC อยู่จุดเดียว วัดให้ครบทุกจุดแล้วชี้ให้ตรง!',
          probes: [
            { id: 'p_mot', label: 'ความกว้างเส้นไฟมอเตอร์', reading: '40 mil (ผ่าน)', ok: true },
            { id: 'p_sep', label: 'ระยะเส้นอนาล็อก–เส้นมอเตอร์', reading: 'ชิดมาก 5 mil', ok: false, fault: true },
            { id: 'p_ant', label: 'เว้นระยะรอบเสาอากาศ', reading: 'เว้นครบ (ผ่าน)', ok: true },
            { id: 'p_gnd', label: 'กราวด์ต่อถึงเพลน', reading: 'ต่อครบ (ผ่าน)', ok: true },
            { id: 'p_cap', label: 'ระยะคาปาถึงขาชิป', reading: 'ชิด (ผ่าน)', ok: true },
          ],
          faults: [
            { id: 'analog_motor', label: 'เส้นอนาล็อกเดินชิดเส้นมอเตอร์ เสี่ยงสัญญาณกวน', correct: true },
            { id: 'thin',   label: 'เส้นไฟมอเตอร์แคบเกินไป', mis: 'misread_width' },
            { id: 'antenna', label: 'เสาอากาศไม่เว้นระยะ', mis: 'misread_antenna' },
            { id: 'nognd',  label: 'กราวด์ไม่ต่อถึงเพลน', mis: 'misread_ground' },
            { id: 'decap',  label: 'คาปาดีคัปปลิ้งวางไกลชิป', mis: 'misread_decap' },
          ],
          success: ['ผ่าน! จุดเดียวที่ผิดคือเส้นอนาล็อกชิดเส้นมอเตอร์ ขยับให้ห่างแล้วบอร์ดพร้อมผลิต'],
          error: ['อย่าด่วนสรุป วัดทุกจุดก่อน — ค่าที่ "ไม่ผ่าน" มีจุดเดียว นั่นแหละคำตอบ'] },
      ],
    },

  ],
}
