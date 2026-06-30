// ============================================================================
//  art/parts.js — ภาพวาดชิ้นส่วน "ของจริง" (สมจริง) ของจอยคอนโทรลเลอร์
//  ใช้ในเกม sort:  <PartArt kind="battery" w={48} />  (ทุกชิ้นวาดบน viewBox 0 0 100 100)
//  เพิ่มชิ้นใหม่ = เขียน component + ใส่ใน BODY + เติมชื่อใน PART_KINDS
// ============================================================================
import React from 'react';
import Svg, {
  Rect, Circle, Line, Path, G, Ellipse,
  Defs, LinearGradient, RadialGradient, Stop, Text as SvgText,
} from 'react-native-svg';

export const PART_KINDS = [
  'battery', 'holder', 'stick', 'buttons', 'mcu', 'motor', 'trace',
  // ชิ้นส่วนอิเล็กทรอนิกส์ 3D (ใช้ในเกม sort — แยกชื่อจากสัญลักษณ์ schematic ของเกม wire)
  'to92', 'resistorAxial', 'capElec', 'relayBox', 'ldo', 'antenna',
];
export const hasPartArt = (k) => PART_KINDS.includes(k);

// ── แบตเตอรี่ LiPo (ถุงนิ่ม + สายแดง/ดำ + ฉลาก) ───────────────────────────────
function Battery() {
  return (
    <G>
      {/* สายไฟออกด้านบน */}
      <Path d="M41 30 V13" stroke="#D8423E" strokeWidth="3.2" strokeLinecap="round" />
      <Path d="M59 30 V13" stroke="#2A2A30" strokeWidth="3.2" strokeLinecap="round" />
      <Rect x="36.5" y="11" width="9" height="5" rx="1.6" fill="#D9B24A" />
      <Rect x="54.5" y="11" width="9" height="5" rx="1.6" fill="#D9B24A" />
      {/* รอยซีลขอบบน */}
      <Rect x="25" y="24" width="50" height="9" rx="3" fill="#B9BEC4" stroke="#8C9197" strokeWidth="0.8" />
      {/* ตัวถุง */}
      <Rect x="27" y="30" width="46" height="52" rx="6" fill="url(#pa_lipo)" stroke="#7D8288" strokeWidth="1.4" />
      {/* ฉลาก */}
      <Rect x="32" y="44" width="36" height="27" rx="3.5" fill="url(#pa_label)" stroke="#1C4A78" strokeWidth="0.8" />
      <SvgText x="50" y="56" fontSize="9" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">Li-Po</SvgText>
      <SvgText x="50" y="66" fontSize="6.5" fill="#CFE0F5" textAnchor="middle">3.7V</SvgText>
      {/* ไฮไลต์ */}
      <Rect x="30" y="32" width="5" height="48" rx="2.5" fill="#FFFFFF" opacity="0.28" />
    </G>
  );
}

// ── ขั้วใส่แบต (battery holder) ───────────────────────────────────────────────
function Holder() {
  return (
    <G>
      <Rect x="13" y="29" width="74" height="46" rx="8" fill="url(#pa_holder)" stroke="#1A0E08" strokeWidth="1.6" />
      <Rect x="20" y="36" width="60" height="32" rx="5" fill="#2A1810" />
      {/* ช่องใส่ถ่านทรงกระบอก */}
      <Rect x="25" y="43" width="50" height="18" rx="9" fill="#3A2A1A" stroke="#1A0E08" strokeWidth="1" />
      <Rect x="28" y="45" width="44" height="4" rx="2" fill="#5A4632" />
      {/* สปริงลบฝั่งซ้าย */}
      <Path d="M28 46 q4 1.6 0 3.2 q-4 1.6 0 3.2 q4 1.6 0 3.2 q-4 1.6 0 3.2" fill="none" stroke="#D6DADF" strokeWidth="1.7" />
      {/* แผ่นสัมผัสบวกฝั่งขวา */}
      <Rect x="70" y="47" width="5" height="11" rx="1.5" fill="#D6DADF" stroke="#9A9FA6" strokeWidth="0.7" />
      {/* สายออก */}
      <Path d="M40 75 V88" stroke="#D8423E" strokeWidth="3.2" strokeLinecap="round" />
      <Path d="M58 75 V88" stroke="#2A2A30" strokeWidth="3.2" strokeLinecap="round" />
      {/* ไฮไลต์ + เครื่องหมาย */}
      <Rect x="17" y="32" width="66" height="4" rx="2" fill="#FFFFFF" opacity="0.12" />
      <SvgText x="30" y="34" fontSize="8" fontWeight="bold" fill="#8A9097" textAnchor="middle">−</SvgText>
      <SvgText x="71" y="34" fontSize="7" fontWeight="bold" fill="#8A9097" textAnchor="middle">+</SvgText>
    </G>
  );
}

// ── อนาล็อกสติ๊ก (thumbstick module) ─────────────────────────────────────────
function Stick() {
  return (
    <G>
      <Rect x="22" y="26" width="56" height="52" rx="5" fill="url(#pa_pcb)" stroke="#0D2C15" strokeWidth="1.4" />
      <Rect x="26" y="30" width="48" height="44" rx="3" fill="none" stroke="#5BBF7E" strokeWidth="0.8" opacity="0.5" />
      {/* โพเทนชิโอมิเตอร์โลหะ 2 ตัว */}
      <Rect x="15" y="42" width="11" height="22" rx="2.5" fill="url(#pa_metal)" stroke="#7D8288" strokeWidth="1" />
      <Rect x="42" y="15" width="22" height="11" rx="2.5" fill="url(#pa_metal)" stroke="#7D8288" strokeWidth="1" />
      {/* ขายึดมุมโลหะ */}
      {[[27, 31], [73, 31], [27, 73], [73, 73]].map(([cx, cy], i) => (
        <Circle key={i} cx={cx} cy={cy} r="3" fill="#C8CCD1" stroke="#8A8F96" strokeWidth="0.6" />
      ))}
      {/* ฝานิ้วโป้ง */}
      <Circle cx="50" cy="52" r="22" fill="#1A0E08" />
      <Circle cx="50" cy="52" r="20.5" fill="url(#pa_dome)" />
      <Circle cx="50" cy="52" r="12.5" fill="none" stroke="#000000" strokeWidth="3" opacity="0.45" />
      <Ellipse cx="43" cy="45" rx="8" ry="5" fill="#FFFFFF" opacity="0.18" />
    </G>
  );
}

// ── ปุ่ม A/B/X/Y (4 ปุ่ม ผิวมันเงา) ──────────────────────────────────────────
function Buttons() {
  const btn = (cx, cy, top, bot, ch) => (
    <G>
      <Circle cx={cx} cy={cy + 1.5} r="13" fill="#000000" opacity="0.32" />
      <Circle cx={cx} cy={cy} r="13" fill={bot} />
      <Circle cx={cx} cy={cy - 0.5} r="11.3" fill={top} />
      <Ellipse cx={cx - 3.5} cy={cy - 5} rx="5.5" ry="3.2" fill="#FFFFFF" opacity="0.42" />
      <SvgText x={cx} y={cy + 4} fontSize="11" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">{ch}</SvgText>
    </G>
  );
  return (
    <G>
      {btn(50, 23, '#F2D04B', '#A8861A', 'Y')}
      {btn(25, 49, '#5A9BF0', '#2F5AA8', 'X')}
      {btn(75, 49, '#F0595E', '#A82C30', 'B')}
      {btn(50, 75, '#54C06F', '#2A8A44', 'A')}
    </G>
  );
}

// ── ชิป MCU + RF (โมดูล ESP มี shield โลหะ + เสาอากาศ) ────────────────────────
function Mcu() {
  return (
    <G>
      <Rect x="19" y="28" width="62" height="58" rx="4" fill="url(#pa_pcb)" stroke="#0D2C15" strokeWidth="1.4" />
      {/* ขา castellated รอบ ๆ */}
      {[0, 1, 2, 3, 4, 5, 6].map(i => (
        <Rect key={'b' + i} x={23 + i * 8.3} y="82" width="5" height="5" rx="1" fill="#E0B24A" />
      ))}
      {[0, 1, 2, 3, 4].map(i => (
        <G key={'s' + i}>
          <Rect x="15" y={40 + i * 8} width="5" height="5" rx="1" fill="#E0B24A" />
          <Rect x="80" y={40 + i * 8} width="5" height="5" rx="1" fill="#E0B24A" />
        </G>
      ))}
      {/* เสาอากาศ */}
      <Path d="M29 28 V16 H37 V22 H45 V16 H53 V22 H61 V16 H69 V28"
        fill="none" stroke="#E0B24A" strokeWidth="2.6" strokeLinejoin="round" />
      {/* shield โลหะ */}
      <Rect x="27" y="36" width="46" height="42" rx="2.5" fill="url(#pa_metal)" stroke="#6F747A" strokeWidth="1.4" />
      <Rect x="31" y="40" width="38" height="34" rx="1.5" fill="none" stroke="#AEB3B9" strokeWidth="0.7" />
      <Path d="M31 40 H45 L33 74 H31 Z" fill="#FFFFFF" opacity="0.1" />
      <SvgText x="50" y="60" fontSize="8.5" fontWeight="bold" fill="#41464C" textAnchor="middle" fontFamily="monospace">ESP32</SvgText>
    </G>
  );
}

// ── มอเตอร์สั่น (coin vibration motor) ───────────────────────────────────────
function Motor() {
  return (
    <G>
      <Circle cx="50" cy="46" r="30" fill="url(#pa_coin)" stroke="#7D8288" strokeWidth="1.6" />
      <Circle cx="50" cy="46" r="30" fill="none" stroke="#FFFFFF" strokeWidth="1" opacity="0.22" />
      <Circle cx="50" cy="46" r="20" fill="#33363B" stroke="#1A1C1F" strokeWidth="1" />
      {/* น้ำหนักเยื้องศูนย์ */}
      <Path d="M50 26 A20 20 0 0 1 70 46 L50 46 Z" fill="#454950" opacity="0.65" />
      <Circle cx="50" cy="46" r="5.5" fill="#5C6066" stroke="#2A2D31" strokeWidth="1" />
      <Circle cx="50" cy="46" r="2" fill="#2A2D31" />
      <Ellipse cx="40" cy="36" rx="10" ry="6" fill="#FFFFFF" opacity="0.22" />
      {/* ขั้วต่อ flex */}
      <Rect x="44" y="74" width="12" height="10" rx="2" fill="#D99A2A" stroke="#A8741A" strokeWidth="0.8" />
      <Rect x="46.5" y="76.5" width="2.6" height="5" fill="#8A5E15" />
      <Rect x="51" y="76.5" width="2.6" height="5" fill="#8A5E15" />
    </G>
  );
}

// ── ลายทองแดงบนบอร์ด (copper trace) ──────────────────────────────────────────
function Trace() {
  return (
    <G>
      <Rect x="14" y="22" width="72" height="56" rx="6" fill="url(#pa_grn)" stroke="#0F4F29" strokeWidth="1.6" />
      <Rect x="14" y="22" width="72" height="6" rx="3" fill="#FFFFFF" opacity="0.08" />
      <Path d="M22 66 H40 V40 H56 V62 H72 V32"
        fill="none" stroke="#E8C062" strokeWidth="3.6" strokeLinejoin="round" strokeLinecap="round" />
      <Path d="M22 50 H30 V32 H48"
        fill="none" stroke="#E8C062" strokeWidth="3.6" strokeLinejoin="round" strokeLinecap="round" />
      {[[22, 66], [72, 32], [22, 50], [48, 32]].map(([cx, cy], i) => (
        <G key={i}>
          <Circle cx={cx} cy={cy} r="4.2" fill="#EFCE76" stroke="#A8821F" strokeWidth="0.8" />
          <Circle cx={cx} cy={cy} r="1.7" fill="#5A4410" />
        </G>
      ))}
    </G>
  );
}

// ── ทรานซิสเตอร์ TO-92 (อีพ็อกซีดำ หน้าตัดแบน + 3 ขา) ────────────────────────
function To92() {
  return (
    <G>
      <Rect x="35" y="58" width="3.4" height="30" rx="1" fill="url(#pa_metal)" stroke="#8A8F96" strokeWidth="0.5" />
      <Rect x="48.3" y="58" width="3.4" height="32" rx="1" fill="url(#pa_metal)" stroke="#8A8F96" strokeWidth="0.5" />
      <Rect x="61.6" y="58" width="3.4" height="30" rx="1" fill="url(#pa_metal)" stroke="#8A8F96" strokeWidth="0.5" />
      <Path d="M30 32 Q30 22 40 22 H60 Q70 22 70 32 V50 Q70 62 58 62 H42 Q30 62 30 50 Z" fill="url(#pa_epoxy)" stroke="#0A0A0E" strokeWidth="1.4" />
      <Path d="M33 35 H67" stroke="#6A6A72" strokeWidth="1" opacity="0.5" />
      <Ellipse cx="44" cy="33" rx="9" ry="4" fill="#FFFFFF" opacity="0.12" />
      <SvgText x="50" y="51" fontSize="8" fill="#B8BCC4" textAnchor="middle" fontFamily="monospace">Q</SvgText>
    </G>
  );
}

// ── ตัวต้านทาน (axial ตัวถังครีม + แถบสี + ขาลวด) ─────────────────────────────
function ResistorAxial() {
  return (
    <G>
      <Line x1="6" y1="50" x2="30" y2="50" stroke="#B0B4B9" strokeWidth="2.4" strokeLinecap="round" />
      <Line x1="70" y1="50" x2="94" y2="50" stroke="#B0B4B9" strokeWidth="2.4" strokeLinecap="round" />
      <Rect x="28" y="38" width="44" height="24" rx="12" fill="url(#pa_tan)" stroke="#9A7B45" strokeWidth="1.2" />
      <Rect x="35" y="38" width="4" height="24" fill="#7A4A1E" />
      <Rect x="43" y="38" width="4" height="24" fill="#D03A2E" />
      <Rect x="51" y="38" width="4" height="24" fill="#C9A23A" />
      <Rect x="61" y="38" width="3.5" height="24" fill="#D0B068" />
      <Rect x="30" y="40" width="40" height="4" rx="2" fill="#FFFFFF" opacity="0.25" />
    </G>
  );
}

// ── คาปาซิเตอร์อิเล็กโทรไลต์ (กระป๋องน้ำเงิน + แถบลบ + 2 ขา) ──────────────────
function CapElec() {
  return (
    <G>
      <Line x1="42" y1="68" x2="42" y2="86" stroke="#B0B4B9" strokeWidth="2.4" strokeLinecap="round" />
      <Line x1="58" y1="68" x2="58" y2="86" stroke="#B0B4B9" strokeWidth="2.4" strokeLinecap="round" />
      <Rect x="34" y="22" width="32" height="48" rx="7" fill="url(#pa_blue)" stroke="#16335C" strokeWidth="1.4" />
      <Ellipse cx="50" cy="24" rx="16" ry="4.5" fill="#4A82C4" stroke="#16335C" strokeWidth="1" />
      <Rect x="56" y="27" width="8" height="40" rx="4" fill="#DCE6F2" opacity="0.85" />
      <SvgText x="60" y="50" fontSize="9" fill="#16335C" textAnchor="middle" fontWeight="bold">−</SvgText>
      <Rect x="37" y="26" width="5" height="40" rx="2.5" fill="#FFFFFF" opacity="0.25" />
    </G>
  );
}

// ── รีเลย์ (กล่องน้ำเงิน + ขาล่าง + ป้าย) ─────────────────────────────────────
function RelayBox() {
  return (
    <G>
      {[40, 50, 60].map((x, i) => <Rect key={i} x={x - 1.5} y="68" width="3" height="16" rx="1" fill="url(#pa_metal)" stroke="#8A8F96" strokeWidth="0.4" />)}
      <Rect x="30" y="26" width="40" height="44" rx="4" fill="url(#pa_blue)" stroke="#16335C" strokeWidth="1.4" />
      <Rect x="30" y="26" width="40" height="9" rx="4" fill="#4A82C4" opacity="0.6" />
      <SvgText x="50" y="52" fontSize="8.5" fill="#DCE6F2" textAnchor="middle" fontWeight="bold" fontFamily="monospace">RELAY</SvgText>
      <Rect x="33" y="30" width="5" height="36" rx="2.5" fill="#FFFFFF" opacity="0.18" />
    </G>
  );
}

// ── ตัวจ่ายไฟ LDO (ชิปดำเล็ก + แท็บโลหะ + 3 ขา) ──────────────────────────────
function Ldo() {
  return (
    <G>
      {[42, 50, 58].map((x, i) => <Rect key={i} x={x - 1.4} y="60" width="2.8" height="22" rx="1" fill="url(#pa_metal)" stroke="#8A8F96" strokeWidth="0.4" />)}
      <Rect x="38" y="27" width="24" height="9" rx="2" fill="url(#pa_metal)" stroke="#7D8288" strokeWidth="0.8" />
      <Rect x="34" y="34" width="32" height="27" rx="3" fill="url(#pa_epoxy)" stroke="#0A0A0E" strokeWidth="1.3" />
      <SvgText x="50" y="51" fontSize="7" fill="#B8BCC4" textAnchor="middle" fontFamily="monospace">LDO</SvgText>
      <Rect x="36" y="37" width="5" height="20" rx="2" fill="#FFFFFF" opacity="0.1" />
    </G>
  );
}

// ── เสาอากาศ PCB (แผ่นเขียว + ลายทองแบบ meander) ─────────────────────────────
function Antenna() {
  return (
    <G>
      <Rect x="22" y="30" width="56" height="40" rx="5" fill="url(#pa_grn)" stroke="#0F4F29" strokeWidth="1.4" />
      <Rect x="22" y="30" width="56" height="5" rx="2.5" fill="#FFFFFF" opacity="0.08" />
      <Path d="M30 60 V42 H40 V58 H50 V42 H60 V58 H70 V40"
        fill="none" stroke="#E8C062" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round" />
      <Circle cx="30" cy="60" r="3.4" fill="#EFCE76" stroke="#A8821F" strokeWidth="0.7" />
    </G>
  );
}

const BODY = {
  battery: Battery, holder: Holder, stick: Stick,
  buttons: Buttons, mcu: Mcu, motor: Motor, trace: Trace,
  to92: To92, resistorAxial: ResistorAxial, capElec: CapElec,
  relayBox: RelayBox, ldo: Ldo, antenna: Antenna,
};

export function PartArt({ kind, w = 48 }) {
  const Body = BODY[kind];
  if (!Body) return null;
  return (
    <Svg width={w} height={w} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="pa_lipo" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#EEF1F4" /><Stop offset="0.5" stopColor="#C4C9CF" /><Stop offset="1" stopColor="#A4AAB1" />
        </LinearGradient>
        <LinearGradient id="pa_label" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E2A648" /><Stop offset="1" stopColor="#A8741E" />
        </LinearGradient>
        <LinearGradient id="pa_pcb" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#C9A24A" /><Stop offset="1" stopColor="#8A6A22" />
        </LinearGradient>
        <LinearGradient id="pa_holder" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#4A3826" /><Stop offset="1" stopColor="#2A1810" />
        </LinearGradient>
        <LinearGradient id="pa_metal" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#e4e7ea" /><Stop offset="0.5" stopColor="#c0c5cb" /><Stop offset="1" stopColor="#9aa0a7" />
        </LinearGradient>
        <LinearGradient id="pa_grn" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2a9d54" /><Stop offset="1" stopColor="#176b38" />
        </LinearGradient>
        <RadialGradient id="pa_dome" cx="0.4" cy="0.32" r="0.8">
          <Stop offset="0" stopColor="#5A4632" /><Stop offset="0.7" stopColor="#2E1F14" /><Stop offset="1" stopColor="#1A0E08" />
        </RadialGradient>
        <RadialGradient id="pa_coin" cx="0.4" cy="0.35" r="0.85">
          <Stop offset="0" stopColor="#eef1f4" /><Stop offset="0.6" stopColor="#c0c5cb" /><Stop offset="1" stopColor="#9aa0a7" />
        </RadialGradient>
        <LinearGradient id="pa_epoxy" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#4A4A52" /><Stop offset="1" stopColor="#16161C" />
        </LinearGradient>
        <LinearGradient id="pa_tan" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#EAD6AE" /><Stop offset="1" stopColor="#C9A86E" />
        </LinearGradient>
        <LinearGradient id="pa_blue" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#3F74B4" /><Stop offset="1" stopColor="#1C3E6E" />
        </LinearGradient>
      </Defs>
      {/* เงาสัมผัสใต้ชิ้นส่วน — ให้ดูวางอยู่จริง */}
      <Ellipse cx="50" cy="92" rx="30" ry="5" fill="#000000" opacity="0.16" />
      <Body />
    </Svg>
  );
}
