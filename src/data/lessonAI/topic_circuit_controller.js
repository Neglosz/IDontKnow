// ============================================================================
//  paste ทับ topic 'circuit' ตัวเดิมใน TOPICS[]  (ของที่สแกน: จอยคอนโทรลเลอร์ไร้สาย)
//  ทุก node = dialogue(สอน) → มอนสเตอร์อ่อน → บอส(boss:true) ; ใช้แค่ 6 engine
// ============================================================================
export default {
  key: 'circuit', th: 'การต่อวงจร',
  quest: 'แกะจอยไร้สาย แล้วต่อวงจรตั้งแต่ขั้วไฟ–อนาล็อกสติ๊ก–ปุ่ม–มอเตอร์สั่น จนประกอบครบทั้งตัว',
  nodes: [

    // ── tier 0 (ราก) ───────────────────────────────────────────────────────
    { id: 'parts', en: 'Inside the Controller', th: 'ชิ้นส่วนจอย', fullTh: 'รู้จักชิ้นส่วนในจอย',
      desc: 'แยกชิ้นส่วนตามหน้าที่: จ่ายไฟ / รับรู้ / ประมวลผล / สั่งงาน / ทางเชื่อม',
      teaches: ['parts'], requires: [],
      pretest: { q: 'ในจอยคอนโทรลเลอร์ ชิ้นใดทำหน้าที่ "สั่นเตือน" (feedback)?',
        choices: ['อนาล็อกสติ๊ก', 'มอเตอร์สั่น', 'แบตเตอรี่'], answer: 1 },
      chapter: 'CHAPTER 0', gameTitle: 'รู้จักชิ้นส่วนในจอย', maxReward: 6,
      intro: 'แกะฝาหลังจอยออกมา ดูสิว่าข้างในมีอะไรบ้าง ก่อนจะต่อวงจรเป็น',
      steps: [
        { kind: 'dialogue', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
          text: 'แกะจอยไร้สายออกมา จะเห็นชิ้นส่วนแบ่งตาม "หน้าที่" ได้ดังนี้:\n\n' +
            '• แหล่งจ่ายไฟ ⚡ = แบตเตอรี่\n' +
            '• ตัวรับรู้/อินพุต 👁 = อนาล็อกสติ๊ก + ปุ่มกด\n' +
            '• ตัวประมวลผล 🧠 = ชิป MCU + ตัวส่งสัญญาณไร้สาย\n' +
            '• ตัวสั่งงาน/เอาต์พุต 📳 = มอเตอร์สั่น\n' +
            '• ทางเชื่อม 🔌 = ลายทองแดง/ขั้วต่อ\n\n' +
            'แยกหน้าที่ให้ออกก่อน เดี๋ยวต่อวงจรจะไม่งง' },

        { kind: 'sort', questId: 'parts_sort_easy', npc: 'สไลม์เขียว', emoji: '🟢',
          title: 'แยกชิ้นส่วนจอย', brief: 'แตะชิ้นส่วน แล้วแตะกล่องกลุ่มที่ใช่',
          bins: [
            { id: 'power', label: 'แหล่งจ่ายไฟ', icon: '⚡' },
            { id: 'sense', label: 'รับรู้/อินพุต', icon: '👁' },
            { id: 'brain', label: 'ประมวลผล', icon: '🧠' },
            { id: 'out',   label: 'สั่งงาน/เอาต์พุต', icon: '📳' },
          ],
          items: [
            { id: 'batt',  label: 'แบตเตอรี่', icon: '🔋', art: 'battery', bin: 'power' },
            { id: 'stick', label: 'อนาล็อกสติ๊ก', icon: '🕹', art: 'stick', bin: 'sense' },
            { id: 'mcu',   label: 'ชิป MCU', icon: '🧠', art: 'mcu', bin: 'brain' },
            { id: 'motor', label: 'มอเตอร์สั่น', icon: '📳', art: 'motor', bin: 'out' },
          ],
          success: ['แยกกลุ่มชิ้นส่วนได้ครบ!'],
          error: ['ยังมีชิ้นผิดกล่อง — ลองคิดว่าชิ้นนี้ "ทำหน้าที่อะไร"'] },

        { kind: 'sort', questId: 'parts_sort_boss', boss: true, npc: 'ออร์คนักถอดแยก', emoji: '👹',
          title: 'BOSS: คัดชิ้นส่วนให้ครบ', brief: 'คราวนี้ชิ้นเยอะขึ้น และมีตัวหลอก! ตัดสินที่ "หน้าที่จริง"',
          bins: [
            { id: 'power', label: 'แหล่งจ่ายไฟ', icon: '⚡' },
            { id: 'sense', label: 'รับรู้/อินพุต', icon: '👁' },
            { id: 'brain', label: 'ประมวลผล', icon: '🧠' },
            { id: 'out',   label: 'สั่งงาน/เอาต์พุต', icon: '📳' },
            { id: 'link',  label: 'ทางเชื่อม', icon: '🔌' },
          ],
          items: [
            { id: 'batt',   label: 'แบตเตอรี่', icon: '🔋', art: 'battery', bin: 'power' },
            { id: 'holder', label: 'ขั้วใส่แบต', icon: '🔌', art: 'holder', bin: 'link' },
            { id: 'stick',  label: 'อนาล็อกสติ๊ก', icon: '🕹', art: 'stick', bin: 'sense' },
            { id: 'btn',    label: 'ปุ่ม A/B/X/Y', icon: '🅰', art: 'buttons', bin: 'sense' },
            { id: 'mcu',    label: 'ชิป MCU+RF', icon: '🧠', art: 'mcu', bin: 'brain' },
            { id: 'motor',  label: 'มอเตอร์สั่น', icon: '📳', art: 'motor', bin: 'out' },
            { id: 'trace',  label: 'ลายทองแดงบนบอร์ด', icon: '➰', art: 'trace', bin: 'link' },
          ],
          success: ['เก่งมาก! มอเตอร์สั่นเป็น "เอาต์พุต" ที่ MCU สั่งให้ทำงาน'],
          error: ['คิดจากหน้าที่: รับค่าเข้า=อินพุต, สั่งให้เกิดผล=เอาต์พุต'] },
      ],
    },

    // ── tier 1 (แตกสองกิ่งจาก parts) ────────────────────────────────────────
    { id: 'polarity', en: 'Polarity', th: 'ขั้วไฟ', fullTh: 'ขั้วบวก–ขั้วลบ',
      desc: 'รู้จัก + / − และอันตรายของการต่อกลับขั้ว',
      teaches: ['polarity'], requires: ['parts'],
      pretest: { q: 'ใส่แบตกลับขั้วในจอย จะเกิดอะไร?',
        choices: ['เล่นได้ลื่นขึ้น', 'ไฟไหลผิดทาง วงจรไม่ทำงานหรือพังได้', 'จอยสั่นแรงขึ้น'], answer: 1 },
      chapter: 'CHAPTER 0', gameTitle: 'ขั้วบวก–ขั้วลบ', maxReward: 8,
      intro: 'ไฟมีทิศทาง! ต่อขั้วสลับเมื่อไหร่ วงจรพังเมื่อนั้น',
      steps: [
        { kind: 'dialogue', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
          text: 'แบตมีสองขั้ว: + (ปุ่มนูน) และ − (ด้านแบน)\n\n' +
            'ไฟไหลจาก + ผ่านวงจร กลับเข้า − เสมอ\n\n' +
            'ถ้าใส่กลับขั้ว → ไฟไหลผิดทาง บอร์ดไม่ทำงาน บางทีลัดวงจรจนไหม้\n\n' +
            'กฎเหล็ก: + ต่อ + , − ต่อ − เสมอ' },

        { kind: 'polarity', questId: 'pol_insert', npc: 'ค้างคาวขั้วไฟ', emoji: '🦇',
          title: 'ใส่แบตให้ถูกขั้ว',
          brief: 'ลงมือเอง! พลิกแบตให้ขั้ว + (ปุ่มแดง) ตรงกับเครื่องหมาย + บนราง แล้วกดเสียบ ' +
            'ถ้ากลับขั้ว ไฟจะไม่เข้าบอร์ด',
          plusSide: 'left', startFlipped: true,
          success: ['ขั้วตรง! ไฟเลี้ยงเข้าบอร์ด 🔋⚡'],
          error: ['ใส่กลับขั้ว! ไฟไหลผิดทาง บอร์ดไม่ทำงาน — พลิกแบตแล้วเสียบใหม่'] },

        { kind: 'polarity', questId: 'pol_boss', boss: true, npc: 'ออร์คสลับขั้ว', emoji: '👹',
          title: 'BOSS: ใส่ถ่าน 2 ก้อนให้ครบวงจร',
          brief: 'จอยใช้ถ่าน 2 ก้อนต่ออนุกรม! หมุนให้หัวขั้ว + ของแต่ละก้อน ' +
            'ชนกับหน้าสัมผัส + ของช่องนั้น (สังเกตช่องบน-ล่างกลับด้านกัน) ทุกก้อนต้องถูก ไฟถึงจะเข้า',
          slots: [{ plusSide: 'left' }, { plusSide: 'right' }],
          success: ['ครบวงจร! ถ่านทั้งสองต่ออนุกรมถูกขั้ว จอยมีไฟ 🎮⚡'],
          error: ['ยังมีก้อนกลับขั้ว (ไฟแดง)! หมุนก้อนนั้นแล้วจ่ายไฟใหม่'] },
      ],
    },

    { id: 'pinout', en: 'Pinout', th: 'อ่านขา', fullTh: 'อ่านขาอุปกรณ์ (VCC/GND/SIG)',
      desc: 'รู้หน้าที่แต่ละขา โดยเฉพาะขา wiper ของอนาล็อกสติ๊ก',
      teaches: ['pinout'], requires: ['parts'],
      pretest: { q: 'ขา 2 (ขากลาง/wiper) ของอนาล็อกสติ๊กส่งค่าอะไรออกมา?',
        choices: ['แรงดันที่เปลี่ยนตามตำแหน่งสติ๊ก', 'ไฟเลี้ยงคงที่', 'กราวด์'], answer: 0 },
      chapter: 'CHAPTER 0', gameTitle: 'อ่านขาอุปกรณ์', maxReward: 10,
      intro: 'อนาล็อกสติ๊กคือหัวใจของจอย — ต้องรู้ก่อนว่าแต่ละขาทำอะไร',
      steps: [
        { kind: 'dialogue', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
          text: 'อนาล็อกสติ๊กข้างในคือ "ตัวต้านทานปรับค่า" (โพเทนชิโอมิเตอร์) มี 3 ขา เรียงหมายเลข 1-2-3:\n\n' +
            '• ขา 1 (ขาริม) → ต่อ VCC\n' +
            '• ขา 2 (ขากลาง / wiper) → ส่ง "แรงดัน" ที่เปลี่ยนตามตำแหน่งที่ดันสติ๊ก\n' +
            '• ขา 3 (ขาริม) → ต่อ GND\n\n' +
            'ขาริม 1 กับ 3 สลับ VCC/GND กันได้ — แต่ขากลาง (ขา 2) คือ wiper เสมอ\n' +
            'ดันสุดทาง = แรงดันเข้าใกล้ VCC, ดันอีกทาง = เข้าใกล้ 0V, ตรงกลาง = ครึ่งหนึ่ง' },

        { kind: 'wire', questId: 'pin_wire', npc: 'โครงกระดูกช่างไฟ', emoji: '💀',
          title: 'ต่อขากลาง (wiper)',
          brief: 'อนาล็อกสติ๊กมีขากลาง (wiper) ที่ "ส่งค่า" — ลากให้เข้าปลายทางที่ถูก ถ้าตรึงไว้ที่ไฟเลี้ยง/กราวด์ ค่าจะไม่เปลี่ยน',
          left: [{ id: 'wip', label: 'ขา 2 (ขากลาง/wiper)', art: 'wiper' }],
          right: [
            { id: 'adc', label: 'ขา ADC (อ่านอนาล็อก)', art: 'signal', wireType: 'sig' },
            { id: 'vcc', label: 'VCC (ไฟเลี้ยง)', art: 'vcc', wireType: 'pwr' },
            { id: 'gnd', label: 'GND (กราวด์)', art: 'gnd', wireType: 'gnd' },
          ],
          pairs: [['wip', 'adc']],
          traps: { 'wip->vcc': 'wiper_to_power', 'wip->gnd': 'wiper_to_ground' },
          success: ['ถูก! ขากลางส่งสัญญาณเข้า ADC'],
          error: ['wiper ต้องเข้า ADC — ถ้าตรึงไว้ที่ VCC/GND ค่าจะไม่เปลี่ยน'] },

        { kind: 'wire', questId: 'pin_wire_boss', boss: true, npc: 'ออร์คขาสับสน', emoji: '👹',
          title: 'BOSS: จับคู่ขาอนาล็อกสติ๊ก', brief: 'อนาล็อกสติ๊กมี 3 ขา จับแต่ละขาให้ตรง "หน้าที่"',
          left: [
            { id: 'end1', label: 'ขา 1 (ขาริม)', art: 'pin' },
            { id: 'wip',  label: 'ขา 2 (ขากลาง/wiper)', art: 'wiper' },
            { id: 'end2', label: 'ขา 3 (ขาริม)', art: 'pin' },
          ],
          right: [
            { id: 'f_pow', label: 'รับไฟเลี้ยง (VCC)', art: 'vcc', wireType: 'pwr' },
            { id: 'f_gnd', label: 'ต่อกราวด์ 0V', art: 'gnd', wireType: 'gnd' },
            { id: 'f_adc', label: 'ส่งแรงดันให้ ADC', art: 'signal', wireType: 'sig' },
          ],
          // ขาริมสองด้านสลับกันได้ (จะเข้า VCC หรือ GND ก็ได้) ขอแค่ขากลางเข้า ADC
          pairs: [['end1', ['f_pow', 'f_gnd']], ['end2', ['f_pow', 'f_gnd']], ['wip', 'f_adc']],
          traps: { 'wip->f_pow': 'wiper_to_power', 'wip->f_gnd': 'wiper_to_ground', 'end1->f_adc': 'power_to_adc', 'end2->f_adc': 'power_to_adc' },
          success: ['จับคู่ขาครบถูกต้อง! ขา 2 (กลาง) เข้า ADC ขา 1/3 (ริม) เป็น VCC/GND'],
          error: ['ขา 2 (ขากลาง/wiper) ต้องเข้า ADC เท่านั้น ขา 1/3 (ริม) คือ VCC/GND'] },
      ],
    },

    // ── tier 2 ──────────────────────────────────────────────────────────────
    { id: 'analog_wire', en: 'Wire Analog Stick', th: 'ต่ออนาล็อกสติ๊ก', fullTh: 'ต่อสายอนาล็อกสติ๊กและอ่านค่า',
      desc: 'ต่อ 3 สายให้ถูกขั้ว และอ่านแรงดันกลาง',
      teaches: ['analog_wiring'], requires: ['polarity', 'pinout'],
      pretest: { q: 'อนาล็อกสติ๊กอยู่ตรงกลาง ขา wiper ควรอ่านแรงดันได้ประมาณเท่าใด (ไฟเลี้ยง 3.3V)?',
        choices: ['0V', 'ครึ่งหนึ่ง ~1.65V', '3.3V'], answer: 1 },
      chapter: 'CHAPTER 1', gameTitle: 'ต่ออนาล็อกสติ๊ก DUNGEON', maxReward: 12,
      intro: 'รวมความรู้ขั้วไฟ + ขา มาต่ออนาล็อกสติ๊กให้อ่านค่าได้จริง',
      steps: [
        { kind: 'dialogue', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
          text: 'อนาล็อกสติ๊กทำงานเป็น "ตัวแบ่งแรงดัน":\n\n' +
            '• ปลายหนึ่งต่อ VCC, อีกปลายต่อ GND\n' +
            '• wiper อยู่กลาง อ่านได้ครึ่งหนึ่งของไฟเลี้ยง (3.3V → ~1.65V)\n' +
            '• ดันขึ้น/ลง ค่าแรงดันก็เลื่อนตาม\n\n' +
            'ต่อ VCC/GND สลับกัน ทิศการอ่านจะกลับด้าน — ระวังขั้ว!' },

        { kind: 'tune', questId: 'aw_tune', npc: 'ผีน้อยมิเตอร์', emoji: '👻',
          title: 'อ่านค่ากลางสติ๊ก',
          unit: 'V', min: 0, max: 3.3, step: 0.05, target: 1.65, tolerance: 0.15,
          prompt: 'ดันอนาล็อกสติ๊กให้อยู่ "ตรงกลาง" — ขา wiper ควรอ่านได้ครึ่งหนึ่งของไฟเลี้ยง 3.3V',
          success: ['พอดี ~1.65V! ตรงกลางคือครึ่งหนึ่งของไฟเลี้ยง'],
          error: ['ยังไม่กลาง: 0V คือสุดทางหนึ่ง, 3.3V คืออีกสุดทาง ตรงกลางคือครึ่ง'] },

        { kind: 'wire', questId: 'aw_wire_boss', boss: true, npc: 'ออร์คสติ๊กพันสาย', emoji: '👹',
          title: 'BOSS: ต่อสายอนาล็อกสติ๊ก', brief: 'ต่อ 3 สายจากสติ๊กไปบอร์ดให้ครบ ถูกขั้วทุกเส้น',
          left: [
            { id: 's_end1', label: 'ปลาย 1 สติ๊ก(VCC)', art: 'vcc' },
            { id: 's_end2', label: 'ปลาย 2 สติ๊ก(GND)', art: 'gnd' },
            { id: 's_wip',  label: 'wiper สติ๊ก', art: 'wiper' },
          ],
          right: [
            { id: 'b_33',  label: '3V3 บอร์ด', art: 'vcc', wireType: 'pwr' },
            { id: 'b_gnd', label: 'GND บอร์ด', art: 'gnd', wireType: 'gnd' },
            { id: 'b_adc', label: 'ขา ADC', art: 'signal', wireType: 'sig' },
          ],
          pairs: [['s_end1', 'b_33'], ['s_end2', 'b_gnd'], ['s_wip', 'b_adc']],
          traps: { 's_wip->b_33': 'wiper_to_power', 's_end1->b_adc': 'power_to_adc', 's_wip->b_gnd': 'wiper_to_ground' },
          success: ['ต่อครบ 3 สาย! wiper เข้า ADC อ่านการเลื่อนได้แล้ว'],
          error: ['ปลายต่อ VCC/GND, ขากลาง (wiper) เท่านั้นที่เข้า ADC'] },
      ],
    },

    { id: 'button_wire', en: 'Wire Buttons', th: 'ต่อปุ่มกด', fullTh: 'ต่อปุ่มกดเข้าขาอินพุต',
      desc: 'ปุ่มคือสวิตช์ที่ทำให้ขาอินพุตเปลี่ยนสถานะ',
      teaches: ['switch_input'], requires: ['pinout'],
      pretest: { q: 'ปุ่มกดบนจอยต่อเข้ากับอะไร?',
        choices: ['ขาอินพุต MCU (อีกขาไป GND)', 'ขั้วบวกแบตโดยตรง', 'มอเตอร์สั่น'], answer: 0 },
      chapter: 'CHAPTER 1', gameTitle: 'ต่อปุ่ม A/B/X/Y', maxReward: 10,
      intro: 'ปุ่มไม่ได้จ่ายไฟ แต่มันคือสวิตช์ที่บอกบอร์ดว่า "มีคนกด"',
      steps: [
        { kind: 'dialogue', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
          text: 'ปุ่มกด = สวิตช์ ตอนปกติวงจรเปิด ตอนกดจึงต่อถึงกัน\n\n' +
            'วิธีต่อ: ขาหนึ่งของปุ่มเข้า "ขาอินพุต" ของบอร์ด อีกขาเข้า GND\n\n' +
            'พอกด → ขาอินพุตถูกดึงลง GND → บอร์ดอ่านได้ว่า "กด"\n\n' +
            'ปุ่มจึงไม่เกี่ยวกับการจ่ายไฟ มันแค่ "เปลี่ยนสถานะ" ของขาอินพุต' },

        { kind: 'wire', questId: 'bw_wire', npc: 'ค้างคาวปุ่มกด', emoji: '🦇',
          title: 'ต่อปุ่มกด A',
          brief: 'อีกขาของปุ่มต่อ GND ไว้แล้ว — ลาก "ขาสัญญาณ" ของปุ่มเข้าที่ที่ถูก พอกดจะดึงขาอินพุตลง GND (ห้ามเข้า VCC)',
          left: [{ id: 'btn', label: 'ปุ่ม A (ขาสัญญาณ)', art: 'button' }],
          right: [
            { id: 'io', label: 'ขาอินพุต (IO)', art: 'signal', wireType: 'sig' },
            { id: 'vcc', label: 'VCC (ห้ามต่อ)', art: 'vcc', wireType: 'pwr' },
            { id: 'pwr', label: 'อนุกรมกับแบต (ตัดไฟ)', art: 'battery' },
          ],
          pairs: [['btn', 'io']],
          traps: { 'btn->vcc': 'switch_no_path', 'btn->pwr': 'switch_as_power' },
          success: ['ใช่! กดแล้วขาอินพุตถูกดึงลง GND บอร์ดรู้ว่า "กด"'],
          error: ['ปุ่มต้องต่อขาอินพุตเพื่อ "เปลี่ยนสถานะ" ไม่ใช่ต่อ VCC หรือตัดไฟ'] },

        { kind: 'wire', questId: 'bw_wire_boss', boss: true, npc: 'ออร์คสี่ปุ่ม', emoji: '👹',
          title: 'BOSS: ต่อปุ่มเข้าอินพุต',
          brief: 'ต่อปุ่มทั้งสี่เข้า "ขาอินพุต (GPIO)" ของบอร์ด — จะเลือกขาไหนก็ได้ ' +
            'แต่ปุ่มละขา (ห้ามใช้ขาเดียวกันซ้ำ) และห้ามต่อเข้า VCC! (อีกขาของปุ่มต่อ GND ร่วมไว้แล้ว)',
          left: [
            { id: 'a', label: 'ปุ่ม A', art: 'button' },
            { id: 'b', label: 'ปุ่ม B', art: 'button' },
            { id: 'x', label: 'ปุ่ม X', art: 'button' },
            { id: 'y', label: 'ปุ่ม Y', art: 'button' },
          ],
          right: [
            { id: 'io1', label: 'GPIO 32 (อินพุต)', art: 'signal', group: 'in' },
            { id: 'io2', label: 'GPIO 33 (อินพุต)', art: 'signal', group: 'in' },
            { id: 'io3', label: 'GPIO 25 (อินพุต)', art: 'signal', group: 'in' },
            { id: 'io4', label: 'GPIO 26 (อินพุต)', art: 'signal', group: 'in' },
            { id: 'vr',  label: 'VCC (ห้ามต่อปุ่ม)', art: 'vcc', group: 'pwr' },
          ],
          need: 'in',
          trap: { pwr: 'switch_to_power' },
          success: ['ต่อครบสี่ปุ่ม! แต่ละปุ่มเข้าขาอินพุตคนละขา บอร์ดอ่านการกดได้แล้ว'],
          error: ['แต่ละปุ่มต้องเข้า "ขาอินพุต (GPIO)" คนละขา และห้ามต่อเข้า VCC'] },
      ],
    },

    // ── tier 3 (แตกสองกิ่ง) ─────────────────────────────────────────────────
    { id: 'common_ground', en: 'Common Ground', th: 'กราวด์ร่วม', fullTh: 'รวมกราวด์ร่วม (Common GND)',
      desc: 'ทุกชิ้นต้องอ้างอิง 0V จุดเดียวกัน ไม่งั้นค่าอนาล็อกเพี้ยน',
      teaches: ['common_ground'], requires: ['analog_wiring'],
      pretest: { q: 'ทำไมอนาล็อกสติ๊กกับ MCU ต้องใช้กราวด์ร่วมกัน?',
        choices: ['เพื่อความสวยงาม', 'เพื่อให้มีจุดอ้างอิงแรงดันเดียวกัน ค่าจึงถูก', 'เพื่อประหยัดแบต'], answer: 1 },
      chapter: 'CHAPTER 2', gameTitle: 'กราวด์ร่วม DUNGEON', maxReward: 12,
      intro: 'อนาล็อกวัดเป็น "แรงดันเทียบกราวด์" ถ้ากราวด์ไม่ร่วม ค่าจะมั่ว',
      steps: [
        { kind: 'dialogue', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
          text: 'ค่าอนาล็อกคือ "แรงดันเทียบกับ 0V" ถ้าสติ๊กกับ MCU วัด 0V กันคนละจุด ค่าก็เทียบกันไม่ได้\n\n' +
            'ฉะนั้น − ของแบต, GND อนาล็อกสติ๊ก, ขาล่างปุ่ม, GND มอเตอร์ ต้องมารวมที่ "จุด GND ร่วม" จุดเดียว\n\n' +
            'กราวด์ลอย = ค่าแกว่งมั่ว สติ๊กกระตุก' },

        { kind: 'diagnose', questId: 'cg_diag', npc: 'ผีน้อยมิเตอร์', emoji: '👻',
          title: 'หาเหตุสติ๊กกระตุก', brief: 'ดันสติ๊กแล้วค่าแกว่งมั่ว จิ้มวัดแต่ละเส้น หาเส้นที่ขาด แล้วต่อกลับ',
          circuit: {
            device: 'controller',
            a: { label: 'สติ๊ก', icon: '🕹' },
            b: { label: 'บอร์ด', icon: '🔲' },
            wires: [
              { probeId: 'vcc', label: 'VCC', color: '#E5484D', v: 3.30 },
              { probeId: 'wip', label: 'wiper', color: '#E5C237', v: 1.65 },
              { probeId: 'gnd', label: 'GND', color: '#9AA0A7', v: 0, broken: true },
            ],
          },
          probes: [
            { id: 'vcc', label: 'VCC สติ๊ก', reading: '3.30 V', ok: true },
            { id: 'wip', label: 'wiper', reading: 'ค่าแกว่งมั่ว', ok: false },
            { id: 'gnd', label: 'GND สติ๊ก', reading: 'ลอย (ไม่ต่อ)', ok: false, fault: true },
          ],
          faults: [
            { id: 'float_gnd', label: 'GND สติ๊กไม่ได้ต่อร่วม', correct: true },
            { id: 'no_power',  label: 'ไม่มีไฟเลี้ยง', mis: 'misread_vcc' },
            { id: 'bad_stick', label: 'สติ๊กพังถาวร', mis: 'blame_part' },
          ],
          success: ['ถูก! GND ลอยทำให้ไม่มีจุดอ้างอิง ค่าจึงแกว่ง'],
          error: ['VCC ปกติ แต่ GND ลอย นั่นแหละต้นเหตุของค่าแกว่ง'] },

        { kind: 'wire', questId: 'cg_wire_boss', boss: true, npc: 'ออร์คกราวด์แตก', emoji: '👹',
          title: 'BOSS: รวมกราวด์ร่วม', brief: 'ลาก GND ของทุกชิ้นเข้า "จุดกราวด์ร่วม" จุดเดียว อย่าต่อไปฝั่งไฟบวก!',
          left: [
            { id: 'g_batt',  label: '− แบต', art: 'battery' },
            { id: 'g_stick', label: 'GND สติ๊ก', art: 'stick' },
            { id: 'g_btn',   label: 'ขาล่างปุ่ม', art: 'button' },
            { id: 'g_motor', label: 'GND มอเตอร์', art: 'motor' },
          ],
          right: [
            { id: 'gnd_node', label: 'จุดกราวด์ร่วม (GND)', art: 'gnd', wireType: 'gnd' },
            { id: 'v_node',   label: 'ฝั่งไฟบวก (+)', art: 'vcc', wireType: 'pwr' },
          ],
          pairs: [['g_batt', 'gnd_node'], ['g_stick', 'gnd_node'], ['g_btn', 'gnd_node'], ['g_motor', 'gnd_node']],
          traps: { 'g_batt->v_node': 'ground_to_power', 'g_stick->v_node': 'ground_to_power', 'g_btn->v_node': 'ground_to_power', 'g_motor->v_node': 'ground_to_power' },
          success: ['ทุกกราวด์รวมเป็นจุดเดียว ระบบมีจุดอ้างอิงเดียวกันแล้ว!'],
          error: ['อย่าเอากราวด์ไปต่อฝั่งไฟบวก — กราวด์ทุกชิ้นต้องไปจุด GND ร่วม'] },
      ],
    },

    { id: 'motor_drive', en: 'Drive the Motor', th: 'ขับมอเตอร์สั่น', fullTh: 'ต่อวงจรขับมอเตอร์สั่น',
      desc: 'ใช้ทรานซิสเตอร์เป็นสวิตช์ + ไดโอดกันไฟย้อน',
      teaches: ['motor_drive'], requires: ['switch_input'],
      pretest: { q: 'ทำไมไม่ควรต่อมอเตอร์สั่นเข้าขา MCU โดยตรง?',
        choices: ['มอเตอร์กินกระแสมากเกินขา MCU จะเสียหาย', 'มอเตอร์ทำงานช้าลง', 'ไม่มีปัญหาอะไร'], answer: 0 },
      chapter: 'CHAPTER 2', gameTitle: 'ขับมอเตอร์สั่น DUNGEON', maxReward: 14,
      intro: 'มอเตอร์สั่นคือของว้าวของจอย แต่ต่อตรงขา MCU ไม่ได้ ต้องมีตัวช่วย',
      steps: [
        { kind: 'dialogue', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
          text: 'มอเตอร์กินกระแสเยอะกว่าที่ขา MCU จ่ายไหว ถ้าต่อตรง ขา MCU พังได้\n\n' +
            'วิธีที่ถูก:\n' +
            '• ใช้ "ทรานซิสเตอร์" เป็นสวิตช์ — MCU สั่งที่ขา B (ผ่าน R) แล้วทรานซิสเตอร์เปิดทางให้กระแสใหญ่ไหลผ่านมอเตอร์\n' +
            '• ใส่ "ไดโอดกันไฟย้อน" (flyback) คร่อมมอเตอร์ — ตอนมอเตอร์หยุด จะเกิดไฟกระชากย้อน ไดโอดช่วยดูดทิ้ง ไม่ให้ทรานซิสเตอร์พัง\n\n' +
            'ไดโอดต้องคร่อมถูกขั้ว (แถบแคโทดไปฝั่ง +)' },

        { kind: 'wire', questId: 'md_wire', npc: 'โครงกระดูกขับมอเตอร์', emoji: '💀',
          title: 'ต่อชุดขับมอเตอร์',
          brief: 'มอเตอร์กินกระแสเยอะ ห้ามต่อเข้าขา MCU ตรง ๆ! ลากให้ถูก: MCU สั่งผ่านทรานซิสเตอร์ และไดโอดกันไฟย้อน',
          left: [
            { id: 'mcu', label: 'ขาสัญญาณจาก MCU', art: 'mcu' },
            { id: 'diode', label: 'ไดโอดกันไฟย้อน', art: 'diode' },
          ],
          right: [
            { id: 'base', label: 'ขาเบส (B) ทรานซิสเตอร์', art: 'transistor', wireType: 'sig' },
            { id: 'motor', label: 'ขามอเตอร์ตรง ๆ', art: 'motor' },
            { id: 'across', label: 'คร่อมขั้วมอเตอร์', art: 'motor' },
          ],
          pairs: [['mcu', 'base'], ['diode', 'across']],
          traps: { 'mcu->motor': 'mcu_direct_drive', 'mcu->across': 'mcu_direct_drive', 'diode->base': 'no_flyback' },
          success: ['ถูก! MCU สั่งผ่านทรานซิสเตอร์ ไดโอดกันไฟย้อน'],
          error: ['MCU เข้าขา B (ไม่ใช่มอเตอร์ตรง) และไดโอดต้องคร่อมมอเตอร์'] },

        { kind: 'wire', questId: 'md_wire_boss', boss: true, npc: 'ออร์คมอเตอร์คลั่ง', emoji: '👹',
          title: 'BOSS: ต่อวงจรขับมอเตอร์', brief: 'ต่อชุดขับมอเตอร์ให้ครบ อย่าต่อมอเตอร์เข้าขา MCU ตรง และอย่าลืมไดโอด!',
          left: [
            { id: 'mcu',   label: 'ขาสัญญาณสั่งจาก MCU', art: 'mcu' },
            { id: 'mpos',  label: 'ขั้วบวกมอเตอร์ (+)', art: 'motor' },
            { id: 'mneg',  label: 'ขั้วลบมอเตอร์ (−)', art: 'motor' },
            { id: 'diode', label: 'ไดโอดกันไฟย้อน', art: 'diode' },
          ],
          right: [
            { id: 'base',   label: 'ขาเบส (B) ผ่านตัวต้านทาน', art: 'transistor', wireType: 'sig' },
            { id: 'vcc',    label: 'ไฟเลี้ยง VCC', art: 'vcc', wireType: 'pwr' },
            { id: 'coll',   label: 'ขาคอลเลกเตอร์ (C)', art: 'transistor' },
            { id: 'across', label: 'คร่อมขั้วมอเตอร์ (แคโทด→+)', art: 'motor' },
          ],
          pairs: [['mcu', 'base'], ['mpos', 'vcc'], ['mneg', 'coll'], ['diode', 'across']],
          traps: { 'mcu->coll': 'mcu_direct_drive', 'mcu->vcc': 'mcu_direct_drive', 'diode->vcc': 'diode_misplaced' },
          success: ['สำเร็จ! MCU สั่งผ่านทรานซิสเตอร์ มอเตอร์สั่นได้ ไดโอดกันไฟย้อนพร้อม'],
          error: ['MCU เข้าขา B เท่านั้น (ไม่ใช่มอเตอร์ตรง) และไดโอดต้องคร่อมมอเตอร์'] },
      ],
    },

    // ── tier 4 (บอสใหญ่สุดของ topic) ────────────────────────────────────────
    { id: 'full_circuit', en: 'Full Controller Circuit', th: 'ประกอบทั้งตัว', fullTh: 'ประกอบวงจรจอยทั้งตัว',
      desc: 'รวมไฟ + อนาล็อก + ปุ่ม + มอเตอร์ + กราวด์ร่วม เป็นวงจรเดียว',
      teaches: ['full_circuit'], requires: ['common_ground', 'motor_drive'],
      pretest: { q: 'ก่อนบอกว่า "ต่อวงจรจอยเสร็จ" ควรทำสิ่งใด?',
        choices: ['ตรวจขั้วไฟ กราวด์ร่วม และไดโอดกันไฟย้อนให้ครบก่อนจ่ายไฟ', 'รีบใส่แบตแล้วกดเล่นเลย', 'ต่อแค่อนาล็อกพอ'], answer: 0 },
      chapter: 'CHAPTER 3', gameTitle: 'ประกอบวงจรจอย FINAL BOSS', maxReward: 20,
      intro: 'ด่านรวมทุกความรู้! ต่อไฟ–อนาล็อก–ปุ่ม–มอเตอร์–กราวด์ร่วม ผิดขั้วแม้เส้นเดียว = แพ้',
      steps: [
        { kind: 'dialogue', npc: 'ศาสตราจารย์ฮิปโป', emoji: '🦛',
          text: 'ถึงด่านสุดท้าย — ประกอบวงจรจอยทั้งตัว\n\n' +
            'ตรวจ checklist ก่อนจ่ายไฟเสมอ:\n' +
            '• ขั้วไฟถูกทาง (+ เข้า +)\n' +
            '• wiper อนาล็อกเข้า ADC, ปลายเข้า VCC/GND\n' +
            '• ปุ่มเข้าขาอินพุต ไม่ใช่ราง VCC\n' +
            '• มอเตอร์ขับผ่านทรานซิสเตอร์ + มีไดโอดกันไฟย้อน\n' +
            '• กราวด์ทุกชิ้นรวมจุดเดียว\n\n' +
            'ครบแล้วค่อยใส่แบต แล้วทดสอบ' },

        { kind: 'sequence', questId: 'fc_seq', npc: 'โครงกระดูกหัวหน้า', emoji: '💀',
          title: 'ลำดับประกอบจอย', brief: 'เรียงขั้นตอนประกอบ ตั้งแต่ยังไม่จ่ายไฟจนพร้อมเล่น',
          items: [
            { id: 'p_gnd',   label: 'วางกราวด์ร่วมก่อน', art: 'gnd' },
            { id: 'p_pow',   label: 'ต่อแหล่งจ่ายไฟถูกขั้ว', art: 'battery' },
            { id: 'p_stick', label: 'ต่ออนาล็อกสติ๊ก (VCC/GND/wiper)', art: 'stick' },
            { id: 'p_btn',   label: 'ต่อปุ่มเข้าขาอินพุต', art: 'button' },
            { id: 'p_motor', label: 'ต่อชุดขับมอเตอร์ + ไดโอด', art: 'motor' },
            { id: 'p_test',  label: 'จ่ายไฟ แล้วทดสอบ', art: 'test' },
          ],
          correctOrder: ['p_gnd', 'p_pow', 'p_stick', 'p_btn', 'p_motor', 'p_test'],
          success: ['ลำดับประกอบถูกต้อง!'],
          error: ['วางกราวด์ร่วม + ไฟให้พร้อมก่อน แล้วทดสอบเป็นขั้นสุดท้าย'] },

        { kind: 'diagnose', questId: 'fc_diag', npc: 'ผีน้อยตรวจไฟ', emoji: '👻',
          title: 'จอยมอเตอร์ไม่สั่น', brief: 'ทุกอย่างปกติแต่มอเตอร์ไม่สั่น จิ้มวัดหาเส้นที่ขาด แล้วต่อกลับ',
          circuit: {
            a: { label: 'MCU', icon: '🧠' },
            b: { label: 'ทรานซิสเตอร์', icon: '🎚' },
            wires: [
              { probeId: 'sig', label: 'สัญญาณ', color: '#3A86E0', v: 3.30 },
              { probeId: 'base', label: 'ขา B', color: '#9AA0A7', v: 0, broken: true },
              { probeId: 'mvcc', label: 'ไฟมอเตอร์', color: '#E5484D', v: 5.00 },
            ],
          },
          probes: [
            { id: 'sig', label: 'สัญญาณจาก MCU', reading: 'มีสั่งออกมา', ok: true },
            { id: 'base', label: 'ขา B ทรานซิสเตอร์', reading: 'ไม่ได้ต่อ (ลอย)', ok: false, fault: true },
            { id: 'mvcc', label: 'ไฟเลี้ยงฝั่งมอเตอร์', reading: 'มีไฟปกติ', ok: true },
          ],
          faults: [
            { id: 'base_float', label: 'ขา B ทรานซิสเตอร์ไม่ได้ต่อกับ MCU', correct: true },
            { id: 'motor_dead', label: 'มอเตอร์พัง', mis: 'blame_part' },
            { id: 'no_power',   label: 'ไม่มีไฟเลี้ยง', mis: 'misread_power' },
          ],
          success: ['ถูก! MCU สั่งแล้วแต่ขา B ลอย ทรานซิสเตอร์เลยไม่เปิด มอเตอร์จึงไม่สั่น'],
          error: ['MCU สั่งปกติ ไฟมอเตอร์ปกติ แต่ขา B ลอย — สัญญาณไปไม่ถึงทรานซิสเตอร์'] },

        { kind: 'wire', questId: 'fc_wire_boss', boss: true, npc: 'จอมมารวงจรจอย', emoji: '🐲',
          title: 'FINAL BOSS: ต่อวงจรจอยทั้งตัว',
          brief: 'รวมทุกอย่าง! ไฟ–อนาล็อก–ปุ่ม–มอเตอร์–กราวด์ร่วม ครบและถูกขั้ว ผิดแม้เส้นเดียว = แพ้',
          left: [
            { id: 'bp',   label: '+ แบต', art: 'battery' },
            { id: 'wip',  label: 'wiper อนาล็อก', art: 'wiper' },
            { id: 'btn',  label: 'ปุ่มกด', art: 'button' },
            { id: 'mctl', label: 'ขา MCU คุมมอเตอร์', art: 'mcu' },
            { id: 'allg', label: 'กราวด์ทุกชิ้น (−)', art: 'gnd' },
          ],
          right: [
            { id: 'r_vcc',  label: 'ราง VCC บอร์ด', art: 'vcc', wireType: 'pwr' },
            { id: 'r_adc',  label: 'ขา ADC', art: 'signal', wireType: 'sig' },
            { id: 'r_io',   label: 'ขาอินพุตปุ่ม', art: 'signal', wireType: 'sig' },
            { id: 'r_base', label: 'ขา B ทรานซิสเตอร์', art: 'transistor' },
            { id: 'r_gnd',  label: 'จุดกราวด์ร่วม', art: 'gnd', wireType: 'gnd' },
          ],
          pairs: [['bp', 'r_vcc'], ['wip', 'r_adc'], ['btn', 'r_io'], ['mctl', 'r_base'], ['allg', 'r_gnd']],
          traps: {
            'bp->r_gnd': 'reverse_polarity',
            'allg->r_vcc': 'ground_to_power',
            'wip->r_vcc': 'wiper_to_power',
            'btn->r_vcc': 'switch_to_power',
            'mctl->r_vcc': 'mcu_direct_drive',
          },
          success: ['สำเร็จ! วงจรจอยครบทั้งตัว ไฟถูกขั้ว อนาล็อกเข้า ADC ปุ่มเข้าอินพุต มอเตอร์ขับผ่านทรานซิสเตอร์ กราวด์ร่วมเดียว'],
          error: ['ยังมีเส้นผิด! ไฟ→VCC, wiper→ADC, ปุ่ม→อินพุต, MCU→ขา B, กราวด์ทุกชิ้น→จุด GND ร่วม'] },
      ],
    },

  ],
}
