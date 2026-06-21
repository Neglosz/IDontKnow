import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, Image, TouchableOpacity, ScrollView,
    StyleSheet, Dimensions, Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';

/* ===== assets ===== */
const starSrc        = require('../../assets/star.png');
const catSheet       = require('../../assets/player_cat-sheet_150.png');
const catGlassesSheet = require('../../assets/CAT_idle_glasses150.png');

const hatIcon   = require('../../assets/hat.png');
const shirtIcon = require('../../assets/shirt.png');
const pantIcon  = require('../../assets/pant.png');
const shoeIcon  = require('../../assets/shoe.png');
const ringIcon  = require('../../assets/ring.png');

const glassesRed   = require('../../assets/glasses.png');
const glassesBlack = require('../../assets/glasses_black.png');
const beleSrc      = require('../../assets/bele.png');
const hatPump      = require('../../assets/hat_pump.png');
const hatBear      = require('../../assets/hat_bear_true.png');
const hatSleeping  = require('../../assets/hat_sleeping.png');

const { width: SW } = Dimensions.get('window');
const PAD  = 20;
const GAP  = 12;
const COLS = 4;
const CELL_W = (SW - PAD * 2 - GAP * (COLS - 1)) / COLS;

// ระยะจากก้นกรอบตัวละครขึ้นไปถึง "เท้า" ของสไปรท์ (ปรับเลขนี้เลขเดียวเพื่อเลื่อนเงา)
const FEET_FROM_BOTTOM = -5;

/* ===== ช่องอุปกรณ์รอบตัวละคร ===== */
const SLOTS = [
    { key: 'hat',       label: 'Hat',       icon: hatIcon   },
    { key: 'shirt',     label: 'Shirt',     icon: shirtIcon },
    { key: 'pant',      label: 'Pant',      icon: pantIcon  },
    { key: 'shoe',      label: 'Shoe',      icon: shoeIcon  },
    { key: 'accessory', label: 'Accessory', icon: ringIcon  },
];
const SLOT_TH = { hat: 'หมวก', shirt: 'เสื้อ', pant: 'กางเกง', shoe: 'รองเท้า', accessory: 'เครื่องประดับ' };

/* ===== ระดับความหายาก (rarity) — กรอบสี + ป้าย ===== */
const RARITY = {
    common: { label: 'ธรรมดา',  color: '#9AA7B5', soft: '#EEF1F4' },
    rare:   { label: 'หายาก',   color: '#3A8FE8', soft: '#E6F0FB' },
    epic:   { label: 'เอพิค',    color: '#A24DD0', soft: '#F4E9FB' },
};

/* ===== รายการคอสตูม (mockup) ===== */
// sheet: ถ้าใส่แล้วเปลี่ยน sprite ของแมว ให้ใส่ sprite sheet ตรงนี้
const COSTUMES = [
    { key: 'glasses_red',   name: 'แว่นตา',      src: glassesRed,   slot: 'accessory', price: 300, owned: true,  rarity: 'rare', sheet: catGlassesSheet },
    { key: 'glasses_black', name: 'แว่นกันแดด',  src: glassesBlack, slot: 'accessory', price: 300, owned: true,  rarity: 'rare' },
    { key: 'meat',          name: 'หมวกเนื้อ',    src: beleSrc,      slot: 'hat',       price: 550, owned: false, rarity: 'epic',   isNew: true },
    { key: 'pumpkin',       name: 'หมวกฟักทอง',  src: hatPump,      slot: 'hat',       price: 550, owned: false, rarity: 'rare',   isNew: true },
    { key: 'bear',          name: 'หมวกหมี',      src: hatBear,      slot: 'hat',       price: 550, owned: false, rarity: 'epic'   },
    { key: 'sleeping',      name: 'หมวกนอน',      src: hatSleeping,  slot: 'hat',       price: 550, owned: false, rarity: 'common' },
];

/* ===== sprite-sheet แอนิเมชัน 150x150 x 3 เฟรม ===== */
function SpriteFrame({ source, size = 150, totalFrames = 3, fps = 3.5 }) {
    const [frame, setFrame] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setFrame(prev => (prev + 1) % totalFrames), 1000 / fps);
        return () => clearInterval(id);
    }, [totalFrames, fps]);
    return (
        <View style={{ width: size, height: size, overflow: 'hidden' }}>
            <Image
                source={source}
                style={{ width: size * totalFrames, height: size, marginLeft: -size * frame }}
                resizeMode="cover"
            />
        </View>
    );
}

/* ===== ช่องอุปกรณ์ (กดได้: มีของ→เลือก, ว่าง→ไปหมวดนั้น) ===== */
function SlotBox({ icon, label, placeholder, active, onPress }) {
    return (
        <TouchableOpacity style={styles.slotCol} activeOpacity={0.8} onPress={onPress}>
            <View style={[styles.slotBox, active && styles.slotBoxActive]}>
                {/* opacity อยู่ที่ Image เท่านั้น → รูปจาง แต่กรอบไม่จางตาม */}
                <Image
                    source={icon}
                    style={[styles.slotImg, placeholder && styles.slotImgDim]}
                    resizeMode="contain"
                />
            </View>
            <Text style={styles.slotLabel}>{label}</Text>
        </TouchableOpacity>
    );
}

/* ===== ปุ่มแอ็กชันชุด (footer ของเวที) ===== */
function FooterBtn({ icon, label, onPress, tone }) {
    return (
        <TouchableOpacity style={styles.footerBtn} activeOpacity={0.75} onPress={onPress}>
            <Ionicons name={icon} size={18} color={tone === 'primary' ? '#C47A30' : '#7A5326'} />
            <Text style={[styles.footerBtnText, tone === 'primary' && styles.footerBtnTextPrimary]}>{label}</Text>
        </TouchableOpacity>
    );
}

/* ===== การ์ดสินค้าในกริด ===== */
function CostumeCell({ item, equipped, previewing, onPress }) {
    const r = RARITY[item.rarity] ?? RARITY.common;
    return (
        <TouchableOpacity
            style={[
                styles.cell,
                { width: CELL_W, height: CELL_W, borderColor: r.color, backgroundColor: r.soft },
                previewing && styles.cellPreview,
                equipped && styles.cellEquipped,
            ]}
            activeOpacity={0.8}
            onPress={onPress}
        >
            {item.isNew && !item.owned && (
                <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>
            )}

            {equipped ? (
                <View style={[styles.cornerBadge, styles.cornerEquipped]}>
                    <Ionicons name="checkmark" size={12} color="#FFF" />
                </View>
            ) : item.owned ? (
                <View style={[styles.cornerBadge, styles.cornerOwned]}>
                    <Ionicons name="checkmark" size={12} color="#FFF" />
                </View>
            ) : null}

            <Image source={item.src} style={styles.cellImg} resizeMode="contain" />

            {equipped ? (
                <View style={[styles.cellFoot, styles.cellFootEquipped]}>
                    <Text style={styles.cellFootEquippedText}>ใส่อยู่</Text>
                </View>
            ) : !item.owned ? (
                <View style={styles.cellFoot}>
                    <Image source={starSrc} style={styles.cellStar} resizeMode="contain" />
                    <Text style={styles.cellPrice}>{item.price}</Text>
                </View>
            ) : null}
        </TouchableOpacity>
    );
}

/* ===== แถบแอ็กชันด้านล่าง (แทน modal — ลองก่อนซื้อ) ===== */
function ActionBar({ item, equipped, canAfford, onClose, onBuy, onEquip, onUnequip }) {
    if (!item) return null;
    const r = RARITY[item.rarity] ?? RARITY.common;
    return (
        <View style={styles.actionBar}>
            <View style={styles.actionThumb}>
                <Image source={item.src} style={{ width: '70%', height: '70%' }} resizeMode="contain" />
            </View>

            <View style={{ flex: 1 }}>
                <View style={styles.actionTitleRow}>
                    <Text style={styles.actionName} numberOfLines={1}>{item.name}</Text>
                    <View style={[styles.rarityChip, { backgroundColor: r.color }]}>
                        <Text style={styles.rarityChipText}>{r.label}</Text>
                    </View>
                </View>
                {!item.owned ? (
                    <View style={styles.actionPriceRow}>
                        <Image source={starSrc} style={{ width: 16, height: 16 }} resizeMode="contain" />
                        <Text style={styles.actionPrice}>{item.price}</Text>
                        <Text style={styles.actionTryHint}>· กำลังลองอยู่</Text>
                    </View>
                ) : (
                    <Text style={styles.actionOwnedHint}>{equipped ? 'กำลังสวมใส่' : 'อยู่ในตู้เสื้อผ้าของคุณ'}</Text>
                )}
            </View>

            {!item.owned ? (
                <TouchableOpacity
                    style={[styles.barBtn, styles.barBuy, !canAfford && styles.barBtnDisabled]}
                    activeOpacity={0.85}
                    onPress={() => onBuy(item)}
                >
                    <Text style={styles.barBtnText}>{canAfford ? 'ซื้อ' : 'ดาวไม่พอ'}</Text>
                </TouchableOpacity>
            ) : equipped ? (
                <TouchableOpacity style={[styles.barBtn, styles.barRemove]} activeOpacity={0.85} onPress={() => onUnequip(item)}>
                    <Text style={styles.barBtnText}>ถอด</Text>
                </TouchableOpacity>
            ) : (
                <TouchableOpacity style={[styles.barBtn, styles.barEquip]} activeOpacity={0.85} onPress={() => onEquip(item)}>
                    <Text style={styles.barBtnText}>สวมใส่</Text>
                </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.barClose} onPress={onClose} hitSlop={8}>
                <Ionicons name="close" size={18} color="#8B6340" />
            </TouchableOpacity>
        </View>
    );
}

/* ===== ป๊อปอัปฉลองตอนซื้อ ===== */
function Toast({ data, onHide }) {
    const a = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        if (!data) return;
        a.setValue(0);
        Animated.sequence([
            Animated.spring(a, { toValue: 1, useNativeDriver: true, friction: 6, tension: 90 }),
            Animated.delay(1100),
            Animated.timing(a, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start(({ finished }) => { if (finished) onHide(); });
    }, [data]);
    if (!data) return null;
    const scale = a.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });
    return (
        <Animated.View pointerEvents="none" style={[styles.toast, { opacity: a, transform: [{ scale }] }]}>
            <Text style={styles.toastEmoji}>✨</Text>
            <Text style={styles.toastText}>{data}</Text>
        </Animated.View>
    );
}

export default function ShopScreen({ onNavigate }) {
    // ดาว = total_stars จริงใน Supabase (ผ่าน AuthContext) — ซื้อแล้วหักจริง
    const { user, stars: coins, spendStars } = useAuth();
    const [items, setItems]       = useState(COSTUMES);
    const [equipped, setEquipped] = useState({});   // { slotKey: itemKey }
    const [preview, setPreview]   = useState(null);  // key ของไอเทมที่กำลังลอง/เลือก
    const [filter, setFilter]     = useState('all'); // 'all' | slotKey | 'owned'
    const [toast, setToast]       = useState(null);
    const [presets, setPresets]   = useState([]);    // ชุดที่บันทึกไว้ [{id, equipped}]

    // ── ของที่ครอบครอง/สวมใส่: เก็บใน AsyncStorage (cosmetic — ไม่กระทบ economy) ──
    // RLS ของ inventory เปิดให้ client "อ่าน" อย่างเดียว จึงเก็บฝั่งเครื่องไว้ก่อน
    const costumesKey = user ? `@costumes:${user.id}` : null;
    const hydrated = useRef(false);

    useEffect(() => {
        if (!costumesKey) return;
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(costumesKey);
                if (raw) {
                    const saved = JSON.parse(raw);   // { owned: string[], equipped: {} }
                    if (Array.isArray(saved.owned)) {
                        setItems(list => list.map(i =>
                            saved.owned.includes(i.key) ? { ...i, owned: true } : i));
                    }
                    if (saved.equipped) setEquipped(saved.equipped);
                }
            } catch {}
            hydrated.current = true;
        })();
    }, [costumesKey]);

    // เซฟทุกครั้งที่ของที่มี/ชุดที่ใส่เปลี่ยน (หลัง hydrate เสร็จ กันทับค่าว่าง)
    useEffect(() => {
        if (!costumesKey || !hydrated.current) return;
        const owned = items.filter(i => i.owned).map(i => i.key);
        AsyncStorage.setItem(costumesKey, JSON.stringify({ owned, equipped })).catch(() => {});
    }, [items, equipped, costumesKey]);

    const itemByKey = (key) => items.find(i => i.key === key) || null;
    const previewItem = itemByKey(preview);

    // ของที่จะโชว์ในแต่ละ slot: ถ้ากำลังลองไอเทมของ slot นั้น ให้โชว์ตัวลอง ไม่งั้นโชว์ที่สวมอยู่
    const slotItem = (slotKey) =>
        (previewItem && previewItem.slot === slotKey) ? previewItem : itemByKey(equipped[slotKey]);

    // sprite ของแมว: ลองแว่น → เห็นบนตัวสด, ไม่งั้นใช้ของที่ใส่อยู่
    const catSrc = previewItem?.sheet ?? itemByKey(equipped.accessory)?.sheet ?? catSheet;

    const isEquipped = (item) => !!item && equipped[item.slot] === item.key;

    // ===== ดาวเด้งเมื่อยอดเปลี่ยน =====
    const coinScale = useRef(new Animated.Value(1)).current;
    const firstCoin = useRef(true);
    useEffect(() => {
        if (firstCoin.current) { firstCoin.current = false; return; }
        Animated.sequence([
            Animated.spring(coinScale, { toValue: 1.28, useNativeDriver: true, friction: 4 }),
            Animated.spring(coinScale, { toValue: 1, useNativeDriver: true, friction: 5 }),
        ]).start();
    }, [coins]);

    // แท็บหมวด: ทั้งหมด + ทุก slot (แม้ยังไม่มีของ) + ของฉัน
    const TABS = [
        { key: 'all', label: 'ทั้งหมด' },
        ...SLOTS.map(s => ({ key: s.key, label: SLOT_TH[s.key] })),
        { key: 'owned', label: 'ของฉัน' },
    ];
    const shown = items.filter(i =>
        filter === 'all' ? true : filter === 'owned' ? i.owned : i.slot === filter
    );

    /* --- actions --- */
    const onSlotPress = (slotKey) => {
        const eq = itemByKey(equipped[slotKey]);
        if (eq) setPreview(eq.key);
        else { setFilter(slotKey); setPreview(null); }
    };

    const doBuy = async (item) => {
        const res = await spendStars(item.price);   // หักดาวจริงใน Supabase
        if (res?.error) {
            Alert.alert('ดาวไม่พอ', `ต้องใช้ ${item.price} ดาว แต่คุณมี ${res.balance ?? coins} ดาว`);
            return;
        }
        setItems(list => list.map(i => i.key === item.key ? { ...i, owned: true } : i));
        setEquipped(e => ({ ...e, [item.slot]: item.key }));
        setPreview(item.key);
        setToast(`ซื้อ “${item.name}” สำเร็จ!`);
    };
    const buy = (item) => {
        if (coins < item.price) {
            Alert.alert('ดาวไม่พอ', `ต้องใช้ ${item.price} ดาว แต่คุณมี ${coins} ดาว`, [
                { text: 'ปิด', style: 'cancel' },
                { text: 'ไปเก็บดาว', onPress: () => onNavigate?.('scan') },
            ]);
            return;
        }
        Alert.alert('ยืนยันการซื้อ', `ซื้อ “${item.name}” ราคา ${item.price} ดาวไหม?`, [
            { text: 'ยกเลิก', style: 'cancel' },
            { text: 'ซื้อเลย', onPress: () => doBuy(item) },
        ]);
    };
    const equip = (item) => setEquipped(e => ({ ...e, [item.slot]: item.key }));
    const unequip = (item) => setEquipped(e => {
        const next = { ...e };
        if (next[item.slot] === item.key) delete next[item.slot];
        return next;
    });

    // ===== สุ่ม / ถอดหมด / บันทึก-สลับชุด =====
    const randomize = () => {
        const next = {};
        SLOTS.forEach(s => {
            const pool = items.filter(i => i.slot === s.key && i.owned);
            if (pool.length && Math.random() > 0.25) {
                next[s.key] = pool[Math.floor(Math.random() * pool.length)].key;
            }
        });
        setEquipped(next);
        setPreview(null);
        setToast('สุ่มชุดให้แล้ว! 🎲');
    };
    const removeAll = () => { setEquipped({}); setPreview(null); };
    const savePreset = () => {
        if (Object.keys(equipped).length === 0) { setToast('ยังไม่ได้ใส่อะไรเลย'); return; }
        setPresets(p => [...p, { id: Date.now(), equipped: { ...equipped } }].slice(-4));
        setToast('บันทึกชุดแล้ว! 💾');
    };
    const applyPreset = (p) => { setEquipped({ ...p.equipped }); setPreview(null); };
    const deletePreset = (id) => setPresets(list => list.filter(p => p.id !== id));

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.body}>
                {/* header */}
                <View style={styles.header}>
                    <Text style={styles.title}>SHOP</Text>
                    <Animated.View style={[styles.coinBadge, { transform: [{ scale: coinScale }] }]}>
                        <Image source={starSrc} style={{ width: 20, height: 20 }} resizeMode="contain" />
                        <Text style={styles.coinText}>{coins}</Text>
                    </Animated.View>
                </View>

                {/* ===== เวทีตัวละคร (stage) + ช่องอุปกรณ์ ===== */}
                <View style={styles.stage}>
                    <View style={styles.dressRow}>
                        <View style={styles.sideCol}>
                            {SLOTS.filter(s => s.key === 'hat' || s.key === 'shirt').map(s => (
                                <SlotBox
                                    key={s.key}
                                    label={s.label}
                                    icon={slotItem(s.key)?.src ?? s.icon}
                                    placeholder={!slotItem(s.key)}
                                    active={previewItem?.slot === s.key}
                                    onPress={() => onSlotPress(s.key)}
                                />
                            ))}
                        </View>

                        <View style={styles.catStage}>
                            <View style={styles.stageRug} />
                            <View style={styles.stageShadow} />
                            <View style={styles.catWrap}>
                                <SpriteFrame source={catSrc} size={150} totalFrames={3} fps={3.5} />
                            </View>
                        </View>

                        <View style={styles.sideCol}>
                            {SLOTS.filter(s => s.key === 'pant' || s.key === 'shoe').map(s => (
                                <SlotBox
                                    key={s.key}
                                    label={s.label}
                                    icon={slotItem(s.key)?.src ?? s.icon}
                                    placeholder={!slotItem(s.key)}
                                    active={previewItem?.slot === s.key}
                                    onPress={() => onSlotPress(s.key)}
                                />
                            ))}
                        </View>
                    </View>

                    <View style={styles.accessoryWrap}>
                        <SlotBox
                            label="Accessory"
                            icon={slotItem('accessory')?.src ?? ringIcon}
                            placeholder={!slotItem('accessory')}
                            active={previewItem?.slot === 'accessory'}
                            onPress={() => onSlotPress('accessory')}
                        />
                    </View>

                    {/* แถบแอ็กชันชุด (footer ในกรอบเวที) */}
                    <View style={styles.stageFooter}>
                        <FooterBtn icon="shuffle" label="สุ่มชุด" onPress={randomize} tone="primary" />
                        <View style={styles.footerDivider} />
                        <FooterBtn icon="bookmark-outline" label="บันทึก" onPress={savePreset} />
                        <View style={styles.footerDivider} />
                        <FooterBtn icon="refresh-outline" label="ถอดหมด" onPress={removeAll} />
                    </View>
                </View>

                {/* ชุดที่บันทึก — โผล่เฉพาะเมื่อมี (กันรก) */}
                {presets.length > 0 && (
                    <ScrollView
                        horizontal showsHorizontalScrollIndicator={false}
                        style={styles.presetScroll} contentContainerStyle={styles.presetRow}
                    >
                        <Text style={styles.presetLabel}>ชุดของฉัน</Text>
                        {presets.map((p, idx) => (
                            <View key={p.id} style={styles.presetChip}>
                                <TouchableOpacity style={styles.presetMain} activeOpacity={0.8} onPress={() => applyPreset(p)}>
                                    <Ionicons name="shirt" size={13} color="#8B6340" />
                                    <Text style={styles.presetText}>ชุด {idx + 1}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.presetDel} onPress={() => deletePreset(p.id)} hitSlop={6}>
                                    <Ionicons name="close" size={12} color="#9A8569" />
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>
                )}

                {/* แท็บหมวด */}
                <ScrollView
                    horizontal showsHorizontalScrollIndicator={false}
                    style={styles.tabScroll} contentContainerStyle={styles.tabRow}
                >
                    {TABS.map(t => (
                        <TouchableOpacity
                            key={t.key}
                            style={[styles.tabChip, filter === t.key && styles.tabChipActive]}
                            activeOpacity={0.85}
                            onPress={() => setFilter(t.key)}
                        >
                            <Text style={[styles.tabChipText, filter === t.key && styles.tabChipTextActive]}>{t.label}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* grid */}
                <ScrollView
                    style={styles.gridScroll}
                    contentContainerStyle={styles.grid}
                    showsVerticalScrollIndicator={false}
                >
                    {shown.length === 0 ? (
                        <View style={styles.emptyWrap}>
                            <View style={styles.emptyIconCircle}>
                                <Ionicons name="cube-outline" size={38} color="#C9BCA3" />
                            </View>
                            <Text style={styles.emptyText}>ยังไม่มีไอเทมในหมวดนี้</Text>
                            <Text style={styles.emptySub}>กำลังจะมาเร็ว ๆ นี้! ✨</Text>
                        </View>
                    ) : shown.map(item => (
                        <CostumeCell
                            key={item.key}
                            item={item}
                            equipped={isEquipped(item)}
                            previewing={preview === item.key}
                            onPress={() => setPreview(item.key)}
                        />
                    ))}
                </ScrollView>

                {/* แถบแอ็กชันด้านล่าง */}
                <ActionBar
                    item={previewItem}
                    equipped={isEquipped(previewItem)}
                    canAfford={previewItem ? coins >= previewItem.price : false}
                    onClose={() => setPreview(null)}
                    onBuy={buy}
                    onEquip={equip}
                    onUnequip={unequip}
                />
            </View>

            <Toast data={toast} onHide={() => setToast(null)} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F7F1E5' },
    body: { flex: 1 },

    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: PAD, paddingTop: 8, paddingBottom: 6,
    },
    title: { fontFamily: 'Jersey', fontSize: 28, fontWeight: '900', color: '#C47A30', letterSpacing: 1 },
    coinBadge: {
        flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F7F1E5',
        borderWidth: 2.5, borderColor: '#3A1A00', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 3,
    },
    coinText: { fontFamily: 'Jersey', fontSize: 22, fontWeight: '900', color: '#3A1A00' },

    /* ===== เวทีตัวละคร ===== */
    stage: {
        marginHorizontal: PAD, borderRadius: 18, overflow: 'hidden',
        backgroundColor: '#FFFBF4',
        borderWidth: 2, borderColor: '#E4D3AE', paddingTop: 8, paddingBottom: 12,
    },
    dressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14 },
    sideCol: { gap: 14 },
    catStage: { width: 150, height: 158, alignItems: 'center', justifyContent: 'flex-end' },
    stageRug: {
        position: 'absolute', bottom: FEET_FROM_BOTTOM - 6, alignSelf: 'center',
        width: 116, height: 26, borderRadius: 14, backgroundColor: '#E7D2A8', opacity: 0.8,
    },
    stageShadow: {
        position: 'absolute', bottom: FEET_FROM_BOTTOM, alignSelf: 'center',
        width: 78, height: 15, borderRadius: 8, backgroundColor: 'rgba(74,46,18,0.20)',
    },
    catWrap: { width: 150, height: 150, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },

    slotCol: { alignItems: 'center', gap: 4 },
    slotBox: {
        width: 58, height: 58, borderRadius: 12, backgroundColor: '#FFFDF8',
        borderWidth: 2, borderColor: '#D8CBB5', alignItems: 'center', justifyContent: 'center',
    },
    slotBoxActive: { borderColor: '#C47A30', borderWidth: 2.5, backgroundColor: '#FFF8EE' },
    slotImg: { width: 36, height: 36 },
    slotImgDim: { opacity: 0.35 },
    slotLabel: { fontFamily: 'Jersey', fontSize: 14, fontWeight: '700', color: '#6E441B' },

    accessoryWrap: { alignItems: 'center', marginTop: 6 },

    /* ===== footer แอ็กชันชุด (อยู่ในกรอบเวที) ===== */
    stageFooter: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
        marginTop: 10, marginHorizontal: 12, paddingTop: 10,
        borderTopWidth: 1.5, borderTopColor: '#E7D6B4',
    },
    footerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
    footerBtnText: { fontFamily: 'PKNonthaburi', fontSize: 15, fontWeight: '700', color: '#7A5326' },
    footerBtnTextPrimary: { color: '#C47A30' },
    footerDivider: { width: 1.5, height: 20, backgroundColor: '#E7D6B4' },

    /* ===== ชุดที่บันทึก (slim, โผล่เฉพาะเมื่อมี) ===== */
    presetScroll: { maxHeight: 42, flexGrow: 0 },
    presetRow: { paddingHorizontal: PAD, gap: 8, alignItems: 'center', paddingVertical: 6 },
    presetLabel: { fontFamily: 'PKNonthaburi', fontSize: 14, fontWeight: '700', color: '#9A8569', marginRight: 2 },
    presetChip: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFFDF8', borderWidth: 1.5, borderColor: '#D8CBB5', borderRadius: 16, paddingLeft: 9, paddingRight: 3,
    },
    presetMain: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 5 },
    presetText: { fontFamily: 'PKNonthaburi', fontSize: 14, fontWeight: '700', color: '#6E441B' },
    presetDel: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },

    /* ===== แท็บหมวด ===== */
    tabScroll: { maxHeight: 44, flexGrow: 0, marginTop: 14 },
    tabRow: { paddingHorizontal: PAD, gap: 8, alignItems: 'center', paddingVertical: 2 },
    tabChip: {
        paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
        backgroundColor: '#EDE3D0', borderWidth: 1.5, borderColor: '#D8CBB5',
    },
    tabChipActive: { backgroundColor: '#8B6340', borderColor: '#6E4A28' },
    tabChipText: { fontFamily: 'PKNonthaburi', fontSize: 16, fontWeight: '700', color: '#6E441B' },
    tabChipTextActive: { color: '#FFFFFF' },

    /* ===== grid ===== */
    gridScroll: { flex: 1 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, paddingHorizontal: PAD, paddingTop: 12, paddingBottom: 24 },
    cell: {
        borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden',
    },
    cellImg: { width: '58%', height: '58%' },
    cellPreview: { borderWidth: 3, borderColor: '#C47A30' },
    cellEquipped: { borderColor: '#3F9E4D', borderWidth: 3 },

    newBadge: {
        position: 'absolute', top: 0, left: 0, backgroundColor: '#E0492B',
        paddingHorizontal: 6, paddingVertical: 2, borderBottomRightRadius: 8, zIndex: 2,
    },
    newBadgeText: { fontFamily: 'Jersey', fontSize: 11, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
    cornerBadge: {
        position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10,
        alignItems: 'center', justifyContent: 'center', zIndex: 2,
    },
    cornerEquipped: { backgroundColor: '#3F9E4D' },
    cornerOwned: { backgroundColor: '#B8A98C' },

    cellFoot: {
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 22,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3,
        backgroundColor: 'rgba(255,255,255,0.82)',
    },
    cellStar: { width: 13, height: 13 },
    cellPrice: { fontFamily: 'Jersey', fontSize: 15, fontWeight: '900', color: '#7A4E13' },
    cellFootEquipped: { backgroundColor: '#3F9E4D' },
    cellFootEquippedText: { fontFamily: 'PKNonthaburi', fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

    emptyWrap: { width: '100%', alignItems: 'center', paddingVertical: 44, gap: 6 },
    emptyIconCircle: {
        width: 76, height: 76, borderRadius: 38, backgroundColor: '#F1EADB',
        borderWidth: 2, borderColor: '#E4DAC6', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
    },
    emptyText: { fontFamily: 'PKNonthaburi', fontSize: 17, fontWeight: '700', color: '#6E441B' },
    emptySub: { fontFamily: 'PKNonthaburi', fontSize: 14, color: '#9A8569' },

    /* ===== แถบแอ็กชันด้านล่าง ===== */
    actionBar: {
        flexDirection: 'row', alignItems: 'center', gap: 12,
        backgroundColor: '#FCF8EF', borderTopWidth: 2, borderTopColor: '#D8CBB5',
        paddingHorizontal: PAD, paddingVertical: 12,
    },
    actionThumb: {
        width: 54, height: 54, borderRadius: 12, backgroundColor: '#FBF6EC',
        borderWidth: 2, borderColor: '#C99A5B', alignItems: 'center', justifyContent: 'center',
    },
    actionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    actionName: { fontFamily: 'PKNonthaburi', fontSize: 19, fontWeight: '700', color: '#3A1A00', flexShrink: 1 },
    rarityChip: { paddingHorizontal: 7, paddingVertical: 1, borderRadius: 6 },
    rarityChipText: { fontFamily: 'Jersey', fontSize: 12, fontWeight: '900', color: '#FFFFFF' },
    actionPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    actionPrice: { fontFamily: 'Jersey', fontSize: 18, fontWeight: '900', color: '#7A4E13' },
    actionTryHint: { fontFamily: 'PKNonthaburi', fontSize: 13, color: '#A2906F', marginLeft: 2 },
    actionOwnedHint: { fontFamily: 'PKNonthaburi', fontSize: 14, color: '#9A8569', marginTop: 2 },

    barBtn: { height: 44, minWidth: 84, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    barBuy: { backgroundColor: '#4CC15B' },
    barEquip: { backgroundColor: '#C47A30' },
    barRemove: { backgroundColor: '#8B6340' },
    barBtnDisabled: { backgroundColor: '#D98E2E' },
    barBtnText: { fontFamily: 'Jersey', fontSize: 19, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.5 },
    barClose: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },

    /* ===== toast ฉลองตอนซื้อ ===== */
    toast: {
        position: 'absolute', top: '42%', alignSelf: 'center',
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: 'rgba(58,26,0,0.92)', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 16,
    },
    toastEmoji: { fontSize: 20 },
    toastText: { fontFamily: 'PKNonthaburi', fontSize: 18, fontWeight: '700', color: '#FFF6E6' },
});
