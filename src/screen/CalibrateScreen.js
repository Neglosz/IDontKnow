import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import NavBar from '../components/NavBar';

// sprite sheet ของ MASTER — ปรับ path / frame ให้ตรงกับไฟล์จริง
const masterSrc = require('../../assets/boss_talkt_128.png');

function SpriteFrame({ source, frameWidth, frameHeight, totalFrames, fps = 8 }) {
    const [frame, setFrame] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            setFrame(prev => (prev + 1) % totalFrames);
        }, 1000 / fps);
        return () => clearInterval(id);
    }, [totalFrames, fps]);

    return (
        <View style={{ width: frameWidth, height: frameHeight, overflow: 'hidden' }}>
            <Image
                source={source}
                style={{
                    width: frameWidth * totalFrames,
                    height: frameHeight,
                    marginLeft: -frameWidth * frame,
                }}
                resizeMode="cover"
            />
        </View>
    );
}

const DEFAULT_INTRO =
    'บอกฉันหน่อยว่าคุณมีพื้นฐานด้านการออกแบบแผงวงจร (PCB) ขนาดไหน~ ' +
    'ฉันจะได้ช่วยจัดสายการเรียนรู้ที่ท้าทายและเหมาะกับคุณที่สุดได้!';

const DEFAULT_SCENARIO =
    'แย่แล้ว! หุ่นยนต์คู่หูของคุณกระแสไฟไหลเกินจนระบบเตือนสีแดงค้าง ' +
    'หากต้องการจำกัดกระแสไฟฟ้าไม่ให้ไหลผ่านหลอด LED แจ้งเตือนมากเกินไปจนหลอดขาด ' +
    'ต้องนำอุปกรณ์ใดมาต่ออนุกรมในวงจร?';

const DEFAULT_OPTIONS = [
    { id: 'A', th: 'ตัวเก็บประจุ', en: 'Capacitor' },
    { id: 'B', th: 'ไดโอด', en: 'Diode' },
    { id: 'C', th: 'ตัวต้านทาน', en: 'Resistor' },
    { id: 'D', th: 'ไม่ทราบอะไรเลย', en: "I don't know" },
];

export default function CalibrateScreen({
    onNavigate,
    masterIntro = DEFAULT_INTRO,
    scenario = DEFAULT_SCENARIO,
    options = DEFAULT_OPTIONS,
    correctId = 'C',
}) {
    const [selected, setSelected] = useState(null);
    const answered = selected !== null;
    const isCorrect = selected === correctId;

    // อนิเมชันเลื่อนขึ้นของแถบเฉลย
    const slide = useRef(new Animated.Value(0)).current;
    const scrollRef = useRef(null);

    const handlePick = (id) => {
        if (answered) return;          // ตอบได้ครั้งเดียว
        setSelected(id);
    };

    useEffect(() => {
        if (answered) {
            Animated.timing(slide, {
                toValue: 1,
                duration: 220,
                useNativeDriver: true,
            }).start();
            // เลื่อนลิสต์ให้เห็นข้อที่เลือก/เฉลยด้วย
            requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
        }
    }, [answered, slide]);

    const barTranslate = slide.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

    // สีของปุ่มแต่ละสถานะ
    const optionStateStyle = (id) => {
        if (!answered) return null;
        if (id === correctId) return styles.optCorrect;       // ข้อถูก = เขียว
        if (id === selected) return styles.optWrong;          // ข้อที่เลือกผิด = แดง
        return styles.optDimmed;                              // ข้ออื่น = จาง
    };
    const letterStateStyle = (id) => {
        if (!answered) return null;
        if (id === correctId) return styles.letterCorrect;
        if (id === selected) return styles.letterWrong;
        return null;
    };

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.body}>

                <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate?.('learn')}>
                    <Text style={styles.backText}>◄ BACK</Text>
                </TouchableOpacity>

                <ScrollView
                    ref={scrollRef}
                    style={styles.content}
                    contentContainerStyle={{ paddingBottom: 24 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ===== กล่องข้อความ MASTER (อ้างอิงบับเบิล + ตัดคำจาก ScanScreen) ===== */}
                    <View style={styles.msgRow}>
                        <View style={styles.masterAvatar}>
                            <SpriteFrame
                                source={masterSrc}
                                frameWidth={90}
                                frameHeight={90}
                                totalFrames={14}
                                fps={5}
                            />
                        </View>

                        <View style={styles.msgCol}>
                            <View style={styles.nameBadge}>
                                <Text style={styles.nameBadgeText}>MASTER</Text>
                            </View>

                            <View style={styles.bubble}>
                                <Text
                                    style={styles.bubbleText}
                                    textBreakStrategy="highQuality"
                                    lineBreakStrategyIOS="standard"
                                >
                                    {masterIntro}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* ===== กล่อง SCENARIO ===== */}
                    <View style={styles.scenarioBox}>
                        <View style={styles.scenarioBadge}>
                            <Text style={styles.scenarioBadgeText}>SCENARIO</Text>
                        </View>
                        <Text
                            style={styles.scenarioText}
                            textBreakStrategy="highQuality"
                            lineBreakStrategyIOS="standard"
                        >
                            {scenario}
                        </Text>
                    </View>

                    {/* ===== ตัวเลือก A–D ===== */}
                    {options.map((opt) => (
                        <TouchableOpacity
                            key={opt.id}
                            activeOpacity={0.85}
                            onPress={() => handlePick(opt.id)}
                            style={[styles.optionBtn, optionStateStyle(opt.id)]}
                        >
                            <View style={[styles.letterBox, letterStateStyle(opt.id)]}>
                                <Text style={styles.letterText}>{opt.id}</Text>
                            </View>
                            <View style={styles.optTextWrap}>
                                <Text style={styles.optTh}>{opt.th}</Text>
                                <Text style={styles.optEn}>{opt.en}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* ===== แถบเฉลยปักล่างจอ (เด้งขึ้นหลังตอบ ไม่ต้อง scroll หา) ===== */}
                {answered && (
                    <Animated.View
                        style={[
                            styles.resultBar,
                            isCorrect ? styles.resultBarOk : styles.resultBarNo,
                            { opacity: slide, transform: [{ translateY: barTranslate }] },
                        ]}
                    >
                        <View style={styles.resultHeader}>
                            <View style={[styles.resultIcon, isCorrect ? styles.resultIconOk : styles.resultIconNo]}>
                                <Text style={styles.resultIconText}>{isCorrect ? '✓' : '✕'}</Text>
                            </View>
                            <Text style={[styles.resultTitle, { color: isCorrect ? GREEN : RED }]}>
                                {isCorrect ? 'ถูกต้อง!' : 'ยังไม่ใช่~'}
                            </Text>
                        </View>

                        <Text
                            style={styles.resultText}
                            textBreakStrategy="highQuality"
                            lineBreakStrategyIOS="standard"
                        >
                            {isCorrect
                                ? 'ตัวต้านทานต่ออนุกรมช่วยจำกัดกระแสไม่ให้ LED ขาด'
                                : `คำตอบที่ถูกคือข้อ ${correctId} (${options.find(o => o.id === correctId)?.en}) — ต่ออนุกรมเพื่อจำกัดกระแส`}
                        </Text>

                        <TouchableOpacity
                            style={styles.ctaPrimary}
                            activeOpacity={0.85}
                            onPress={() => onNavigate?.('skill-tree')}
                        >
                            <LinearGradient
                                colors={['#DEA569', '#C47A2D', '#C47A2D', '#854F18']}
                                locations={[0, 0.15, 0.85, 1]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                style={StyleSheet.absoluteFill}
                            />
                            <Text style={styles.ctaPrimaryText}>ไปต่อ</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}

            </View>

            <NavBar active="scan" onPress={onNavigate} />
        </SafeAreaView>
    );
}

const GREEN = '#3F7D3A';
const RED = '#B23A2E';

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F7F1E5' },
    body: { flex: 1, paddingHorizontal: 20 },
    content: { flex: 1 },

    backBtn: { paddingVertical: 10 },
    backText: {
        fontFamily: 'Jersey',
        fontSize: 26,
        fontWeight: '900',
        color: '#3A1A00',
        letterSpacing: 1,
    },

    // ===== กล่องข้อความ MASTER =====
    msgRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    masterAvatar: {
        width: 90,
        height: 90,
    },
    msgCol: { flex: 1 },
    nameBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#F7F1E5',
        paddingHorizontal: 10,
        paddingVertical: 3,
        marginBottom: 4,
    },
    nameBadgeText: {
        fontFamily: 'Jersey',
        fontSize: 16,
        fontWeight: '900',
        color: '#C47A30',
        letterSpacing: 0.5,
    },
    bubble: {
        backgroundColor: '#EFE7DA',
        borderWidth: 2,
        borderColor: '#2C1810',
        borderRadius: 16,
        borderBottomLeftRadius: 5,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    bubbleText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 18,
        color: '#4A2800',
    },

    // ===== SCENARIO =====
    scenarioBox: {
        backgroundColor: '#EFE7DA',
        borderWidth: 2,
        borderColor: '#2C1810',
        borderRadius: 14,
        paddingTop: 16,
        paddingBottom: 14,
        paddingHorizontal: 14,
        marginBottom: 16,
    },
    scenarioBadge: {
        position: 'absolute',
        top: -12,
        left: 12,
        backgroundColor: '#F7F1E5',
        borderWidth: 1.5,
        borderColor: '#C47A30',
        borderRadius: 14,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    scenarioBadgeText: {
        fontFamily: 'Jersey',
        fontSize: 16,
        fontWeight: '900',
        color: '#C47A30',
        letterSpacing: 0.5,
    },
    scenarioText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 18,
        color: '#4A2800',
        marginTop: 2,
    },

    // ===== ตัวเลือก =====
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#F7F1E5',
        borderWidth: 2,
        borderColor: '#2C1810',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 12,
        marginBottom: 12,
    },
    optCorrect: { borderColor: GREEN, backgroundColor: '#E5F0DC' },
    optWrong: { borderColor: RED, backgroundColor: '#F3DAD5' },
    optDimmed: { opacity: 0.5 },

    letterBox: {
        width: 42,
        height: 42,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#2C1810',
        alignItems: 'center',
        justifyContent: 'center',
    },
    letterCorrect: { borderColor: GREEN },
    letterWrong: { borderColor: RED },
    letterText: {
        fontFamily: 'Jersey',
        fontSize: 24,
        fontWeight: '900',
        color: '#2C1810',
    },
    optTextWrap: { flex: 1, minWidth: 0 },
    optTh: {
        fontFamily: 'PKNonthaburi',
        fontSize: 18,
        fontWeight: '700',
        color: '#2C1810',
    },
    optEn: {
        fontFamily: 'PKNonthaburi',
        fontSize: 16,
        color: '#6E441B',
        marginTop: 1,
    },

    // ===== แถบเฉลยปักล่างจอ =====
    resultBar: {
        marginHorizontal: -20,      // ขยายเต็มความกว้างจอ (body มี padding 20)
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 12,
        borderTopWidth: 2,
    },
    resultBarOk: { backgroundColor: '#E5F0DC', borderTopColor: GREEN },
    resultBarNo: { backgroundColor: '#F3DAD5', borderTopColor: RED },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    resultIcon: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    resultIconOk: { backgroundColor: GREEN },
    resultIconNo: { backgroundColor: RED },
    resultIconText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '900',
        lineHeight: 18,
    },
    resultTitle: {
        fontFamily: 'Jersey',
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    resultText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 15,
        color: '#2C1810',
        lineHeight: 22,
        marginBottom: 12,
    },

    // ===== CTA =====
    ctaPrimary: {
        overflow: 'hidden',
        borderRadius: 10,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#2C1810',
    },
    ctaPrimaryText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 6,
    },
});