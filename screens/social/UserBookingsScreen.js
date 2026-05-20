/**
 * UserBookingsScreen — Client view: all sessions booked + coin spend history
 */
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, StatusBar, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../../config/firebase';
import { BASE_URL } from '../../config/constants';

const STATUS_CFG = {
  pending:   { color: '#F59E0B', label: 'Awaiting confirmation' },
  confirmed: { color: '#10B981', label: 'Confirmed'             },
  cancelled: { color: '#EF4444', label: 'Cancelled'             },
  completed: { color: '#7C3AED', label: 'Completed'             },
};

export default function UserBookingsScreen({ navigation }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefresh]= useState(false);
  const topPad = StatusBar.currentHeight || 0;

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      const res = await fetch(`${BASE_URL}/api/user/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: '{}',
      });
      const d = await res.json();
      setBookings(d.bookings || []);
    } catch {}
    setLoading(false); setRefresh(false);
  };

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#060412' }}>
      <ActivityIndicator color="#F4B942" />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#060412' }}>
      <LinearGradient colors={['#0D0829','#1E0A5C']} style={[s.header, { paddingTop: topPad + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44 }}>
          <Text style={{ fontSize: 28, color: '#fff' }}>&#8249;</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>My Sessions</Text>
        <View style={{ width: 44 }} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); load(); }} tintColor="#F4B942" />}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      >
        {bookings.length === 0 ? (
          <View style={s.empty}>
            <Text style={{ fontSize: 48, marginBottom: 16 }}>📅</Text>
            <Text style={s.emptyTxt}>No sessions booked yet</Text>
            <Text style={s.emptySub}>Browse astrologer profiles on the Social tab and book a session.</Text>
          </View>
        ) : bookings.map((b, i) => {
          const cfg = STATUS_CFG[b.status] || STATUS_CFG.pending;
          return (
            <View key={b.id || i} style={s.card}>
              <View style={s.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={s.astroName}>{b.astrologer_name}</Text>
                  <Text style={s.svcName}>{b.service_name} · {b.service_duration} min</Text>
                  <Text style={s.datetime}>{b.date} at {b.time_slot}</Text>
                </View>
                <View style={s.right}>
                  <Text style={s.price}>₹{b.service_price}</Text>
                  <View style={[s.badge, { backgroundColor: cfg.color + '20' }]}>
                    <Text style={[s.badgeTxt, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>
              </View>
              {b.message ? <Text style={s.msg} numberOfLines={2}>Your note: "{b.message}"</Text> : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 14 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  card:        { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  cardTop:     { flexDirection: 'row', gap: 12 },
  astroName:   { fontSize: 15, fontWeight: '800', color: '#fff', marginBottom: 3 },
  svcName:     { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  datetime:    { fontSize: 13, color: '#F4B942', fontWeight: '600' },
  right:       { alignItems: 'flex-end', gap: 6 },
  price:       { fontSize: 20, fontWeight: '900', color: '#10B981' },
  badge:       { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTxt:    { fontSize: 11, fontWeight: '700' },
  msg:         { fontSize: 12, color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', marginTop: 10 },
  empty:       { alignItems: 'center', paddingTop: 80 },
  emptyTxt:    { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 10 },
  emptySub:    { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 21, paddingHorizontal: 20 },
});
