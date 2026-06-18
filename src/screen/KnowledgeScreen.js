import React, { useState, useEffect } from 'react';
import {
    View, Text, Image, TouchableOpacity, Alert, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

const shopSrc = require('../../assets/shop.png');
// ใช้ sprite sheet ตัวเดียวกับ ScanScreen เพื่อให้ฮิปโปขยับได้
const hippoSrc = require('../../assets/hippo.png');

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

function FrameBrackets() {
    const SIZE = 32;
    const THICK = 5;
    const col = '#6E441B';
    const corners = [
        { top: 18, left: 18, borderTopWidth: THICK, borderLeftWidth: THICK },
        { top: 18, right: 18, borderTopWidth: THICK, borderRightWidth: THICK },
        { bottom: 18, left: 18, borderBottomWidth: THICK, borderLeftWidth: THICK },
        { bottom: 18, right: 18, borderBottomWidth: THICK, borderRightWidth: THICK },
    ];
    return (
        <>
            {corners.map((pos, i) => (
                <View
                    key={i}
                    pointerEvents="none"
                    style={{ position: 'absolute', width: SIZE, height: SIZE, borderColor: col, ...pos }}
                />
            ))}
        </>
    );
}

export default function KnowledgeScreen({ onNavigate, item, path, topic }) {
    const itemName = item?.name ?? 'เมาส์ไร้สาย';
    const itemLoc  = item?.location ?? 'เชียงใหม่';

    const addToMap = () => Alert.alert('เร็ว ๆ นี้', 'ฟีเจอร์เพิ่มลงแผนที่การเรียนรู้กำลังจัดทำ');

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.body}>

                <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate?.('select-lens')}>
                    <Text style={styles.backText}>◄ BACK</Text>
                </TouchableOpacity>

                <View style={styles.content}>

                    <View style={styles.photoFrame}>
                        <FrameBrackets />
                        <View style={styles.photoPlaceholder}>
                            <Ionicons name="image-outline" size={64} color="#A89A86" />
                        </View>
                    </View>

                    {/* กล่อง PIPO โผล่หัวเหนือบับเบิล + ชื่ออยู่นอกบับเบิลแบบ ScanScreen */}
                    <View style={styles.dialog}>
                        <View style={styles.pipoWrap}>
                            {/* ชื่อ PIPO อยู่นอกบับเบิล เหมือน msgName ใน ScanScreen */}
                            <Text style={styles.msgName}>PIPO</Text>

                            {/* ครอบบับเบิลไว้ เพื่อให้ฮิปโปเกาะ "ขอบบนของบับเบิล" ตลอด */}
                            <View style={styles.bubbleWrap}>
                                <View style={styles.hippoPeek} pointerEvents="none">
                                    <SpriteFrame
                                        source={hippoSrc}
                                        frameWidth={90}
                                        frameHeight={90}
                                        totalFrames={4}
                                        fps={5}
                                    />
                                </View>

                                <View style={styles.bubble}>
                                    <Text
                                        style={styles.bubbleText}
                                        textBreakStrategy="highQuality"
                                        lineBreakStrategyIOS="standard"
                                    >
                                        <Text style={styles.tipLead}>รู้มั้ย? </Text>
                                        บอร์ดเมาส์ไร้สายมีเสาอากาศ (Antenna) อยู่บนบอร์ดด้วยนะ!
                                        ตอนออกแบบเราต้องวางอุปกรณ์ชิ้นอื่นหรือแผ่นทองแดง (Ground Plane)
                                        ใกล้ๆ บริเวณเสาอากาศเด็ดขาด ไม่งั้นสัญญาณจะรับส่งเมาส์ดีเลย์หรือหลุดบ่อยๆ เลยล่ะ!
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.ctaPrimary}
                    activeOpacity={0.85}
                    onPress={() => onNavigate?.('calibrate')}
                >
                    <LinearGradient
                        colors={['#DEA569', '#C47A2D', '#C47A2D', '#854F18']}
                        locations={[0, 0.15, 0.85, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <Text style={styles.ctaPrimaryText}>สำรวจต่อ</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.ctaSecondary}
                    activeOpacity={0.85}
                    onPress={addToMap}
                >
                    <Text style={styles.ctaSecondaryText}>เพิ่มลงแผนที่การเรียนรู้</Text>
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
}

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

    photoFrame: {
        flex: 1,
        minHeight: 200,
        borderWidth: 5,
        borderColor: '#452817',
        borderRadius: 10,
        backgroundColor: '#EDE3D0',
        overflow: 'hidden',
        marginBottom: 16,
    },
    photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    // ===== กล่อง PIPO โผล่หัว =====
    dialog: {
        marginTop: 60,       // เว้นที่ให้หัวฮิปโปโผล่ขึ้นมา
        marginBottom: 12,
    },
    pipoWrap: {
        position: 'relative',
    },
    bubbleWrap: {
        position: 'relative',   // ฮิปโปจะอ้างอิงขอบของ wrapper นี้ = ขอบบับเบิล
    },
    hippoPeek: {
        position: 'absolute',
        bottom: '100%',         // เอาก้นฮิปโปไปแปะขอบบนของบับเบิลเสมอ (ไม่ใช่ค่าพิกเซลตายตัว)
        right: 8,
        marginBottom: -28,      // จุ่มลงมาทับขอบบับเบิลนิดหน่อยให้ดูซ้อนกัน
        zIndex: 0,
        elevation: 5,
        transform: [{ scaleX: -1 }],
    },

    // ชื่อ PIPO นอกบับเบิล — สไตล์เดียวกับ msgName ใน ScanScreen
    msgName: {
        fontFamily: 'Jersey',
        fontSize: 16,
        fontWeight: '900',
        color: '#C77A20',
        letterSpacing: 1,
        marginBottom: 4,
        marginLeft: 4,
    },

    bubble: {
        backgroundColor: '#EFE7DA',
        borderWidth: 2,
        borderColor: '#2C1810',
        borderRadius: 16,
        borderBottomLeftRadius: 5,
        paddingTop: 14,
        paddingBottom: 12,
        paddingHorizontal: 14,
    },
    bubbleText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 18,
        color: '#4A2800',
        lineHeight: 30,
    },

    tipLead: { fontWeight: '700', color: '#C47A30' },
    tipBold: { fontWeight: '700', color: '#4A2800' },

    ctaPrimary: {
        overflow: 'hidden',
        borderRadius: 10,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#2C1810',
        marginTop: 12,
    },
    ctaPrimaryText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
    },
    ctaSecondary: {
        borderRadius: 10,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#2C1810',
        backgroundColor: '#6E441B',
        marginTop: 10,
        marginBottom: 12,
    },
    ctaSecondaryText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 24,
        fontWeight: '900',
        color: '#FFFFFF',
    },
});