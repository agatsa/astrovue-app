import React from 'react';
import { View, Text, TouchableOpacity, StatusBar, StyleSheet } from 'react-native';

export default function ScreenHeader({ title, navigation, rightComponent, dark = false }) {
  const topPad = StatusBar.currentHeight || 0;
  const bg     = dark ? '#0D0829' : '#fff';
  const fg     = dark ? '#fff'    : '#1A1A2E';
  const border = dark ? 'rgba(255,255,255,0.1)' : '#E5E5E5';

  return (
    <View style={[s.header, { paddingTop: topPad + 10, backgroundColor: bg, borderBottomColor: border }]}>
      <TouchableOpacity onPress={() => navigation?.goBack()} style={s.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Text style={[s.backArrow, { color: fg }]}>‹</Text>
      </TouchableOpacity>
      <Text style={[s.title, { color: fg }]} numberOfLines={1}>{title}</Text>
      <View style={s.right}>{rightComponent || null}</View>
    </View>
  );
}

const s = StyleSheet.create({
  header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5 },
  backBtn:   { width: 44, justifyContent: 'center' },
  backArrow: { fontSize: 30, lineHeight: 34, fontWeight: '300' },
  title:     { flex: 1, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  right:     { width: 44, alignItems: 'flex-end' },
});
