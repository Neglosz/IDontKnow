// HardwareArt.js
// Realistic ESP32-WROOM-32 DevKit (PORTRAIT / vertical) + sensor modules.
//   - Esp32Board:  vertical board, pin headers on LEFT & RIGHT edges
//   - SensorModule: module with a 3-pin header on its LEFT edge
// Pin coordinates are exported (local viewBox units) so Game.js can place
// tappable hotspots that line up exactly with the drawn pads, at any size.
//
// Requires:  npx expo install react-native-svg

import React from 'react';
import Svg, {
  Rect, Circle, Line, Path, G, Ellipse,
  Defs, RadialGradient, LinearGradient, Stop, Text as SvgText,
} from 'react-native-svg';

// ─────────────────────────────────────────────────────────────────────────────
// ESP32 geometry + pad map  (shared by art AND tappable overlay)
// ─────────────────────────────────────────────────────────────────────────────
export const ESP_VB = { w: 210, h: 360 };

// LEFT column = one header row, RIGHT column = the row with 3V3/GND/D2
const LEFT_LABELS  = ['VIN','GND','D13','D12','D14','D27','D26','D25','D33','D32','D35','D34','VN','VP','EN'];
const RIGHT_LABELS = ['3V3','GND','D15','D2','D4','RX2','TX2','D5','D18','D19','D21','RX0','TX0','D22','D23'];

const PIN_N = 15;
const PIN_Y0 = 66, PIN_Y1 = 300;
const PIN_PITCH = (PIN_Y1 - PIN_Y0) / (PIN_N - 1);
const LX = 18, RX = 192;

// Usable pins for this mission (on the RIGHT edge, facing the sensor)
const RIGHT_ACTIVE = {
  0: { id: 'esp_vcc', label: '3V3' },
  1: { id: 'esp_gnd', label: 'GND' },
  3: { id: 'esp_d2',  label: 'GPIO 2' },
};

export const ESP_PADS = (() => {
  const arr = [];
  for (let i = 0; i < PIN_N; i++) {
    const y = PIN_Y0 + i * PIN_PITCH;
    arr.push({ key: 'L' + i, side: 'L', x: LX, y, label: LEFT_LABELS[i], active: false });
    const a = RIGHT_ACTIVE[i];
    arr.push({ key: 'R' + i, side: 'R', x: RX, y, label: RIGHT_LABELS[i], active: !!a, id: a && a.id });
  }
  return arr;
})();

function Pad({ x, y, active }) {
  if (active) {
    return (
      <G>
        <Circle cx={x} cy={y} r="7.5" fill="#1b5e20" />
        <Circle cx={x} cy={y} r="5" fill="#46d268" stroke="#eafff0" strokeWidth="1.2" />
      </G>
    );
  }
  return (
    <G>
      <Circle cx={x} cy={y} r="4.6" fill="#d9b24a" />
      <Circle cx={x} cy={y} r="1.8" fill="#1a1407" />
    </G>
  );
}

export function Esp32Board({ w = 190 }) {
  const h = w * ESP_VB.h / ESP_VB.w;
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${ESP_VB.w} ${ESP_VB.h}`}>
      <Defs>
        <LinearGradient id="esp_metal" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#e4e7ea" /><Stop offset="0.5" stopColor="#c0c5cb" /><Stop offset="1" stopColor="#9aa0a7" />
        </LinearGradient>
        <LinearGradient id="esp_usb" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#9aa0a7" /><Stop offset="0.5" stopColor="#d2d6da" /><Stop offset="1" stopColor="#9aa0a7" />
        </LinearGradient>
      </Defs>

      {/* PCB */}
      <Rect x="8" y="6" width="194" height="348" rx="11" fill="#121216" stroke="#2c2c33" strokeWidth="1.5" />
      <Rect x="11" y="9" width="188" height="342" rx="9" fill="none" stroke="#1c1c22" strokeWidth="1" />

      {/* mounting holes */}
      {[[24,22],[186,22],[24,338],[186,338]].map(([cx,cy],i) => (
        <G key={i}>
          <Circle cx={cx} cy={cy} r="8.5" fill="#26262c" stroke="#b6b6bd" strokeWidth="2" />
          <Circle cx={cx} cy={cy} r="3.4" fill="#050506" />
        </G>
      ))}

      {/* header strips (left & right) */}
      <Rect x="10" y={PIN_Y0 - 8} width="18" height={PIN_Y1 - PIN_Y0 + 16} rx="3" fill="#0a0a0d" />
      <Rect x="182" y={PIN_Y0 - 8} width="18" height={PIN_Y1 - PIN_Y0 + 16} rx="3" fill="#0a0a0d" />

      {/* pads */}
      {ESP_PADS.map(p => <Pad key={p.key} x={p.x} y={p.y} active={p.active} />)}

      {/* silkscreen labels */}
      {ESP_PADS.filter(p => p.side === 'L').map(p => (
        <SvgText key={'ll'+p.key} x="32" y={p.y + 2.4} fontSize="6.4" fill="#e8e8ea" textAnchor="start" fontFamily="monospace">{p.label}</SvgText>
      ))}
      {ESP_PADS.filter(p => p.side === 'R').map(p => (
        <SvgText key={'rl'+p.key} x="178" y={p.y + 2.4} fontSize={p.active ? '7.6' : '6.4'} fontWeight={p.active ? 'bold' : 'normal'} fill={p.active ? '#8FE6A8' : '#e8e8ea'} textAnchor="end" fontFamily="monospace">{p.label}</SvgText>
      ))}

      {/* micro-USB (top) */}
      <Rect x="84" y="6" width="42" height="26" rx="3" fill="url(#esp_usb)" stroke="#7d8288" strokeWidth="1.4" />
      <Rect x="90" y="12" width="30" height="16" rx="2" fill="#5a5f64" />
      <Rect x="96" y="15" width="18" height="11" rx="1" fill="#3a3f44" />

      {/* EN + BOOT buttons */}
      <Rect x="40" y="24" width="22" height="22" rx="4" fill="#202024" stroke="#3a3a40" strokeWidth="1" />
      <Rect x="45" y="29" width="12" height="12" rx="2" fill="#34343b" />
      <SvgText x="51" y="58" fontSize="6.5" fill="#cfcfcf" textAnchor="middle" fontFamily="monospace">EN</SvgText>
      <Rect x="148" y="24" width="22" height="22" rx="4" fill="#202024" stroke="#3a3a40" strokeWidth="1" />
      <Rect x="153" y="29" width="12" height="12" rx="2" fill="#34343b" />
      <SvgText x="159" y="58" fontSize="6.5" fill="#cfcfcf" textAnchor="middle" fontFamily="monospace">BOOT</SvgText>

      {/* crystal + regulator + CP2102 + passives + LEDs (center) */}
      <Rect x="66" y="80" width="13" height="30" rx="6.5" fill="#cfd3d8" stroke="#9a9fa6" strokeWidth="1" />
      <Rect x="118" y="80" width="16" height="26" rx="2" fill="#18181c" />
      <Rect x="116" y="80" width="3" height="26" fill="#8a8f96" />
      <Rect x="78" y="128" width="32" height="32" rx="2" fill="#17171b" stroke="#000" strokeWidth="0.5" />
      <Circle cx="83" cy="133" r="1.6" fill="#3a3a40" />
      {[0,1,2,3,4,5].map(i => <Rect key={'cl'+i} x="75" y={130+i*5} width="3" height="2" fill="#6a6f76" />)}
      {[0,1,2,3,4,5].map(i => <Rect key={'cr'+i} x="110" y={130+i*5} width="3" height="2" fill="#6a6f76" />)}
      {[[120,128],[120,140],[120,152],[134,128],[134,140],[88,170],[100,170],[120,170],[134,170],[100,186],[120,186]].map(([x,y],i)=>(
        <Rect key={'smd'+i} x={x} y={y} width="9" height="5" rx="1" fill={i%3===0?'#c8a96a':'#26262c'} stroke="#3a3a40" strokeWidth="0.4" />
      ))}
      <Rect x="92" y="116" width="4" height="7" rx="1" fill="#E5484D" />
      <Rect x="100" y="116" width="4" height="7" rx="1" fill="#2f86e0" />

      {/* RF shield (WROOM-32) at the bottom */}
      <Rect x="42" y="216" width="126" height="118" rx="4" fill="url(#esp_metal)" stroke="#82888f" strokeWidth="1.5" />
      <Rect x="46" y="220" width="118" height="110" rx="3" fill="none" stroke="#9aa0a7" strokeWidth="0.8" />
      <SvgText x="105" y="234" fontSize="7" fontWeight="bold" fill="#4a4f55" textAnchor="middle" fontFamily="monospace">ESP32-WROOM-32</SvgText>
      <Rect x="56" y="290" width="34" height="34" fill="#e9ecef" stroke="#9aa0a7" strokeWidth="0.6" />
      {[[58,292],[62,292],[70,292],[80,292],[58,300],[66,300],[74,300],[82,300],[58,308],[64,308],[76,308],[58,316],[68,316],[78,316],[82,316]].map(([x,y],i)=>(
        <Rect key={'qr'+i} x={x} y={y} width="3.4" height="3.4" fill="#2a2d31" />
      ))}
      <Circle cx="132" cy="300" r="9" fill="none" stroke="#7d8288" strokeWidth="1" />

      {/* PCB antenna meander (bottom edge) */}
      <Path d="M62 346 V338 H74 V346 H86 V338 H98 V346 H110 V338 H122 V346 H134 V338 H146 V346"
        stroke="#e8e2cf" strokeWidth="2.2" fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sensor geometry + pad map  (3-pin header on the LEFT edge, facing the ESP32)
// ─────────────────────────────────────────────────────────────────────────────
export const SENSOR_VB = { w: 108, h: 100 };
export const SENSOR_PADS = [
  { id: 'sen_sig', x: 8, y: 32 },
  { id: 'sen_vcc', x: 8, y: 50 },
  { id: 'sen_gnd', x: 8, y: 68 },
];

function SensorPins({ labels = ['SIG', 'VCC', 'GND'] }) {
  return (
    <G>
      {SENSOR_PADS.map((p, i) => (
        <G key={p.id}>
          <Line x1={p.x + 4} y1={p.y} x2="24" y2={p.y} stroke="#8a6b2a" strokeWidth="1.6" />
          <Rect x={p.x - 4} y={p.y - 3.3} width="11" height="6.6" rx="1.6" fill="#E9B949" />
          <SvgText x="27" y={p.y + 2.2} fontSize="6.2" fontWeight="bold" fill="#eafff0" textAnchor="start" fontFamily="monospace">{labels[i]}</SvgText>
        </G>
      ))}
    </G>
  );
}

export function SensorModule({ type = 'pir', w = 92, labels }) {
  const h = w * SENSOR_VB.h / SENSOR_VB.w;
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${SENSOR_VB.w} ${SENSOR_VB.h}`}>
      <Defs>
        <RadialGradient id="pir_dome" cx="0.4" cy="0.35" r="0.75">
          <Stop offset="0" stopColor="#ffffff" /><Stop offset="0.6" stopColor="#f0f0f0" /><Stop offset="1" stopColor="#cdcdcd" />
        </RadialGradient>
        <LinearGradient id="grn_pcb" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2a9d54" /><Stop offset="1" stopColor="#176b38" />
        </LinearGradient>
        <LinearGradient id="dht_pcb" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#2f6fb0" /><Stop offset="1" stopColor="#1f4f80" />
        </LinearGradient>
        <LinearGradient id="soil_pcb" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#caa24a" /><Stop offset="1" stopColor="#9c7a2e" />
        </LinearGradient>
      </Defs>
      <SensorBody type={type} />
      <SensorPins labels={labels} />
    </Svg>
  );
}

function SensorBody({ type }) {
  switch (type) {
    case 'dht11': return <DhtBody />;
    case 'soil':  return <SoilBody />;
    case 'ldr':   return <LdrBody />;
    case 'pir':
    default:      return <PirBody />;
  }
}

function PirBody() {
  return (
    <G>
      <Rect x="42" y="10" width="60" height="80" rx="6" fill="url(#grn_pcb)" stroke="#0f4f29" strokeWidth="1.6" />
      <Circle cx="68" cy="50" r="27" fill="url(#pir_dome)" stroke="#bdbdbd" strokeWidth="1.5" />
      <Circle cx="68" cy="50" r="19" fill="none" stroke="#dcdcdc" strokeWidth="1" />
      <Circle cx="68" cy="50" r="10" fill="none" stroke="#e6e6e6" strokeWidth="1" />
      <Line x1="41" y1="50" x2="95" y2="50" stroke="#d6d6d6" strokeWidth="0.8" />
      <Line x1="68" y1="23" x2="68" y2="77" stroke="#d6d6d6" strokeWidth="0.8" />
      <Line x1="49" y1="31" x2="87" y2="69" stroke="#e2e2e2" strokeWidth="0.7" />
      <Line x1="87" y1="31" x2="49" y2="69" stroke="#e2e2e2" strokeWidth="0.7" />
      <Ellipse cx="59" cy="41" rx="7" ry="5" fill="#ffffff" opacity="0.7" />
    </G>
  );
}

function DhtBody() {
  return (
    <G>
      <Rect x="42" y="12" width="58" height="76" rx="6" fill="url(#dht_pcb)" stroke="#163a5e" strokeWidth="1.6" />
      <Rect x="52" y="24" width="40" height="42" rx="3" fill="#4f9be0" stroke="#2c6aa6" strokeWidth="1.4" />
      {Array.from({ length: 20 }).map((_, i) => {
        const r = Math.floor(i / 5), c = i % 5;
        return <Circle key={i} cx={57 + c * 7.5} cy={31 + r * 8.5} r="1.5" fill="#1f4f80" />;
      })}
    </G>
  );
}

function SoilBody() {
  return (
    <G>
      <Rect x="42" y="10" width="58" height="26" rx="4" fill="url(#grn_pcb)" stroke="#0f4f29" strokeWidth="1.4" />
      <Circle cx="55" cy="23" r="5.5" fill="#2244aa" stroke="#13287a" strokeWidth="1" />
      <Rect x="70" y="16" width="22" height="13" rx="1.5" fill="#16181c" />
      <Rect x="52" y="38" width="40" height="15" rx="2" fill="url(#soil_pcb)" stroke="#6f5520" strokeWidth="1.2" />
      <Path d="M60 53 H68 V84 L64 92 L60 84 Z" fill="url(#soil_pcb)" stroke="#6f5520" strokeWidth="1" />
      <Path d="M78 53 H86 V84 L82 92 L78 84 Z" fill="url(#soil_pcb)" stroke="#6f5520" strokeWidth="1" />
    </G>
  );
}

function LdrBody() {
  return (
    <G>
      <Rect x="42" y="12" width="58" height="74" rx="6" fill="url(#grn_pcb)" stroke="#0f4f29" strokeWidth="1.6" />
      <Circle cx="70" cy="50" r="21" fill="#f4c542" stroke="#b9892a" strokeWidth="2" />
      <Path d="M55 44 H85 M55 50 H85 M55 56 H85" stroke="#7a3b12" strokeWidth="2" />
      <Path d="M61 39 V61 M70 39 V61 M79 39 V61" stroke="#caa24a" strokeWidth="2.4" />
    </G>
  );
}