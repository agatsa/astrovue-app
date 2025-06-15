import { BASE_URL } from "../config/constants";
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Image,
  Switch,
  FlatList
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AstroSocialScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('Aura');
  const [caption, setCaption] = useState('');
  const [mood, setMood] = useState('Happy');
  const [hashtags, setHashtags] = useState('');
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [comments, setComments] = useState('');
  const [thought, setThought] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [media, setMedia] = useState(null);
  const [thoughtHistory, setThoughtHistory] = useState([]);
  const [feed, setFeed] = useState([
    { id: 1, user: 'Aryaman', content: 'Feeling high energy today thanks to Mars in Aries!', likes: 4 },
    { id: 2, user: 'Megha', content: 'Moon in Cancer brought some emotional waves 🌊', likes: 7 }
  ]);

  const handleAnalyzePost = () => {
    alert("Post analyzed: Strong Mars influence. Consider softening tone with Venus vibes.");
  };

  const handleCommentsAnalysis = () => {
    alert("Comments reflect admiration with subtle envy. Avoid oversharing during Rahu transit.");
  };

  const pickMedia = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 1 });
    if (!result.cancelled) setMedia(result);
  };

  const handlePostThought = () => {
    const newThought = { id: Date.now(), content: thought, isPublic, media };
    setThoughtHistory([newThought, ...thoughtHistory]);
    setThought('');
    setMedia(null);
    alert('🎉 Thought posted! You earned 2 Dharma Coins!');
  };

  const handleLike = (postId) => {
    setFeed(feed.map(post => post.id === postId ? { ...post, likes: post.likes + 1 } : post));
  };

  const getTransitNote = () => {
    if (mood.toLowerCase().includes('angry')) return 'Mars is influencing your emotions today.';
    if (mood.toLowerCase().includes('emotional')) return 'Moon in Cancer may be stirring deep feelings.';
    if (mood.toLowerCase().includes('romantic')) return 'Venus is adding charm to your vibe.';
    return '';
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'Aura':
        const sampleFriends = [
          { name: 'Megha', compatibility: '89%', sync: 'Green', clash: 'No' },
          { name: 'Arjun', compatibility: '62%', sync: 'Yellow', clash: 'Yes (Shani)' }
        ];
        return (
          <View style={styles.tabContent}>
            <Text style={styles.header}>🌙 Today's Social Planet Energy</Text>
            <View style={styles.planetTable}>
              <Text style={styles.planetRow}>Mars 🔥 - High → Avoid arguments</Text>
              <Text style={styles.planetRow}>Venus 💖 - Low → Add charm in tone</Text>
            </View>
            <Text style={styles.header}>🌟 New Post Insight</Text>
            <TextInput style={styles.input} placeholder="Write your post caption..." value={caption} onChangeText={setCaption} />
            <TextInput style={styles.input} placeholder="#hashtags" value={hashtags} onChangeText={setHashtags} />
            <Text style={styles.label}>Mood:</Text>
            <TextInput style={styles.input} placeholder="e.g. Happy, Angry, Romantic" value={mood} onChangeText={setMood} />
            <Text style={styles.prompt}>{getTransitNote()}</Text>
            <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateButton}>
              <Text>Select Post Date: {date.toDateString()}</Text>
            </TouchableOpacity>
            {showPicker && (<DateTimePicker value={date} mode="date" display="default" onChange={(e, d) => { setShowPicker(false); d && setDate(d); }} />)}
            <TouchableOpacity style={styles.button} onPress={handleAnalyzePost}>
              <Text style={styles.buttonText}>Analyze Post</Text>
            </TouchableOpacity>
            <Text style={styles.header}>💞 Karmic Bond Meter</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.col}>Name</Text>
              <Text style={styles.col}>Match</Text>
              <Text style={styles.col}>Sync</Text>
              <Text style={styles.col}>Clash?</Text>
            </View>
            {sampleFriends.map((f, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.col}>{f.name}</Text>
                <Text style={styles.col}>{f.compatibility}</Text>
                <Text style={styles.col}>{f.sync}</Text>
                <Text style={styles.col}>{f.clash}</Text>
              </View>
            ))}
            <Text style={styles.header}>🔮 Your Social Mirror</Text>
            <Text style={styles.prompt}>“This week, your posts reflect a bold and dominant Mars tone. Consider a shift toward Venus softness for better social harmony.”</Text>
            <Text style={styles.header}>💬 Karma Comments Insight</Text>
            <TextInput style={styles.input} placeholder="Paste a few recent comments or messages..." value={comments} onChangeText={setComments} />
            <TouchableOpacity style={styles.button} onPress={handleCommentsAnalysis}>
              <Text style={styles.buttonText}>Analyze Comments</Text>
            </TouchableOpacity>
            <Text style={styles.header}>📈 Weekly Social Energy Report</Text>
            <Text style={styles.prompt}>“Best Day: Thursday (Jupiter boost)\nWorst Day: Monday (Moon-Rahu)\nDominant Tone: 🔥 Mars\nTry: Soft storytelling posts next week.”</Text>
            <Text style={styles.header}>⚠️ AstroSocial Detox Alert</Text>
            <Text style={styles.prompt}>“Your Venus is weak + Moon-Saturn aspect → Consider a 24h social break for emotional clarity.”</Text>
            <TouchableOpacity style={styles.askButton} onPress={() => navigation.navigate('AskAI', { topic: 'social' })}>
              <Text style={styles.askText}>🤖 Ask AstroAI about Social Life</Text>
            </TouchableOpacity>
          </View>
        );

      case 'Thought':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.header}>📝 Share a Thought</Text>
            <TextInput style={[styles.input, { height: 120 }]} placeholder="What are you feeling right now?" multiline value={thought} onChangeText={setThought} />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ marginRight: 10 }}>Public</Text>
              <Switch value={isPublic} onValueChange={setIsPublic} />
              <TouchableOpacity onPress={pickMedia} style={[styles.button, { marginLeft: 10 }]}> <Text style={styles.buttonText}>Attach Media</Text> </TouchableOpacity>
            </View>
            {media && <Image source={{ uri: media.uri }} style={{ width: '100%', height: 180, borderRadius: 10, marginBottom: 10 }} />}
            <TouchableOpacity style={styles.button} onPress={handlePostThought}>
              <Text style={styles.buttonText}>Post & Earn Dharma Coins</Text>
            </TouchableOpacity>
            <Text style={styles.header}>🧠 My Thoughts</Text>
            <FlatList data={thoughtHistory} keyExtractor={(item) => item.id.toString()} renderItem={({ item }) => (
              <View style={styles.postBox}>
                <Text style={styles.postUser}>{item.isPublic ? 'Public' : 'Private'} Thought</Text>
                <Text>{item.content}</Text>
                {item.media && <Image source={{ uri: item.media.uri }} style={{ width: '100%', height: 180, borderRadius: 10, marginTop: 6 }} />}
              </View>
            )} />
          </View>
        );

      case 'Feed':
        return (
          <View style={styles.tabContent}>
            <Text style={styles.header}>📲 Astro Feed</Text>
            {feed.map(post => (
              <View key={post.id} style={styles.postBox}>
                <Text style={styles.postUser}>{post.user}</Text>
                <Text>{post.content}</Text>
                <TouchableOpacity onPress={() => handleLike(post.id)}>
                  <Text style={{ marginTop: 6 }}>❤️ {post.likes} Likes</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>See Full Feed →</Text>
            </TouchableOpacity>
          </View>
        );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.tabRow}>
        {['Aura', 'Thought', 'Feed'].map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabButton, activeTab === tab && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeText]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {renderTab()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#fff' },
  tabRow: { flexDirection: 'row', marginBottom: 12 },
  tabButton: { flex: 1, paddingVertical: 12, borderBottomWidth: 2, borderColor: '#ddd', alignItems: 'center' },
  activeTab: { borderColor: '#673ab7' },
  tabText: { fontSize: 16, fontWeight: '600', color: '#888' },
  activeText: { color: '#673ab7' },
  tabContent: { marginTop: 8 },
  header: { fontSize: 20, fontWeight: 'bold', marginVertical: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 10 },
  label: { marginTop: 10, marginBottom: 4 },
  dateButton: { padding: 10, backgroundColor: '#eee', borderRadius: 8, marginBottom: 10 },
  button: { backgroundColor: '#6c5ce7', padding: 12, borderRadius: 8, alignItems: 'center', marginVertical: 10 },
  buttonText: { color: 'white', fontWeight: 'bold' },
  tableHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderColor: '#eee' },
  col: { width: '25%', fontSize: 14 },
  prompt: { fontStyle: 'italic', marginTop: 10, backgroundColor: '#fafafa', padding: 12, borderRadius: 8 },
  askButton: { backgroundColor: '#f6e58d', padding: 12, borderRadius: 8, marginTop: 16, alignItems: 'center' },
  askText: { fontWeight: 'bold' },
  planetTable: { backgroundColor: '#f0f0ff', padding: 10, borderRadius: 8 },
  planetRow: { fontSize: 14, marginVertical: 2 },
  postBox: { backgroundColor: '#f0f0f0', padding: 12, borderRadius: 10, marginBottom: 10 },
  postUser: { fontWeight: 'bold', marginBottom: 4 }
});
