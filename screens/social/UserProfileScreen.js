/**
 * UserProfileScreen — Instagram-style user profile
 * Shows bio, services, post grid, Follow + Jyotish View buttons
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  ScrollView, FlatList, Dimensions, StatusBar, ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getUserProfile, followUser, unfollowUser } from '../../services/socialService';

const { width: SW } = Dimensions.get('window');
const GRID = (SW - 3) / 3;

const ZONE_COLOR = { 'Green Zone': '#10B981', 'Red Zone': '#EF4444', 'Neutral Zone': '#F59E0B' };
const AVATAR_COLORS = [
  ['#7C3AED','#A855F7'], ['#DB2777','#EC4899'], ['#059669','#10B981'],
  ['#D97706','#F59E0B'], ['#2563EB','#3B82F6'],
];
function avatarColors(name = '') {
  const code = name && name.length > 0 ? name.charCodeAt(0) : 65;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}
function Avatar({ photo, name, size }) {
  const cols = avatarColors(name || '');
  if (photo) return <Image source={{ uri: photo }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  return (
    <LinearGradient colors={cols} style={{ width: size, height: size, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.38 }}>{(name || '?')[0].toUpperCase()}</Text>
    </LinearGradient>
  );
}

function StatBox({ value, label }) {
  return (
    <View style={s.statBox}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export default function UserProfileScreen({ route, navigation }) {
  const { uid, profile: routeProfile } = route.params || {};
  const [profile, setProfile]   = useState(routeProfile || null);
  const [posts, setPosts]        = useState([]);
  const [following, setFollowing]= useState(false);
  const [loading, setLoading]    = useState(true);
  const [activeTab, setTab]      = useState('posts'); // 'posts' | 'reels' | 'tagged'
  const topPad = StatusBar.currentHeight || 0;

  useEffect(() => {
    load();
  }, [uid]);

  const load = async () => {
    setLoading(true);
    try {
      if (uid) {
        const p = await getUserProfile(uid);
        if (p) setProfile(prev => ({ ...prev, ...p }));
      }
    } catch {}
    setLoading(false);
  };

  const handleFollow = async () => {
    const next = !following;
    setFollowing(next);
    try {
      if (next) await followUser(uid);
      else       await unfollowUser(uid);
    } catch {
      setFollowing(!next); // revert on error
    }
  };

  const handleJyotishView = () => {
    navigation.navigate('JyotishProfileUnlock', { uid, profile });
  };

  if (!profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator color="#7C3AED" />
      </View>
    );
  }

  const name      = profile.author_name || profile.name || 'User';
  const photo     = profile.author_photo || profile.photo || '';
  const bio       = profile.bio || '';
  const services  = profile.services || '';
  const website   = profile.website || '';
  const nakshatra = profile.author_nakshatra || profile.nakshatra || '';
  const moonSign  = profile.author_moon_sign || profile.moon_sign || '';
  const ascendant = profile.author_ascendant || profile.ascendant || '';
  const zone      = profile.author_zone || '';
  const followers = profile.followers_count || Math.floor(Math.random() * 5000) + 100;
  const following_ = profile.following_count || Math.floor(Math.random() * 500) + 20;
  const postCount = profile.post_count || posts.length;
  const zoneColor = ZONE_COLOR[zone] || '#8E8E8E';

  // Dummy post grid for profile
  const dummyGrid = Array.from({ length: 9 }, (_, i) => ({
    id: `gp_${i}`,
    uri: null,
    type: i % 5 === 0 ? 'video' : 'photo',
  }));

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerName} numberOfLines={1}>{name}</Text>
        <TouchableOpacity style={s.moreBtn}>
          <Text style={s.moreDots}>•••</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile info */}
        <View style={s.profileSection}>
          {/* Avatar + stats row */}
          <View style={s.avatarStatsRow}>
            {/* Avatar with story ring */}
            <LinearGradient colors={['#F77737','#FD1D1D','#833AB4']} style={s.avatarRing}>
              <View style={s.avatarInner}>
                <Avatar photo={photo} name={name} size={76} />
              </View>
            </LinearGradient>

            {/* Stats */}
            <View style={s.statsRow}>
              <StatBox value={postCount || 0} label="Posts" />
              <TouchableOpacity onPress={() => navigation.navigate('FollowList', { mode: 'followers', uid, title: `${name}'s Followers` })}>
                <StatBox value={followers >= 1000 ? `${(followers/1000).toFixed(1)}K` : followers} label="Followers" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('FollowList', { mode: 'following', uid, title: `${name} Following` })}>
                <StatBox value={following_} label="Following" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Name + bio */}
          <Text style={s.displayName}>{name}</Text>

          {/* Astro badges */}
          <View style={s.astroBadges}>
            {nakshatra && <View style={s.badge}><Text style={s.badgeTxt}>🌙 {nakshatra}</Text></View>}
            {moonSign  && <View style={s.badge}><Text style={s.badgeTxt}>♋ {moonSign}</Text></View>}
            {ascendant && <View style={s.badge}><Text style={s.badgeTxt}>↑ {ascendant}</Text></View>}
            {zone && (
              <View style={[s.badge, { backgroundColor: zoneColor + '20' }]}>
                <Text style={[s.badgeTxt, { color: zoneColor, fontWeight: '700' }]}>{zone}</Text>
              </View>
            )}
          </View>

          {bio ? <Text style={s.bio}>{bio}</Text> : null}
          {services ? (
            <View style={s.servicesBox}>
              <Text style={s.servicesTitle}>✨ Services Offered</Text>
              <Text style={s.servicesTxt}>{services}</Text>
            </View>
          ) : null}
          {website ? <Text style={s.website}>{website}</Text> : null}
        </View>

        {/* Action buttons */}
        <View style={s.actionRow}>
          <TouchableOpacity
            style={[s.followBtn, following && s.followingBtn]}
            onPress={handleFollow}
          >
            <Text style={[s.followBtnTxt, following && s.followingBtnTxt]}>
              {following ? 'Following ✓' : 'Follow'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.messageBtn} onPress={handleJyotishView}>
            <Text style={s.messageBtnTxt}>🔮 Jyotish View</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.moreActionBtn}>
            <Text style={{ fontSize: 18, color: '#262626' }}>▾</Text>
          </TouchableOpacity>
        </View>

        {/* Story highlights (astro categories) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.highlights}>
          {['Kundli', 'Muhurat', 'Vastu', 'Predictions', 'Remedies'].map(h => (
            <TouchableOpacity key={h} style={s.highlight}>
              <View style={s.highlightRing}>
                <Text style={{ fontSize: 22 }}>
                  {h === 'Kundli' ? '📜' : h === 'Muhurat' ? '🗓️' : h === 'Vastu' ? '🏠' : h === 'Predictions' ? '🔮' : '🙏'}
                </Text>
              </View>
              <Text style={s.highlightLabel}>{h}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab bar */}
        <View style={s.tabBar}>
          {[
            { key: 'posts',  icon: '▦' },
            { key: 'reels',  icon: '▷' },
            { key: 'tagged', icon: '⊡' },
          ].map(t => (
            <TouchableOpacity key={t.key} style={[s.tab, activeTab === t.key && s.tabActive]} onPress={() => setTab(t.key)}>
              <Text style={[s.tabIcon, activeTab === t.key && s.tabIconActive]}>{t.icon}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Post grid */}
        <View style={s.grid}>
          {dummyGrid.map((item, i) => (
            <TouchableOpacity key={item.id} style={s.gridItem} activeOpacity={0.85}>
              {item.uri
                ? <Image source={{ uri: item.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                : (
                  <LinearGradient
                    colors={avatarColors(name + i)}
                    style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                  >
                    <Text style={{ fontSize: 28 }}>
                      {['🌙', '🪐', '⭐', '✨', '🔮', '🌟', '☀️', '🌌', '🙏'][i % 9]}
                    </Text>
                  </LinearGradient>
                )
              }
              {item.type === 'video' && (
                <View style={s.videoBadge}><Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>▶</Text></View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: '#E8E8E8', backgroundColor: '#fff' },
  backBtn:      { width: 44 },
  backArrow:    { fontSize: 28, color: '#262626', lineHeight: 32 },
  headerName:   { flex: 1, fontSize: 16, fontWeight: '700', color: '#262626', textAlign: 'center' },
  moreBtn:      { width: 44, alignItems: 'flex-end' },
  moreDots:     { fontSize: 18, color: '#262626', letterSpacing: 1 },
  profileSection:{ padding: 16 },
  avatarStatsRow:{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatarRing:   { width: 88, height: 88, borderRadius: 44, padding: 3, marginRight: 20 },
  avatarInner:  { width: 82, height: 82, borderRadius: 41, borderWidth: 3, borderColor: '#fff', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  statsRow:     { flex: 1, flexDirection: 'row', justifyContent: 'space-around' },
  statBox:      { alignItems: 'center' },
  statValue:    { fontSize: 17, fontWeight: '700', color: '#262626' },
  statLabel:    { fontSize: 12, color: '#8E8E8E', marginTop: 2 },
  displayName:  { fontSize: 14, fontWeight: '700', color: '#262626', marginBottom: 6 },
  astroBadges:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  badge:        { backgroundColor: '#F4F4F4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeTxt:     { fontSize: 11.5, color: '#555', fontWeight: '600' },
  bio:          { fontSize: 13.5, color: '#262626', lineHeight: 19, marginBottom: 8 },
  servicesBox:  { backgroundColor: '#F8F0FF', borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#7C3AED' },
  servicesTitle:{ fontSize: 12, fontWeight: '700', color: '#7C3AED', marginBottom: 4 },
  servicesTxt:  { fontSize: 13, color: '#444', lineHeight: 18 },
  website:      { fontSize: 13, color: '#7C3AED', fontWeight: '600' },
  actionRow:    { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 16 },
  followBtn:    { flex: 1, backgroundColor: '#7C3AED', borderRadius: 8, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  followingBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#DBDBDB' },
  followBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 13.5 },
  followingBtnTxt:{ color: '#262626' },
  messageBtn:   { flex: 1, backgroundColor: '#F0EEFF', borderRadius: 8, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  messageBtnTxt:{ color: '#7C3AED', fontWeight: '700', fontSize: 12.5 },
  moreActionBtn:{ width: 38, borderRadius: 8, borderWidth: 1, borderColor: '#DBDBDB', alignItems: 'center', justifyContent: 'center' },
  highlights:   { paddingHorizontal: 16, paddingBottom: 12, gap: 14 },
  highlight:    { alignItems: 'center', gap: 4, width: 62 },
  highlightRing:{ width: 58, height: 58, borderRadius: 29, borderWidth: 1, borderColor: '#DBDBDB', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' },
  highlightLabel:{ fontSize: 10.5, color: '#262626', textAlign: 'center' },
  tabBar:       { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: '#DBDBDB' },
  tab:          { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive:    { borderTopWidth: 1.5, borderTopColor: '#262626' },
  tabIcon:      { fontSize: 22, color: '#ABABAB' },
  tabIconActive:{ color: '#262626' },
  grid:         { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem:     { width: GRID, height: GRID, marginRight: 1.5, marginBottom: 1.5, backgroundColor: '#F0F0F0', overflow: 'hidden' },
  videoBadge:   { position: 'absolute', top: 6, right: 6 },
});
