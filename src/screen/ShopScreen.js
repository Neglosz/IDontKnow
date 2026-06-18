import React, { useState, useEffect } from 'react';
import {
    View, Text, Image, TouchableOpacity, Modal, ScrollView,
    StyleSheet, Dimensions, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';

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

/* ===== ช่องอุปกรณ์รอบตัวละคร ===== */
const SLOTS = [
    { key: 'hat',       label: 'Hat',       icon: hatIcon   },
    { key: 'shirt',     label: 'Shirt',     icon: shirtIcon },
    { key: 'pant',      label: 'Pant',      icon: pantIcon  },
    { key: 'shoe',      label: 'Shoe',      icon: shoeIcon  },
    { key: 'accessory', label: 'Accessory', icon: ringIcon  },
];

/* ===== รายการคอสตูม (mockup) ===== */
// sheet: ถ้าใส่แล้วเปลี่ยน sprite ของแมว ให้ใส่ sprite sheet ตรงนี้
const COSTUMES = [
    { key: 'glasses_red',   name: 'แว่นตา',      src: glassesRed,   slot: 'accessory', price: 300, owned: true,  sheet: catGlassesSheet },
    { key: 'glasses_black', name: 'แว่นกันแดด',  src: glassesBlack, slot: 'accessory', price: 300, owned: true },
    { key: 'meat',          name: 'หมวกเนื้อ',    src: beleSrc,      slot: 'hat',       price: 550, owned: false },
    { key: 'pumpkin',       name: 'หมวกฟักทอง',  src: hatPump,      slot: 'hat',       price: 550, owned: false },
    { key: 'bear',          name: 'หมวกหมี',      src: hatBear,      slot: 'hat',       price: 550, owned: false },
    { key: 'sleeping',      name: 'หมวกนอน',      src: hatSleeping,  slot: 'hat',       price: 550, owned: false },
];

/* ===== sprite-sheet แอนิเมชัน 150x150 x 3 เฟรม ===== */
function SpriteFrame({ source, size = 150, totalFrames = 3, fps = 3.5 }) {
    const [frame, setFrame] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            setFrame(prev => (prev + 1) % totalFrames);
        }, 1000 / fps);
        return () => clearInterval(id);
    }, [totalFrames, fps]);

    return (
        <View style={{ width: size, height: size, overflow: 'hidden' }}>
            <Image
                source={source}
                style={{
                    width: size * totalFrames,
                    height: size,
                    marginLeft: -size * frame,
                }}
                resizeMode="cover"
            />
        </View>
    );
}

function SlotBox({ icon, label }) {
    return (
        <View style={styles.slotCol}>
            <View style={styles.slotBox}>
                <Image source={icon} style={styles.slotImg} resizeMode="contain" />
            </View>
            <Text style={styles.slotLabel}>{label}</Text>
        </View>
    );
}

function CostumeCell({ item, equipped, onPress }) {
    const locked = !item.owned;
    return (
        <TouchableOpacity
            style={[
                styles.cell,
                { width: CELL_W, height: CELL_W },
                locked && styles.cellLocked,
                equipped && styles.cellEquipped,
            ]}
            activeOpacity={0.8}
            onPress={onPress}
        >
            {locked && (
                <View style={styles.lockBadge}>
                    <Ionicons name="lock-closed" size={12} color="#FFF" />
                </View>
            )}
            <Image
                source={item.src}
                style={[styles.cellImg, locked && { opacity: 0.45 }]}
                resizeMode="contain"
            />
        </TouchableOpacity>
    );
}

function CostumeModal({ item, equipped, coins, onClose, onBuy, onEquip, onUnequip }) {
    if (!item) return null;
    const canAfford = coins >= item.price;

    return (
        <Modal visible transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Costume</Text>
                        <TouchableOpacity style={styles.modalClose} onPress={onClose} activeOpacity={0.8}>
                            <Ionicons name="close" size={16} color="#C0392B" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.modalThumb}>
                        <Image source={item.src} style={styles.modalImg} resizeMode="contain" />
                        {!item.owned && (
                            <View style={styles.priceRow}>
                                <Image source={starSrc} style={{ width: 18, height: 18 }} resizeMode="contain" />
                                <Text style={styles.priceText}>{item.price}</Text>
                            </View>
                        )}
                    </View>

                    {!item.owned ? (
                        <TouchableOpacity
                            style={[styles.buyBtn, !canAfford && styles.buyBtnDisabled]}
                            activeOpacity={0.85}
                            onPress={() => onBuy(item)}
                        >
                            <Text style={styles.buyText}>BUY</Text>
                        </TouchableOpacity>
                    ) : equipped ? (
                        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.85} onPress={() => onUnequip(item)}>
                            <Text style={styles.actionText}>ถอด</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.85} onPress={() => onEquip(item)}>
                            <Text style={styles.actionText}>สวมใส่</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
}

export default function ShopScreen({ onNavigate }) {
    const [coins, setCoins]       = useState(1200);
    const [items, setItems]       = useState(COSTUMES);
    const [equipped, setEquipped] = useState({});  // { slotKey: itemKey }
    const [active, setActive]     = useState(null); // item ที่เปิด modal อยู่

    const itemByKey = (key) => items.find(i => i.key === key) || null;

    // sprite ของแมว: ถ้า accessory ที่ใส่อยู่มี sheet เฉพาะ ให้ใช้ sheet นั้น
    const accItem = itemByKey(equipped.accessory);
    const catSrc  = accItem?.sheet ?? catSheet;

    const openItem = (item) => setActive(item);
    const closeModal = () => setActive(null);

    const buy = (item) => {
        if (coins < item.price) {
            Alert.alert('ดาวไม่พอ', `ต้องใช้ ${item.price} ดาวเพื่อซื้อ “${item.name}”`);
            return;
        }
        setCoins(c => c - item.price);
        setItems(list => list.map(i => i.key === item.key ? { ...i, owned: true } : i));
        setActive({ ...item, owned: true });
    };

    const equip = (item) => {
        setEquipped(e => ({ ...e, [item.slot]: item.key }));
        closeModal();
    };

    const unequip = (item) => {
        setEquipped(e => {
            const next = { ...e };
            if (next[item.slot] === item.key) delete next[item.slot];
            return next;
        });
        closeModal();
    };

    const isEquipped = (item) => equipped[item.slot] === item.key;

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.body}>
                {/* header */}
                <View style={styles.header}>
                    <Text style={styles.title}>SHOP</Text>
                    <View style={styles.coinBadge}>
                        <Image source={starSrc} style={{ width: 20, height: 20 }} resizeMode="contain" />
                        <Text style={styles.coinText}>{coins}</Text>
                    </View>
                </View>

                {/* ตัวละคร + ช่องอุปกรณ์ */}
                <View style={styles.dressRow}>
                    <View style={styles.sideCol}>
                        {SLOTS.filter(s => s.key === 'hat' || s.key === 'shirt').map(s => (
                            <SlotBox
                                key={s.key}
                                label={s.label}
                                icon={itemByKey(equipped[s.key])?.src ?? s.icon}
                            />
                        ))}
                    </View>

                    <View style={styles.catWrap}>
                        <SpriteFrame source={catSrc} size={150} totalFrames={3} fps={3.5} />
                    </View>

                    <View style={styles.sideCol}>
                        {SLOTS.filter(s => s.key === 'pant' || s.key === 'shoe').map(s => (
                            <SlotBox
                                key={s.key}
                                label={s.label}
                                icon={itemByKey(equipped[s.key])?.src ?? s.icon}
                            />
                        ))}
                    </View>
                </View>

                {/* accessory ตรงกลางล่าง */}
                <View style={styles.accessoryWrap}>
                    <SlotBox
                        label="Accessory"
                        icon={itemByKey(equipped.accessory)?.src ?? ringIcon}
                    />
                </View>

                {/* แถบ Costume */}
                <View style={styles.sectionBar}>
                    <Text style={styles.sectionTitle}>Costume</Text>
                </View>

                {/* grid (scroll เฉพาะส่วนนี้) */}
                <ScrollView
                    style={styles.gridScroll}
                    contentContainerStyle={styles.grid}
                    showsVerticalScrollIndicator={false}
                >
                    {items.map(item => (
                        <CostumeCell
                            key={item.key}
                            item={item}
                            equipped={isEquipped(item)}
                            onPress={() => openItem(item)}
                        />
                    ))}
                    {/* ช่องว่างให้ครบ grid สวย ๆ */}
                    {Array.from({ length: (COLS * 4) - items.length }).map((_, i) => (
                        <View key={`empty-${i}`} style={[styles.cell, styles.cellEmpty, { width: CELL_W, height: CELL_W }]} />
                    ))}
                </ScrollView>
            </View>

            <CostumeModal
                item={active}
                equipped={active ? isEquipped(active) : false}
                coins={coins}
                onClose={closeModal}
                onBuy={buy}
                onEquip={equip}
                onUnequip={unequip}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F7F1E5' },
    body: { flex: 1 },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: PAD,
        paddingTop: 8,
        paddingBottom: 10,
    },
    title: {
        fontFamily: 'Jersey',
        fontSize: 30,
        fontWeight: '900',
        color: '#C47A30',
        letterSpacing: 1,
    },
    coinBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F7F1E5',
        borderWidth: 2.5,
        borderColor: '#3A1A00',
        borderRadius: 16,
        paddingHorizontal: 14,
        paddingVertical: 3,
    },
    coinText: {
        fontFamily: 'Jersey',
        fontSize: 22,
        fontWeight: '900',
        color: '#3A1A00',
    },

    /* ===== แต่งตัว ===== */
    dressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: PAD,
        marginTop: 4,
    },
    sideCol: { gap: 18 },
    catWrap: {
        width: 150,
        height: 150,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },

    slotCol: { alignItems: 'center', gap: 4 },
    slotBox: {
        width: 64,
        height: 64,
        borderRadius: 12,
        backgroundColor: '#F0E8D8',
        borderWidth: 2,
        borderColor: '#D8CBB5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    slotImg: { width: 40, height: 40 },
    slotLabel: {
        fontFamily: 'Jersey',
        fontSize: 15,
        fontWeight: '700',
        color: '#6E441B',
    },

    accessoryWrap: { alignItems: 'center', marginTop: 14, marginBottom: 18 },

    /* ===== section bar ===== */
    sectionBar: {
        backgroundColor: '#8B6340',
        paddingVertical: 8,
        paddingHorizontal: PAD,
    },
    sectionTitle: {
        fontFamily: 'Jersey',
        fontSize: 20,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },

    /* ===== grid ===== */
    gridScroll: { flex: 1 },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: GAP,
        paddingHorizontal: PAD,
        paddingTop: 16,
        paddingBottom: 24,
    },
    cell: {
        borderRadius: 14,
        backgroundColor: '#F7F1E5',
        borderWidth: 2,
        borderColor: '#C99A5B',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cellImg: { width: '64%', height: '64%' },
    cellLocked: {
        backgroundColor: '#C9C2B4',
        borderColor: '#B3AB9B',
    },
    cellEquipped: {
        borderColor: '#C47A30',
        borderWidth: 3,
        backgroundColor: '#FFF8EE',
    },
    cellEmpty: {
        backgroundColor: 'transparent',
        borderColor: '#D8C39E',
    },
    lockBadge: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 20,
        height: 20,
        borderRadius: 5,
        backgroundColor: '#E0A11E',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },

    /* ===== modal ===== */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(20, 12, 6, 0.45)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    modalCard: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: '#F7F1E5',
        borderWidth: 2,
        borderColor: '#D8CBB5',
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 18,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    modalTitle: {
        fontFamily: 'Jersey',
        fontSize: 22,
        fontWeight: '900',
        color: '#3A1A00',
    },
    modalClose: {
        width: 26,
        height: 26,
        borderRadius: 13,
        borderWidth: 2,
        borderColor: '#C0392B',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalThumb: {
        alignSelf: 'center',
        width: 150,
        height: 150,
        borderRadius: 14,
        borderWidth: 2.5,
        borderColor: '#C99A5B',
        backgroundColor: '#FBF6EC',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    modalImg: { width: '64%', height: '64%' },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
    },
    priceText: {
        fontFamily: 'Jersey',
        fontSize: 22,
        fontWeight: '900',
        color: '#3A1A00',
    },

    buyBtn: {
        height: 44,
        borderRadius: 10,
        backgroundColor: '#4CC15B',
        alignItems: 'center',
        justifyContent: 'center',
    },
    buyBtnDisabled: { backgroundColor: '#B7C9B5' },
    buyText: {
        fontFamily: 'Jersey',
        fontSize: 20,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    actionBtn: {
        height: 44,
        borderRadius: 10,
        backgroundColor: '#8B6340',
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
