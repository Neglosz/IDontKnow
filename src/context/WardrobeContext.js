// ─────────────────────────────────────────────────────────────────────────
// WardrobeContext — store กลางของ "ตู้เสื้อผ้า" (catalog + ของที่มี + ชุดที่ใส่)
// ----------------------------------------------------------------------------
// ย้ายออกจาก ShopScreen เพื่อให้ทุกจอ (Profile, Scan, Game...) โชว์แมวแต่งชุดได้
//   • catalog  = shop_items จาก DB (อ่านครั้งเดียว)
//   • ownedKeys/equipped = เก็บใน AsyncStorage ต่อ user (cosmetic ไม่กระทบ economy)
//   • catLayers(preview) = ลำดับ sheet ของชุดที่ใส่ → ป้อนให้ <DressedCat>
// ─────────────────────────────────────────────────────────────────────────
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const SHOP_BUCKET = 'shop';
const shopUrl = (path) =>
  path ? supabase.storage.from(SHOP_BUCKET).getPublicUrl(path).data.publicUrl : null;

// ลำดับซ้อนชุดบนแมว: ล่างสุด → บนสุด (ตัวท้าย = ทับบนสุด) — ปรับที่เดียว
//   ชุด(ลำตัว) → เครื่องประดับ → หมวก(หัว) → แว่น(หน้า บนสุด)
export const CAT_LAYER_ORDER = ['outfit', 'accessory', 'hat', 'glasses'];

// แปลงแถว shop_items (DB) → รูปแบบที่ UI ใช้ (รูป/sheet เป็น {uri} จาก Storage)
function rowToItem(row) {
  return {
    key: row.id,
    name: row.name_th,
    slot: row.slot,
    price: row.price,
    rarity: row.rarity ?? 'common',
    isNew: row.is_new ?? false,
    src: shopUrl(row.icon_path) ? { uri: shopUrl(row.icon_path) } : null,
    sheet: shopUrl(row.sheet_path) ? { uri: shopUrl(row.sheet_path) } : null,
  };
}

const WardrobeContext = createContext(null);

export function WardrobeProvider({ children }) {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ownedKeys, setOwnedKeys] = useState(() => new Set());
  const [equipped, setEquipped] = useState({});   // { slot: itemKey }
  const hydrated = useRef(false);

  // โหลด catalog — รอ user ก่อน (RLS "read shop" = ต้อง authenticated)
  // ผูกกับ user เพื่อกัน race ตอนเปิดแอป (query ยิงก่อน session กู้คืนเสร็จ = ร้านว่าง)
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let alive = true;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from('shop_items').select('*').eq('is_active', true).order('sort_order');
      if (!alive) return;
      setCatalog((data ?? []).map(rowToItem));
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [user]);

  // โหลด/เซฟ ตู้เสื้อผ้า ต่อ user
  const storeKey = user ? `@costumes:${user.id}` : null;
  useEffect(() => {
    hydrated.current = false;
    if (!storeKey) { setOwnedKeys(new Set()); setEquipped({}); return; }
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storeKey);
        const saved = raw ? JSON.parse(raw) : {};
        setOwnedKeys(new Set(Array.isArray(saved.owned) ? saved.owned : []));
        setEquipped(saved.equipped ?? {});
      } catch { setOwnedKeys(new Set()); setEquipped({}); }
      hydrated.current = true;
    })();
  }, [storeKey]);

  useEffect(() => {
    if (!storeKey || !hydrated.current) return;
    AsyncStorage.setItem(storeKey, JSON.stringify({ owned: Array.from(ownedKeys), equipped }))
      .catch(() => {});
  }, [ownedKeys, equipped, storeKey]);

  // merge owned ก่อน แล้วค่อยทำ map → itemByKey จะได้ของที่มี field owned ถูกต้อง
  // (ไม่งั้น previewItem.owned = undefined → ร้านโชว์ปุ่ม "ซื้อ" ทั้งที่ซื้อแล้ว)
  const items = catalog.map(c => ({ ...c, owned: ownedKeys.has(c.key) }));
  const itemsMap = {};
  items.forEach(c => { itemsMap[c.key] = c; });

  const value = {
    loading,
    items,
    equipped,
    ownedKeys,
    itemByKey: (k) => (k ? itemsMap[k] ?? null : null),
    isOwned: (k) => ownedKeys.has(k),
    isEquipped: (item) => !!item && equipped[item.slot] === item.key,
    addOwned: (k) => setOwnedKeys(prev => new Set(prev).add(k)),
    equip: (item) => setEquipped(e => ({ ...e, [item.slot]: item.key })),
    unequip: (item) => setEquipped(e => {
      const n = { ...e }; if (n[item.slot] === item.key) delete n[item.slot]; return n;
    }),
    setEquipped,
    removeAll: () => setEquipped({}),
    // ลำดับ sheet ของชุดที่ใส่ (preview = ไอเทมที่กำลังลองใน shop, ใส่หรือไม่ก็ได้)
    catLayers: (preview) => CAT_LAYER_ORDER.map(slot => {
      if (preview && preview.slot === slot) return preview.sheet ?? null;
      return itemsMap[equipped[slot]]?.sheet ?? null;
    }),
  };

  return <WardrobeContext.Provider value={value}>{children}</WardrobeContext.Provider>;
}

export const useWardrobe = () => useContext(WardrobeContext);
