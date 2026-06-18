import React, { useState } from 'react';
import {
    View, Text, Image, TouchableOpacity, Modal,
    StyleSheet, Dimensions, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

const shopSrc = require('../../assets/shop.png');

const { width: SW } = Dimensions.get('window');
const PAD  = 20;
const GAP  = 8;
const COLS = 4;
const ITEM_W = (SW - PAD * 2 - GAP * (COLS - 1)) / COLS;

const LEVEL_TITLES = [
    'เลือกศาสตร์ความรู้ที่สนใจ',
    'เลือกศาสตร์ย่อยความรู้ที่สนใจ',
    'เลือกมุมมองความรู้ที่สนใจ',
];
const SUBTITLE = 'แต่ละตัวเลือกจะมองมุมความรู้ที่ต่างกัน';

const LENS_TREE = [
    {
        key: 'engineering', th: 'วิศวกรรม', en: 'Engineering', icon: 'construct-outline', pct: 80,
        children: [
            {
                key: 'comp', th: 'วิศวกรรมคอมพิวเตอร์', en: 'Computer Eng', icon: 'hardware-chip-outline', pct: 60,
                children: [
                    { key: 'embedded', th: 'ระบบฝังตัว',        en: 'Embedded System',       icon: 'hardware-chip-outline', pct: 70,
                      topics: ['การต่อวงจร', 'เขียนโค้ดคุม', 'ออกแบบบอร์ด', 'เชื่อมต่อระบบ'] },
                    { key: 'iot',      th: 'สมาร์ทไอโอที',      en: 'Smart IoT',             icon: 'wifi-outline',          pct: 30,
                      topics: ['เชื่อมต่อเซนเซอร์', 'ส่งข้อมูลขึ้นคลาวด์', 'ควบคุมผ่านแอป'] },
                    { key: 'software', th: 'การเขียนโค้ด',      en: 'Software',              icon: 'code-slash-outline',    pct: 30,
                      topics: ['พื้นฐานการเขียนโปรแกรม', 'โครงสร้างข้อมูล', 'ดีบักโค้ด'] },
                    { key: 'ai',       th: 'ปัญญาประดิษฐ์',     en: 'Artificial Intelligence', icon: 'sparkles-outline',    pct: null },
                    { key: 'cyber',    th: 'ความปลอดภัยไซเบอร์', en: 'Cybersecurity',        icon: 'lock-closed-outline',   pct: null },
                    { key: 'cloud',    th: 'ระบบคลาวด์',        en: 'Cloud Computing',       icon: 'cloud-outline',         pct: null },
                    { key: 'data',     th: 'วิศวกรรมข้อมูล',    en: 'Data Engineering',      icon: 'server-outline',        pct: null },
                    { key: 'network',  th: 'ระบบเน็ตเวิร์ก',    en: 'Network',               icon: 'git-network-outline',   pct: null },
                ],
            },
            { key: 'civil',  th: 'วิศวกรรมโยธา',         en: 'Civil',       icon: 'business-outline',   pct: 30 },
            { key: 'mech',   th: 'วิศวกรรมเครื่องกล',     en: 'Mechanical',  icon: 'cog-outline',        pct: 30 },
            { key: 'elec',   th: 'วิศวกรรมไฟฟ้า',        en: 'Electrical',  icon: 'flash-outline',      pct: 30 },
            { key: 'chem',   th: 'วิศวกรรมเคมี',         en: 'Chemical',    icon: 'flask-outline',      pct: 10 },
            { key: 'indus',  th: 'วิศวกรรมอุตสาหการ',     en: 'Industrial',  icon: 'build-outline',      pct: null },
            { key: 'auto',   th: 'วิศวกรรมยานยนต์',       en: 'Automotive',  icon: 'car-sport-outline',  pct: null },
            { key: 'biomed', th: 'วิศวกรรมชีวการแพทย์',   en: 'Biomedical',  icon: 'fitness-outline',    pct: null },
            { key: 'env',    th: 'วิศวกรรมสิ่งแวดล้อม',   en: 'Environmental', icon: 'leaf-outline',     pct: null },
            { key: 'mining', th: 'วิศวกรรมเหมืองแร่',     en: 'Mining',      icon: 'diamond-outline',    pct: null },
            { key: 'logis',  th: 'วิศวกรรมโลจิสติกส์',    en: 'Logistics',   icon: 'cube-outline',       pct: null },
            { key: 'aero',   th: 'วิศวกรรมการบิน',        en: 'Aeronautical', icon: 'airplane-outline',  pct: null },
        ],
    },
    { key: 'interior',     th: 'ออกแบบภายใน',   en: 'Interior Design', icon: 'home-outline',          pct: null },
    { key: 'science',      th: 'วิทยาศาสตร์',   en: 'Science',         icon: 'flask-outline',         pct: 20   },
    { key: 'math',         th: 'คณิตศาสตร์',    en: 'Mathematics',     icon: 'calculator-outline',    pct: null },
    { key: 'business',     th: 'ธุรกิจ',         en: 'Business',        icon: 'briefcase-outline',     pct: null },
    { key: 'marketing',    th: 'การตลาด',        en: 'Marketing',       icon: 'bar-chart-outline',     pct: null },
    { key: 'architecture', th: 'สถาปัตย์',      en: 'Architecture',    icon: 'business-outline',      pct: null },
    { key: 'comms',        th: 'การสื่อสาร',    en: 'Communication',   icon: 'chatbubbles-outline',   pct: null },
    { key: 'history',      th: 'ประวัติศาสตร์', en: 'History',         icon: 'book-outline',          pct: null },
    { key: 'law',          th: 'กฎหมาย',         en: 'Law & Policy',    icon: 'document-text-outline', pct: null },
    { key: 'agriculture',  th: 'เกษตร',          en: 'Agriculture',     icon: 'leaf-outline',          pct: null },
    { key: 'healthcare',   th: 'สุขภาพ',         en: 'Healthcare',      icon: 'heart-outline',         pct: null },
];

function resolvePath(path) {
    let list = LENS_TREE;
    for (const key of path) {
        const node = list.find(n => n.key === key);
        list = node?.children ?? [];
    }
    return list;
}

const byPct = (a, b) => (b.pct ?? -1) - (a.pct ?? -1);

function LensCard({ lens, selected, onPress }) {
    const disabled = lens.pct === null;

    let iconColor = '#6E441B';
    if (disabled)      iconColor = '#A89A86';
    else if (selected) iconColor = '#C47A30';

    return (
        <TouchableOpacity
            style={[
                styles.card,
                { width: ITEM_W, minHeight: ITEM_W * 1.3 },
                !disabled && styles.cardEnabled,
                selected && styles.cardSelected,
                disabled && styles.cardDisabled,
            ]}
            activeOpacity={0.75}
            onPress={onPress}
            disabled={disabled}
        >
            {!disabled && (
                <View style={[styles.badge, selected && styles.badgeActive]}>
                    <Text style={styles.badgeText}>{lens.pct}%</Text>
                </View>
            )}
            <Ionicons name={lens.icon} size={ITEM_W * 0.4} color={iconColor} />
            <Text
                style={[
                    styles.lensThName,
                    selected && styles.lensThNameSel,
                    disabled && styles.lensTextDisabled,
                ]}
                numberOfLines={2}
            >
                {lens.th}
            </Text>
            <Text
                style={[styles.lensEnName, disabled && styles.lensTextDisabled]}
                numberOfLines={1}
            >
                {lens.en}
            </Text>
        </TouchableOpacity>
    );
}

function TopicModal({ node, onClose, onPick }) {
    return (
        <Modal visible transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalCard}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>อยากรู้เรื่องอะไรก่อน?</Text>
                        <TouchableOpacity style={styles.modalClose} onPress={onClose} activeOpacity={0.8}>
                            <Ionicons name="close" size={16} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.topicGrid}>
                        {node.topics.map((topic, i) => (
                            <TouchableOpacity
                                key={i}
                                style={styles.topicBtn}
                                activeOpacity={0.8}
                                onPress={() => onPick(topic)}
                            >
                                <Text style={styles.topicText} numberOfLines={2}>{topic}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export default function SelectLens({ onNavigate }) {
    const [path, setPath]         = useState([]);    // เส้นทางการเจาะลึก เช่น ['engineering','comp']
    const [selected, setSelected] = useState(null);  // key ของการ์ดที่เลือกในชั้นนี้
    const [modalNode, setModalNode] = useState(null);

    const cards = [...resolvePath(path)].sort(byPct);
    const selectedNode = cards.find(n => n.key === selected) || null;
    const title = LEVEL_TITLES[Math.min(path.length, LEVEL_TITLES.length - 1)];

    const goBack = () => {
        if (path.length === 0) { onNavigate?.('scan'); return; }
        setPath(path.slice(0, -1));
        setSelected(null);
    };

    const goNext = () => {
        if (!selectedNode) return;
        if (selectedNode.children?.length) {
            setPath([...path, selectedNode.key]);
            setSelected(null);
        } else if (selectedNode.topics?.length) {
            setModalNode(selectedNode);
        } else {
            Alert.alert('เร็ว ๆ นี้', `เนื้อหา “${selectedNode.th}” กำลังจัดทำ`);
        }
    };

    const pickTopic = (topic) => {
        const target = modalNode;
        setModalNode(null);
        onNavigate?.('learn', { path: [...path, target.key], topic });
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.body}>

                <TouchableOpacity style={styles.backBtn} onPress={goBack}>
                    <Text style={styles.backText}>◄ BACK</Text>
                </TouchableOpacity>

                <View style={styles.content}>
                    <View style={styles.itemCard}>
                        <View style={styles.itemThumb}>
                            <Image source={shopSrc} style={styles.itemImg} resizeMode="contain" />
                        </View>
                        <View style={styles.itemTextWrap}>
                            <Text style={styles.itemName} numberOfLines={1}>เมาส์ไร้สาย</Text>
                            <View style={styles.itemLocRow}>
                                <Ionicons name="location-outline" size={15} color="#C47A30" />
                                <Text style={styles.itemLoc} numberOfLines={1}>เชียงใหม่</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.subtitle}>{SUBTITLE}</Text>

                    <View style={styles.grid}>
                        {cards.map(lens => (
                            <LensCard
                                key={lens.key}
                                lens={lens}
                                selected={selected === lens.key}
                                onPress={() => setSelected(lens.key)}
                            />
                        ))}
                    </View>
                </View>

                <TouchableOpacity
                    style={[styles.ctaBtn, !selectedNode && styles.ctaBtnDisabled]}
                    activeOpacity={0.85}
                    onPress={goNext}
                    disabled={!selectedNode}
                >
                    {selectedNode && (
                        <LinearGradient
                            colors={['#DEA569', '#C47A2D', '#C47A2D', '#854F18']}
                            locations={[0, 0.15, 0.85, 1]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={StyleSheet.absoluteFill}
                        />
                    )}
                    <Text style={[styles.ctaText, !selectedNode && styles.ctaTextDisabled]}>ถัดไป</Text>
                </TouchableOpacity>

            </View>

            {modalNode && (
                <TopicModal
                    node={modalNode}
                    onClose={() => setModalNode(null)}
                    onPick={pickTopic}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe:    { flex: 1, backgroundColor: '#F7F1E5' },
    body:    { flex: 1, paddingHorizontal: PAD },
    content: { flex: 1 },

    backBtn: { paddingVertical: 10 },
    backText: {
        fontFamily: 'Jersey',
        fontSize: 26,
        fontWeight: '900',
        color: '#3A1A00',
        letterSpacing: 1,
    },

    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#EDE3D0',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#C9BBA4',
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 18,
        shadowColor: '#2C1810',
        shadowOpacity: 0.18,
        shadowRadius: 1,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    itemThumb: {
        width: 54,
        height: 54,
        borderRadius: 10,
        backgroundColor: '#FFF8EE',
        borderWidth: 2,
        borderColor: '#C47A30',
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemImg:  { width: 40, height: 40 },
    itemTextWrap: { flex: 1, minWidth: 0 },
    itemName: { fontFamily: 'PKNonthaburi', fontSize: 20, fontWeight: '700', color: '#3A1A00' },
    itemLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
    itemLoc:  { fontFamily: 'PKNonthaburi', fontSize: 16, color: '#8B6340' },

    title: {
        fontFamily: 'PKNonthaburi',
        fontSize: 30,
        fontWeight: '700',
        color: '#3A1A00',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontFamily: 'PKNonthaburi',
        fontSize: 20,
        color: '#6E441B',
        textAlign: 'center',
        marginBottom: 14,
        opacity: 0.8,
    },

    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: GAP,
        marginTop: 20,
        marginBottom: 30,
    },
    card: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D8CBB5',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#B8A898',
        paddingVertical: 10,
        paddingHorizontal: 4,
        gap: 4,
        position: 'relative',
    },
    cardEnabled: {
        backgroundColor: '#EDE3D0',
        borderColor: '#C9BBA4',
        shadowColor: '#2C1810',
        shadowOpacity: 0.18,
        shadowRadius: 1,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    cardSelected: {
        backgroundColor: '#FFF8EE',
        borderColor: '#C47A30',
        borderWidth: 2.5,
    },
    cardDisabled: {
        backgroundColor: '#D0C6B6',
        borderColor: '#C2B6A4',
        opacity: 0.5,
    },
    lensTextDisabled: { color: '#A89A86' },
    badge: {
        position: 'absolute',
        top: -10,
        left: -8,
        backgroundColor: '#8B6340',
        borderRadius: 20,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderWidth: 2,
        borderColor: '#F7F1E5',
        zIndex: 2,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 1,
        shadowOffset: { width: 0, height: 1 },
    },
    badgeActive: { backgroundColor: '#C47A30' },
    badgeText:  { fontFamily: 'Jersey', fontSize: 14, fontWeight: '900', color: '#FFF', letterSpacing: 0.5 },
    lensThName: {
        fontFamily: 'PKNonthaburi',
        fontSize: 16,
        color: '#3A1A00',
        textAlign: 'center',
    },
    lensThNameSel: { color: '#C47A30' },
    lensEnName: {
        fontFamily: 'Jersey',
        fontSize: 14,
        color: '#8B6340',
        textAlign: 'center',
        letterSpacing: 0.3,
    },

    ctaBtn: {
        overflow: 'hidden',
        borderRadius: 10,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#2C1810',
        marginTop: 12,
        marginBottom: 12,
    },
    ctaBtnDisabled: {
        backgroundColor: '#D8CBB5',
        borderColor: '#C2B6A4',
    },
    ctaText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 6,
    },
    ctaTextDisabled: { color: '#6E441B' },

    /* ===== Popup เลือกหัวข้อ ===== */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(20, 12, 6, 0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
    },
    modalCard: {
        width: '100%',
        backgroundColor: '#F7F1E5',
        borderWidth: 2.5,
        borderColor: '#2C1810',
        borderRadius: 18,
        paddingVertical: 18,
        paddingHorizontal: 16,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    modalTitle: {
        fontFamily: 'PKNonthaburi',
        fontSize: 22,
        fontWeight: '700',
        color: '#3A1A00',
        flex: 1,
    },
    modalClose: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#C0392B',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    topicGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    topicBtn: {
        width: '48%',
        minHeight: 52,
        backgroundColor: '#EFE7DA',
        borderWidth: 2,
        borderColor: '#C9BBA4',
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    topicText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 16,
        color: '#4A2800',
        textAlign: 'center',
    },
});