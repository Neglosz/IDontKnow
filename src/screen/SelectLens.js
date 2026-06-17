import React, { useState } from 'react';
import {
    View, Text, Image, TouchableOpacity,
    StyleSheet, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import NavBar from '../components/NavBar';

const shopSrc  = require('../../assets/shop.png');

const { width: SW } = Dimensions.get('window');
const PAD  = 20;
const GAP  = 8;
const COLS = 4;
const ITEM_W = (SW - PAD * 2 - GAP * (COLS - 1)) / COLS;

const LENSES = [
    { key: 'engineering',  th: 'วิศวกรรม',      en: 'Engineering',    icon: 'construct-outline',      pct: 80   },
    { key: 'interior',     th: 'ออกแบบภายใน',   en: 'Interior Design', icon: 'home-outline',           pct: null },
    { key: 'science',      th: 'วิทยาศาสตร์',   en: 'Science',        icon: 'flask-outline',          pct: 20   },
    { key: 'math',         th: 'คณิตศาสตร์',    en: 'Mathematics',    icon: 'calculator-outline',     pct: null },
    { key: 'business',     th: 'ธุรกิจ',         en: 'Business',       icon: 'briefcase-outline',      pct: null },
    { key: 'marketing',    th: 'การตลาด',        en: 'Marketing',      icon: 'bar-chart-outline',      pct: null },
    { key: 'architecture', th: 'สถาปัตย์',      en: 'Architecture',   icon: 'business-outline',       pct: null },
    { key: 'comms',        th: 'การสื่อสาร',    en: 'Communication',  icon: 'chatbubbles-outline',    pct: null },
    { key: 'history',      th: 'ประวัติศาสตร์', en: 'History',        icon: 'book-outline',           pct: null },
    { key: 'law',          th: 'กฎหมาย',         en: 'Law & Policy',   icon: 'document-text-outline',  pct: null },
    { key: 'agriculture',  th: 'เกษตร',          en: 'Agriculture',    icon: 'leaf-outline',           pct: null },
    { key: 'healthcare',   th: 'สุขภาพ',         en: 'Healthcare',     icon: 'heart-outline',          pct: null },
];

// เรียง % มาก -> น้อย, อันที่ไม่มี % (disabled) ไปกองท้ายสุด
const SORTED_LENSES = [...LENSES].sort(
    (a, b) => (b.pct ?? -1) - (a.pct ?? -1)
);

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
            <Ionicons
                name={lens.icon}
                size={ITEM_W * 0.4}
                color={iconColor}
            />
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

export default function SelectLens({ onNavigate }) {
    const [selected, setSelected] = useState(null);

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.body}>

                <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate?.('scan')}>
                    <Text style={styles.backText}>◄ BACK</Text>
                </TouchableOpacity>

                <View style={styles.content}>
                    {/* Item card */}
                    <View style={styles.itemCard}>
                        <Image source={shopSrc} style={styles.itemImg} resizeMode="contain" />
                        <View>
                            <Text style={styles.itemName}>เมาส์ไร้สาย</Text>
                            <Text style={styles.itemLoc}>สถานที่ : เชียงใหม่</Text>
                        </View>
                    </View>

                    <Text style={styles.title}>เลือกศาสตร์ความรู้ที่สนใจ</Text>
                    <Text style={styles.subtitle}>แต่ละตัวเลือกจะมองมุมความรู้ที่ต่างกัน</Text>

                    {/* Lens grid */}
                    <View style={styles.grid}>
                        {SORTED_LENSES.map(lens => (
                            <LensCard
                                key={lens.key}
                                lens={lens}
                                selected={selected === lens.key}
                                onPress={() => setSelected(lens.key)}
                            />
                        ))}
                    </View>
                </View>

                {/* ปุ่มถัดไป — ปักล่าง */}
                <TouchableOpacity
                    style={styles.ctaBtn}
                    activeOpacity={0.85}
                    onPress={() => onNavigate?.('result')}
                >
                    <LinearGradient
                        colors={['#DEA569', '#C47A2D', '#C47A2D', '#854F18']}
                        locations={[0, 0.15, 0.85, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <Text style={styles.ctaText}>ถัดไป</Text>
                </TouchableOpacity>

            </View>

            <NavBar active="scan" />
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
        gap: 14,
        backgroundColor: '#2C1810',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#C47A30',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 18,
    },
    itemImg:  { width: 48, height: 48 },
    itemName: { fontFamily: 'PKNonthaburi', fontSize: 20, fontWeight: '700', color: '#F7F1E5' },
    itemLoc:  { fontFamily: 'PKNonthaburi', fontSize: 18, color: '#B8997A', marginTop: 2 },

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
        marginTop:20,
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
        // เงาให้ดูมีมิติ (iOS + Android)
        shadowColor: '#2C1810',
        shadowOpacity: 0.18,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
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
    lensTextDisabled: {
        color: '#A89A86',
    },
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
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 2,
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
    ctaText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 6,
    },
});