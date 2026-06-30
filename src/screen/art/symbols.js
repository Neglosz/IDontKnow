// ============================================================================
//  art/symbols.js — สัญลักษณ์ schematic (วาดเวกเตอร์ แทน emoji)
//  ใช้ในเกม wire / sequence / sort:  <SchematicSymbol kind="resistor" w={28} />
//  เพิ่มสัญลักษณ์ใหม่ = เพิ่ม case ใน SymBody (ทุกอันวาดบน viewBox 0 0 40 40)
// ============================================================================
import React from 'react';
import Svg, { Rect, Circle, Line, Path, G, Text as SvgText } from 'react-native-svg';

const SY = '#3B2A18';   // สีเส้นหลัก (น้ำตาลเข้ม ให้เห็นบนพื้นกระดาษ)
function SymBody({ kind }) {
  switch (kind) {
    case 'transistor': return (
      <G>
        <Line x1="4" y1="20" x2="15" y2="20" stroke={SY} strokeWidth="2" />
        <Rect x="14.5" y="10" width="2.6" height="20" fill={SY} />
        <Line x1="17" y1="15" x2="31" y2="7" stroke={SY} strokeWidth="2" />
        <Line x1="17" y1="25" x2="31" y2="33" stroke={SY} strokeWidth="2" />
        <Path d="M31 33 l -5 -1 l 2 -4 z" fill={SY} />
        <SvgText x="24" y="20" fontSize="5.5" fill="#7C8A99" textAnchor="middle">Q</SvgText>
      </G>
    );
    case 'diode': return (
      <G>
        <Line x1="3" y1="20" x2="11" y2="20" stroke={SY} strokeWidth="2" />
        <Path d="M11 12 L25 20 L11 28 Z" fill="#5A4632" stroke={SY} strokeWidth="2" strokeLinejoin="round" />
        <Line x1="25" y1="11" x2="25" y2="29" stroke="#54E07A" strokeWidth="2.5" />
        <Line x1="25" y1="20" x2="37" y2="20" stroke={SY} strokeWidth="2" />
      </G>
    );
    case 'resistor': return (
      <Path d="M3 20 H9 l3 -8 l4 16 l4 -16 l4 16 l3 -8 H37" fill="none" stroke={SY} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    );
    case 'motor': return (
      <G>
        <Circle cx="20" cy="20" r="13" fill="#5A4632" stroke={SY} strokeWidth="2" />
        <SvgText x="20" y="25" fontSize="13" fontWeight="bold" fill={SY} textAnchor="middle" fontFamily="monospace">M</SvgText>
        <Path d="M14 9 q6 -5 12 0" fill="none" stroke="#E5C237" strokeWidth="1.5" />
      </G>
    );
    case 'capacitor': return (
      <G>
        <Line x1="3" y1="20" x2="17" y2="20" stroke={SY} strokeWidth="2" />
        <Line x1="17" y1="9" x2="17" y2="31" stroke={SY} strokeWidth="2.5" />
        <Line x1="23" y1="9" x2="23" y2="31" stroke={SY} strokeWidth="2.5" />
        <Line x1="23" y1="20" x2="37" y2="20" stroke={SY} strokeWidth="2" />
      </G>
    );
    case 'mcu': return (
      <G>
        <Rect x="9" y="9" width="22" height="22" rx="2" fill="#3A2A1A" stroke={SY} strokeWidth="1.6" />
        {[13, 18, 23, 27].map((y, i) => <G key={i}><Line x1="5" y1={y} x2="9" y2={y} stroke={SY} strokeWidth="1.4" /><Line x1="31" y1={y} x2="35" y2={y} stroke={SY} strokeWidth="1.4" /></G>)}
        <Circle cx="13" cy="13" r="1.4" fill="#5A6B7A" />
        <SvgText x="20" y="23" fontSize="6" fill="#9aa7b5" textAnchor="middle" fontFamily="monospace">IC</SvgText>
      </G>
    );
    case 'vcc': return (
      <G>
        <Line x1="20" y1="14" x2="20" y2="34" stroke="#E5484D" strokeWidth="2" />
        <Path d="M20 6 L26 16 L14 16 Z" fill="#E5484D" />
        <SvgText x="20" y="13.5" fontSize="6" fontWeight="bold" fill="#fff" textAnchor="middle">+</SvgText>
      </G>
    );
    case 'gnd': return (
      <G>
        <Line x1="20" y1="6" x2="20" y2="20" stroke={SY} strokeWidth="2" />
        <Line x1="10" y1="20" x2="30" y2="20" stroke={SY} strokeWidth="2.4" />
        <Line x1="14" y1="26" x2="26" y2="26" stroke={SY} strokeWidth="2.2" />
        <Line x1="17" y1="31" x2="23" y2="31" stroke={SY} strokeWidth="2" />
      </G>
    );
    case 'battery': return (
      <G>
        <Line x1="3" y1="20" x2="14" y2="20" stroke={SY} strokeWidth="2" />
        <Line x1="14" y1="11" x2="14" y2="29" stroke={SY} strokeWidth="2.6" />
        <Line x1="20" y1="15" x2="20" y2="25" stroke={SY} strokeWidth="2.6" />
        <Line x1="24" y1="11" x2="24" y2="29" stroke={SY} strokeWidth="2.6" />
        <Line x1="30" y1="15" x2="30" y2="25" stroke={SY} strokeWidth="2.6" />
        <Line x1="30" y1="20" x2="37" y2="20" stroke={SY} strokeWidth="2" />
      </G>
    );
    case 'button': return (
      <G>
        <Line x1="3" y1="26" x2="13" y2="26" stroke={SY} strokeWidth="2" />
        <Circle cx="13" cy="26" r="2.2" fill={SY} />
        <Line x1="13" y1="26" x2="27" y2="14" stroke={SY} strokeWidth="2" />
        <Circle cx="27" cy="26" r="2.2" fill={SY} />
        <Line x1="27" y1="26" x2="37" y2="26" stroke={SY} strokeWidth="2" />
        <Line x1="20" y1="9" x2="20" y2="16" stroke={SY} strokeWidth="1.5" strokeDasharray="2 2" />
      </G>
    );
    case 'signal': return (
      <Path d="M3 28 H11 V12 H20 V28 H28 V12 H37" fill="none" stroke="#54E07A" strokeWidth="2" strokeLinejoin="round" />
    );
    case 'wiper': return (
      <G>
        <Rect x="8" y="15" width="24" height="10" rx="1.5" fill="none" stroke={SY} strokeWidth="2" />
        <Line x1="3" y1="20" x2="8" y2="20" stroke={SY} strokeWidth="2" />
        <Line x1="32" y1="20" x2="37" y2="20" stroke={SY} strokeWidth="2" />
        <Line x1="20" y1="4" x2="20" y2="15" stroke="#E5C237" strokeWidth="2" />
        <Path d="M20 15 l -4 -5 l 8 0 z" fill="#E5C237" />
      </G>
    );
    case 'test': return (
      <G>
        {/* ปุ่มจ่ายไฟ (power on) + เครื่องหมายถูก = จ่ายไฟแล้วทดสอบ */}
        <Path d="M16.2 12.4 A 11 11 0 1 1 23.8 12.4" fill="none" stroke={SY} strokeWidth="2.4" strokeLinecap="round" />
        <Line x1="20" y1="8" x2="20" y2="21" stroke={SY} strokeWidth="2.4" strokeLinecap="round" />
        <Path d="M27 28 l 3 3 l 7 -8" fill="none" stroke="#46B25E" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </G>
    );
    case 'target': return (
      <G>
        <Circle cx="20" cy="20" r="13" fill="none" stroke={SY} strokeWidth="2" />
        <Circle cx="20" cy="20" r="7.5" fill="none" stroke={SY} strokeWidth="2" />
        <Circle cx="20" cy="20" r="2.6" fill={SY} />
      </G>
    );
    case 'schematic': return (
      <G>
        <Rect x="9" y="6" width="22" height="28" rx="2" fill="none" stroke={SY} strokeWidth="2" />
        <Path d="M12 14 H16 l1.5 -4 l3 8 l3 -8 l1.5 4 H28" fill="none" stroke={SY} strokeWidth="1.6" strokeLinejoin="round" />
        <Line x1="12" y1="23" x2="28" y2="23" stroke={SY} strokeWidth="1.6" />
        <Circle cx="12" cy="23" r="1.6" fill={SY} /><Circle cx="28" cy="23" r="1.6" fill={SY} />
        <Line x1="12" y1="28" x2="24" y2="28" stroke={SY} strokeWidth="1.6" />
      </G>
    );
    case 'parts': return (
      <G>
        <Path d="M7 16 H33 L30 32 H10 Z" fill="none" stroke={SY} strokeWidth="2" strokeLinejoin="round" />
        <Rect x="13" y="20" width="8" height="6" rx="1" fill={SY} />
        <Circle cx="26" cy="23" r="3" fill="none" stroke={SY} strokeWidth="1.8" />
      </G>
    );
    case 'place': return (
      <G>
        <Rect x="8" y="8" width="24" height="24" rx="2.5" fill="none" stroke={SY} strokeWidth="2" />
        <Rect x="15" y="15" width="10" height="10" rx="1.5" fill={SY} />
        <Line x1="20" y1="3" x2="20" y2="11" stroke={SY} strokeWidth="1.6" strokeDasharray="2 2" />
        <Line x1="20" y1="29" x2="20" y2="37" stroke={SY} strokeWidth="1.6" strokeDasharray="2 2" />
      </G>
    );
    case 'pour': return (
      <G>
        <Rect x="7" y="9" width="26" height="22" rx="2" fill="none" stroke={SY} strokeWidth="2" />
        <Path d="M10 24 L16 12 M15 30 L25 12 M22 30 L30 14 M28 30 L32 22" stroke={SY} strokeWidth="1.3" opacity="0.75" />
      </G>
    );
    case 'read': return (
      <G>
        <Rect x="23" y="11" width="10" height="18" rx="2" fill="none" stroke={SY} strokeWidth="2" />
        <Line x1="6" y1="20" x2="22" y2="20" stroke={SY} strokeWidth="2.2" strokeLinecap="round" />
        <Path d="M16 14 l 6 6 l -6 6" fill="none" stroke={SY} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </G>
    );
    case 'timer': return (
      <G>
        <Circle cx="20" cy="22" r="11" fill="none" stroke={SY} strokeWidth="2" />
        <Line x1="20" y1="22" x2="20" y2="14" stroke={SY} strokeWidth="2" strokeLinecap="round" />
        <Line x1="20" y1="22" x2="26" y2="24" stroke={SY} strokeWidth="2" strokeLinecap="round" />
        <Line x1="16" y1="6" x2="24" y2="6" stroke={SY} strokeWidth="2" strokeLinecap="round" />
        <Line x1="20" y1="6" x2="20" y2="11" stroke={SY} strokeWidth="2" />
      </G>
    );
    case 'wait': return (
      <G>
        <Line x1="11" y1="7" x2="29" y2="7" stroke={SY} strokeWidth="2" strokeLinecap="round" />
        <Line x1="11" y1="33" x2="29" y2="33" stroke={SY} strokeWidth="2" strokeLinecap="round" />
        <Path d="M13 7 L27 7 L21 20 L27 33 L13 33 L19 20 Z" fill="none" stroke={SY} strokeWidth="2" strokeLinejoin="round" />
        <Path d="M16 11 L24 11 L20 17 Z" fill={SY} />
      </G>
    );
    case 'logic': return (
      <G>
        <Path d="M20 7 L33 20 L20 33 L7 20 Z" fill="none" stroke={SY} strokeWidth="2" strokeLinejoin="round" />
        <SvgText x="20" y="25.5" fontSize="14" fill={SY} textAnchor="middle" fontWeight="bold">?</SvgText>
      </G>
    );
    case 'send': return (
      <G>
        <Line x1="20" y1="34" x2="20" y2="18" stroke={SY} strokeWidth="2" strokeLinecap="round" />
        <Path d="M14 24 L20 18 L26 24" fill="none" stroke={SY} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <Path d="M11 14 A 12 12 0 0 1 29 14" fill="none" stroke={SY} strokeWidth="1.8" strokeLinecap="round" />
        <Path d="M14.5 17 A 7 7 0 0 1 25.5 17" fill="none" stroke={SY} strokeWidth="1.8" strokeLinecap="round" />
        <Circle cx="20" cy="34" r="1.6" fill={SY} />
      </G>
    );
    case 'packet': return (
      <G>
        <Path d="M20 7 L32 13 L20 19 L8 13 Z" fill="none" stroke={SY} strokeWidth="2" strokeLinejoin="round" />
        <Path d="M8 13 V27 L20 33 V19" fill="none" stroke={SY} strokeWidth="2" strokeLinejoin="round" />
        <Path d="M32 13 V27 L20 33" fill="none" stroke={SY} strokeWidth="2" strokeLinejoin="round" />
      </G>
    );
    case 'config': return (
      <G>
        <Circle cx="20" cy="20" r="6.5" fill="none" stroke={SY} strokeWidth="2" />
        <Circle cx="20" cy="20" r="2" fill={SY} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a, i) => {
          const rad = a * Math.PI / 180;
          return <Line key={i} x1={20 + 9 * Math.cos(rad)} y1={20 + 9 * Math.sin(rad)} x2={20 + 13 * Math.cos(rad)} y2={20 + 13 * Math.sin(rad)} stroke={SY} strokeWidth="2.4" strokeLinecap="round" />;
        })}
      </G>
    );
    case 'wireless': return (
      <G>
        <Circle cx="20" cy="29" r="2.4" fill={SY} />
        <Path d="M13 23 A 10 10 0 0 1 27 23" fill="none" stroke={SY} strokeWidth="2" strokeLinecap="round" />
        <Path d="M9 18 A 16 16 0 0 1 31 18" fill="none" stroke={SY} strokeWidth="2" strokeLinecap="round" />
      </G>
    );
    case 'led': return (
      <G>
        <Path d="M15 11 L15 29 L27 20 Z" fill="none" stroke={SY} strokeWidth="2" strokeLinejoin="round" />
        <Line x1="27" y1="11" x2="27" y2="29" stroke={SY} strokeWidth="2" strokeLinecap="round" />
        <Line x1="6" y1="20" x2="15" y2="20" stroke={SY} strokeWidth="2" />
        <Line x1="27" y1="20" x2="34" y2="20" stroke={SY} strokeWidth="2" />
        <Path d="M23 8 l3 -3 M28 10 l3 -3" stroke="#E5C237" strokeWidth="1.8" strokeLinecap="round" />
      </G>
    );
    case 'limit': return (
      <G>
        <Path d="M9 11 H31 L22 23 V30 H18 V23 Z" fill="none" stroke={SY} strokeWidth="2" strokeLinejoin="round" />
        <Line x1="20" y1="33" x2="20" y2="37" stroke={SY} strokeWidth="2" strokeLinecap="round" />
      </G>
    );
    case 'filter': return (
      <G>
        <Path d="M6 11 q3 -5 6 0 t6 0 t6 0 t6 0" fill="none" stroke={SY} strokeWidth="2" />
        <Path d="M6 30 H34" stroke={SY} strokeWidth="2.4" strokeLinecap="round" />
        <Path d="M20 16 V24 M17 21 l3 3 l3 -3" fill="none" stroke={SY} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
      </G>
    );
    case 'indicator': return (
      <G>
        <Circle cx="20" cy="17" r="7.5" fill="none" stroke={SY} strokeWidth="2" />
        <Path d="M16 26 H24 M17 30 H23" stroke={SY} strokeWidth="2" strokeLinecap="round" />
        <Path d="M20 3 V0.5 M8 9 L6 7 M32 9 L34 7" stroke="#E5C237" strokeWidth="1.8" strokeLinecap="round" />
      </G>
    );
    case 'oneway': return (
      <G>
        <Line x1="6" y1="20" x2="26" y2="20" stroke={SY} strokeWidth="2.4" strokeLinecap="round" />
        <Path d="M21 13 l7 7 l-7 7" fill="none" stroke={SY} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
        <Line x1="32" y1="11" x2="32" y2="29" stroke={SY} strokeWidth="2.4" strokeLinecap="round" />
      </G>
    );
    case 'vibrate': return (
      <G>
        <Circle cx="20" cy="20" r="8" fill="none" stroke={SY} strokeWidth="2" />
        <SvgText x="20" y="24" fontSize="10" fill={SY} textAnchor="middle" fontWeight="bold" fontFamily="monospace">M</SvgText>
        <Path d="M6 14 q-2 6 0 12 M10 16 q-1 4 0 8" fill="none" stroke={SY} strokeWidth="1.6" strokeLinecap="round" />
        <Path d="M34 14 q2 6 0 12 M30 16 q1 4 0 8" fill="none" stroke={SY} strokeWidth="1.6" strokeLinecap="round" />
      </G>
    );
    case 'shield': return (
      <G>
        <Path d="M20 5 L31 10 V20 Q31 30 20 35 Q9 30 9 20 V10 Z" fill="none" stroke={SY} strokeWidth="2" strokeLinejoin="round" />
        <Path d="M15 19 l4 4 l7 -8" fill="none" stroke="#46B25E" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </G>
    );
    case 'ruler': return (
      <G>
        <Rect x="6" y="14" width="28" height="12" rx="1.5" fill="none" stroke={SY} strokeWidth="2" />
        <Line x1="12" y1="14" x2="12" y2="20" stroke={SY} strokeWidth="1.5" />
        <Line x1="18" y1="14" x2="18" y2="22" stroke={SY} strokeWidth="1.5" />
        <Line x1="24" y1="14" x2="24" y2="20" stroke={SY} strokeWidth="1.5" />
        <Line x1="30" y1="14" x2="30" y2="22" stroke={SY} strokeWidth="1.5" />
      </G>
    );
    case 'palette': return (
      <G>
        <Path d="M20 8 Q33 8 33 19 Q33 27 24 27 Q21 27 21 29 Q21 32 17 32 Q7 31 7 20 Q7 8 20 8 Z" fill="none" stroke={SY} strokeWidth="2" strokeLinejoin="round" />
        <Circle cx="14" cy="15" r="2" fill="#E5484D" />
        <Circle cx="22" cy="13" r="2" fill="#E5C237" />
        <Circle cx="27" cy="19" r="2" fill="#46B25E" />
      </G>
    );
    case 'relay': return (
      <G>
        <Rect x="7" y="11" width="26" height="18" rx="2" fill="none" stroke={SY} strokeWidth="2" />
        <Path d="M11 17 q2 -3 4 0 t4 0" fill="none" stroke={SY} strokeWidth="1.6" />
        <Circle cx="24" cy="16" r="1.5" fill={SY} />
        <Line x1="24" y1="16" x2="30" y2="22" stroke={SY} strokeWidth="1.8" strokeLinecap="round" />
        <Circle cx="30" cy="23" r="1.5" fill={SY} />
      </G>
    );
    case 'pin':
    default: return (
      <G>
        <Circle cx="13" cy="20" r="7" fill="#E8C36A" stroke="#fff" strokeWidth="1.3" />
        <Circle cx="13" cy="20" r="2.2" fill="#1A1407" />
        <Line x1="20" y1="20" x2="37" y2="20" stroke="#C99A4A" strokeWidth="2.5" />
      </G>
    );
  }
}
export function SchematicSymbol({ kind, w = 24 }) {
  return (
    <Svg width={w} height={w} viewBox="0 0 40 40">
      <SymBody kind={kind} />
    </Svg>
  );
}
