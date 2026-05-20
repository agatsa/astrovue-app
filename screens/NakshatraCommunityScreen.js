/**
 * Nakshatra Community — Astrologically matched social network
 * Connect with people of same nakshatra, compatible moon signs
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, SafeAreaView, TextInput, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/constants';
import { auth } from '../config/firebase';
import { colors, spacing, radius, typography, shadows, gradients } from '../config/theme';

const TABS = ['My Nakshatra', 'Compatible', 'Groups', 'Feed'];

const NAKSHATRA_DESCRIPTIONS = {
  'Ashwini':    { deity: 'Ashwini Kumaras', quality: 'Swift, healing', element: 'Fire', emoji: '🐎' },
  'Bharani':    { deity: 'Yama', quality: 'Transformative, creative', element: 'Earth', emoji: '🌸' },
  'Krittika':   { deity: 'Agni', quality: 'Sharp, determined', element: 'Fire', emoji: '🔥' },
  'Rohini':     { deity: 'Brahma', quality: 'Nurturing, beautiful', element: 'Earth', emoji: '🌹' },
  'Mrigashirsha':{ deity: 'Soma', quality: 'Searching, gentle', element: 'Air', emoji: '🦌' },
  'Ardra':      { deity: 'Rudra', quality: 'Intense, transformative', element: 'Air', emoji: '⛈️' },
  'Punarvasu':  { deity: 'Aditi', quality: 'Optimistic, giving', element: 'Air', emoji: '✨' },
  'Pushya':     { deity: 'Brihaspati', quality: 'Nurturing, protective', element: 'Water', emoji: '🌙' },
  'Ashlesha':   { deity: 'Sarpa', quality: 'Intuitive, mystical', element: 'Water', emoji: '🐍' },
  'Magha':      { deity: 'Pitras', quality: 'Regal, ancestral', element: 'Fire', emoji: '👑' },
  'Purva Phalguni':{ deity: 'Bhaga', quality: 'Luxurious, creative', element: 'Fire', emoji: '🎭' },
  'Uttara Phalguni':{ deity: 'Aryaman', quality: 'Loyal, helpful', element: 'Fire', emoji: '☀️' },
  'Hasta':      { deity: 'Savitri', quality: 'Skillful, crafty', element: 'Earth', emoji: '✋' },
  'Chitra':     { deity: 'Vishwakarma', quality: 'Artistic, brilliant', element: 'Fire', emoji: '💎' },
  'Swati':      { deity: 'Vayu', quality: 'Independent, flexible', element: 'Air', emoji: '🌬️' },
  'Vishakha':   { deity: 'Indra-Agni', quality: 'Goal-oriented, intense', element: 'Fire', emoji: '⚡' },
  'Anuradha':   { deity: 'Mitra', quality: 'Devoted, cooperative', element: 'Water', emoji: '🌺' },
  'Jyeshtha':   { deity: 'Indra', quality: 'Powerful, protective', element: 'Water', emoji: '🛡️' },
  'Mula':       { deity: 'Nirriti', quality: 'Investigative, destructive', element: 'Fire', emoji: '🌿' },
  'Purva Ashadha':{ deity: 'Apas', quality: 'Energetic, optimistic', element: 'Fire', emoji: '🌊' },
  'Uttara Ashadha':{ deity: 'Vishwadevas', quality: 'Victorious, responsible', element: 'Fire', emoji: '🏆' },
  'Shravana':   { deity: 'Vishnu', quality: 'Receptive, wise', element: 'Air', emoji: '👂' },
  'Dhanishta':  { deity: 'Ashta Vasus', quality: 'Wealthy, musical', element: 'Air', emoji: '🥁' },
  'Shatabhisha':{ deity: 'Varuna', quality: 'Independent, healing', element: 'Air', emoji: '🔭' },
  'Purva Bhadrapada':{ deity: 'Aja Ekapada', quality: 'Intense, passionate', element: 'Fire', emoji: '🐉' },
  'Uttara Bhadrapada':{ deity: 'Ahir Budhnya', quality: 'Wise, disciplined', element: 'Water', emoji: '🌙' },
  'Revati':     { deity: 'Pushan', quality: 'Compassionate, nurturing', element: 'Water', emoji: '🐟' },
};

export default function NakshatraCommunityScreen({ navigation }) {
  const [activeTab, setTab]    = useState(0);
  const [profile, setProfile]  = useState(null);
  const [nakshatra, setNak]    = useState(null);
  const [members, setMembers]  = useState([]);
  const [posts, setPosts]      = useState([]);
  const [groups, setGroups]    = useState([]);
  const [loading, setLoading]  = useState(true);
  const [post, setPost]        = useState('');

  useEffect(() => {
    (async () => {
      const ps = JSON.parse(await AsyncStorage.getItem('userProfile') || '{}');
      const de = JSON.parse(await AsyncStorage.getItem('@daily_energy') || '{}');
      setProfile(ps);
      const nak = de?.user_Chart?.nakshatra || 'Unknown';
      setNak(nak);
      fetchCommunity(nak);
    })();
  }, []);

  const fetchCommunity = async (nak) => {
    setLoading(true);
    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken().catch(() => null) : null;
      const de = JSON.parse(await AsyncStorage.getItem('@daily_energy') || '{}');
      const res = await fetch(`${BASE_URL}/api/community`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
        body: JSON.stringify({ nakshatra: nak, moon_sign: de?.moon_sign }),
      });
      const data = await res.json();
      setMembers(data.members || []);
      setPosts(data.posts || []);
      setGroups(data.groups || []);
    } catch (e) {
      setMembers([]); setPosts([]); setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const nakshatraInfo = NAKSHATRA_DESCRIPTIONS[nakshatra] || { emoji: '⭐', deity: 'Unknown', quality: '', element: '' };

  const MemberCard = ({ item }) => (
    <TouchableOpacity style={s.memberCard}>
      <View style={[s.memberAvatar, { backgroundColor: colors.violetMuted }]}>
        <Text style={s.memberAvatarTxt}>{item.name?.[0] || '?'}</Text>
      </View>
      <Text style={s.memberName}>{item.name}</Text>
      <Text style={s.memberNak}>{item.nakshatra}</Text>
      <Text style={s.memberLoc}>{item.city || 'India'}</Text>
    </TouchableOpacity>
  );

  const PostCard = ({ item }) => (
    <View style={s.postCard}>
      <View style={s.postHeader}>
        <View style={[s.postAvatar, { backgroundColor: colors.violetMuted }]}>
          <Text style={s.postAvatarTxt}>{item.author?.[0] || '?'}</Text>
        </View>
        <View>
          <Text style={s.postAuthor}>{item.author}</Text>
          <Text style={s.postNak}>{item.nakshatra} • {item.time}</Text>
        </View>
      </View>
      <Text style={s.postText}>{item.text}</Text>
      <View style={s.postActions}>
        <TouchableOpacity style={s.postAction}>
          <Text style={s.postActionTxt}>❤️ {item.likes || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.postAction}>
          <Text style={s.postActionTxt}>💬 {item.comments || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.postAction}>
          <Text style={s.postActionTxt}>🔮 Ask Jyotish</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const GroupCard = ({ item }) => (
    <TouchableOpacity style={[s.groupCard, shadows.sm]}>
      <Text style={s.groupEmoji}>{item.emoji || '⭐'}</Text>
      <Text style={s.groupName}>{item.name}</Text>
      <Text style={s.groupDesc}>{item.description}</Text>
      <Text style={s.groupMembers}>{item.member_count} members</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.root}>
      <LinearGradient colors={gradients.dusk} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <View style={s.headerContent}>
          <Text style={s.headerEmoji}>🌌</Text>
          <View>
            <Text style={s.headerTitle}>Nakshatra Community</Text>
            <Text style={s.headerSub}>Your cosmic tribe</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={s.tabs}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={i} style={[s.tab, activeTab === i && s.tabActive]} onPress={() => setTab(i)}>
            <Text style={[s.tabTxt, activeTab === i && s.tabTxtActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={colors.violet} />
          <Text style={s.loadingTxt}>Finding your cosmic tribe...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }}>
          {activeTab === 0 && (
            <View>
              {/* My Nakshatra profile */}
              <LinearGradient colors={gradients.dusk} style={s.nakshatraCard}>
                <Text style={s.nakshatraEmoji}>{nakshatraInfo.emoji}</Text>
                <Text style={s.nakshatraName}>{nakshatra || 'Unknown'} Nakshatra</Text>
                <Text style={s.nakshatraDeity}>Deity: {nakshatraInfo.deity}</Text>
                <Text style={s.nakshatraQuality}>{nakshatraInfo.quality}</Text>
                <View style={s.nakshatraChips}>
                  <View style={s.nakshatraChip}><Text style={s.nakshatraChipTxt}>{nakshatraInfo.element} element</Text></View>
                </View>
              </LinearGradient>

              <Text style={s.sectionHead}>People in your Nakshatra</Text>
              {members.length > 0 ? (
                <FlatList
                  horizontal
                  data={members.filter(m => m.nakshatra === nakshatra)}
                  keyExtractor={(_, i) => i.toString()}
                  renderItem={({ item }) => <MemberCard item={item} />}
                  contentContainerStyle={{ paddingHorizontal: spacing.lg }}
                  showsHorizontalScrollIndicator={false}
                />
              ) : (
                <View style={s.emptyWrap}>
                  <Text style={s.emptyTxt}>Growing community — invite friends to join your nakshatra group!</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 1 && (
            <View>
              <Text style={s.compatText}>Showing members with compatible moon signs & nakshatras</Text>
              {members.length > 0 ? (
                <View style={s.memberGrid}>
                  {members.map((m, i) => <MemberCard key={i} item={m} />)}
                </View>
              ) : (
                <View style={s.emptyWrap}>
                  <Text style={s.emptyTxt}>Community is growing. Check back soon!</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 2 && (
            <View style={s.groupsWrap}>
              {groups.length > 0 ? groups.map((g, i) => <GroupCard key={i} item={g} />) : (
                <>
                  {[
                    { emoji: '🔥', name: 'Fire Sign Warriors', description: 'Aries, Leo, Sagittarius moon signs', member_count: 234 },
                    { emoji: '💧', name: 'Water Mystics', description: 'Cancer, Scorpio, Pisces moon signs', member_count: 189 },
                    { emoji: '🌍', name: 'Earth Builders', description: 'Taurus, Virgo, Capricorn moon signs', member_count: 156 },
                    { emoji: '🌬️', name: 'Air Intellectuals', description: 'Gemini, Libra, Aquarius moon signs', member_count: 201 },
                    { emoji: '🪐', name: 'Saturn Devotees', description: 'In Saturn Mahadasha or Sade Sati', member_count: 312 },
                    { emoji: '☿', name: 'Mercury Rising', description: 'Strong Mercury in birth chart', member_count: 98 },
                  ].map((g, i) => <GroupCard key={i} item={g} />)}
                </>
              )}
            </View>
          )}

          {activeTab === 3 && (
            <View>
              {/* Post composer */}
              <View style={s.composeCard}>
                <TextInput
                  style={s.composeInput}
                  placeholder={`Share something with your ${nakshatra} community...`}
                  placeholderTextColor={colors.textMuted}
                  value={post}
                  onChangeText={setPost}
                  multiline
                />
                <TouchableOpacity style={[s.postBtn, !post.trim() && s.postBtnDisabled]} disabled={!post.trim()}>
                  <LinearGradient colors={gradients.violet} style={s.postBtnGrad}>
                    <Text style={s.postBtnTxt}>Share</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {posts.length > 0 ? posts.map((p, i) => <PostCard key={i} item={p} />) : (
                <View style={s.emptyWrap}>
                  <Text style={s.emptyEmoji}>🌌</Text>
                  <Text style={s.emptyTxt}>Be the first to share something with your cosmic community!</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:              { flex: 1, backgroundColor: colors.surface },
  header:            { paddingTop: 52, paddingBottom: 20, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center' },
  backBtn:           { marginRight: 12 },
  backTxt:           { color: colors.white, fontSize: 22, fontWeight: '600' },
  headerContent:     { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerEmoji:       { fontSize: 28 },
  headerTitle:       { color: colors.white, ...typography.h4 },
  headerSub:         { color: colors.violetLight, ...typography.micro },
  tabs:              { flexDirection: 'row', backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  tab:               { flex: 1, paddingVertical: spacing.md, alignItems: 'center' },
  tabActive:         { borderBottomWidth: 2, borderBottomColor: colors.violet },
  tabTxt:            { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  tabTxtActive:      { color: colors.violet },
  loadingWrap:       { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.lg, paddingTop: spacing.xxxl },
  loadingTxt:        { ...typography.body, color: colors.textMuted },
  nakshatraCard:     { margin: spacing.lg, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center' },
  nakshatraEmoji:    { fontSize: 48, marginBottom: spacing.sm },
  nakshatraName:     { ...typography.h2, color: colors.white, textAlign: 'center' },
  nakshatraDeity:    { ...typography.caption, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  nakshatraQuality:  { ...typography.bodyBold, color: colors.gold, marginTop: spacing.sm, textAlign: 'center' },
  nakshatraChips:    { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
  nakshatraChip:     { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  nakshatraChipTxt:  { ...typography.micro, color: colors.white },
  sectionHead:       { ...typography.h4, color: colors.textPrimary, paddingHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.md },
  memberCard:        { width: 100, alignItems: 'center', marginRight: spacing.md, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, ...shadows.sm },
  memberAvatar:      { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm },
  memberAvatarTxt:   { ...typography.h4, color: colors.violet },
  memberName:        { ...typography.caption, color: colors.textPrimary, fontWeight: '700', textAlign: 'center' },
  memberNak:         { ...typography.micro, color: colors.violet, textAlign: 'center' },
  memberLoc:         { ...typography.micro, color: colors.textMuted, textAlign: 'center' },
  memberGrid:        { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.lg, gap: spacing.sm },
  groupsWrap:        { padding: spacing.lg },
  groupCard:         { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  groupEmoji:        { fontSize: 28, width: 40, textAlign: 'center' },
  groupName:         { ...typography.bodyBold, color: colors.textPrimary, flex: 1 },
  groupDesc:         { ...typography.caption, color: colors.textMuted },
  groupMembers:      { ...typography.micro, color: colors.violet },
  composeCard:       { margin: spacing.lg, backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.lg, ...shadows.sm },
  composeInput:      { ...typography.body, color: colors.textPrimary, minHeight: 80, textAlignVertical: 'top', marginBottom: spacing.md },
  postBtn:           { borderRadius: radius.full, overflow: 'hidden', alignSelf: 'flex-end' },
  postBtnDisabled:   { opacity: 0.4 },
  postBtnGrad:       { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm },
  postBtnTxt:        { ...typography.bodyBold, color: colors.white },
  postCard:          { backgroundColor: colors.white, marginHorizontal: spacing.lg, marginBottom: spacing.sm, borderRadius: radius.lg, padding: spacing.lg, ...shadows.sm },
  postHeader:        { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  postAvatar:        { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  postAvatarTxt:     { ...typography.bodyBold, color: colors.violet },
  postAuthor:        { ...typography.bodyBold, color: colors.textPrimary },
  postNak:           { ...typography.micro, color: colors.textMuted },
  postText:          { ...typography.body, color: colors.textSecondary, lineHeight: 22, marginBottom: spacing.md },
  postActions:       { flexDirection: 'row', gap: spacing.lg },
  postAction:        { flexDirection: 'row', alignItems: 'center' },
  postActionTxt:     { ...typography.caption, color: colors.textMuted },
  compatText:        { ...typography.caption, color: colors.textMuted, paddingHorizontal: spacing.lg, marginTop: spacing.md, marginBottom: spacing.sm },
  emptyWrap:         { padding: spacing.xxxl, alignItems: 'center' },
  emptyEmoji:        { fontSize: 40, marginBottom: spacing.md },
  emptyTxt:          { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
})
