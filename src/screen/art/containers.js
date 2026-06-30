// ============================================================================
//  art/containers.js — ภาพวาดประกอบฉาก
//    • CardboardBox : ลังกระดาษเปิดฝา (isometric) — ปลายทางหย่อนของในเกม sort
//    • BatteryRail  : รางใส่ถ่าน AA (simulation) — ใช้ในเกม polarity
// ============================================================================
import React from 'react';
import Svg, {
  Rect, Circle, Path, G,
  Defs, LinearGradient, Stop, Text as SvgText,
} from 'react-native-svg';

// ── กล่องลังกระดาษเปิดฝา (isometric) — ปลายทางหย่อนของ ────────────────────────
export function CardboardBox({ w = '100%', h = 132, ready = false }) {
  const flap = ready ? 'url(#cb_glow)' : 'url(#cb_flap)';
  const inside = ready ? '#3E4E29' : '#5A4022';
  return (
    <Svg width={w} height={h} viewBox="0 0 220 196" preserveAspectRatio="xMidYMid meet">
      <Defs>
        <LinearGradient id="cb_flap" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#E6CB90" /><Stop offset="1" stopColor="#C9A363" />
        </LinearGradient>
        <LinearGradient id="cb_glow" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#C7DD9A" /><Stop offset="1" stopColor="#9FC56E" />
        </LinearGradient>
        <LinearGradient id="cb_left" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#C79C5E" /><Stop offset="1" stopColor="#B5874A" />
        </LinearGradient>
        <LinearGradient id="cb_right" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#A87C44" /><Stop offset="1" stopColor="#8B6234" />
        </LinearGradient>
      </Defs>

      {/* ตัวกล่อง (สองหน้าหน้า) */}
      <Path d="M38,96 L110,134 L110,184 L38,152 Z" fill="url(#cb_left)" stroke="#6E4F2E" strokeWidth="1.6" strokeLinejoin="round" />
      <Path d="M110,134 L182,96 L182,152 L110,184 Z" fill="url(#cb_right)" stroke="#6E4F2E" strokeWidth="1.6" strokeLinejoin="round" />

      {/* ภายในกล่อง */}
      <Path d="M110,58 L38,96 L110,134 L182,96 Z" fill={inside} stroke="#3A2A16" strokeWidth="1.4" strokeLinejoin="round" />
      <Path d="M110,58 L110,134 M38,96 L182,96" stroke="#3A2A16" strokeWidth="1" opacity="0.35" />

      {/* ฝา 4 บาน กางออก */}
      <Path d="M110,58 L182,96 L216,80 L144,42 Z" fill={flap} stroke="#7A5A32" strokeWidth="1.4" strokeLinejoin="round" />
      <Path d="M110,58 L38,96 L4,80 L76,42 Z" fill={flap} stroke="#7A5A32" strokeWidth="1.4" strokeLinejoin="round" />
      <Path d="M182,96 L110,134 L144,150 L216,112 Z" fill={flap} stroke="#7A5A32" strokeWidth="1.4" strokeLinejoin="round" />
      <Path d="M38,96 L110,134 L76,150 L4,112 Z" fill={flap} stroke="#7A5A32" strokeWidth="1.4" strokeLinejoin="round" />
    </Svg>
  );
}

// ── รางใส่ถ่าน AA (simulation) — วาดตามจำนวนช่อง + สถานะ ──────────────────────
export function BatteryRail({ slots = [], result = null }) {
  const W = 240, slotH = 82, padT = 24, padB = 16;
  const H = padT + slots.length * slotH + padB;
  const bodyL = 56, bodyR = W - 56;
  const zig = (xa, xb, yc, n = 6, amp = 8) => {
    let d = `M ${xa} ${yc}`;
    for (let k = 1; k <= n; k++) d += ` L ${(xa + (xb - xa) * k / n).toFixed(1)} ${(yc + (k % 2 ? -amp : amp)).toFixed(1)}`;
    return d;
  };
  const edge = result === 'correct' ? '#3FAE5A' : result === 'wrong' ? '#D94040' : '#0C0C0F';
  const lamp = result === 'correct' ? '#54E07A' : result === 'wrong' ? '#E5484D' : '#33363B';
  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <Defs>
        <LinearGradient id="br_body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#5A4632" /><Stop offset="1" stopColor="#2C1810" />
        </LinearGradient>
        <LinearGradient id="br_cell" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F2EAD9" /><Stop offset="0.5" stopColor="#D8C8A8" /><Stop offset="1" stopColor="#BCA87E" />
        </LinearGradient>
        <LinearGradient id="br_label" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#D89A3A" /><Stop offset="1" stopColor="#9A6E1E" />
        </LinearGradient>
      </Defs>
      {/* ตัวราง */}
      <Rect x="6" y="6" width={W - 12} height={H - 12} rx="16" fill="url(#br_body)" stroke={edge} strokeWidth="2.5" />
      <Rect x="11" y="11" width={W - 22} height={H - 22} rx="12" fill="none" stroke="#7A5A38" strokeWidth="1" />
      <Circle cx={W - 22} cy="16" r="5" fill={lamp} stroke="#2C1810" strokeWidth="1" />
      <SvgText x="18" y="18" fontSize="8" fontWeight="bold" fill="#E8C36A">PWR</SvgText>

      {slots.map((s, i) => {
        const yc = padT + slotH * i + slotH / 2;
        const plusLeft = s.plusSide === 'left';
        const battPlusLeft = s.battPlus === 'left';
        const matched = s.plusSide === s.battPlus;
        const plusZoneX = plusLeft ? 32 : W - 32;
        const minusZoneX = plusLeft ? W - 32 : 32;
        return (
          <G key={i}>
            <Rect x="44" y={yc - 27} width={W - 88} height="54" rx="11" fill="#2A1E14" />
            {/* สปริงขั้วลบ */}
            <Path d={zig(minusZoneX - 14, minusZoneX + 14, yc)} fill="none" stroke="#CDD2D8" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {/* หน้าสัมผัสขั้วบวก */}
            <Rect x={plusLeft ? plusZoneX - 2 : plusZoneX - 10} y={yc - 8} width="12" height="16" rx="2" fill="#C8CCD1" stroke="#8A8F96" strokeWidth="0.8" />
            {/* ตัวถ่าน */}
            <Rect x={bodyL} y={yc - 21} width={bodyR - bodyL} height="42" rx="8" fill="url(#br_cell)" stroke="#7D8288" strokeWidth="1.4" />
            <Rect x={bodyL + 3} y={yc - 19} width="4" height="38" rx="2" fill="#fff" opacity="0.4" />
            <Rect x={bodyL + 16} y={yc - 15} width={bodyR - bodyL - 32} height="30" rx="4" fill="url(#br_label)" />
            <SvgText x={(bodyL + bodyR) / 2} y={yc + 1.5} fontSize="9" fontWeight="bold" fill="#fff" textAnchor="middle">AA 1.5V</SvgText>
            {/* หัวขั้วบวกของถ่าน (ทอง) ฝั่งที่หมุนอยู่ */}
            <Rect x={battPlusLeft ? bodyL - 8 : bodyR} y={yc - 6} width="8" height="12" rx="2" fill="#E0B24A" stroke="#A8851F" strokeWidth="0.6" />
            {/* ป้าย +/− ที่ปลายราง */}
            <SvgText x={plusLeft ? 20 : W - 20} y={yc + 5} fontSize="15" fontWeight="900" fill="#E5484D" textAnchor="middle">+</SvgText>
            <SvgText x={plusLeft ? W - 20 : 20} y={yc + 5} fontSize="16" fontWeight="900" fill="#9AA0A7" textAnchor="middle">−</SvgText>
            {/* ไฟบอกว่าขั้วชนถูกไหม */}
            <Circle cx={plusLeft ? bodyL - 13 : bodyR + 13} cy={yc - 17} r="3.5" fill={matched ? '#54E07A' : '#E5484D'} />
          </G>
        );
      })}
    </Svg>
  );
}
