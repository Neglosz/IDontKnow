// ─────────────────────────────────────────────────────────────────────────
// DressedCat — แมว (master 150) + ชุดที่ใส่อยู่ทั้งหมด ซ้อนเป็นเลเยอร์
// ----------------------------------------------------------------------------
// ใช้ทุกจอที่ต้องโชว์ตัวละคร — ส่ง size เพื่อ scale ลงจาก master ตัวเดียว
//   • ทุกเลเยอร์ใช้ตัวนับเฟรมร่วมกัน → ขยับพร้อมกัน ไม่หลุดเฟส
//   • base + overlay เป็น sheet 450×150 (3 เฟรม) เท่ากัน → scale แล้วยังตรงตำแหน่ง
//   • preview (optional) = ไอเทมที่กำลังลองใน Shop เพื่อโชว์ทับสด ๆ ก่อนซื้อ
// ─────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { View, Image } from 'react-native';
import { useWardrobe } from '../context/WardrobeContext';

const BASE = require('../../assets/player_cat-sheet_150.png');   // master idle 3 เฟรม

// ขนาดเฟรมจริงในไฟล์ (กว้าง×สูง) — สูง 178 = เว้นหัวด้านบนไว้ใส่หมวก ไม่ให้ทะลุกรอบ
// ปรับ 2 ค่านี้ที่เดียวถ้าเปลี่ยนสัดส่วน sheet (base + overlay ต้องเท่ากันเสมอ)
const FRAME_W = 150;
const FRAME_H = 178;

export default function DressedCat({ size = 150, totalFrames = 3, fps = 3.5, preview = null }) {
  const wardrobe = useWardrobe();
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setFrame(prev => (prev + 1) % totalFrames), 1000 / fps);
    return () => clearInterval(id);
  }, [totalFrames, fps]);

  const layers = [BASE, ...(wardrobe?.catLayers(preview) ?? [])].filter(Boolean);

  // size = ความกว้าง/ลำตัว (เท่าเดิมทุกจอ) — ความสูงเต็มเฟรมมากกว่า size เพราะมี headroom
  const h = Math.round(size * (FRAME_H / FRAME_W));
  const top = size - h;   // ติดลบ → ลำตัวอยู่ในกล่อง size×size, ส่วนหัว/หมวกโผล่ขึ้นด้านบน

  return (
    <View style={{ width: size, height: size }}>
      {layers.map((src, i) => (
        <View key={i} style={{ position: 'absolute', top, left: 0, width: size, height: h, overflow: 'hidden' }}>
          <Image
            source={src}
            style={{ width: size * totalFrames, height: h, marginLeft: -size * frame }}
            resizeMode="stretch"
          />
        </View>
      ))}
    </View>
  );
}
