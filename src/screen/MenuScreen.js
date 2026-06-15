import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';

const BORDER = '#2C1B10';
const FONT = { fontFamily: 'monospace' };

export default function MenuScreen({ onSelect }) {
  return (
    <SafeAreaView style={s.root}>
      <ScrollView contentContainerStyle={s.scroll}>

        <View style={s.titleBanner}>
          <Text style={s.titleTop}>[ NSC DUNGEON ]</Text>
          <Text style={s.titleMain}>ห้องเรียน{'\n'}ดันเจี้ยน</Text>
          <Text style={s.titleSub}>IoT SIMULATION RPG</Text>
        </View>

        <View style={s.npcRow}>
          <Text style={s.npcEmoji}>🦛</Text>
          <View style={s.bubble}>
            <Text style={s.bubbleText}>
              "ยินดีต้อนรับ! ฉันคือศาสตราจารย์ฮิปโป{'\n'}
              เลือกโหมดที่เจ้าต้องการฝึกฝนได้เลย!"
            </Text>
          </View>
        </View>

        <Text style={s.sectionLabel}>▼  เลือกโหมดการเรียน  ▼</Text>

        <TouchableOpacity
          style={[s.card, s.cardHard]}
          onPress={() => onSelect('hardware')}
          activeOpacity={0.8}
        >
          <View style={s.cardBadge}>
            <Text style={s.cardBadgeText}>MODE 1</Text>
          </View>
          <View style={s.cardBody}>
            <Text style={s.cardBigIcon}>⚙️</Text>
            <View style={s.cardInfo}>
              <Text style={s.cardName}>HARDWARE</Text>
              <Text style={s.cardNameTh}>วงจรฮาร์ดแวร์</Text>
              <Text style={s.cardDesc}>
                เชื่อมต่อ ESP32 เข้ากับเซนเซอร์ PIR{'\n'}
                ต่อวงจรให้ถูกต้องเพื่อเปิดประตูโรงเรือน
              </Text>
            </View>
          </View>
          <View style={s.cardFooter}>
            <View style={s.diffRow}>
              <Text style={s.diffLabel}>DIFFICULTY</Text>
              <Text style={s.diffStars}>⚡⚡⚡☆☆</Text>
            </View>
            <View style={[s.enterBtn, s.enterBtnGreen]}>
              <Text style={s.enterBtnText}>ENTER  →</Text>
            </View>
          </View>
          <View style={s.cardTag}>
            <Text style={s.cardTagText}>CIRCUIT · WIRING · ESP32</Text>
          </View>
        </TouchableOpacity>
        <View style={s.vsDivider}>
          <View style={s.vsLine} />
          <View style={s.vsBox}><Text style={s.vsText}>VS</Text></View>
          <View style={s.vsLine} />
        </View>
        <TouchableOpacity
          style={[s.card, s.cardSoft]}
          onPress={() => onSelect('software')}
          activeOpacity={0.8}
        >
          <View style={[s.cardBadge, s.cardBadgeBlue]}>
            <Text style={s.cardBadgeText}>MODE 2</Text>
          </View>
          <View style={s.cardBody}>
            <Text style={s.cardBigIcon}>💻</Text>
            <View style={s.cardInfo}>
              <Text style={[s.cardName, { color: '#5DADE2' }]}>SOFTWARE</Text>
              <Text style={s.cardNameTh}>บล็อกโค้ด</Text>
              <Text style={s.cardDesc}>
                เรียงบล็อกคำสั่งให้ ESP32 อ่านเซนเซอร์{'\n'}
                และตัดสินใจตามลอจิกที่เจ้าเขียนขึ้น
              </Text>
            </View>
          </View>
          <View style={s.cardFooter}>
            <View style={s.diffRow}>
              <Text style={s.diffLabel}>DIFFICULTY</Text>
              <Text style={s.diffStars}>⚡⚡☆☆☆</Text>
            </View>
            <View style={[s.enterBtn, s.enterBtnBlue]}>
              <Text style={s.enterBtnText}>ENTER  →</Text>
            </View>
          </View>
          <View style={[s.cardTag, s.cardTagBlue]}>
            <Text style={[s.cardTagText, { color: '#85C1E9' }]}>
              BLOCKS · LOGIC · CODING
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={s.footer}>© NSC DUNGEON  v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#120E08' },
  scroll: { padding: 14, gap: 14, paddingBottom: 30 },
  titleBanner: {
    backgroundColor: '#1A1208',
    borderWidth: 3,
    borderColor: BORDER,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 0,
    elevation: 6,
  },
  titleTop: {
    ...FONT,
    fontSize: 11,
    color: '#C97D10',
    letterSpacing: 3,
    marginBottom: 6,
  },
  titleMain: {
    ...FONT,
    fontSize: 30,
    fontWeight: '900',
    color: '#F5F2EB',
    textAlign: 'center',
    lineHeight: 38,
  },
  titleSub: {
    ...FONT,
    fontSize: 11,
    color: '#7B6B4A',
    letterSpacing: 2,
    marginTop: 6,
  },
  npcRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  npcEmoji: { fontSize: 44 },
  bubble: {
    flex: 1,
    backgroundColor: '#F7E7C4',
    borderWidth: 3,
    borderColor: BORDER,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 4,
  },
  bubbleText: {
    ...FONT,
    fontSize: 12,
    color: '#3D1C00',
    lineHeight: 19,
  },

  sectionLabel: {
    ...FONT,
    fontSize: 11,
    color: '#7B6B4A',
    textAlign: 'center',
    letterSpacing: 1,
  },
  card: {
    borderWidth: 3,
    borderColor: BORDER,
    padding: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 0,
    elevation: 7,
  },
  cardHard: { backgroundColor: '#0D1F0D' },
  cardSoft: { backgroundColor: '#0D1422' },

  cardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#2E7D32',
    borderWidth: 2,
    borderColor: '#145A18',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cardBadgeBlue: {
    backgroundColor: '#1F618D',
    borderColor: '#154360',
  },
  cardBadgeText: {
    ...FONT,
    fontSize: 9,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
  },

  cardBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  cardBigIcon: { fontSize: 40 },
  cardInfo: { flex: 1, gap: 3 },

  cardName: {
    ...FONT,
    fontSize: 20,
    fontWeight: '900',
    color: '#4CAF50',
    letterSpacing: 1,
  },
  cardNameTh: {
    ...FONT,
    fontSize: 13,
    color: '#A5D6A7',
    fontWeight: '700',
  },
  cardDesc: {
    ...FONT,
    fontSize: 11,
    color: '#8BC34A',
    lineHeight: 17,
    marginTop: 4,
    opacity: 0.85,
  },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderTopColor: '#2C1B10',
    paddingTop: 10,
  },
  diffRow: { gap: 2 },
  diffLabel: {
    ...FONT,
    fontSize: 8,
    color: '#7B6B4A',
    letterSpacing: 1,
  },
  diffStars: { fontSize: 14 },

  enterBtn: {
    borderWidth: 3,
    paddingHorizontal: 14,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 0,
    elevation: 3,
  },
  enterBtnGreen: {
    backgroundColor: '#2E7D32',
    borderColor: '#1B5E20',
  },
  enterBtnBlue: {
    backgroundColor: '#1F618D',
    borderColor: '#154360',
  },
  enterBtnText: {
    ...FONT,
    fontSize: 13,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1,
  },

  cardTag: {
    backgroundColor: '#0A1A0A',
    borderWidth: 1,
    borderColor: '#2E7D32',
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  cardTagBlue: {
    backgroundColor: '#080F1A',
    borderColor: '#1F618D',
  },
  cardTagText: {
    ...FONT,
    fontSize: 9,
    color: '#66BB6A',
    letterSpacing: 1,
  },
  vsDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vsLine: {
    flex: 1,
    height: 2,
    backgroundColor: BORDER,
  },
  vsBox: {
    backgroundColor: '#2C1B10',
    borderWidth: 3,
    borderColor: '#5D3A1A',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  vsText: {
    ...FONT,
    fontSize: 12,
    fontWeight: '900',
    color: '#C97D10',
    letterSpacing: 2,
  },

  footer: {
    ...FONT,
    fontSize: 9,
    color: '#3A2A1A',
    textAlign: 'center',
    letterSpacing: 2,
    marginTop: 6,
  },
});
