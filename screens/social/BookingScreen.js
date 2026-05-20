/**
 * BookingScreen — Book a consultation with a jyotishi/influencer
 * Fully Instagram-quality booking UX
 */
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  ScrollView, StatusBar, ActivityIndicator, Alert, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../../config/constants';
import { auth } from '../../config/firebase';

const AVATAR_COLORS = [
  ['#7C3AED','#A855F7'],['#DB2777','#EC4899'],['#059669','#10B981'],['#D97706','#F59E0B'],
];
function avatarColors(name = '') {
  return AVATAR_COLORS[(name.charCodeAt(0) || 65) % AVATAR_COLORS.length];
}

const SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
               '02:00 PM', '03:00 PM', '04:00 PM', '06:00 PM', '07:00 PM'];

function getDates() {
  const dates = [];
  const days  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months= ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() + i);
    dates.push({
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : days[d.getDay()],
      date:  `${d.getDate()} ${months[d.getMonth()]}`,
      iso:   d.toISOString().split('T')[0],
    });
  }
  return dates;
}

export default function BookingScreen({ route, navigation }) {
  const { astrologer, service } = route.params || {};
  const topPad = StatusBar.currentHeight || 0;

  const [selectedDate, setDate] = useState(getDates()[0]);
  const [selectedSlot, setSlot] = useState(null);
  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [message, setMessage]   = useState('');
  const [loading, setLoading]   = useState(false);

  const DATES = getDates();

  const handleBook = async () => {
    if (!selectedSlot) { Alert.alert('Pick a time slot'); return; }
    if (!name.trim())  { Alert.alert('Enter your name'); return; }
    setLoading(true);
    try {
      const myProfile = JSON.parse(await AsyncStorage.getItem('userProfile') || '{}');
      let token = null;
      try { token = auth.currentUser ? await auth.currentUser.getIdToken() : null; } catch {}

      const res = await fetch(`${BASE_URL}/api/social/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          astrologer_uid:   astrologer?.author_uid || astrologer?.uid || '',
          astrologer_name:  astrologer?.author_name || astrologer?.name || '',
          astrologer_email: astrologer?.email || '',
          service_name:     service?.name || 'Consultation',
          service_duration: service?.duration || 30,
          service_price:    service?.price || 0,
          date:             selectedDate.iso,
          time_slot:        selectedSlot,
          client_name:      name || myProfile.name || '',
          client_phone:     phone || myProfile.phone || '',
          client_uid:       myProfile.uid || '',
          message,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      Alert.alert(
        'Booking Requested! 🙏',
        `Your session with ${astrologer?.author_name || astrologer?.name} on ${selectedDate.date} at ${selectedSlot} has been sent.\n\nThey will confirm within 24 hours.`,
        [{ text: 'Done', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert('Could not book', e.message || 'Please try again.');
    } finally { setLoading(false); }
  };

  const name_  = astrologer?.author_name || astrologer?.name || 'Astrologer';
  const photo_ = astrologer?.author_photo || astrologer?.photo || '';
  const nak_   = astrologer?.author_nakshatra || astrologer?.nakshatra || '';

  return (
    <View style={{ flex: 1, backgroundColor: '#FAFAFA' }}>
      {/* Header */}
      <LinearGradient colors={['#0D0829','#1E0A5C']} style={[s.header, { paddingTop: topPad + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44 }}>
          <Text style={{ fontSize: 28, color: '#fff', lineHeight: 32 }}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Book a Session</Text>
        <View style={{ width: 44 }} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Astrologer card */}
        <View style={s.astroCard}>
          <LinearGradient colors={avatarColors(name_)} style={s.astroAvatarRing}>
            <View style={s.astroAvatarInner}>
              {photo_
                ? <Image source={{ uri: photo_ }} style={{ width: 64, height: 64, borderRadius: 32 }} />
                : <Text style={{ fontSize: 26, color: '#fff', fontWeight: '800' }}>{name_[0]?.toUpperCase()}</Text>
              }
            </View>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={s.astroName}>{name_}</Text>
            {nak_ ? <Text style={s.astroNak}>🌙 {nak_} Nakshatra</Text> : null}
            {astrologer?.experience ? <Text style={s.astroExp}>⭐ {astrologer.experience} experience</Text> : null}
            {astrologer?.languages  ? <Text style={s.astroLang}>🗣 {astrologer.languages}</Text> : null}
          </View>
        </View>

        {/* Selected service */}
        <View style={s.serviceCard}>
          <View style={s.servicePill}>
            <Text style={s.serviceIcon}>🔮</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.serviceName}>{service?.name || 'Consultation'}</Text>
              <Text style={s.serviceMeta}>{service?.duration || 30} min session</Text>
            </View>
            <Text style={s.servicePrice}>₹{service?.price || '—'}</Text>
          </View>
        </View>

        {/* Date picker */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {DATES.map(d => (
              <TouchableOpacity
                key={d.iso}
                style={[s.dateChip, selectedDate.iso === d.iso && s.dateChipActive]}
                onPress={() => setDate(d)}
              >
                <Text style={[s.dateDay, selectedDate.iso === d.iso && s.dateTextActive]}>{d.label}</Text>
                <Text style={[s.dateNum, selectedDate.iso === d.iso && s.dateTextActive]}>{d.date}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time slots */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Select Time</Text>
          <View style={s.slotsGrid}>
            {SLOTS.map(slot => (
              <TouchableOpacity
                key={slot}
                style={[s.slotChip, selectedSlot === slot && s.slotChipActive]}
                onPress={() => setSlot(slot)}
              >
                <Text style={[s.slotTxt, selectedSlot === slot && s.slotTxtActive]}>{slot}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Your details */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Your Details</Text>
          <TextInput
            style={s.input}
            value={name}
            onChangeText={setName}
            placeholder="Your full name"
            placeholderTextColor="#ABABAB"
          />
          <TextInput
            style={s.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="WhatsApp number (for confirmation)"
            placeholderTextColor="#ABABAB"
            keyboardType="phone-pad"
          />
          <TextInput
            style={[s.input, { minHeight: 80, textAlignVertical: 'top' }]}
            value={message}
            onChangeText={setMessage}
            placeholder="What would you like to discuss? (optional)"
            placeholderTextColor="#ABABAB"
            multiline
            maxLength={300}
          />
        </View>

        {/* Summary */}
        {selectedSlot && (
          <View style={s.summaryCard}>
            <Text style={s.summaryTitle}>Booking Summary</Text>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Astrologer</Text><Text style={s.summaryVal}>{name_}</Text></View>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Service</Text><Text style={s.summaryVal}>{service?.name || 'Consultation'}</Text></View>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Date & Time</Text><Text style={s.summaryVal}>{selectedDate.date}, {selectedSlot}</Text></View>
            <View style={s.summaryRow}><Text style={s.summaryLabel}>Duration</Text><Text style={s.summaryVal}>{service?.duration || 30} minutes</Text></View>
            <View style={[s.summaryRow, { borderBottomWidth: 0 }]}>
              <Text style={s.summaryLabel}>Amount</Text>
              <Text style={[s.summaryVal, { color: '#7C3AED', fontWeight: '800' }]}>₹{service?.price || '—'}</Text>
            </View>
            <Text style={s.summaryNote}>Payment collected directly by the astrologer after confirmation.</Text>
          </View>
        )}
      </ScrollView>

      {/* Book button — fixed bottom */}
      <View style={s.bookBar}>
        <View>
          <Text style={s.bookPrice}>₹{service?.price || '—'}</Text>
          <Text style={s.bookDuration}>{service?.duration || 30} min · {service?.name || 'Consultation'}</Text>
        </View>
        <TouchableOpacity
          style={[s.bookBtn, (!selectedSlot || loading) && { opacity: 0.5 }]}
          onPress={handleBook}
          disabled={!selectedSlot || loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.bookBtnTxt}>Request Session</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 14 },
  headerTitle:   { fontSize: 17, fontWeight: '700', color: '#fff' },
  astroCard:     { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', margin: 16, borderRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  astroAvatarRing: { width: 72, height: 72, borderRadius: 36, padding: 2.5, justifyContent: 'center', alignItems: 'center' },
  astroAvatarInner:{ width: 66, height: 66, borderRadius: 33, borderWidth: 2.5, borderColor: '#fff', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0D0829' },
  astroName:     { fontSize: 17, fontWeight: '800', color: '#1A1A2E', marginBottom: 4 },
  astroNak:      { fontSize: 13, color: '#7C3AED', fontWeight: '600', marginBottom: 2 },
  astroExp:      { fontSize: 12, color: '#8E8E8E' },
  astroLang:     { fontSize: 12, color: '#8E8E8E' },
  serviceCard:   { marginHorizontal: 16, marginBottom: 8 },
  servicePill:   { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F0EEFF', borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: '#7C3AED30' },
  serviceIcon:   { fontSize: 24 },
  serviceName:   { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  serviceMeta:   { fontSize: 12, color: '#8E8E8E', marginTop: 2 },
  servicePrice:  { fontSize: 20, fontWeight: '900', color: '#7C3AED' },
  section:       { marginHorizontal: 16, marginTop: 20 },
  sectionTitle:  { fontSize: 15, fontWeight: '700', color: '#1A1A2E', marginBottom: 12 },
  dateChip:      { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E8E8E8', minWidth: 70 },
  dateChipActive:{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  dateDay:       { fontSize: 12, color: '#8E8E8E', fontWeight: '600', marginBottom: 2 },
  dateNum:       { fontSize: 13, color: '#262626', fontWeight: '700' },
  dateTextActive:{ color: '#fff' },
  slotsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotChip:      { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E8E8E8' },
  slotChipActive:{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  slotTxt:       { fontSize: 13, fontWeight: '600', color: '#262626' },
  slotTxtActive: { color: '#fff' },
  input:         { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E8E8E8', paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#1A1A2E', marginBottom: 10 },
  summaryCard:   { margin: 16, backgroundColor: '#fff', borderRadius: 20, padding: 18, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  summaryTitle:  { fontSize: 15, fontWeight: '800', color: '#1A1A2E', marginBottom: 14 },
  summaryRow:    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  summaryLabel:  { fontSize: 13.5, color: '#8E8E8E' },
  summaryVal:    { fontSize: 13.5, fontWeight: '600', color: '#1A1A2E' },
  summaryNote:   { fontSize: 11.5, color: '#ABABAB', marginTop: 12, lineHeight: 17 },
  bookBar:       { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 0.5, borderTopColor: '#E8E8E8', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 10 },
  bookPrice:     { fontSize: 22, fontWeight: '900', color: '#1A1A2E' },
  bookDuration:  { fontSize: 12, color: '#8E8E8E', marginTop: 2 },
  bookBtn:       { backgroundColor: '#7C3AED', borderRadius: 16, paddingHorizontal: 28, paddingVertical: 14 },
  bookBtnTxt:    { color: '#fff', fontSize: 15, fontWeight: '800' },
});
