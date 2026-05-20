/**
 * PostDetailScreen — Full post view like Instagram
 * Full image, all comments, like/comment/share/bookmark
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  FlatList, TextInput, KeyboardAvoidingView, Platform,
  StatusBar, Dimensions, ScrollView, Animated, Share,
  ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { getComments, addComment, likePost } from '../../services/socialService';
import { useFocusEffect } from '@react-navigation/native';

const { width: SW } = Dimensions.get('window');
const ZONE_COLOR = { 'Green Zone': '#10B981', 'Red Zone': '#EF4444', 'Neutral Zone': '#F59E0B' };
const AVATAR_COLORS = [
  ['#7C3AED','#A855F7'],['#DB2777','#EC4899'],['#059669','#10B981'],
  ['#D97706','#F59E0B'],['#2563EB','#3B82F6'],['#DC2626','#EF4444'],
];
function avatarColors(name = '') {
  const code = name && name.length > 0 ? name.charCodeAt(0) : 65;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}
function Avatar({ photo, name, size = 36 }) {
  const cols = avatarColors(name || '');
  if (photo) return <Image source={{ uri: photo }} style={{ width: size, height: size, borderRadius: size/2 }} />;
  return (
    <LinearGradient colors={cols} style={{ width: size, height: size, borderRadius: size/2, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.38 }}>{(name||'?')[0].toUpperCase()}</Text>
    </LinearGradient>
  );
}

function timeAgo(ts) {
  if (!ts) return '';
  const d = ts instanceof Date ? ts : typeof ts === 'string' ? new Date(ts) : ts.toDate?.() ?? new Date(ts);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60)    return 'just now';
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
}

function Caption({ text, name }) {
  const [expanded, setExpanded] = useState(false);
  if (!text) return null;
  const MAX = 180;
  const parts = (expanded || text.length <= MAX ? text : text.slice(0, MAX)).split(/(#\w+|@\w+)/g);
  return (
    <Text style={s.captionTxt}>
      <Text style={s.captionName}>{name} </Text>
      {parts.map((p, i) => p.startsWith('#') || p.startsWith('@')
        ? <Text key={i} style={s.captionTag}>{p}</Text>
        : <Text key={i}>{p}</Text>
      )}
      {!expanded && text.length > MAX && (
        <Text style={s.captionMore} onPress={() => setExpanded(true)}> … more</Text>
      )}
    </Text>
  );
}

// Media carousel (images + videos) for detail view
function MediaCarousel({ urls, mediaTypes, onDoubleTap, isVisible, muted, onMuteToggle }) {
  const [page, setPage]   = useState(0);
  const lastTap           = useRef(0);
  const heartScale        = useRef(new Animated.Value(0)).current;
  const heartOpacity      = useRef(new Animated.Value(0)).current;

  const handleImgPress = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onDoubleTap?.();
      heartScale.setValue(0); heartOpacity.setValue(1);
      Animated.sequence([
        Animated.spring(heartScale, { toValue: 1, friction: 3, useNativeDriver: true }),
        Animated.delay(500),
        Animated.timing(heartOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    }
    lastTap.current = now;
  };

  if (!urls || urls.length === 0) return null;

  const isVideo = (idx) => {
    const type = mediaTypes?.[idx] || '';
    const url  = urls[idx] || '';
    return type === 'video' || url.match(/\.(mp4|mov|webm|avi)$/i);
  };

  return (
    <View>
      <FlatList
        data={urls} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={e => setPage(Math.round(e.nativeEvent.contentOffset.x / SW))}
        renderItem={({ item: uri, index: idx }) => (
          isVideo(idx) ? (
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setPlaying(p => ({ ...p, [idx]: !p[idx] }))}
              style={{ width: SW, height: SW, backgroundColor: '#000' }}
            >
              <Video
                source={{ uri }}
                style={{ width: SW, height: SW }}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={isVisible && idx === page}
                isLooping
                isMuted={muted !== false}
                useNativeControls={false}
              />
              {/* Mute toggle */}
              <TouchableOpacity
                style={{ position: 'absolute', bottom: 14, right: 14, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}
                onPress={onMuteToggle}
              >
                <Text style={{ fontSize: 16 }}>{muted !== false ? '🔇' : '🔊'}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity activeOpacity={1} onPress={handleImgPress}>
              <Image source={{ uri }} style={{ width: SW, height: SW }} resizeMode="cover" />
            </TouchableOpacity>
          )
        )}
      />
      {urls.length > 1 && (
        <View style={s.dots}>
          {urls.map((_, i) => <View key={i} style={[s.dot, i === page && s.dotActive]} />)}
        </View>
      )}
      <Animated.View style={[s.heartOverlay, { opacity: heartOpacity, transform: [{ scale: heartScale }] }]} pointerEvents="none">
        <Text style={{ fontSize: 90 }}>❤️</Text>
      </Animated.View>
    </View>
  );
}

export default function PostDetailScreen({ route, navigation }) {
  const { post: initialPost } = route.params;
  const [post, setPost]           = useState(initialPost);
  const [comments, setComments]   = useState(initialPost.sample_comments || []);
  const [loadingComments, setLC]  = useState(true);
  const [liked, setLiked]         = useState(false);
  const [saved, setSaved]         = useState(false);
  const [muted, setMuted]         = useState(false);  // unmuted by default in detail
  const [focused, setFocused]     = useState(true);
  const [text, setText]           = useState('');
  const [sending, setSending]     = useState(false);
  const [replyTo, setReplyTo]     = useState(null);
  const [likedComments, setLC2]   = useState({});
  const heartAnim = useRef(new Animated.Value(1)).current;
  const inputRef  = useRef(null);
  const topPad    = StatusBar.currentHeight || 0;

  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => setFocused(false);
  }, []));

  useEffect(() => {
    if (post?.id && !post.id.startsWith('demo')) {
      getComments(post.id).then(c => { if (c.length) setComments(c); setLC(false); });
    } else {
      setLC(false);
    }
  }, [post?.id]);

  const handleLike = () => {
    Animated.sequence([
      Animated.timing(heartAnim, { toValue: 1.35, duration: 100, useNativeDriver: true }),
      Animated.timing(heartAnim, { toValue: 1,    duration: 100, useNativeDriver: true }),
    ]).start();
    setLiked(p => !p);
    setPost(p => ({ ...p, likes_count: Math.max(0, (p.likes_count || 0) + (liked ? -1 : 1)) }));
    if (post?.id && !post.id.startsWith('demo')) likePost(post.id).catch(() => {});
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${post.author_name} on AstroVue:\n\n"${post.content?.slice(0, 200)}"\n\nDownload AstroVue — Vedic Astrology Community`,
      });
    } catch {}
  };

  const submitComment = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const newC = { id: `local_${Date.now()}`, author_name: 'You', text: text.trim(), created_at: new Date() };
    setComments(p => [...p, newC]);
    setPost(p => ({ ...p, comments_count: (p.comments_count || 0) + 1 }));
    setText(''); setReplyTo(null);
    if (post?.id && !post.id.startsWith('demo')) {
      try { await addComment(post.id, newC.text, replyTo?.id || null); } catch {}
    }
    setSending(false);
  };

  const zoneColor = ZONE_COLOR[post.author_zone] || '#8E8E8E';
  const ringColors = post.author_zone === 'Green Zone' ? ['#F77737','#FD1D1D','#833AB4'] : ['#DBDBDB','#DBDBDB'];

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={[s.header, { paddingTop: topPad + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 44 }}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Post</Text>
        <TouchableOpacity style={{ width: 44, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 18, color: '#262626' }}>•••</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          data={comments}
          keyExtractor={c => c.id || String(Math.random())}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {/* Author */}
              <TouchableOpacity
                style={s.authorRow}
                onPress={() => navigation.navigate('UserProfile', { uid: post.author_uid, profile: post })}
                activeOpacity={0.75}
              >
                <LinearGradient colors={ringColors} style={s.avatarRing}>
                  <View style={s.avatarInner}>
                    <Avatar photo={post.author_photo} name={post.author_name} size={38} />
                  </View>
                </LinearGradient>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={s.authorName}>{post.author_name}</Text>
                  <Text style={s.authorSub} numberOfLines={1}>
                    {[post.author_nakshatra, post.author_moon_sign].filter(Boolean).join(' · ')}
                    {post.author_zone ? ` · ${post.author_zone}` : ''}
                  </Text>
                </View>
                <View style={[s.followBtn]}>
                  <Text style={s.followBtnTxt}>Follow</Text>
                </View>
              </TouchableOpacity>

              {/* Images + Videos — auto-play unmuted in detail */}
              <MediaCarousel
                urls={post.media_urls}
                mediaTypes={post.media_types}
                onDoubleTap={handleLike}
                isVisible={focused}
                muted={muted}
                onMuteToggle={() => setMuted(m => !m)}
              />

              {/* Actions */}
              <View style={s.actionBar}>
                <View style={s.actionsLeft}>
                  <TouchableOpacity onPress={handleLike} style={s.actionBtn}>
                    <Animated.Text style={[s.heartIcon, liked && s.heartLiked, { transform: [{ scale: heartAnim }] }]}>
                      {liked ? '♥' : '♡'}
                    </Animated.Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.actionBtn} onPress={() => inputRef.current?.focus()}>
                    <Text style={s.actionIcon}>💬</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.actionBtn} onPress={handleShare}>
                    <Text style={s.actionIcon}>↗</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.jyotishBtn}
                    onPress={() => navigation.navigate('JyotishProfileUnlock', { uid: post.author_uid, profile: post })}
                  >
                    <Text style={s.jyotishBtnTxt}>🔮 Jyotish View</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => setSaved(p => !p)} style={s.actionBtn}>
                  <Text style={[s.actionIcon, saved && { color: '#7C3AED' }]}>{saved ? '🔖' : '🏷️'}</Text>
                </TouchableOpacity>
              </View>

              {/* Likes */}
              {(post.likes_count || 0) > 0 && (
                <Text style={s.likesCount}>{post.likes_count.toLocaleString()} likes</Text>
              )}

              {/* Caption */}
              <View style={s.captionWrap}>
                <Caption text={post.content} name={post.author_name} />
              </View>

              {/* Astro chips */}
              {(post.planetary_moment?.mahadasha || post.author_nakshatra) && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
                  {post.planetary_moment?.mahadasha && <View style={s.chip}><Text style={s.chipTxt}>⏳ {post.planetary_moment.mahadasha} dasha</Text></View>}
                  {post.author_nakshatra && <View style={s.chip}><Text style={s.chipTxt}>🌙 {post.author_nakshatra}</Text></View>}
                </ScrollView>
              )}

              <Text style={s.timestamp}>{timeAgo(post.created_at)}</Text>
              <View style={s.divider} />
              <Text style={s.commentsHeader}>Comments</Text>
              {loadingComments && <ActivityIndicator color="#7C3AED" style={{ margin: 20 }} />}
              {!loadingComments && comments.length === 0 && (
                <Text style={s.noComments}>No comments yet. Be the first 🌟</Text>
              )}
            </View>
          }
          renderItem={({ item: c }) => (
            <View style={s.commentRow}>
              <Avatar name={c.author_name} size={34} />
              <View style={s.commentBody}>
                <Text style={s.commentTxt}>
                  <Text style={s.commentName}>{c.author_name} </Text>
                  {c.text}
                </Text>
                <View style={s.commentMeta}>
                  <Text style={s.commentTime}>{timeAgo(c.created_at)}</Text>
                  <TouchableOpacity onPress={() => { setReplyTo(c); inputRef.current?.focus(); }}>
                    <Text style={s.replyBtn}>Reply</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setLC2(p => ({ ...p, [c.id]: !p[c.id] }))}>
                    <Text style={[s.commentHeart, likedComments[c.id] && { color: '#ED4956' }]}>
                      {likedComments[c.id] ? '♥' : '♡'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingBottom: 80 }}
        />

        {/* Comment composer */}
        {replyTo && (
          <View style={s.replyBar}>
            <Text style={s.replyBarTxt}>Replying to <Text style={{ fontWeight: '700' }}>{replyTo.author_name}</Text></Text>
            <TouchableOpacity onPress={() => setReplyTo(null)}><Text style={s.replyBarX}>✕</Text></TouchableOpacity>
          </View>
        )}
        <View style={s.composer}>
          <Avatar name="You" size={32} />
          <TextInput
            ref={inputRef}
            style={s.composerInput}
            value={text}
            onChangeText={setText}
            placeholder={replyTo ? `Reply to ${replyTo.author_name}...` : 'Add a comment...'}
            placeholderTextColor="#ABABAB"
            multiline maxLength={300}
          />
          <TouchableOpacity onPress={submitComment} disabled={!text.trim() || sending}>
            {sending
              ? <ActivityIndicator size="small" color="#7C3AED" />
              : <Text style={[s.postBtn, !text.trim() && { opacity: 0.3 }]}>Post</Text>
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 10, borderBottomWidth: 0.5, borderBottomColor: '#E8E8E8' },
  backArrow:     { fontSize: 28, color: '#262626', lineHeight: 32 },
  headerTitle:   { fontSize: 16, fontWeight: '700', color: '#262626' },
  authorRow:     { flexDirection: 'row', alignItems: 'center', padding: 12 },
  avatarRing:    { width: 46, height: 46, borderRadius: 23, padding: 2 },
  avatarInner:   { width: 41, height: 41, borderRadius: 21, borderWidth: 2, borderColor: '#fff', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  authorName:    { fontSize: 13.5, fontWeight: '700', color: '#262626' },
  authorSub:     { fontSize: 11.5, color: '#8E8E8E', marginTop: 1 },
  followBtn:     { borderWidth: 1, borderColor: '#7C3AED', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 5 },
  followBtnTxt:  { color: '#7C3AED', fontWeight: '700', fontSize: 13 },
  dots:          { position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot:           { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive:     { backgroundColor: '#fff' },
  heartOverlay:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  actionBar:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 6 },
  actionsLeft:   { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionBtn:     { padding: 6 },
  heartIcon:     { fontSize: 28, color: '#262626', lineHeight: 32 },
  heartLiked:    { color: '#ED4956' },
  actionIcon:    { fontSize: 22, color: '#262626', lineHeight: 28 },
  jyotishBtn:    { marginLeft: 6, backgroundColor: '#F0EEFF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  jyotishBtnTxt: { fontSize: 12, color: '#7C3AED', fontWeight: '700' },
  likesCount:    { fontSize: 13.5, fontWeight: '700', color: '#262626', paddingHorizontal: 14, marginBottom: 4 },
  captionWrap:   { paddingHorizontal: 14, marginBottom: 6 },
  captionTxt:    { fontSize: 14, color: '#262626', lineHeight: 20 },
  captionName:   { fontWeight: '700' },
  captionTag:    { color: '#7C3AED', fontWeight: '600' },
  captionMore:   { color: '#8E8E8E' },
  chips:         { paddingHorizontal: 12, paddingBottom: 8, gap: 6 },
  chip:          { backgroundColor: '#F4F4F4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  chipTxt:       { fontSize: 11.5, color: '#555', fontWeight: '600' },
  timestamp:     { fontSize: 11, color: '#ABABAB', paddingHorizontal: 14, paddingBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  divider:       { height: 0.5, backgroundColor: '#E8E8E8' },
  commentsHeader:{ fontSize: 13.5, fontWeight: '700', color: '#262626', padding: 14, paddingBottom: 8 },
  noComments:    { fontSize: 13.5, color: '#8E8E8E', textAlign: 'center', padding: 24 },
  commentRow:    { flexDirection: 'row', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#F5F5F5' },
  commentBody:   { flex: 1 },
  commentTxt:    { fontSize: 13.5, color: '#262626', lineHeight: 19 },
  commentName:   { fontWeight: '700' },
  commentMeta:   { flexDirection: 'row', gap: 14, marginTop: 4, alignItems: 'center' },
  commentTime:   { fontSize: 11.5, color: '#8E8E8E' },
  replyBtn:      { fontSize: 11.5, color: '#8E8E8E', fontWeight: '700' },
  commentHeart:  { fontSize: 13, color: '#8E8E8E' },
  replyBar:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8F0FF', paddingHorizontal: 16, paddingVertical: 8 },
  replyBarTxt:   { fontSize: 13, color: '#7C3AED' },
  replyBarX:     { fontSize: 16, color: '#7C3AED', padding: 4 },
  composer:      { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: 0.5, borderTopColor: '#E8E8E8', backgroundColor: '#fff' },
  composerInput: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9, fontSize: 14, color: '#262626', maxHeight: 80 },
  postBtn:       { fontSize: 14, fontWeight: '700', color: '#7C3AED', paddingVertical: 6 },
});
