import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const hippoSrc = require('../../assets/hippo.png');
const loadingSrc = require('../../assets/loading128.png');

function SpriteFrame({ source, frameWidth, frameHeight, totalFrames, fps = 8 }) {
    const [frame, setFrame] = useState(0);
    useEffect(() => {
        const id = setInterval(() => setFrame(prev => (prev + 1) % totalFrames), 1000 / fps);
        return () => clearInterval(id);
    }, [totalFrames, fps]);
    return (
        <View style={{ width: frameWidth, height: frameHeight, overflow: 'hidden' }}>
            <Image
                source={source}
                style={{ width: frameWidth * totalFrames, height: frameHeight, marginLeft: -frameWidth * frame }}
                resizeMode="cover"
            />
        </View>
    );
}

export default function ScanLoading({ onNavigate }) {
    useEffect(() => {
        const t = setTimeout(() => onNavigate?.('select-lens'), 3000);
        return () => clearTimeout(t);
    }, []);

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <View style={styles.body}>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.appTitle}>I DON'T KNOW.exe</Text>
                    <Text style={styles.appSub}>SCAN • LEARN</Text>
                </View>

                {/* Sprite loader */}
                <View style={{ alignItems: 'center' }}>
                    <SpriteFrame source={loadingSrc} frameWidth={128} frameHeight={128} totalFrames={12} fps={12} />
                </View>

                <Text style={styles.loadingText}>ค้นหามุมมองความรู้ที่เหมาะกับของชิ้นนี้...</Text>

                {/* Character section */}
                <View style={styles.characterWrap}>
                    <View style={styles.msgCol}>
                        <Text style={styles.msgName}>PIPO</Text>
                        <View style={[styles.bubble, styles.bubbleLeft]}>
                            <Text style={styles.bubbleText}>
                                รอแป๊บนะ <Text style={{ fontWeight: '900' }}>PIPO</Text> กำลังวิเคราะห์
                            </Text>
                        </View>
                    </View>
                    <SpriteFrame source={hippoSrc} frameWidth={130} frameHeight={130} totalFrames={4} fps={5} />
                </View>

                {/* Disabled CTA */}
                <View style={styles.ctaBtn}>
                    <Text style={styles.ctaText}>กำลังวิเคราะห์ . . .</Text>
                </View>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: '#F7F1E5' },
    body: { flex: 1, paddingHorizontal: 20, justifyContent: 'space-between' },

    header: {
        alignItems: 'center',
        paddingTop: 28,
        paddingBottom: 4,
    },
    appTitle: {
        fontFamily: 'Jersey',
        fontSize: 40,
        fontWeight: '900',
        color: '#C47A30',
        letterSpacing: 0.4,
    },
    appSub: {
        fontFamily: 'Jersey',
        fontSize: 20,
        fontWeight: '800',
        color: '#6E441B',
        letterSpacing: 2.5,
        marginTop: 2,
    },


    loadingText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 24,
        color: '#6E441B',
        textAlign: 'center',
    },

    characterWrap: {
        alignItems: 'center',
        gap: 0,
    },

    msgCol: {
        alignSelf: 'center',
        alignItems: 'flex-start',
        maxWidth: '90%',
        marginBottom: 12,
    },
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
        maxWidth: '100%',
        backgroundColor: '#EFE7DA',
        borderWidth: 2,
        borderColor: '#2C1810',
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 14,
    },
    bubbleLeft: { borderBottomLeftRadius: 5 },
    bubbleText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 18,
        color: '#4A2800',
        lineHeight: 30,
    },

    ctaBtn: {
        borderRadius: 10,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#D8CBB5',
        marginBottom: 70,
    },
    ctaText: {
        fontFamily: 'PKNonthaburi',
        fontSize: 22,
        color: '#6E441B',
        marginBottom: 4,
    },
});