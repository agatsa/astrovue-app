import { BASE_URL } from "../config/constants";
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
// import firestore from '@react-native-firebase/firestore';

export default function AstroConnectScreen({ navigation }) {
  const [astroList, setAstroList] = useState([]);
  const [chatMode, setChatMode] = useState({});
  const [filter, setFilter] = useState('All');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirm = (date) => {
  setSelectedDate(date);
  hideDatePicker();
};


useEffect(() => {
  const mockAstros = [
    {
      id: '1',
      name: 'Pandit Vishal Ji',
      specialty: 'Career, Remedies',
      rating: 4.9,
      photoUrl: 'https://via.placeholder.com/60'
    },
    {
      id: '2',
      name: 'Acharya Meena Ji',
      specialty: 'Love, Marriage',
      rating: 4.8,
      photoUrl: 'https://via.placeholder.com/60'
    }
  ];
  setAstroList(mockAstros);
}, []);




  const pastSessions = [
    { id: 1, astrologer: 'Pandit Vishal Ji', topic: 'Career Growth', date: 'May 18, 2025' },
    { id: 2, astrologer: 'Acharya Meena Ji', topic: 'Marriage Timing', date: 'May 25, 2025' },
  ];

  const liveEvents = [
    {
      id: 1,
      title: 'Morning Aarti from Ujjain',
      time: '7:00 AM – 7:30 AM',
      host: 'Pandit Vishal Ji',
      roomId: 'ujjain_aarti'
    }
  ];

  const filteredAstros = filter === 'All' ? astroList : astroList.filter(a => a.specialty?.includes(filter));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.header}>🦠 Your Kundli Snapshot</Text>
        <Text style={styles.detail}>Moon Sign: Aquarius | Ascendant: Capricorn</Text>
        <Text style={styles.detail}>Current Dasha: Rahu > Rahu > Mercury</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.header}>🤖 Ask AstroAI First</Text>
        <Text style={styles.subText}>“What career should I focus on during this Dasha?”</Text>
        <TouchableOpacity style={styles.askBtn}>
          <Text style={styles.askBtnText}>Ask AI</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.header}>🔮 Filter by Specialty</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['All', 'Career', 'Love', 'Health'].map((tag) => (
            <TouchableOpacity key={tag} onPress={() => setFilter(tag)} style={styles.filterBtn}>
              <Text style={styles.filterText}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.header}>🔮 Available Astrologers</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filteredAstros.map((astro) => (
            <View key={astro.id} style={styles.astroCard}>
              <Image source={{ uri: astro.photoUrl }} style={styles.astroImage} />
              <Text style={styles.astroName}>{astro.name}</Text>
              <Text style={styles.astroSub}>{astro.specialty}</Text>
              <Text style={styles.astroRating}>⭐ {astro.rating}</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleBtn, !chatMode[astro.id] && styles.toggleSelected]}
                  onPress={() => setChatMode({ ...chatMode, [astro.id]: false })}>
                  <Text style={styles.toggleText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, chatMode[astro.id] && styles.toggleSelected]}
                  onPress={() => setChatMode({ ...chatMode, [astro.id]: true })}>
                  <Text style={styles.toggleText}>Chat</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.connectBtn}>
                <Text style={styles.connectBtnText}>
                  {chatMode[astro.id] ? 'Start Chat' : 'Start Call'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <Text style={styles.header}>🗓 Book a Session</Text>
        <TouchableOpacity style={styles.bookBtn} onPress={showDatePicker}>
          <Text style={styles.bookBtnText}>Choose Date & Time</Text>
        </TouchableOpacity>
        {selectedDate && (
          <Text style={{ marginTop: 6, fontSize: 14 }}>Selected: {selectedDate.toLocaleString()}</Text>
        )}
        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="datetime"
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.header}>📻 Live Aarti & Group Sessions</Text>
        {liveEvents.map((event) => (
          <View key={event.id} style={styles.sessionCard}>
            <Text style={styles.sessionText}>{event.title}</Text>
            <Text style={styles.sessionSub}>{event.time} | Host: {event.host}</Text>
            <TouchableOpacity
              style={styles.joinBtn}
              onPress={() => navigation.navigate('LiveAartiScreen', { roomId: event.roomId })}>
              <Text style={styles.joinText}>Join Live</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.header}>📖 Your Past Consultations</Text>
        {pastSessions.map((session) => (
          <View key={session.id} style={styles.sessionCard}>
            <Text style={styles.sessionText}>{session.topic}</Text>
            <Text style={styles.sessionSub}>{session.astrologer} – {session.date}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  section: { marginBottom: 24 },
  header: { fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  detail: { fontSize: 14, color: '#555' },
  subText: { fontSize: 14, fontStyle: 'italic', color: '#777' },
  askBtn: { backgroundColor: '#6c47ff', padding: 10, borderRadius: 8, marginTop: 8 },
  askBtnText: { color: '#fff', textAlign: 'center' },
  filterBtn: { padding: 8, backgroundColor: '#ddd', borderRadius: 8, marginRight: 8 },
  filterText: { fontSize: 13 },
  astroCard: {
    width: 180, padding: 12, marginRight: 12, backgroundColor: '#f9f4ff',
    borderRadius: 12, alignItems: 'center',
  },
  astroImage: { width: 60, height: 60, borderRadius: 30, marginBottom: 8 },
  astroName: { fontWeight: 'bold', fontSize: 14 },
  astroSub: { fontSize: 12, color: '#666', textAlign: 'center' },
  astroRating: { fontSize: 12, marginTop: 4 },
  toggleRow: { flexDirection: 'row', marginTop: 8 },
  toggleBtn: {
    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6,
    backgroundColor: '#ccc', marginHorizontal: 4,
  },
  toggleSelected: { backgroundColor: '#5e35b1' },
  toggleText: { color: '#fff', fontSize: 12 },
  connectBtn: { backgroundColor: '#5e35b1', padding: 6, borderRadius: 6, marginTop: 6 },
  connectBtnText: { color: '#fff', fontSize: 12 },
  bookBtn: { backgroundColor: '#f8c102', padding: 12, borderRadius: 10 },
  bookBtnText: { textAlign: 'center', color: '#000', fontWeight: 'bold' },
  sessionCard: { backgroundColor: '#f2f2f2', padding: 10, borderRadius: 8, marginTop: 6 },
  sessionText: { fontWeight: 'bold' },
  sessionSub: { fontSize: 12, color: '#666' },
  joinBtn: { backgroundColor: '#2196F3', padding: 6, borderRadius: 6, marginTop: 6, alignSelf: 'flex-start' },
  joinText: { color: '#fff', fontSize: 12 },
});
