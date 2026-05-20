/**
 * FollowListScreen — Shows followers or following list
 * Accessible from UserProfileScreen stats row
 */
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { followUser, unfollowUser } from '../../services/socialService';
import { BASE_URL } from '../../config/constants';
import { auth } from '../../config/firebase';

const AVATAR_COLORS = [
  ['#7C3AED','#A855F7'], ['#DB2777','#EC4899'], ['#059669','#10B981'],
  ['#D97706','#F59E0B'], ['#2563EB','#3B82F6'],
];
function avatarColors(name = '') {
  const code = name && name.length > 0 ? name.charCodeAt(0) : 65;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}
function Avatar({ photo, name, size = 46 }) {
  const cols = avatarColors(name || '');
  if (photo) return <Image source={{ uri: photo }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  return (
    <LinearGradient colors={cols} style={{ width: size, height: size, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.38 }}>{(name || '?')[0].toUpperCase()}</Text>
    </LinearGradient>
  );
}

// Dummy data so screen is never empty
const DUMMY_FOLLOWERS = [
  { uid: 'f1', name: 'Priya Sharma',   nakshatra: 'Rohini',   following: true,  followers: 12400 },
  { uid: 'f2', name: 'Arjun Mehta',    nakshatra: 'Ashwini',  following: false, followers: 3800  },
  { uid: 'f3', name: 'Meera Nair',     nakshatra: 'Hasta',    following: true,  followers: 28900 },
  { uid: 'f4', name: 'Vikram Singh',   nakshatra: 'Magha',    following: false, followers: 5100  },
  { uid: 'f5', name: 'Ananya Krishnan',nakshatra: 'Pushya',   following: true,  followers: 7200  },
  { uid: 'f6', name: 'Rohan Desai',    nakshatra: 'Uttara',   following: false, followers: 920   },
  { uid: 'f7', name: 'Kavitha Menon',  nakshatra: 'Chitra',   following: true,  followers: 15600 },
  { uid: 'f8', name: 'Suresh Pillai',  nakshatra: 'Jyeshta',  following: false, followers: 2300  },
];

function UserRow({ item, mode, onToggleFollow, onRemove, onPress }) {
  const [loading, setLoading] = useState(false);
  const followers = item.followers >= 1000
    ? `${(item.followers / 1000).toFixed(1)}K`
    : item.followers;

  const handleFollowToggle = async () => {
    setLoading(true);
    await onToggleFollow(item.uid, item.following);
    setLoading(false);
  };

  return (
    <TouchableOpacity style={s.row} onPress={() => onPress(item)} activeOpacity={0.75}>
      <Avatar name={item.name} photo={item.photo} size={46} />
      <View style={s.rowInfo}>
        <Text style={s.rowName}>{item.name}</Text>
        <Text style={s.rowSub}>🌙 {item.nakshatra} · {followers} followers</Text>
      </View>
      <View style={s.rowActions}>
        {mode === 'followers' && (
          <TouchableOpacity
            style={[s.actionBtn, item.following ? s.followingBtn : s.followBtn]}
            onPress={handleFollowToggle}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator size="small" color="#7C3AED" />
              : <Text style={[s.actionBtnTxt, item.following && s.followingBtnTxt]}>
                  {item.following ? 'Following' : 'Follow'}
                </Text>
            }
          </TouchableOpacity>
        )}
        {mode === 'following' && (
          <TouchableOpacity
            style={[s.actionBtn, s.followingBtn]}
            onPress={handleFollowToggle}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator size="small" color="#7C3AED" />
              : <Text style={s.followingBtnTxt}>Following</Text>
            }
          </TouchableOpacity>
        )}
        {mode === 'following' && (
          <TouchableOpacity style={s.removeBtn} onPress={() => onRemove(item)}>
            <Text style={s.removeBtnTxt}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function FollowListScreen({ route, navigation }) {
  const { mode = 'followers', uid, title } = route.params || {};
  // mode: 'followers' | 'following'
  const [users, setUsers]     = useState(DUMMY_FOLLOWERS.map(u => ({ ...u, following: mode === 'following' ? true : u.following })));
  const [loading, setLoading] = useState(false);
  const [tab, setTab]         = useState(mode);
  const topPad = StatusBar.currentHeight || 0;

  const handleToggleFollow = async (targetUid, currentlyFollowing) => {
    setUsers(p => p.map(u => u.uid === targetUid ? { ...u, following: !currentlyFollowing } : u));
    try {
      if (currentlyFollowing) await unfollowUser(targetUid);
      else                     await followUser(targetUid);
    } catch {
      setUsers(p => p.map(u => u.uid === targetUid ? { ...u, following: currentlyFollowing } : u));
    }
  };

  const handleRemove = (item) => {
    Alert.alert(
      `Remove ${item.name}?`,
      'They won\'t be notified. You can follow them again anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => {
            setUsers(p => p.filter(u => u.uid !== item.uid));
            try { await unfollowUser(item.uid); } catch {}
          },
        },
      ]
    );
  };

  const handleUserPress = (item) => {
    navigation.navigate('UserProfile', { uid: item.uid, profile: item });
  };

  const displayed = tab === 'followers'
    ? users
    : users.filter(u => u.following);

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44 }}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>{title || (tab === 'followers' ? 'Followers' : 'Following')}</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Tab switcher */}
      <View style={s.tabs}>
        {[
          { key: 'followers', label: 'Followers' },
          { key: 'following', label: 'Following' },
        ].map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.tab, tab === t.key && s.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Text style={[s.tabTxt, tab === t.key && s.tabTxtActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading
        ? <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color="#7C3AED" /></View>
        : (
          <FlatList
            data={displayed}
            keyExtractor={u => u.uid}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={s.emptyIcon}>👥</Text>
                <Text style={s.emptyTxt}>No {tab} yet</Text>
                <Text style={s.emptySubtxt}>Start exploring the community to connect with other Jyotish seekers</Text>
              </View>
            }
            renderItem={({ item }) => (
              <UserRow
                item={item}
                mode={tab}
                onToggleFollow={handleToggleFollow}
                onRemove={handleRemove}
                onPress={handleUserPress}
              />
            )}
          />
        )
      }
    </View>
  );
}

const s = StyleSheet.create({
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#E8E8E8' },
  backArrow:   { fontSize: 28, color: '#262626', lineHeight: 32 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#262626' },
  tabs:        { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#E8E8E8' },
  tab:         { flex: 1, paddingVertical: 13, alignItems: 'center' },
  tabActive:   { borderBottomWidth: 2, borderBottomColor: '#262626' },
  tabTxt:      { fontSize: 14, color: '#8E8E8E', fontWeight: '600' },
  tabTxtActive:{ color: '#262626' },
  row:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  rowInfo:     { flex: 1, marginLeft: 12 },
  rowName:     { fontSize: 14, fontWeight: '700', color: '#262626' },
  rowSub:      { fontSize: 12, color: '#8E8E8E', marginTop: 2 },
  rowActions:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtn:   { borderRadius: 8, paddingHorizontal: 14, paddingVertical: 7, minWidth: 86, alignItems: 'center' },
  followBtn:   { backgroundColor: '#7C3AED' },
  followingBtn:{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#DBDBDB' },
  actionBtnTxt:{ color: '#fff', fontWeight: '700', fontSize: 13 },
  followingBtnTxt:{ color: '#262626', fontWeight: '600', fontSize: 13 },
  removeBtn:   { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center' },
  removeBtnTxt:{ fontSize: 13, color: '#8E8E8E', fontWeight: '700' },
  empty:       { padding: 60, alignItems: 'center' },
  emptyIcon:   { fontSize: 48, marginBottom: 16 },
  emptyTxt:    { fontSize: 17, fontWeight: '700', color: '#262626', marginBottom: 8 },
  emptySubtxt: { fontSize: 13.5, color: '#8E8E8E', textAlign: 'center', lineHeight: 20 },
});
