import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, Circle } from 'react-native-svg';
import NavBar from '../components/NavBar';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';

const hippoSrc = require('../../assets/hippo.png');
const catSrc = require('../../assets/player_cat-sheet_120.png');
const starSrc = require('../../assets/star.png');

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

function CameraIcon({ size = 56, color = '#6B4220' }) {
    const s = size;
    return (
        <Svg width={s} height={s * 0.82} viewBox="0 0 56 46">
            <Rect x="2" y="12" width="52" height="32" rx="6" ry="6"
                fill="none" stroke={color} strokeWidth="3" />
            <Rect x="18" y="2" width="20" height="12" rx="4" ry="4"
                fill="none" stroke={color} strokeWidth="3" />
            <Circle cx="28" cy="28" r="9" fill="none" stroke={color} strokeWidth="2.5" />
            <Circle cx="28" cy="28" r="4.5" fill="none" stroke={color} strokeWidth="2" />
            <Circle cx="44" cy="20" r="2.5" fill={color} />
        </Svg>
    );
}

function ViewfinderBrackets() {
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
                    style={{ position: 'absolute', width: SIZE, height: SIZE, borderColor: col, ...pos }}
                />
            ))}
        </>
    );
}
function ChatMessage({ side, name, avatar, children }) {
    const right = side === 'right';
    return (
        <View style={[styles.msgRow, right && styles.msgRowRight]}>
            {!right && avatar}

            <View style={[styles.msgCol, right ? styles.msgColRight : styles.msgColLeft]}>
                <Text style={[styles.msgName, right && styles.msgNameRight]}>{name}</Text>

                <View style={[styles.bubble, right ? styles.bubbleRight : styles.bubbleLeft]}>
                    <Text
                        style={styles.bubbleText}
                        textBreakStrategy="highQuality"
                        lineBreakStrategyIOS="standard"
                    >
                        {children}
                    </Text>
                </View>
            </View>

            {right && avatar}
        </View>
    );
}

export default function ScanScreen({ onNavigate }) {
    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.body}>

                {/* HEADER — ปักไว้ด้านบน ไม่เลื่อน */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.appTitle}>I DON'T KNOW.exe</Text>
                        <Text style={styles.appSub}>SCAN • LEARN</Text>
                    </View>
                    <View style={styles.scoreBadge}>
                        <Image source={starSrc} style={{ width: 18, height: 18 }} resizeMode="contain" />
                        <Text style={styles.scoreNum}>1200</Text>
                    </View>
                </View>

                {/* ส่วนกลาง — flex ยืด/หดตามจอ (ไม่มี scroll) */}
                <View style={styles.content}>
                    <View style={styles.viewfinder}>
                        <ViewfinderBrackets />

                        <View style={styles.vfCenter}>
                            <Ionicons name="camera-outline" size={72} color="#6E441B" />
                            <Text style={styles.vfMainText}>รูปภาพที่คุณถ่ายไว้</Text>
                            <Text style={styles.vfSubText}>แอร์คอนดิชั่น  เชียงใหม่</Text>
                        </View>

                        <Text style={styles.vfHint}>เช่น อุปกรณ์ไฟฟ้า  สิ่งของ  หรือสถานที่</Text>
                    </View>

                    <View style={styles.dialog}>
                        <ChatMessage
                            side="left"
                            name="PIPO"
                            avatar={
                                <SpriteFrame
                                    source={hippoSrc}
                                    frameWidth={90}
                                    frameHeight={90}
                                    totalFrames={4}
                                    fps={5}
                                />
                            }
                        >
                            ลองสแกนสิ่งรอบตัวดูสิ NOBI~ อาจมีเรื่องน่าสนใจซ่อนอยู่ก็ได้นะ!
                        </ChatMessage>

                        <ChatMessage
                            side="right"
                            name="NOBI"
                            avatar={
                                <View style={styles.catWrap}>
                                    <SpriteFrame
                                        source={catSrc}
                                        frameWidth={120}
                                        frameHeight={120}
                                        totalFrames={3}
                                        fps={3.5}
                                    />
                                </View>
                            }
                        >
                            อื้อ! อุปกรณ์ชิ้นนี้ทำงานยังไงนะ? มาลองสแกนดูให้รู้กันไปเลย!
                        </ChatMessage>
                    </View>
                </View>

                {/* CTA — ปักไว้เหนือ NavBar เสมอ ไม่จม */}
                <TouchableOpacity style={styles.ctaBtn} activeOpacity={0.85} onPress={() => onNavigate?.('scan-loading')}>
                    <LinearGradient
                        colors={['#DEA569', '#C47A2D', '#C47A2D', '#854F18']}
                        locations={[0, 0.15, 0.85, 1]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                    <Text style={styles.ctaText}>ออกสำรวจ !</Text>
                </TouchableOpacity>

            </View>

            <NavBar active="scan" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#F7F1E5',
    },
    body: {
        flex: 1,
        paddingHorizontal: 20,
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingTop: 8,
        paddingBottom: 14,
    },
    appTitle: {
        fontFamily: 'Jersey',
        fontSize: 24,
        fontWeight: '900',
        color: "#C47A30",
        letterSpacing: 0.4,
    },
    appSub: {
        fontFamily: 'Jersey',
        fontSize: 14,
        fontWeight: '800',
        color: "#6E441B",
        letterSpacing: 2.5,
        marginTop: 3,
    },
    scoreBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 2.5,
        borderColor: '#3A1A00',
        borderRadius: 10,
        paddingHorizontal: 3,
        paddingVertical: 3,
    },
    scoreNum: {
        fontFamily: 'Jersey',
        fontSize: 24,
        fontWeight: '900',
        color: '#3A1A00',
    },

    content: {
        flex: 1,
    },

    viewfinder: {
        borderWidth: 5,
        borderColor: '#452817',
        borderRadius: 10,
        padding: 20,
        flex: 1,
        minHeight: 200,
        justifyContent: 'space-between',
        position: 'relative',
        marginBottom: 20,
    },
    vfCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 24,
        gap: 10,
    },
    vfMainText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 16,
        fontWeight: '700',
        color: "#6E441B",
    },
    vfSubText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 14,
        color: "#6E441B",
        opacity:0.6
    },
    vfHint: {
        fontFamily: 'PKNonthaburi',
        textAlign: 'center',
        fontSize: 16,
        color: "#2C1810",
        opacity:0.5
    },

    dialog: {
        marginTop: 8,
    },
    msgRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        marginBottom: 18,
    },
    msgRowRight: {},
    msgCol: { flex: 1 },
    msgColLeft: { alignItems: 'flex-start' },
    msgColRight: { alignItems: 'flex-end' },

    msgName: {
        fontFamily: 'Jersey',
        fontSize: 16,
        fontWeight: '900',
        color: '#C77A20',
        letterSpacing: 1,
        marginBottom: 4,
        marginLeft: 4,
    },
    msgNameRight: {
        marginLeft: 0,
        marginRight: 4,
    },

    bubble: {
        maxWidth: '100%',
        backgroundColor: '#EFE7DA',
        borderWidth: 2,
        borderColor: '#2C1810',
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    bubbleLeft: { borderBottomLeftRadius: 5 },
    bubbleRight: { borderBottomRightRadius: 5 },
    bubbleText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 18,
        color: '#4A2800',
        lineHeight: 30,
    },

    catWrap: {
        transform: [{ scaleX: -1 }],
    },

    ctaBtn: {
        overflow: 'hidden',
        borderRadius: 10,
        height: 50,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#2C1810',
        justifyContent: 'center',
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