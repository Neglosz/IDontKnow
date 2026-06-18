import React, { useState, useMemo, useCallback } from 'react';
import {
    View, Text, Image, TouchableOpacity, ScrollView, StyleSheet,
    Modal, Pressable, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import Svg, { Path, G } from 'react-native-svg';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue, useAnimatedProps, useAnimatedStyle,
    withTiming, runOnJS, useAnimatedReaction,
} from 'react-native-reanimated';
// วางไฟล์ thailandProvinces.js ไว้ที่ src/data/ (ปรับ path ตามโปรเจกต์ได้)
import { PROVINCES, MAP_VIEWBOX, MAP_WIDTH, MAP_HEIGHT } from '../data/thailandProvinces';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);
const AnimatedG = Animated.createAnimatedComponent(G);

/* ------------------------------------------------------------------ */
/* ASSETS (optional) — ใส่ของจริงแล้ว uncomment ได้เลย                 */
const PIPO_SRC = null;        // require('../../assets/pipo.png');
const SHOP_ICON = null;       // require('../../assets/shop_icon.png');

/* ------------------------------------------------------------------ */
/* MOCK DATA — แทนที่ด้วยข้อมูลจริงได้เลย                              */
const SHORT_NAME = { 'กรุงเทพมหานคร': 'กรุงเทพ' };
const shortName = (th) => SHORT_NAME[th] || th;

const PROVINCE_LEARNINGS = {
    'เชียงใหม่': [
        {
            id: 'cm1', title: 'เมาส์ไร้สาย', date: '15 ม.ค. 2567', image: null,
            pipo: 'รู้มั้ย? บอร์ดเมาส์ไร้สายมีเสาอากาศ (Antenna) อยู่บนบอร์ดด้วยนะ! ตอนออกแบบเราห้ามวางอุปกรณ์ชิ้นอื่นหรือเททองแดง (Ground Plane) ใกล้ๆ บริเวณเสาอากาศเด็ดขาด ไม่งั้นสัญญาณจะดรอปจนเมาส์ดีเลย์หรือหลุดบ่อยๆ เลยล่ะ!',
            cta: 'เรียนรู้อีกครั้ง',
        },
        {
            id: 'cm2', title: 'แอร์คอนดิชั่น', date: '15 ม.ค. 2567', image: null,
            pipo: '"รู้มั้ย? แอร์ 1 เครื่องที่มีขนาด 18,000 BTU จริงๆ แล้วอาจจะทำความเย็นสู้ห้องที่โดนแดดบ่ายตรงๆ ไม่ได้เลยนะ! เพราะในทางวิศวกรรม เราไม่ได้ดูแค่ขนาดพื้นที่ (ตร.ม.) แต่ต้องคำนวณ \'โหลดความร้อนแฝง\' จากกระจก แสงแดด และเครื่องใช้ไฟฟ้าด้วย นี่แหละเหตุผลที่ต้องคำนวณ BTU ให้เคลียร์ก่อนติดตั้ง!"',
            cta: 'สร้างการเรียนรู้',
        },
    ],
    'กรุงเทพมหานคร': [
        { id: 'bk1', title: 'สมาร์ทวอทช์', date: '12 ม.ค. 2567', image: null, pipo: 'หน้าจอ AMOLED ของสมาร์ทวอทช์กินไฟน้อยกว่าตอนแสดงพื้นหลังสีดำ เพราะพิกเซลสีดำคือการ "ปิด" ไฟไปเลย!', cta: 'เรียนรู้อีกครั้ง' },
        { id: 'bk2', title: 'จอยเกม', date: '12 ม.ค. 2567', image: null, pipo: 'มอเตอร์สั่น (Haptic) ในจอยใช้การหมุนตุ้มน้ำหนักเยื้องศูนย์ ทำให้รู้สึกถึงแรงสั่นได้จริง', cta: 'เรียนรู้อีกครั้ง' },
        { id: 'bk3', title: 'หูฟังบลูทูธ', date: '10 ม.ค. 2567', image: null, pipo: 'ระบบตัดเสียงรบกวน (ANC) สร้างคลื่นเสียงตรงข้ามเพื่อหักล้างเสียงภายนอกแบบเรียลไทม์', cta: 'เรียนรู้อีกครั้ง' },
    ],
    'นครราชสีมา': [
        { id: 'nm1', title: 'พัดลมไอเย็น', date: '08 ม.ค. 2567', image: null, pipo: 'พัดลมไอเย็นใช้หลักการระเหยของน้ำดูดความร้อนออกจากอากาศ จึงเย็นกว่าพัดลมธรรมดา', cta: 'เรียนรู้อีกครั้ง' },
        { id: 'nm2', title: 'หม้อหุงข้าว', date: '08 ม.ค. 2567', image: null, pipo: 'เซนเซอร์แม่เหล็ก (Magnetic Thermostat) จะตัดไฟอัตโนมัติเมื่ออุณหภูมิเกิน 100°C ตอนน้ำแห้ง', cta: 'เรียนรู้อีกครั้ง' },
    ],
};

const HISTORY_ORDER = ['เชียงใหม่', 'กรุงเทพมหานคร', 'นครราชสีมา'];

const MY_PODIUM = [
    { medal: 'silver', rank: 234, province: 'นครราชสีมา', people: '6,890' },
    { medal: 'gold',   rank: 156, province: 'เชียงใหม่',  people: '8,750' },
    { medal: 'bronze', rank: 892, province: 'กรุงเทพ',    people: '15,420' },
];
const TOP_PROVINCES = [
    { province: 'กรุงเทพ',     people: '15,420', learns: '52,400' },
    { province: 'เชียงใหม่',   people: '8,750',  learns: '31,430' },
    { province: 'ภูเก็ต',      people: '7,990',  learns: '30,910' },
    { province: 'นครราชสีมา',  people: '6,890',  learns: '29,400' },
    { province: 'ขอนแก่น',     people: '5,230',  learns: '28,900' },
];

const hasData = (th) => !!PROVINCE_LEARNINGS[th];

/* รวม path เพื่อลดจำนวน native node (กันกระตุกตอนเลื่อน/ซูม) */
// จังหวัดไม่มีข้อมูล -> รวม d ทั้งหมดเป็นเส้นเดียว, เส้นขอบทุกจังหวัด -> รวมเป็นเส้นเดียว
const GRAY_FILL_D = PROVINCES.filter(p => !hasData(p.th)).map(p => p.d).join(' ');
const ALL_STROKE_D = PROVINCES.map(p => p.d).join(' ');

/* ------------------------------------------------------------------ */
/* MAP DISPLAY GEOMETRY                                                 */
const SCREEN_W = Dimensions.get('window').width;
const H_PADDING = 20;
const MAP_CARD_PAD = 10;
const DISPLAY_H = 540;
const DISPLAY_W = DISPLAY_H * (MAP_WIDTH / MAP_HEIGHT); // ~ narrow & tall (ไทยทั้งประเทศ)

const MIN_SCALE = 1;
const MAX_SCALE = 7;

// ขนาดจังหวัดที่จะเริ่มโชว์ชื่อในแต่ละ tier ซูม (กันรก)
const TIER_THRESHOLD = [Infinity, 0.5, 0.22, -1];
function tierForScale(s) {
    'worklet';
    if (s < 1.8) return 0;
    if (s < 3) return 1;
    if (s < 4.5) return 2;
    return 3;
}

const MEDAL_STYLE = {
    gold:   { ring: '#E8B23A', grad: ['#F3D77B', '#D9A328'], icon: 'trophy' },
    silver: { ring: '#AEB4BC', grad: ['#D7DBE0', '#A7ADB6'], icon: 'medal' },
    bronze: { ring: '#B07D4E', grad: ['#C99A6A', '#9A6A3E'], icon: 'medal' },
};

/* ============================ COMPONENT ============================ */
export default function HistoryMap({ onNavigate }) {
    const [tab, setTab] = useState('map');
    const [selectedProvince, setSelectedProvince] = useState(null);
    const [detail, setDetail] = useState(null);
    const [mapLocked, setMapLocked] = useState(false); // ล็อก scroll ตอนซูมแผนที่

    const visitedCount = Object.keys(PROVINCE_LEARNINGS).length;

    const openProvince = useCallback((p) => p && setSelectedProvince(p), []);
    const closeProvince = () => setSelectedProvince(null);
    const openDetail = (item, provinceTh) => {
        setSelectedProvince(null);
        setDetail({ item, province: shortName(provinceTh) });
    };

    if (detail) {
        return <LearningDetail detail={detail} onBack={() => setDetail(null)} />;
    }

    const provinceList = HISTORY_ORDER
        .filter(th => PROVINCE_LEARNINGS[th])
        .map(th => ({ th, count: PROVINCE_LEARNINGS[th].length }));

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView
                style={styles.body}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                scrollEnabled={!(tab === 'map' && mapLocked)}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>HISTORY MAP</Text>
                    <Text style={styles.countLabel}>
                        จังหวัด <Text style={styles.countNum}>{visitedCount}/77</Text>
                    </Text>
                </View>

                <View style={styles.tabBar}>
                    <TabButton icon="location-outline" label="แผนที่" active={tab === 'map'} onPress={() => setTab('map')} />
                    <TabButton icon="trophy-outline" label="อันดับ" active={tab === 'rank'} onPress={() => setTab('rank')} />
                </View>

                {tab === 'map' ? (
                    <MapTab
                        selectedProvince={selectedProvince}
                        onProvincePress={openProvince}
                        provinceList={provinceList}
                        onLockChange={setMapLocked}
                    />
                ) : (
                    <RankTab />
                )}
            </ScrollView>

            <ProvinceSheet province={selectedProvince} onClose={closeProvince} onOpenLearning={openDetail} />
        </SafeAreaView>
    );
}

/* ============================ TABS ============================ */
function TabButton({ icon, label, active, onPress }) {
    return (
        <TouchableOpacity style={[styles.tabBtn, active && styles.tabBtnActive]} activeOpacity={0.85} onPress={onPress}>
            <Ionicons name={icon} size={20} color={active ? '#FFFFFF' : '#6B4A2B'} />
            <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
        </TouchableOpacity>
    );
}

/* ---------------------- ZOOMABLE MAP (GH + Reanimated, viewBox-based) ---------------------- */
function MapTab({ selectedProvince, onProvincePress, provinceList, onLockChange }) {
    const scale = useSharedValue(1);
    const tx = useSharedValue(0);
    const ty = useSharedValue(0);
    const savedScale = useSharedValue(1);
    const prevScale = useSharedValue(1);

    const [zoomed, setZoomed] = useState(false);
    const [tier, setTier] = useState(0);

    const setLock = (v) => { setZoomed(v); onLockChange?.(v); };

    // clamp ตำแหน่งให้อยู่ในขอบเสมอ (ใช้ระหว่างซูม/เลื่อน -> ไม่ต้องดีดกลับ)
    const clampX = (v, s) => {
        'worklet';
        const minX = -DISPLAY_W * (s - 1);
        return Math.min(0, Math.max(minX, v));
    };
    const clampY = (v, s) => {
        'worklet';
        const minY = -DISPLAY_H * (s - 1);
        return Math.min(0, Math.max(minY, v));
    };

    // ซูม = แตะถ่างสองนิ้ว (รันบน UI thread)
    const pinch = Gesture.Pinch()
        .onStart(() => { savedScale.value = scale.value; prevScale.value = 1; runOnJS(setLock)(true); })
        .onChange((e) => {
            const factor = e.scale / prevScale.value;
            prevScale.value = e.scale;
            let ns = scale.value * factor;
            ns = Math.min(MAX_SCALE, Math.max(MIN_SCALE, ns));
            const real = ns / scale.value;
            // ซูมเข้าหาจุดกึ่งกลางสองนิ้ว (focal) -> ติดมือ + clamp ทันที ไม่หลุดขอบ
            tx.value = clampX(e.focalX - (e.focalX - tx.value) * real, ns);
            ty.value = clampY(e.focalY - (e.focalY - ty.value) * real, ns);
            scale.value = ns;
        })
        .onEnd(() => {
            runOnJS(setLock)(scale.value > 1.02);
        });

    // เลื่อน = ลากนิ้วเดียว (เปิดเฉพาะตอนซูมอยู่ -> ตอนยังไม่ซูมให้หน้าเพจ scroll ได้ปกติ)
    const pan = Gesture.Pan()
        .enabled(zoomed)
        .minDistance(6)
        .onChange((e) => {
            const s = scale.value;
            tx.value = clampX(tx.value + e.changeX, s);
            ty.value = clampY(ty.value + e.changeY, s);
        });

    const gesture = useMemo(
        () => Gesture.Simultaneous(pinch, pan),
        [zoomed] // rebuild เมื่อ pan เปิด/ปิด
    );

    // ซูม/เลื่อนด้วย matrix บน <G> -> เวกเตอร์คมตลอด ไม่แตก
    // (หมายเหตุ: animate viewBox ของ <Svg> ไม่ทำงานบน New Architecture/Fabric)
    // matrix = [a,b,c,d,e,f] -> scale s + เลื่อน (e,f) ในหน่วย viewBox
    const gProps = useAnimatedProps(() => {
        const s = scale.value;
        const e = (tx.value / DISPLAY_W) * MAP_WIDTH;
        const f = (ty.value / DISPLAY_H) * MAP_HEIGHT;
        return { matrix: [s, 0, 0, s, e, f] };
    });

    // อัปเดต tier ป้ายชื่อเมื่อระดับซูมข้ามขั้น
    useAnimatedReaction(
        () => tierForScale(scale.value),
        (cur, prev) => { if (cur !== prev) runOnJS(setTier)(cur); }
    );

    const reset = () => {
        scale.value = withTiming(1, { duration: 220 });
        tx.value = withTiming(0, { duration: 220 });
        // รอ animation ซูมออกจบ ค่อยสลับกลับเป็น static (กันภาพกระโดด)
        ty.value = withTiming(0, { duration: 220 }, (finished) => {
            if (finished) runOnJS(setLock)(false);
        });
        setTier(0);
    };

    const thr = TIER_THRESHOLD[tier];
    const labelled = PROVINCES.filter(p =>
        hasData(p.th) || selectedProvince?.th === p.th || p.area >= thr
    );
    const markers = useMemo(() => PROVINCES.filter(p => hasData(p.th)), []);

    // จังหวัดมีข้อมูล (สีเขียว) -> แยกเป็น path เพื่อให้กดเลือกได้ (มีแค่ไม่กี่จังหวัด จึงไม่หนัก)
    const greenFills = useMemo(() => (
        markers.map(p => (
            <Path
                key={'gf' + p.code}
                d={p.d}
                fill="#2F6B3A"
                onPress={() => onProvincePress(p)}
            />
        ))
    ), [markers, onProvincePress]);

    const selectedBorder = useMemo(() => {
        const sel = selectedProvince && PROVINCES.find(p => p.th === selectedProvince.th);
        if (!sel) return null;
        return (
            <Path
                key={'sel' + sel.code}
                d={sel.d}
                fill="none"
                stroke="#452817"
                strokeWidth={3}
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
            />
        );
    }, [selectedProvince]);

    // เนื้อหา path ใช้ร่วมกันทั้งโหมด static และ animated
    const mapPaths = (
        <>
            <Path d={GRAY_FILL_D} fill="#8FAE80" pointerEvents="none" />
            {greenFills}
            <Path
                d={ALL_STROKE_D}
                fill="none"
                stroke="#EFE7D6"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
                pointerEvents="none"
            />
            {selectedBorder}
        </>
    );

    return (
        <>
            <View style={styles.mapCard}>
                <GestureDetector gesture={gesture}>
                    <View
                        style={styles.viewport}
                        collapsable={false}
                        renderToHardwareTextureAndroid={!zoomed}
                        shouldRasterizeIOS={!zoomed}
                    >
                        {zoomed ? (
                            // โหมดซูม: animate matrix บน <G> (วาดใหม่ทุกเฟรม แต่เกิดเฉพาะตอน interact)
                            <AnimatedSvg width={DISPLAY_W} height={DISPLAY_H} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}>
                                <AnimatedG animatedProps={gProps}>{mapPaths}</AnimatedG>
                            </AnimatedSvg>
                        ) : (
                            // โหมดปกติ: <Svg> ธรรมดา ไม่มี animated -> Android cache เป็น texture ได้ เลื่อนหน้าลื่น
                            <Svg width={DISPLAY_W} height={DISPLAY_H} viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}>
                                {mapPaths}
                            </Svg>
                        )}

                        {/* overlay: markers + labels (เลื่อนตามแผนที่ แต่คงขนาดเสมอ) */}
                        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
                            {markers.map(p => (
                                <Projected key={'mk' + p.code} svgX={p.cx} svgY={p.cy} w={40} h={40}
                                    scale={scale} tx={tx} ty={ty}>
                                    <TouchableOpacity activeOpacity={0.85} onPress={() => onProvincePress(p)} style={styles.markerInner}>
                                        {PROVINCE_LEARNINGS[p.th][0].image
                                            ? <Image source={PROVINCE_LEARNINGS[p.th][0].image} style={styles.markerImg} />
                                            : <View style={styles.markerPlaceholder}><Ionicons name="cube-outline" size={18} color="#7C6A4E" /></View>}
                                    </TouchableOpacity>
                                </Projected>
                            ))}

                            {labelled.map(p => {
                                const dataP = hasData(p.th);
                                return (
                                    <Projected key={'lb' + p.code} svgX={p.cx} svgY={p.cy}
                                        w={120} h={22} yOffset={dataP ? 22 : 0} pointerEvents="none"
                                        scale={scale} tx={tx} ty={ty}>
                                        <View style={styles.labelCenter}>
                                            <View style={[styles.labelPill, dataP && styles.labelPillData]}>
                                                <Text style={[styles.labelText, dataP && styles.labelTextData]} numberOfLines={1}>
                                                    {shortName(p.th)}
                                                </Text>
                                            </View>
                                        </View>
                                    </Projected>
                                );
                            })}
                        </View>

                        <View style={styles.mapHint} pointerEvents="none">
                            <Ionicons name="scan-outline" size={13} color="#6E5436" />
                            <Text style={styles.mapHintText}>ถ่างนิ้วเพื่อซูม • แตะจังหวัดเพื่อดู</Text>
                        </View>
                        {zoomed && (
                            <TouchableOpacity style={styles.resetBtn} onPress={reset} activeOpacity={0.85}>
                                <Ionicons name="contract-outline" size={20} color="#6B4A2B" />
                            </TouchableOpacity>
                        )}
                    </View>
                </GestureDetector>
            </View>

            <View style={styles.legendCard}>
                <Text style={styles.legendHint}>กดที่จังหวัดเพื่อดูรายละเอียด</Text>
                <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendSwatch, { backgroundColor: '#2F6B3A' }]} />
                        <Text style={styles.legendText}>มีรายการ</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendSwatch, { backgroundColor: '#8FAE80' }]} />
                        <Text style={styles.legendText}>ไม่มีรายการ</Text>
                    </View>
                </View>
            </View>

            <Text style={styles.sectionTitle}>ประวัติ</Text>
            {provinceList.map(({ th, count }) => (
                <TouchableOpacity key={th} style={styles.historyRow} activeOpacity={0.85}
                    onPress={() => onProvincePress(PROVINCES.find(p => p.th === th))}>
                    <View style={styles.historyPin}><Ionicons name="location" size={22} color="#A9794A" /></View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.historyName}>{shortName(th)}</Text>
                        <Text style={styles.historyCount}><Text style={styles.historyCountNum}>{count}</Text> การเรียนรู้</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={22} color="#A9794A" />
                </TouchableOpacity>
            ))}
        </>
    );
}

/* แปลงพิกัด SVG -> ตำแหน่งบนจอ (เลื่อนตามแผนที่ ขนาดคงที่) */
function Projected({ svgX, svgY, w, h, yOffset = 0, scale, tx, ty, children, style, pointerEvents }) {
    const aStyle = useAnimatedStyle(() => {
        const sx = tx.value + scale.value * (svgX / MAP_WIDTH * DISPLAY_W);
        const sy = ty.value + scale.value * (svgY / MAP_HEIGHT * DISPLAY_H);
        return { transform: [{ translateX: sx - w / 2 }, { translateY: sy - h / 2 + yOffset }] };
    });
    return (
        <Animated.View
            pointerEvents={pointerEvents}
            style={[{ position: 'absolute', left: 0, top: 0, width: w, height: h }, aStyle, style]}
        >
            {children}
        </Animated.View>
    );
}

function RankTab() {
    return (
        <>
            <Text style={styles.sectionTitle}>อันดับของฉัน</Text>
            <View style={styles.podiumCard}>
                <View style={styles.podiumRow}>
                    {MY_PODIUM.map((m) => {
                        const cfg = MEDAL_STYLE[m.medal];
                        const h = m.medal === 'gold' ? 150 : m.medal === 'silver' ? 120 : 96;
                        return (
                            <View key={m.medal} style={styles.podiumCol}>
                                <LinearGradient colors={cfg.grad} style={[styles.medal, { borderColor: cfg.ring }]}>
                                    <Ionicons name={cfg.icon} size={24} color="#FFFFFF" />
                                </LinearGradient>
                                <LinearGradient colors={cfg.grad} style={[styles.podiumBar, { height: h }]}>
                                    <Text style={styles.podiumRank}>{m.rank}</Text>
                                    <Text style={styles.podiumProvince}>{m.province}</Text>
                                    <Text style={styles.podiumPeople}>{m.people} คน</Text>
                                </LinearGradient>
                            </View>
                        );
                    })}
                </View>
            </View>

            <Text style={styles.sectionTitle}>อันดับจังหวัดยอดนิยม</Text>
            {TOP_PROVINCES.map((p, i) => (
                <View key={p.province} style={styles.rankRow}>
                    <View style={styles.rankBadge}><Text style={styles.rankBadgeNum}>{i + 1}</Text></View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.rankProvince}>{p.province}</Text>
                        <Text style={styles.rankPeople}>{p.people} คน</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.rankLearns}>{p.learns}</Text>
                        <Text style={styles.rankLearnsLabel}>การเรียนรู้</Text>
                    </View>
                </View>
            ))}
        </>
    );
}

/* ============================ SHEET ============================ */
function ProvinceSheet({ province, onClose, onOpenLearning }) {
    const learnings = province ? (PROVINCE_LEARNINGS[province.th] || []) : [];
    return (
        <Modal visible={!!province} transparent animationType="slide" onRequestClose={onClose}>
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable style={styles.sheet} onPress={() => {}}>
                    <View style={styles.sheetHeader}>
                        <View style={styles.sheetHeaderIcon}><Ionicons name="location" size={22} color="#6B4A2B" /></View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.sheetTitle}>{province ? shortName(province.th) : ''}</Text>
                            <Text style={styles.sheetSub}>{province?.en}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} hitSlop={10}>
                            <Ionicons name="close-circle" size={28} color="#F0E6D5" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.sheetBody}>
                        <Text style={styles.sheetCount}>{learnings.length}</Text>
                        <Text style={styles.sheetCountLabel}>การเรียนรู้ทั้งหมด</Text>

                        {learnings.length > 0 ? (
                            <>
                                <Text style={styles.sheetListLabel}>สิ่งที่เรียนรู้</Text>
                                {learnings.map(item => (
                                    <TouchableOpacity key={item.id} style={styles.learnRow} activeOpacity={0.85}
                                        onPress={() => onOpenLearning(item, province.th)}>
                                        <View style={styles.learnThumb}>
                                            {item.image
                                                ? <Image source={item.image} style={styles.learnThumbImg} />
                                                : <Ionicons name="image-outline" size={22} color="#9A8B72" />}
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.learnTitle}>{item.title}</Text>
                                            <View style={styles.learnDateRow}>
                                                <Ionicons name="time-outline" size={14} color="#A9794A" />
                                                <Text style={styles.learnDate}>{item.date}</Text>
                                            </View>
                                        </View>
                                        <Ionicons name="chevron-forward" size={22} color="#A9794A" />
                                    </TouchableOpacity>
                                ))}
                            </>
                        ) : (
                            <View style={styles.emptyBox}>
                                <Ionicons name="sparkles-outline" size={28} color="#B7AC98" />
                                <Text style={styles.emptyText}>ยังไม่มีการเรียนรู้ในจังหวัดนี้</Text>
                                <Text style={styles.emptyHint}>ไปสแกนสิ่งของเพื่อปลดล็อกความรู้กัน!</Text>
                            </View>
                        )}
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

/* ============================ DETAIL ============================ */
function LearningDetail({ detail, onBack }) {
    const { item, province } = detail;
    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <ScrollView style={styles.body} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack} hitSlop={10}>
                    <Ionicons name="caret-back" size={22} color="#452817" />
                    <Text style={styles.backText}>BACK</Text>
                </TouchableOpacity>

                <View style={styles.detailHeader}>
                    <View style={styles.detailHeaderIcon}>
                        {SHOP_ICON
                            ? <Image source={SHOP_ICON} style={{ width: 32, height: 32 }} resizeMode="contain" />
                            : <Ionicons name="storefront" size={26} color="#E0A45A" />}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.detailTitle}>{item.title}</Text>
                        <Text style={styles.detailLocation}>สถานที่ : {province}</Text>
                    </View>
                </View>

                <View style={styles.scanFrame}>
                    <View style={styles.scanImageWrap}>
                        {item.image
                            ? <Image source={item.image} style={styles.scanImage} resizeMode="cover" />
                            : <View style={styles.scanPlaceholder}>
                                <Ionicons name="image-outline" size={40} color="#B7AC98" />
                                <Text style={styles.scanPlaceholderText}>รูปภาพที่สแกน</Text>
                              </View>}
                    </View>
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />
                </View>

                <View style={styles.pipoWrap}>
                    <View style={styles.pipoChar}>
                        {PIPO_SRC
                            ? <Image source={PIPO_SRC} style={{ width: 84, height: 84 }} resizeMode="contain" />
                            : <Text style={{ fontSize: 56 }}>🦛</Text>}
                    </View>
                    <View style={styles.pipoBubble}>
                        <View style={styles.pipoTag}><Text style={styles.pipoTagText}>PIPO</Text></View>
                        <Text style={styles.pipoText}>{item.pipo}</Text>
                    </View>
                </View>

                <TouchableOpacity activeOpacity={0.9} onPress={onBack}>
                    <LinearGradient colors={['#D99A3F', '#C07C26']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.ctaBtn}>
                        <Text style={styles.ctaText}>{item.cta} ▸</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

/* ============================ STYLES ============================ */
const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F7F1E5' },
    body: { flex: 1, paddingHorizontal: H_PADDING },
    content: { paddingBottom: 28 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 10, paddingBottom: 14 },
    title: { fontFamily: 'Jersey', fontSize: 28, fontWeight: '900', color: '#C47A30', letterSpacing: 1 },
    countLabel: { fontFamily: 'PKNonthaburi', fontSize: 15, color: '#B98A3E' },
    countNum: { fontFamily: 'Jersey', fontSize: 18, fontWeight: '900', color: '#C99A3E' },

    tabBar: { flexDirection: 'row', backgroundColor: '#FCF8EF', borderWidth: 2, borderColor: '#D8CBB5', borderRadius: 14, padding: 5, gap: 5, marginBottom: 16 },
    tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 11, borderRadius: 10 },
    tabBtnActive: { backgroundColor: '#7B5733' },
    tabText: { fontFamily: 'PKNonthaburi', fontSize: 17, fontWeight: '700', color: '#6B4A2B' },
    tabTextActive: { color: '#FFFFFF' },

    mapCard: { backgroundColor: '#FCF8EF', borderWidth: 2, borderColor: '#D8CBB5', borderRadius: 16, padding: MAP_CARD_PAD, alignItems: 'center', marginBottom: 14 },
    viewport: { width: DISPLAY_W, height: DISPLAY_H, borderRadius: 12, overflow: 'hidden', backgroundColor: '#FCF8EF' },

    markerInner: {
        width: 40, height: 40, borderRadius: 11, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#FFFFFF',
        overflow: 'hidden', alignItems: 'center', justifyContent: 'center',
        shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 3,
    },
    markerImg: { width: '100%', height: '100%', borderRadius: 9 },
    markerPlaceholder: { width: '100%', height: '100%', borderRadius: 9, backgroundColor: '#EDE3D0', alignItems: 'center', justifyContent: 'center' },

    labelCenter: { width: 120, alignItems: 'center' },
    labelPill: { backgroundColor: 'rgba(252,248,239,0.92)', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: '#E2D6BE' },
    labelPillData: { backgroundColor: '#2F6B3A', borderColor: '#235029' },
    labelText: { fontFamily: 'PKNonthaburi', fontSize: 12, fontWeight: '700', color: '#3A2817' },
    labelTextData: { color: '#FFFFFF' },

    mapHint: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(252,248,239,0.88)', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5, borderWidth: 1, borderColor: '#E2D6BE' },
    mapHintText: { fontFamily: 'PKNonthaburi', fontSize: 12, color: '#6E5436' },
    resetBtn: { position: 'absolute', bottom: 12, right: 12, width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(252,248,239,0.95)', borderWidth: 1.5, borderColor: '#D8CBB5', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 3 },

    legendCard: { backgroundColor: '#FCF8EF', borderWidth: 2, borderColor: '#D8CBB5', borderRadius: 14, padding: 14, marginBottom: 18 },
    legendHint: { fontFamily: 'PKNonthaburi', fontSize: 16, color: '#452817', marginBottom: 8 },
    legendRow: { flexDirection: 'row', gap: 24 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    legendSwatch: { width: 18, height: 18, borderRadius: 5 },
    legendText: { fontFamily: 'PKNonthaburi', fontSize: 15, color: '#6E441B' },

    sectionTitle: { fontFamily: 'PKNonthaburi', fontSize: 22, fontWeight: '700', color: '#6E441B', marginBottom: 12, marginTop: 4 },

    historyRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FCF8EF', borderWidth: 2, borderColor: '#E4DAC6', borderRadius: 14, padding: 12, marginBottom: 12 },
    historyPin: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#EFE7D6', alignItems: 'center', justifyContent: 'center' },
    historyName: { fontFamily: 'PKNonthaburi', fontSize: 20, fontWeight: '700', color: '#452817' },
    historyCount: { fontFamily: 'PKNonthaburi', fontSize: 15, color: '#9A8569' },
    historyCountNum: { fontWeight: '900', color: '#6E441B' },

    backdrop: { flex: 1, backgroundColor: 'rgba(40,26,12,0.45)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#FBF6EC', borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden', paddingBottom: 28, maxHeight: '80%' },
    sheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#7B5733', paddingHorizontal: 18, paddingVertical: 16 },
    sheetHeaderIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#FBF6EC', alignItems: 'center', justifyContent: 'center' },
    sheetTitle: { fontFamily: 'PKNonthaburi', fontSize: 24, fontWeight: '700', color: '#FFFFFF' },
    sheetSub: { fontFamily: 'PKNonthaburi', fontSize: 14, color: '#E9D8C0' },
    sheetBody: { padding: 18 },
    sheetCount: { fontFamily: 'Jersey', fontSize: 44, fontWeight: '900', color: '#7B5733', textAlign: 'center' },
    sheetCountLabel: { fontFamily: 'PKNonthaburi', fontSize: 16, color: '#6E441B', textAlign: 'center', marginBottom: 14 },
    sheetListLabel: { fontFamily: 'PKNonthaburi', fontSize: 17, fontWeight: '700', color: '#452817', marginBottom: 10 },

    learnRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#EAE0CD', borderRadius: 14, padding: 12, marginBottom: 10 },
    learnThumb: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#F0E8D8', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
    learnThumbImg: { width: '100%', height: '100%' },
    learnTitle: { fontFamily: 'PKNonthaburi', fontSize: 19, fontWeight: '700', color: '#452817' },
    learnDateRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
    learnDate: { fontFamily: 'PKNonthaburi', fontSize: 14, fontWeight: '700', color: '#9A8569' },

    emptyBox: { alignItems: 'center', paddingVertical: 24, gap: 6 },
    emptyText: { fontFamily: 'PKNonthaburi', fontSize: 17, fontWeight: '700', color: '#6E441B' },
    emptyHint: { fontFamily: 'PKNonthaburi', fontSize: 14, color: '#9A8569' },

    podiumCard: { backgroundColor: '#FCF8EF', borderWidth: 2, borderColor: '#E4DAC6', borderRadius: 16, padding: 16, marginBottom: 20 },
    podiumRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 10 },
    podiumCol: { flex: 1, alignItems: 'center' },
    medal: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: -14, zIndex: 2 },
    podiumBar: { width: '100%', borderRadius: 12, paddingTop: 22, paddingBottom: 12, alignItems: 'center', gap: 2 },
    podiumRank: { fontFamily: 'Jersey', fontSize: 22, fontWeight: '900', color: '#FFFFFF' },
    podiumProvince: { fontFamily: 'PKNonthaburi', fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
    podiumPeople: { fontFamily: 'PKNonthaburi', fontSize: 13, fontWeight: '700', color: '#FFFFFF' },

    rankRow: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#FCF8EF', borderWidth: 2, borderColor: '#E4DAC6', borderRadius: 14, padding: 12, marginBottom: 12 },
    rankBadge: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#E7DCC6', alignItems: 'center', justifyContent: 'center' },
    rankBadgeNum: { fontFamily: 'Jersey', fontSize: 22, fontWeight: '900', color: '#6E441B' },
    rankProvince: { fontFamily: 'PKNonthaburi', fontSize: 20, fontWeight: '700', color: '#452817' },
    rankPeople: { fontFamily: 'PKNonthaburi', fontSize: 14, color: '#9A8569' },
    rankLearns: { fontFamily: 'Jersey', fontSize: 22, fontWeight: '900', color: '#6E441B' },
    rankLearnsLabel: { fontFamily: 'PKNonthaburi', fontSize: 13, color: '#9A8569' },

    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 10, paddingBottom: 14 },
    backText: { fontFamily: 'Jersey', fontSize: 24, fontWeight: '900', color: '#452817', letterSpacing: 1 },
    detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#4A3422', borderRadius: 16, padding: 14, marginBottom: 18 },
    detailHeaderIcon: { width: 46, height: 46, borderRadius: 10, backgroundColor: '#5E4128', alignItems: 'center', justifyContent: 'center' },
    detailTitle: { fontFamily: 'PKNonthaburi', fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
    detailLocation: { fontFamily: 'PKNonthaburi', fontSize: 15, color: '#E5D6BF', marginTop: 2 },

    scanFrame: { backgroundColor: '#FCF8EF', borderWidth: 2.5, borderColor: '#4A3422', borderRadius: 18, padding: 22, marginBottom: 18 },
    scanImageWrap: { width: '100%', aspectRatio: 4 / 3, borderRadius: 6, overflow: 'hidden', backgroundColor: '#E9E0CF' },
    scanImage: { width: '100%', height: '100%' },
    scanPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
    scanPlaceholderText: { fontFamily: 'PKNonthaburi', fontSize: 14, color: '#9A8B72' },
    corner: { position: 'absolute', width: 26, height: 26, borderColor: '#D98E2E' },
    cornerTL: { top: 10, left: 10, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 4 },
    cornerTR: { top: 10, right: 10, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 4 },
    cornerBL: { bottom: 10, left: 10, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 4 },
    cornerBR: { bottom: 10, right: 10, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 4 },

    pipoWrap: { marginBottom: 18 },
    pipoChar: { alignItems: 'flex-end', paddingRight: 12, marginBottom: -10, zIndex: 2 },
    pipoBubble: { backgroundColor: '#FCF8EF', borderWidth: 2.5, borderColor: '#4A3422', borderRadius: 16, padding: 16, paddingTop: 22 },
    pipoTag: { position: 'absolute', top: -14, left: 16, backgroundColor: '#4A3422', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 3 },
    pipoTagText: { fontFamily: 'Jersey', fontSize: 15, fontWeight: '900', color: '#E0A45A', letterSpacing: 1 },
    pipoText: { fontFamily: 'PKNonthaburi', fontSize: 16, lineHeight: 26, color: '#3A2817' },

    ctaBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 2, borderColor: '#A9691C' },
    ctaText: { fontFamily: 'PKNonthaburi', fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
});