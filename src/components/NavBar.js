import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ICONS = {
  scan:    require('../../assets/camera.png'),
  map:     require('../../assets/map.png'),
  quest:   require('../../assets/quest.png'),
  shop:    require('../../assets/shop.png'),
  profile: require('../../assets/profile.png'),
};

const ITEMS = [
  { key: 'scan',    label: 'SCAN'    },
  { key: 'map',     label: 'MAP'     },
  { key: 'quest',   label: 'QUEST'   },
  { key: 'shop',    label: 'SHOP'    },
  { key: 'profile', label: 'PROFILE' },
];

const INACTIVE = '#7A5535';

export default function NavBar({ active = 'scan', onPress }) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safeWrap}>
      <View style={styles.bar}>
        {ITEMS.map(({ key, label }) => {
          const isActive = active === key;
          const icon = ICONS[key];
          return (
            <TouchableOpacity
              key={key}
              style={styles.item}
              activeOpacity={0.7}
              onPress={() => onPress?.(key)}
            >
              {isActive && <View pointerEvents="none" style={styles.indicator} />}

              <View style={styles.iconWrap}>
                {icon
                  ? <Image
                      source={icon}
                      style={[
                        styles.icon,
                        isActive ? styles.iconActive : styles.iconInactive,
                      ]}
                      resizeMode="contain"
                    />
                  : <View style={[styles.iconPlaceholder, isActive && styles.iconPlaceholderActive]} />
                }
              </View>

              <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeWrap: { backgroundColor: '#452817' },
  bar: {
    flexDirection: 'row',
    backgroundColor: '#452817',
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  item: { flex: 1, alignItems: 'center', gap: 0 },

  indicator: {
    position: 'absolute',
    alignSelf: 'center',
    top: -8,
    width: 26,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#fff",
  },

  iconWrap: { width: 44, height: 34, alignItems: 'center', justifyContent: 'center' },

  icon: { width: 28, height: 28 },
  iconActive:   { opacity: 1 },
  iconInactive: { opacity: 1 },

  iconPlaceholder:       { width: 24, height: 24, borderRadius: 4, backgroundColor: INACTIVE},
  iconPlaceholderActive: { backgroundColor: "#fff"},

  label:         { fontFamily: 'Jersey', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  labelActive:   { color: '#fff' },
  labelInactive: { color: '#7A5535' },
});