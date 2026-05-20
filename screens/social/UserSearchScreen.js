/**
 * UserSearchScreen — Find other AstroVue users
 * Search by name, nakshatra, or moon sign
 */
import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Image, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { searchUsers } from '../../services/socialService';
import { colors, spacing, radius, typography, shadows, gradients } from '../../config/theme';

const FILTERS = [
  { key: 'any',       label: 'All' },
  { key: 'name',      label: 'Name' },
  { key: 'nakshatra', label: 'Nakshatra' },
  { key: 'moon_sign', label: 'Moon Sign' },
];

const NAKSHATRA_SUGGESTIONS = ['Ashwini','Bharani','Krittika','Rohini','Mrigashirsha','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishta','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];

export default function UserSearchScreen({ navigation }) {
  const [query, setQuery]     = useState('');
  const [filter, setFilter]   = useState('any');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = useCallback(async (q = query) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    const users = await searchUsers(q.trim(), filter);
    setResults(users);
    setLoading(false);
  }, [query, filter]);

  const UserCard = ({ item }) => (
    <TouchableOpacity
      style={s.userCard}
      onPress={() => navigation.navigate('JyotishProfileUnlock', { uid: item.uid, profile: item })}
      activeOpacity={0.8}
    >
      {item.photo
        ? <Image source={{ uri: item.photo }} style={s.avatar} />
        : <View style={s.avatarFb}><Text style={s.avatarInitial}>{item.name?.[0] || '?'}</Text></View>
      }
      <View style={s.userInfo}>
        <View style={s.nameRow}>
          <Text style={s.userName}>{item.name}</Text>
          {item.is_influencer && <Text style={s.influencerBadge}>⭐</Text>}
        </View>
        <Text style={s.userMeta}>
          {item.nakshatra ? `🌙 ${item.nakshatra}` : ''}{item.moon_sign ? ` · ${item.moon_sign} moon` : ''}
        </Text>
        {item.follower_count > 0 && (
          <Text style={s.followerCount}>{item.follower_count} followers</Text>
        )}
      </View>
      <Text style={s.jyotishArrow}>🔮 →</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.root}>
      <LinearGradient colors={gradients.cosmic} style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backTxt}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Find People</Text>
      </LinearGradient>

      {/* Search bar */}
      <View style={s.searchBar}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, nakshatra, moon sign..."
          placeholderTextColor={colors.textMuted}
          autoFocus
          returnKeyType="search"
          onSubmitEditing={() => doSearch()}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => { setQuery(''); setResults([]); setSearched(false); }}>
            <Text style={s.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter chips */}
      <View style={s.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.filterChip, filter === f.key && s.filterChipActive]}
            onPress={() => { setFilter(f.key); if (query) doSearch(query); }}
          >
            <Text style={[s.filterTxt, filter === f.key && s.filterTxtActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Nakshatra quick-pick when filter is nakshatra */}
      {filter === 'nakshatra' && !searched && (
        <View style={s.suggestions}>
          <Text style={s.suggestLabel}>All 27 Nakshatras</Text>
          <FlatList
            data={NAKSHATRA_SUGGESTIONS}
            keyExtractor={n => n}
            numColumns={3}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.suggestChip} onPress={() => { setQuery(item); doSearch(item); }}>
                <Text style={s.suggestTxt}>{item}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ padding: spacing.sm }}
          />
        </View>
      )}

      {/* Results */}
      {loading ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={colors.violet} />
          <Text style={s.loadingTxt}>Searching the cosmos...</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={u => u.uid}
          renderItem={({ item }) => <UserCard item={item} />}
          contentContainerStyle={s.list}
          ListEmptyComponent={searched ? (
            <View style={s.emptyWrap}>
              <Text style={s.emptyEmoji}>🌌</Text>
              <Text style={s.emptyTxt}>No users found for "{query}". Try a different name or nakshatra.</Text>
            </View>
          ) : !filter.includes('nakshatra') ? (
            <View style={s.emptyWrap}>
              <Text style={s.emptyEmoji}>🔍</Text>
              <Text style={s.emptyTxt}>Search by name, nakshatra, or moon sign to find your cosmic connections.</Text>
            </View>
          ) : null}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.surface },
  header:         { paddingTop: 52, paddingBottom: 16, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  backBtn:        {},
  backTxt:        { color: colors.white, fontSize: 22, fontWeight: '600' },
  headerTitle:    { ...typography.h4, color: colors.white },
  searchBar:      { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, margin: spacing.lg, borderRadius: radius.xl, padding: spacing.md, paddingHorizontal: spacing.lg, gap: spacing.sm, ...shadows.sm },
  searchIcon:     { fontSize: 18 },
  searchInput:    { flex: 1, ...typography.body, color: colors.textPrimary },
  clearBtn:       { color: colors.textMuted, fontSize: 16, padding: 4 },
  filterRow:      { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  filterChip:     { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  filterChipActive:{ backgroundColor: colors.violetMuted, borderColor: colors.violet },
  filterTxt:      { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
  filterTxtActive:{ color: colors.violet },
  suggestions:    { flex: 1 },
  suggestLabel:   { ...typography.label, color: colors.textMuted, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  suggestChip:    { flex: 1, margin: 4, backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.sm, alignItems: 'center', ...shadows.sm },
  suggestTxt:     { ...typography.micro, color: colors.textSecondary, textAlign: 'center' },
  list:           { padding: spacing.lg, paddingBottom: 80 },
  userCard:       { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.sm, gap: spacing.md, ...shadows.sm },
  avatar:         { width: 52, height: 52, borderRadius: 26 },
  avatarFb:       { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.violetMuted, justifyContent: 'center', alignItems: 'center' },
  avatarInitial:  { ...typography.h4, color: colors.violet },
  userInfo:       { flex: 1 },
  nameRow:        { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  userName:       { ...typography.bodyBold, color: colors.textPrimary },
  influencerBadge:{ fontSize: 14 },
  userMeta:       { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  followerCount:  { ...typography.micro, color: colors.violet, marginTop: 2 },
  jyotishArrow:   { ...typography.caption, color: colors.violet },
  loadingWrap:    { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.lg },
  loadingTxt:     { ...typography.body, color: colors.textMuted },
  emptyWrap:      { alignItems: 'center', paddingTop: 60, paddingHorizontal: spacing.xl },
  emptyEmoji:     { fontSize: 48, marginBottom: spacing.lg },
  emptyTxt:       { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
})
