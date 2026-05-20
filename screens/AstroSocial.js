import { BASE_URL } from "../config/constants";
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, ScrollView,
  StyleSheet, Image, Switch, FlatList, ActivityIndicator, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firebaseApp } from '../config/firebase';

const storage = getStorage(firebaseApp);

async function getAuthHeader() {
  try {
    const user = getAuth().currentUser;
    if (user) {
      const token = await user.getIdToken();
      return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
    }
  } catch (_) {}
  return { 'Content-Type': 'application/json' };
}

async function uploadMediaToStorage(uri, type = 'image') {
  const response = await fetch(uri);
  const blob = await response.blob();
  const ext = type === 'video' ? 'mp4' : 'jpg';
  const path = `posts/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob);
  return await getDownloadURL(storageRef);
}

export default function AstroSocialScreen({ navigation }) {
  const [activeTab, setActiveTab]       = useState('Feed');
  const [caption, setCaption]           = useState('');
  const [mood, setMood]                 = useState('Happy');
  const [hashtags, setHashtags]         = useState('');
  const [isPublic, setIsPublic]         = useState(true);
  const [media, setMedia]               = useState(null);   // { uri, type: 'image'|'video' }
  const [feed, setFeed]                 = useState([]);
  const [feedLoading, setFeedLoading]   = useState(false);
  const [posting, setPosting]           = useState(false);
  const [uploading, setUploading]       = useState(false);

  // Aura-tab state
  const [auraCaption, setAuraCaption]   = useState('');
  const [auraMood, setAuraMood]         = useState('Happy');
  const [auraAnalysis, setAuraAnalysis] = useState(null);
  const [auraLoading, setAuraLoading]   = useState(false);
  const [date, setDate]                 = useState(new Date());
  const [showPicker, setShowPicker]     = useState(false);

  const fetchFeed = useCallback(async () => {
    setFeedLoading(true);
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${BASE_URL}/api/feed?limit=30`, { headers });
      const data = await res.json();
      if (data.success) setFeed(data.posts || []);
    } catch (e) {
      console.error('Feed fetch error:', e);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  useEffect(() => { fetchFeed(); }, []);

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setMedia({ uri: asset.uri, type: asset.type === 'video' ? 'video' : 'image' });
    }
  };

  const handlePost = async () => {
    if (!caption.trim() && !media) {
      Alert.alert('Write something or pick an image to post.');
      return;
    }
    setPosting(true);
    try {
      let imageUrl = '';
      let videoUrl = '';

      if (media) {
        setUploading(true);
        const url = await uploadMediaToStorage(media.uri, media.type);
        setUploading(false);
        if (media.type === 'video') videoUrl = url;
        else imageUrl = url;
      }

      const headers = await getAuthHeader();
      const res = await fetch(`${BASE_URL}/api/create-post`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          caption,
          imageUrl,
          videoUrl,
          mood,
          hashtags: hashtags.split(/[\s,]+/).filter(Boolean),
          isPublic,
        }),
      });
      const data = await res.json();
      if (data.success) {
        Alert.alert('🎉 Posted!', `You earned ${data.dharmaCoinsEarned || 2} Dharma Coins!`);
        setCaption(''); setMedia(null); setHashtags(''); setMood('Happy');
        fetchFeed();
        setActiveTab('Feed');
      } else {
        Alert.alert('Post failed', data.message || 'Please try again');
      }
    } catch (e) {
      console.error('Post error:', e);
      Alert.alert('Error', 'Could not post. Check your connection.');
    } finally {
      setPosting(false);
      setUploading(false);
    }
  };

  const handleLike = async (postId) => {
    // Optimistic UI
    setFeed(prev => prev.map(p => {
      if (p.postId !== postId) return p;
      const user = getAuth().currentUser;
      const uid = user?.uid || '';
      const liked = p.likes?.includes(uid);
      return {
        ...p,
        likes: liked ? p.likes.filter(l => l !== uid) : [...(p.likes || []), uid],
        likeCount: liked ? (p.likeCount || 1) - 1 : (p.likeCount || 0) + 1,
      };
    }));
    try {
      const headers = await getAuthHeader();
      await fetch(`${BASE_URL}/api/like-post`, {
        method: 'POST', headers,
        body: JSON.stringify({ postId }),
      });
    } catch (e) { console.error('Like error:', e); }
  };

  const handleAuraAnalyze = async () => {
    if (!auraCaption.trim()) return;
    setAuraLoading(true);
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${BASE_URL}/api/analyze-post`, {
        method: 'POST', headers,
        body: JSON.stringify({ caption: auraCaption, timestamp: date.toISOString(), platform: 'AstroVue', mood: auraMood }),
      });
      const data = await res.json();
      setAuraAnalysis(data);
    } catch (e) {
      console.error('Aura analyze error:', e);
    } finally {
      setAuraLoading(false);
    }
  };

  const getTransitNote = (m) => {
    if (m?.toLowerCase().includes('angry')) return 'Mars is influencing your emotions today.';
    if (m?.toLowerCase().includes('emotional')) return 'Moon in Cancer may be stirring deep feelings.';
    if (m?.toLowerCase().includes('romantic')) return 'Venus is adding charm to your vibe.';
    return '';
  };

  const uid = getAuth().currentUser?.uid || '';

  const renderPost = ({ item: post }) => {
    const isLiked = post.likes?.includes(uid);
    return (
      <View style={styles.postCard}>
        {/* Header */}
        <View style={styles.postHeader}>
          {post.userPhoto
            ? <Image source={{ uri: post.userPhoto }} style={styles.avatar} />
            : <View style={[styles.avatar, { backgroundColor: '#c5b4ff', alignItems: 'center', justifyContent: 'center' }]}><Text>👤</Text></View>
          }
          <View style={{ flex: 1 }}>
            <Text style={styles.postUser}>{post.userName || 'AstroVue User'}</Text>
            {post.dominantPlanet ? <Text style={styles.postPlanet}>✨ {post.dominantPlanet} energy</Text> : null}
          </View>
        </View>
        {/* Media */}
        {post.imageUrl ? <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" /> : null}
        {/* Caption */}
        {post.caption ? <Text style={styles.postCaption}>{post.caption}</Text> : null}
        {/* Astro insight */}
        {post.gptSummary ? <Text style={styles.postInsight}>🌙 {post.gptSummary}</Text> : null}
        {/* Actions */}
        <View style={styles.postActions}>
          <TouchableOpacity onPress={() => handleLike(post.postId)} style={styles.likeBtn}>
            <Text style={{ fontSize: 18 }}>{isLiked ? '❤️' : '🤍'}</Text>
            <Text style={styles.likeCount}>{post.likeCount || 0}</Text>
          </TouchableOpacity>
          {post.astroTags?.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {post.astroTags.map((tag, i) => (
                <View key={i} style={styles.tag}><Text style={styles.tagText}>#{tag}</Text></View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tab bar */}
      <View style={styles.tabBar}>
        {['Feed', 'Post', 'Aura'].map(tab => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── FEED TAB ── */}
      {activeTab === 'Feed' && (
        feedLoading
          ? <ActivityIndicator size="large" color="#7c3aed" style={{ marginTop: 40 }} />
          : <FlatList
              data={feed}
              keyExtractor={p => p.postId || String(Math.random())}
              renderItem={renderPost}
              contentContainerStyle={{ padding: 12 }}
              ListEmptyComponent={<Text style={styles.emptyText}>No posts yet. Be the first to post!</Text>}
              onRefresh={fetchFeed}
              refreshing={feedLoading}
            />
      )}

      {/* ── POST TAB ── */}
      {activeTab === 'Post' && (
        <ScrollView contentContainerStyle={styles.postForm}>
          <Text style={styles.formTitle}>✨ Share your astro moment</Text>
          <TextInput
            style={[styles.input, { height: 100 }]}
            multiline
            placeholder="What's in your cosmic orbit today?"
            value={caption}
            onChangeText={setCaption}
          />
          <TextInput style={styles.input} placeholder="Mood (e.g. Happy, Peaceful, Intense)" value={mood} onChangeText={setMood} />
          <Text style={styles.transitNote}>{getTransitNote(mood)}</Text>
          <TextInput style={styles.input} placeholder="#hashtags (space separated)" value={hashtags} onChangeText={setHashtags} />

          <TouchableOpacity style={styles.mediaBtn} onPress={pickMedia}>
            <Text style={styles.mediaBtnText}>{media ? '✅ Media selected — tap to change' : '📷 Add photo or video'}</Text>
          </TouchableOpacity>
          {media?.type === 'image' && <Image source={{ uri: media.uri }} style={styles.mediaPreview} />}
          {media?.type === 'video' && <Text style={styles.videoLabel}>🎬 Video selected</Text>}

          <View style={styles.publicRow}>
            <Text style={styles.publicLabel}>Public post</Text>
            <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ true: '#7c3aed' }} />
          </View>

          <TouchableOpacity
            style={[styles.postBtn, (posting || uploading) && styles.postBtnDisabled]}
            onPress={handlePost}
            disabled={posting || uploading}
          >
            {(posting || uploading)
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.postBtnText}>{uploading ? 'Uploading…' : '🚀 Post — earn 2 Dharma Coins'}</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── AURA TAB ── */}
      {activeTab === 'Aura' && (
        <ScrollView contentContainerStyle={styles.postForm}>
          <Text style={styles.formTitle}>🌙 Analyze Your Post Aura</Text>
          <Text style={styles.auraSubtitle}>See how planetary energies affect your content before you post it anywhere.</Text>
          <TextInput
            style={[styles.input, { height: 100 }]}
            multiline
            placeholder="Paste your caption or post draft…"
            value={auraCaption}
            onChangeText={setAuraCaption}
          />
          <TextInput style={styles.input} placeholder="Your mood" value={auraMood} onChangeText={setAuraMood} />
          <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.dateBtn}>
            <Text>📅 Post date: {date.toDateString()}</Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker value={date} mode="date" display="default"
              onChange={(e, d) => { setShowPicker(false); if (d) setDate(d); }} />
          )}
          <TouchableOpacity style={[styles.postBtn, auraLoading && styles.postBtnDisabled]} onPress={handleAuraAnalyze} disabled={auraLoading}>
            {auraLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.postBtnText}>Analyze Aura ✨</Text>}
          </TouchableOpacity>

          {auraAnalysis && (
            <View style={styles.analysisCard}>
              <Text style={styles.analysisTitle}>🪐 Planet: {auraAnalysis.dominantPlanet}</Text>
              <Text style={styles.analysisSummary}>{auraAnalysis.gptSummary || auraAnalysis.message}</Text>
              {auraAnalysis.remedy ? <Text style={styles.analysisRemedy}>💊 Remedy: {auraAnalysis.remedy}</Text> : null}
              {auraAnalysis.astroTags?.length > 0 && (
                <View style={styles.tagsRow}>
                  {auraAnalysis.astroTags.map((t, i) => (
                    <View key={i} style={styles.tag}><Text style={styles.tagText}>#{t}</Text></View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f9f5ff' },
  tabBar:         { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ede9fe' },
  tab:            { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive:      { borderBottomWidth: 2, borderBottomColor: '#7c3aed' },
  tabText:        { color: '#888', fontWeight: '600' },
  tabTextActive:  { color: '#7c3aed' },

  // Feed
  postCard:    { backgroundColor: '#fff', borderRadius: 14, marginBottom: 14, padding: 14, shadowColor: '#7c3aed', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 },
  postHeader:  { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  avatar:      { width: 40, height: 40, borderRadius: 20 },
  postUser:    { fontWeight: '700', color: '#1a1a2e', fontSize: 14 },
  postPlanet:  { color: '#7c3aed', fontSize: 11, marginTop: 2 },
  postImage:   { width: '100%', height: 220, borderRadius: 10, marginBottom: 10 },
  postCaption: { color: '#333', fontSize: 14, lineHeight: 20, marginBottom: 6 },
  postInsight: { color: '#6d28d9', fontSize: 12, fontStyle: 'italic', marginBottom: 8 },
  postActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  likeBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeCount:   { color: '#555', fontSize: 13, fontWeight: '600' },
  tag:         { backgroundColor: '#ede9fe', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginRight: 6 },
  tagText:     { color: '#7c3aed', fontSize: 11, fontWeight: '600' },
  emptyText:   { textAlign: 'center', color: '#aaa', marginTop: 60, fontSize: 15 },

  // Post form
  postForm:     { padding: 16, paddingBottom: 60 },
  formTitle:    { fontSize: 20, fontWeight: '800', color: '#1a1a2e', marginBottom: 4 },
  auraSubtitle: { color: '#666', fontSize: 13, marginBottom: 14 },
  input:        { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#ddd', padding: 12, marginBottom: 10, fontSize: 14, color: '#333' },
  transitNote:  { color: '#7c3aed', fontStyle: 'italic', fontSize: 12, marginBottom: 6 },
  mediaBtn:     { backgroundColor: '#ede9fe', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 },
  mediaBtnText: { color: '#7c3aed', fontWeight: '700' },
  mediaPreview: { width: '100%', height: 180, borderRadius: 10, marginBottom: 10 },
  videoLabel:   { color: '#7c3aed', fontWeight: '600', marginBottom: 10, textAlign: 'center' },
  publicRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  publicLabel:  { fontSize: 14, color: '#333', fontWeight: '600' },
  postBtn:      { backgroundColor: '#7c3aed', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  postBtnDisabled: { backgroundColor: '#b5a0e8' },
  postBtnText:  { color: '#fff', fontWeight: '800', fontSize: 16 },
  dateBtn:      { backgroundColor: '#f5f3ff', borderRadius: 10, padding: 12, marginBottom: 10, alignItems: 'center' },

  // Aura analysis
  analysisCard:    { marginTop: 16, backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#ede9fe' },
  analysisTitle:   { fontWeight: '800', fontSize: 16, color: '#1a1a2e', marginBottom: 8 },
  analysisSummary: { color: '#444', lineHeight: 20, marginBottom: 6 },
  analysisRemedy:  { color: '#7c3aed', fontStyle: 'italic', marginTop: 6 },
  tagsRow:         { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6 },
});
