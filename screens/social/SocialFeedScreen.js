/**
 * SocialFeedScreen — Full Instagram-feature social feed
 * Double-tap like · Image carousel · Hashtag highlighting · Heart burst · Share
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, RefreshControl, SafeAreaView, ActivityIndicator,
  Modal, TextInput, KeyboardAvoidingView, Platform,
  ScrollView, Dimensions, Animated, Share, StatusBar,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFeed, likePost, syncPublicProfile, getComments, addComment } from '../../services/socialService';

const { width: SW } = Dimensions.get('window');

// ── Avatar colour pool ──────────────────────────────────────────────────────
const AVATAR_COLORS = [
  ['#7C3AED','#A855F7'], ['#DB2777','#EC4899'], ['#059669','#10B981'],
  ['#D97706','#F59E0B'], ['#2563EB','#3B82F6'], ['#DC2626','#EF4444'],
  ['#7C3AED','#6D28D9'], ['#0891B2','#06B6D4'],
];
function avatarColors(name = '') {
  const code = name && name.length > 0 ? name.charCodeAt(0) : 65;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

// ── Dummy seed posts ────────────────────────────────────────────────────────
const DUMMY_POSTS = [
  {
    id: 'demo1', author_uid: 'u1', author_name: 'Priya Sharma',
    followers_count: 12400, following_count: 312, post_count: 87,
    bio: 'Vedic astrologer · 12 years experience · Specialising in career & relationships',
    services: 'Kundli reading • Muhurat timing • Relationship compatibility',
    author_nakshatra: 'Rohini', author_moon_sign: 'Taurus', author_zone: 'Green Zone',
    content: 'Jupiter transiting my 9th house has been absolutely transformational 🙏 My guru literally appeared in a dream last Tuesday. Anyone else feeling this Brihaspati energy strongly this week? #JupiterTransit #VedicAstrology #Jyotish',
    likes_count: 142, comments_count: 34, dharma_reward: 5,
    created_at: new Date(Date.now() - 2 * 3600000),
    planetary_moment: { mahadasha: 'Jupiter', nakshatra: 'Rohini', zone: 'Green Zone' },
    sample_comments: [
      { id: 'c1', author_name: 'Ananya K', text: 'Yes! My meditation has been so deep lately ✨', created_at: new Date(Date.now() - 1800000) },
      { id: 'c2', author_name: 'Rohan M', text: 'Jupiter is blessing us all right now 🙏', created_at: new Date(Date.now() - 900000) },
    ],
  },
  {
    id: 'demo2', author_uid: 'u2', author_name: 'Arjun Mehta',
    followers_count: 3800, following_count: 201, post_count: 45,
    bio: 'Jyotish student & seeker 🙏 Saturn taught me patience',
    author_nakshatra: 'Ashwini', author_moon_sign: 'Aries', author_zone: 'Red Zone',
    content: 'Saturn sadesati ending next month and I can already feel the shift. Three years of discipline, delays and deep lessons. Ready for the new chapter! 💪 Who else is coming out of their sadesati? #Saturn #Sadesati #Transformation',
    likes_count: 89, comments_count: 22, dharma_reward: 5,
    created_at: new Date(Date.now() - 5 * 3600000),
    planetary_moment: { mahadasha: 'Saturn', nakshatra: 'Ashwini', zone: 'Red Zone' },
    sample_comments: [
      { id: 'c3', author_name: 'Vikram S', text: 'Same here! December cannot come fast enough', created_at: new Date(Date.now() - 3600000) },
      { id: 'c4', author_name: 'Deepika R', text: 'Stay strong, the light is at the end of the tunnel 🌟', created_at: new Date(Date.now() - 1800000) },
    ],
  },
  {
    id: 'demo3', author_uid: 'u3', author_name: 'Meera Nair',
    followers_count: 28900, following_count: 445, post_count: 203,
    bio: '🌙 Nakshatra specialist · Moon rituals · Chandra healing · Mumbai',
    services: 'Full moon ceremonies • Nakshatra remedies • Online consultations',
    author_nakshatra: 'Hasta', author_moon_sign: 'Virgo', author_zone: 'Neutral Zone',
    content: 'Full moon in Scorpio tonight hits different when your Moon is in Hasta nakshatra 🌕 The emotional depth is real. Journalled for 2 hours straight. What rituals are you doing tonight? #FullMoon #Scorpio #Nakshatra #Hasta',
    likes_count: 213, comments_count: 67, dharma_reward: 5,
    created_at: new Date(Date.now() - 8 * 3600000),
    planetary_moment: { mahadasha: 'Moon', nakshatra: 'Hasta', zone: 'Neutral Zone' },
    sample_comments: [
      { id: 'c5', author_name: 'Kavitha L', text: 'I lit a white candle and chanted Chandra mantra 🕯️', created_at: new Date(Date.now() - 7200000) },
      { id: 'c6', author_name: 'Suresh P', text: 'Moon in Scorpio always brings hidden things to light', created_at: new Date(Date.now() - 3600000) },
    ],
  },
  {
    id: 'demo4', author_uid: 'u4', author_name: 'Vikram Singh',
    author_nakshatra: 'Magha', author_moon_sign: 'Leo', author_zone: 'Green Zone',
    content: 'Rahu in my 10th house has pushed me to start my own business after 15 years of corporate life. Best decision I ever made ✨ Rahu really does shake your comfort zone to give you gold. #Rahu #10thHouse #Entrepreneur #VedicAstro',
    likes_count: 304, comments_count: 91, dharma_reward: 5,
    created_at: new Date(Date.now() - 12 * 3600000),
    planetary_moment: { mahadasha: 'Rahu', nakshatra: 'Magha', zone: 'Green Zone' },
    sample_comments: [
      { id: 'c7', author_name: 'Nita M', text: 'This is so inspiring! I am in my Rahu mahadasha too', created_at: new Date(Date.now() - 10800000) },
      { id: 'c8', author_name: 'Arun K', text: 'The 10th house Rahu transit is legendary for career breakthroughs', created_at: new Date(Date.now() - 7200000) },
    ],
  },
  {
    id: 'demo5', author_uid: 'u5', author_name: 'Ananya Krishnan',
    author_nakshatra: 'Pushya', author_moon_sign: 'Cancer', author_zone: 'Green Zone',
    content: 'Today is Pushya nakshatra — one of the most auspicious days to start something new 🌱 I signed my new home lease, opened a savings account, and planted a mango sapling. What did you do on this special day? #Pushya #Muhurat #Auspicious',
    likes_count: 178, comments_count: 43, dharma_reward: 5,
    created_at: new Date(Date.now() - 18 * 3600000),
    planetary_moment: { mahadasha: 'Jupiter', nakshatra: 'Pushya', zone: 'Green Zone' },
    sample_comments: [
      { id: 'c9', author_name: 'Rahul D', text: 'Started my online course! Perfect timing 🎓', created_at: new Date(Date.now() - 16200000) },
      { id: 'c10', author_name: 'Pooja S', text: 'Bought gold today — feels right on Pushya!', created_at: new Date(Date.now() - 14400000) },
    ],
  },
];

const DUMMY_STORIES = [
  { id: 's0', name: 'Your Story', isOwn: true },
  { id: 's1', name: 'Priya',  nakshatra: 'Rohini',  active: true  },
  { id: 's2', name: 'Arjun',  nakshatra: 'Ashwini', active: true  },
  { id: 's3', name: 'Meera',  nakshatra: 'Hasta',   active: false },
  { id: 's4', name: 'Vikram', nakshatra: 'Magha',   active: true  },
  { id: 's5', name: 'Ananya', nakshatra: 'Pushya',  active: false },
  { id: 's6', name: 'Rohan',  nakshatra: 'Uttara',  active: true  },
  { id: 's7', name: 'Kavitha',nakshatra: 'Chitra',  active: false },
];

const ZONE_COLOR = { 'Green Zone': '#10B981', 'Red Zone': '#EF4444', 'Neutral Zone': '#F59E0B' };

function timeAgo(ts) {
  if (!ts) return '';
  const d    = ts instanceof Date ? ts : typeof ts === 'string' ? new Date(ts) : ts.toDate?.() ?? new Date(ts);
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60)     return 'just now';
  if (diff < 3600)   return `${Math.floor(diff / 60)}m`;
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// ── Parse caption with hashtag/mention highlighting ─────────────────────────
function Caption({ text, expanded, onToggle, authorName }) {
  if (!text) return null;
  const MAX = 125;
  const isLong = text.length > MAX;
  const display = expanded || !isLong ? text : text.slice(0, MAX);

  const parts = display.split(/(#\w+|@\w+)/g);
  return (
    <Text style={p.captionTxt}>
      <Text style={p.captionName}>{authorName} </Text>
      {parts.map((part, i) =>
        (part.startsWith('#') || part.startsWith('@'))
          ? <Text key={i} style={p.captionTag}>{part}</Text>
          : <Text key={i}>{part}</Text>
      )}
      {isLong && !expanded
        ? <Text style={p.captionMore} onPress={onToggle}>… more</Text>
        : null}
    </Text>
  );
}

// ── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ photo, name, size = 40 }) {
  const cols = avatarColors(name || '');
  if (photo) return <Image source={{ uri: photo }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  return (
    <LinearGradient colors={cols} style={{ width: size, height: size, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.38 }}>{(name || '?')[0].toUpperCase()}</Text>
    </LinearGradient>
  );
}

// ── Media Carousel (images + videos) ─────────────────────────────────────────
function MediaCarousel({ urls, mediaTypes, onDoubleTap, onSingleTap, isVisible, muted, onMuteToggle }) {
  const [page, setPage]  = useState(0);
  const lastTap          = useRef(0);
  const singleTapTimer   = useRef(null);
  const heartScale       = useRef(new Animated.Value(0)).current;
  const heartOpacity     = useRef(new Animated.Value(0)).current;

  const showHeart = () => {
    heartScale.setValue(0); heartOpacity.setValue(1);
    Animated.sequence([
      Animated.spring(heartScale, { toValue: 1, friction: 3, useNativeDriver: true }),
      Animated.delay(600),
      Animated.timing(heartOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const handleImgPress = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      clearTimeout(singleTapTimer.current);
      onDoubleTap?.(); showHeart();
    } else {
      singleTapTimer.current = setTimeout(() => onSingleTap?.(), 280);
    }
    lastTap.current = now;
  };

  if (!urls || urls.length === 0) return null;

  const checkIsVideo = (idx) => {
    const type = mediaTypes?.[idx] || '';
    const url  = urls[idx] || '';
    return type === 'video' || !!url.match(/\.(mp4|mov|webm|avi)$/i);
  };

  return (
    <View style={{ position: 'relative' }}>
      <FlatList
        data={urls} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => `m_${i}`}
        scrollEnabled={urls.length > 1}
        onMomentumScrollEnd={e => setPage(Math.round(e.nativeEvent.contentOffset.x / SW))}
        renderItem={({ item: uri, index: idx }) => (
          checkIsVideo(idx) ? (
            <TouchableOpacity activeOpacity={1} onPress={onSingleTap} style={{ width: SW, height: SW * 0.85, backgroundColor: '#000' }}>
              <Video
                source={{ uri }}
                style={{ width: SW, height: SW * 0.85 }}
                resizeMode={ResizeMode.COVER}
                shouldPlay={isVisible && idx === page}
                isLooping
                isMuted={muted !== false}
                useNativeControls={false}
              />
              {/* Mute toggle — bottom right */}
              <TouchableOpacity style={ic.muteBtn} onPress={onMuteToggle}>
                <Text style={ic.muteTxt}>{muted !== false ? '🔇' : '🔊'}</Text>
              </TouchableOpacity>
              {/* Show play icon when not yet playing */}
              {!isVisible && (
                <View style={[StyleSheet.absoluteFill, ic.videoOverlay]} pointerEvents="none">
                  <View style={ic.videoPlayBtn}><Text style={ic.videoPlayIcon}>▶</Text></View>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity activeOpacity={1} onPress={handleImgPress}>
              <Image source={{ uri }} style={{ width: SW, height: SW * 0.85 }} resizeMode="cover" />
            </TouchableOpacity>
          )
        )}
      />
      {urls.length > 1 && (
        <View style={ic.dots}>
          {urls.map((_, i) => <View key={i} style={[ic.dot, i === page && ic.dotActive]} />)}
        </View>
      )}
      <Animated.View style={[ic.heartOverlay, { opacity: heartOpacity, transform: [{ scale: heartScale }] }]} pointerEvents="none">
        <Text style={ic.heartEmoji}>❤️</Text>
      </Animated.View>
    </View>
  );
}
const ic = StyleSheet.create({
  dots:         { position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 5 },
  dot:          { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  dotActive:    { backgroundColor: '#fff' },
  heartOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  heartEmoji:   { fontSize: 80 },
  videoOverlay: { justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  videoPlayBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  videoPlayIcon:{ fontSize: 26, color: '#fff', marginLeft: 4 },
  muteBtn:      { position: 'absolute', bottom: 12, right: 12, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  muteTxt:      { fontSize: 15 },
});

// ── Comment Sheet ────────────────────────────────────────────────────────────
function CommentSheet({ post, visible, onClose, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [text, setText]         = useState('');
  const [sending, setSending]   = useState(false);
  const [replyTo, setReplyTo]   = useState(null);
  const [likedComments, setLikedComments] = useState({});
  const inputRef = useRef(null);
  const topPad   = StatusBar.currentHeight || 0;

  useEffect(() => {
    if (!visible) return;
    if (post?.sample_comments?.length) {
      setComments(post.sample_comments);
    }
    if (post?.id && !post.id.startsWith('demo')) {
      getComments(post.id).then(c => { if (c.length) setComments(c); });
    }
  }, [visible, post?.id]);

  const submit = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const newC = { id: `local_${Date.now()}`, author_name: 'You', text: text.trim(), created_at: new Date() };
    setComments(p => [...p, newC]);
    setText(''); setReplyTo(null);
    if (post?.id && !post.id.startsWith('demo')) {
      try { await addComment(post.id, newC.text, replyTo?.id || null); } catch {}
    }
    onCommentAdded?.(post?.id);
    setSending(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={cs.root}>
        {/* Handle */}
        <View style={cs.handle} />
        {/* Header */}
        <View style={cs.header}>
          <View style={{ width: 44 }} />
          <Text style={cs.headerTitle}>Comments</Text>
          <TouchableOpacity onPress={onClose} style={cs.closeWrap}>
            <Text style={cs.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>
        <View style={cs.divider} />

        {/* Comment list */}
        <FlatList
          data={comments}
          keyExtractor={c => c.id || Math.random().toString()}
          contentContainerStyle={cs.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={cs.emptyWrap}><Text style={cs.emptyTxt}>No comments yet. Start the conversation 🌟</Text></View>
          }
          renderItem={({ item: c }) => (
            <View style={cs.row}>
              <Avatar name={c.author_name} size={36} />
              <View style={cs.commentBody}>
                <View style={cs.commentBubble}>
                  <Text style={cs.commentText}>
                    <Text style={cs.commentAuthor}>{c.author_name} </Text>
                    {c.text}
                  </Text>
                </View>
                <View style={cs.commentMeta}>
                  <Text style={cs.commentTime}>{timeAgo(c.created_at)}</Text>
                  <TouchableOpacity onPress={() => { setReplyTo(c); inputRef.current?.focus(); }}>
                    <Text style={cs.replyBtn}>Reply</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setLikedComments(p => ({ ...p, [c.id]: !p[c.id] }))}>
                    <Text style={{ fontSize: 12, color: likedComments[c.id] ? '#ED4956' : '#8E8E8E' }}>
                      {likedComments[c.id] ? '♥' : '♡'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        />

        {/* Composer */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {replyTo && (
            <View style={cs.replyBar}>
              <Text style={cs.replyBarTxt}>Replying to <Text style={{ fontWeight: '700' }}>{replyTo.author_name}</Text></Text>
              <TouchableOpacity onPress={() => setReplyTo(null)}><Text style={cs.replyBarX}>✕</Text></TouchableOpacity>
            </View>
          )}
          <View style={cs.composer}>
            <Avatar name="You" size={32} />
            <TextInput
              ref={inputRef}
              style={cs.input}
              value={text}
              onChangeText={setText}
              placeholder={replyTo ? `Reply to ${replyTo.author_name}...` : 'Add a comment...'}
              placeholderTextColor="#ABABAB"
              multiline
              maxLength={300}
              returnKeyType="send"
              onSubmitEditing={submit}
            />
            <TouchableOpacity onPress={submit} disabled={!text.trim() || sending} style={cs.sendWrap}>
              {sending
                ? <ActivityIndicator size="small" color="#7C3AED" />
                : <Text style={[cs.sendBtn, !text.trim() && { opacity: 0.3 }]}>Post</Text>
              }
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ── Story Bubble ─────────────────────────────────────────────────────────────
function StoryBubble({ item, onPress }) {
  const ring = item.active
    ? ['#F77737','#FD1D1D','#833AB4','#405DE6']
    : item.isOwn ? ['#7C3AED','#7C3AED'] : ['#DBDBDB','#DBDBDB'];
  return (
    <TouchableOpacity style={st.wrap} onPress={() => onPress(item)} activeOpacity={0.8}>
      <LinearGradient colors={ring} style={st.ring}>
        <View style={st.inner}>
          {item.isOwn
            ? <View style={st.ownAvatar}><Text style={{ fontSize: 24, color: '#7C3AED' }}>+</Text></View>
            : <Avatar name={item.name} size={54} />
          }
        </View>
      </LinearGradient>
      <Text style={st.name} numberOfLines={1}>{item.isOwn ? 'Your Story' : item.name}</Text>
      {item.nakshatra ? <Text style={st.nak} numberOfLines={1}>{item.nakshatra}</Text> : null}
    </TouchableOpacity>
  );
}
const st = StyleSheet.create({
  wrap:      { alignItems: 'center', width: 74 },
  ring:      { width: 68, height: 68, borderRadius: 34, padding: 2.5, justifyContent: 'center', alignItems: 'center' },
  inner:     { width: 62, height: 62, borderRadius: 31, borderWidth: 2.5, borderColor: '#fff', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  ownAvatar: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#F0EEFF', justifyContent: 'center', alignItems: 'center' },
  name:      { fontSize: 11, color: '#262626', marginTop: 5, fontWeight: '500', maxWidth: 70, textAlign: 'center' },
  nak:       { fontSize: 9.5, color: '#7C3AED', fontWeight: '600', textAlign: 'center' },
});

// ── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ item, likedPosts, onLike, onComment, onJyotishView, onOpenDetail, navigation, isVisible, muted, onMuteToggle }) {
  const openDetail = () => onOpenDetail?.(item);
  const [saved, setSaved]       = useState(false);
  const [expanded, setExpanded] = useState(false);
  const liked    = likedPosts[item.id];
  const zoneColor = ZONE_COLOR[item.author_zone] || ZONE_COLOR['Neutral Zone'];
  const heartAnim = useRef(new Animated.Value(1)).current;

  const handleLike = useCallback(() => {
    Animated.sequence([
      Animated.timing(heartAnim, { toValue: 1.4, duration: 100, useNativeDriver: true }),
      Animated.timing(heartAnim, { toValue: 1,   duration: 100, useNativeDriver: true }),
    ]).start();
    onLike(item.id);
  }, [item.id, onLike]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${item.author_name} on AstroVue:\n\n"${item.content?.slice(0, 200)}"\n\n🌙 ${item.author_nakshatra || ''} · ${item.author_moon_sign || ''}\n\nDownload AstroVue — Vedic Astrology Community`,
      });
    } catch {}
  };

  const ringColors = item.author_zone === 'Green Zone'
    ? ['#F77737','#FD1D1D','#833AB4']
    : ['#DBDBDB','#DBDBDB'];

  return (
    <View style={p.card}>

      {/* Author row */}
      <TouchableOpacity
        style={p.authorRow}
        onPress={() => navigation.navigate('UserProfile', { uid: item.author_uid, profile: item }) }
        activeOpacity={0.75}
      >
        <LinearGradient colors={ringColors} style={p.avatarRing}>
          <View style={p.avatarInner}>
            <Avatar photo={item.author_photo} name={item.author_name} size={38} />
          </View>
        </LinearGradient>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={p.authorName}>{item.author_name}</Text>
            {item.followers_count && (
              <Text style={p.followersBadge}>
                {item.followers_count >= 1000 ? `${(item.followers_count/1000).toFixed(1)}K` : item.followers_count} followers
              </Text>
            )}
          </View>
          <Text style={p.authorSub} numberOfLines={1}>
            {[item.author_nakshatra, item.author_moon_sign].filter(Boolean).join(' · ')}
            {item.author_zone ? `  ·  ${item.author_zone}` : ''}
          </Text>
        </View>
        <TouchableOpacity style={p.moreBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={p.moreDots}>•••</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Media (images + videos) */}
      {item.media_urls?.length > 0 && (
        <MediaCarousel
          urls={item.media_urls}
          mediaTypes={item.media_types}
          onDoubleTap={handleLike}
          onSingleTap={openDetail}
          isVisible={isVisible}
          muted={muted}
          onMuteToggle={onMuteToggle}
        />
      )}

      {/* Action bar */}
      <View style={p.actionBar}>
        <View style={p.actionsLeft}>
          <TouchableOpacity onPress={handleLike} style={p.actionBtn} activeOpacity={0.6}>
            <Animated.Text style={[p.heartIcon, liked && p.heartLiked, { transform: [{ scale: heartAnim }] }]}>
              {liked ? '♥' : '♡'}
            </Animated.Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onComment(item)} style={p.actionBtn} activeOpacity={0.6}>
            <Text style={p.actionIcon}>💬</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={p.actionBtn} activeOpacity={0.6}>
            <Text style={p.actionIcon}>↗</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={p.jyotishBtn}
            onPress={() => onJyotishView(item)}
            activeOpacity={0.8}
          >
            <Text style={p.jyotishBtnTxt}>🔮 Jyotish View</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => setSaved(s => !s)} style={p.actionBtn}>
          <Text style={[p.actionIcon, saved && { color: '#7C3AED' }]}>{saved ? '🔖' : '🏷️'}</Text>
        </TouchableOpacity>
      </View>

      {/* Likes */}
      {(item.likes_count || 0) > 0 && (
        <Text style={p.likesCount}>{(item.likes_count || 0).toLocaleString()} likes</Text>
      )}

      {/* Caption — tap to open full post */}
      <TouchableOpacity onPress={openDetail} activeOpacity={0.85}>
        <View style={p.captionWrap}>
          <Caption
            text={item.content}
            expanded={expanded}
            onToggle={() => setExpanded(true)}
            authorName={item.author_name}
          />
        </View>
      </TouchableOpacity>

      {/* Astro chips */}
      {(item.planetary_moment?.mahadasha || item.author_nakshatra) && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={p.chipsRow}>
          {item.planetary_moment?.mahadasha && (
            <View style={p.chip}><Text style={p.chipTxt}>⏳ {item.planetary_moment.mahadasha} dasha</Text></View>
          )}
          {item.author_nakshatra && (
            <View style={p.chip}><Text style={p.chipTxt}>🌙 {item.author_nakshatra}</Text></View>
          )}
          {item.planetary_moment?.zone && (
            <View style={[p.chip, { backgroundColor: (ZONE_COLOR[item.planetary_moment.zone] || '#F59E0B') + '18' }]}>
              <Text style={[p.chipTxt, { color: ZONE_COLOR[item.planetary_moment.zone] || '#F59E0B', fontWeight: '700' }]}>
                {item.planetary_moment.zone}
              </Text>
            </View>
          )}
          <View style={[p.chip, { backgroundColor: '#F0EEFF' }]}>
            <Text style={[p.chipTxt, { color: '#7C3AED', fontWeight: '700' }]}>+{item.dharma_reward || 5} Dharma</Text>
          </View>
        </ScrollView>
      )}

      {/* Comment previews */}
      {(item.sample_comments?.length > 0 || item.comments_count > 0) && (
        <View style={p.commentPreview}>
          {item.comments_count > 2 && (
            <TouchableOpacity onPress={openDetail}>
              <Text style={p.viewAllComments}>View all {item.comments_count} comments</Text>
            </TouchableOpacity>
          )}
          {(item.sample_comments || []).slice(0, 2).map(c => (
            <Text key={c.id} style={p.previewLine} numberOfLines={2}>
              <Text style={p.previewAuthor}>{c.author_name} </Text>
              {c.text}
            </Text>
          ))}
        </View>
      )}

      {/* Add comment tap target — tap to open full post */}
      <TouchableOpacity style={p.addCommentRow} onPress={openDetail} activeOpacity={0.6}>
        <Avatar name="You" size={22} />
        <Text style={p.addCommentTxt}>Add a comment...</Text>
      </TouchableOpacity>

      {/* Timestamp */}
      <Text style={p.timestamp}>{timeAgo(item.created_at)}</Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function SocialFeedScreen({ navigation }) {
  const topPad = StatusBar.currentHeight || 0;
  const [posts, setPosts]          = useState(DUMMY_POSTS);
  const [refreshing, setRefresh]   = useState(false);
  const [likedPosts, setLiked]     = useState({});
  const [commentPost, setPost]     = useState(null);
  const [visiblePostId, setVisible]= useState(null);  // which post's video plays
  const [muted, setMuted]          = useState(true);   // global mute, default muted
  const [screenFocused, setFocused]= useState(true);

  // Stop all videos when screen loses focus (e.g. navigating to PostDetail)
  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => setFocused(false);
  }, []));

  // Viewability: auto-play video of first fully visible post
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) setVisible(viewableItems[0].item.id);
    else setVisible(null);
  }).current;

  useEffect(() => {
    syncPublicProfile().catch(() => {});
    loadReal();
  }, []);

  const loadReal = async () => {
    try {
      const feed = await getFeed(30);
      if (feed.length > 0) {
        // Sort newest first, then append dummy posts
        const sorted = feed.sort((a, b) => {
          const ta = a.created_at?.toDate?.()?.getTime?.() || new Date(a.created_at || 0).getTime();
          const tb = b.created_at?.toDate?.()?.getTime?.() || new Date(b.created_at || 0).getTime();
          return tb - ta;
        });
        setPosts([...sorted, ...DUMMY_POSTS]);
      }
    } catch {}
    setRefresh(false);
  };

  const handleLike = useCallback(async (postId) => {
    setLiked(prev => {
      const nowLiked = !prev[postId];
      setPosts(p => p.map(post => post.id === postId
        ? { ...post, likes_count: Math.max(0, (post.likes_count || 0) + (nowLiked ? 1 : -1)) }
        : post
      ));
      return { ...prev, [postId]: nowLiked };
    });
    if (!postId.startsWith('demo')) {
      try { await likePost(postId); } catch {}
    }
  }, []);

  const handleOpenDetail = useCallback((post) => {
    navigation.navigate('PostDetail', { post });
  }, [navigation]);

  const handleJyotishView = useCallback((post) => {
    navigation.navigate('JyotishProfileUnlock', {
      uid: post.author_uid,
      profile: {
        name: post.author_name, photo: post.author_photo,
        moon_sign: post.author_moon_sign, ascendant: post.author_ascendant,
        nakshatra: post.author_nakshatra,
      },
    });
  }, [navigation]);

  const onCommentAdded = useCallback((postId) => {
    setPosts(p => p.map(post => post.id === postId
      ? { ...post, comments_count: (post.comments_count || 0) + 1 }
      : post
    ));
  }, []);

  const handleStoryPress = useCallback((story) => {
    if (story.isOwn) navigation.navigate('CreatePost');
  }, [navigation]);

  return (
    <SafeAreaView style={f.root}>

      {/* Header */}
      <View style={[f.header, { paddingTop: topPad + 10 }]}>
        <Text style={f.logo}>AstroVue</Text>
        <View style={f.headerRight}>
          <TouchableOpacity style={f.headerBtn} onPress={() => navigation.navigate('UserSearch')}>
            <Text style={f.headerIcon}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={f.headerBtn} onPress={() => navigation.navigate('FollowList', { mode: 'followers', uid: 'me', title: 'My Network' })}>
            <Text style={f.headerIcon}>👥</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('CreatePost')}>
            <View style={f.newPostBtn}>
              <Text style={f.newPostTxt}>+ Post</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={posts}
        keyExtractor={post => post.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefresh(true); loadReal(); }}
            tintColor="#7C3AED"
          />
        }
        ListHeaderComponent={
          <View style={f.storiesBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={f.storiesScroll}>
              {DUMMY_STORIES.map(s => (
                <StoryBubble key={s.id} item={s} onPress={handleStoryPress} />
              ))}
            </ScrollView>
          </View>
        }
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        renderItem={({ item }) => (
          <PostCard
            item={item}
            likedPosts={likedPosts}
            onLike={handleLike}
            onComment={setPost}
            onJyotishView={handleJyotishView}
            onOpenDetail={handleOpenDetail}
            navigation={navigation}
            isVisible={screenFocused && item.id === visiblePostId}
            muted={muted}
            onMuteToggle={() => setMuted(m => !m)}
          />
        )}
      />

      <CommentSheet
        post={commentPost}
        visible={!!commentPost}
        onClose={() => setPost(null)}
        onCommentAdded={onCommentAdded}
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const f = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#FAFAFA' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 10, backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E8E8E8' },
  logo:         { fontSize: 22, fontWeight: '800', color: '#1A1A2E', fontStyle: 'italic', letterSpacing: -0.5 },
  headerRight:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerBtn:    { padding: 6 },
  headerIcon:   { fontSize: 20 },
  newPostBtn:   { backgroundColor: '#7C3AED', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  newPostTxt:   { color: '#fff', fontSize: 13, fontWeight: '700' },
  storiesBar:   { backgroundColor: '#fff', borderBottomWidth: 0.5, borderBottomColor: '#E8E8E8', paddingVertical: 10 },
  storiesScroll:{ paddingHorizontal: 12, gap: 14 },
});

const p = StyleSheet.create({
  card:         { backgroundColor: '#fff', marginBottom: 8 },
  authorRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 },
  avatarRing:   { width: 46, height: 46, borderRadius: 23, padding: 2, justifyContent: 'center', alignItems: 'center' },
  avatarInner:  { width: 41, height: 41, borderRadius: 21, borderWidth: 2, borderColor: '#fff', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  authorName:    { fontSize: 13.5, fontWeight: '700', color: '#262626' },
  followersBadge:{ fontSize: 10.5, color: '#7C3AED', fontWeight: '600', backgroundColor: '#F0EEFF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  authorSub:     { fontSize: 11.5, color: '#8E8E8E', marginTop: 1 },
  moreBtn:      { padding: 6 },
  moreDots:     { fontSize: 17, color: '#262626', letterSpacing: 1 },
  actionBar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 6 },
  actionsLeft:  { flexDirection: 'row', alignItems: 'center', gap: 2 },
  actionBtn:    { padding: 6 },
  heartIcon:    { fontSize: 28, color: '#262626', lineHeight: 32 },
  heartLiked:   { color: '#ED4956' },
  actionIcon:   { fontSize: 22, color: '#262626', lineHeight: 28 },
  jyotishBtn:   { marginLeft: 6, backgroundColor: '#F0EEFF', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  jyotishBtnTxt:{ fontSize: 12, color: '#7C3AED', fontWeight: '700' },
  likesCount:   { fontSize: 13.5, fontWeight: '700', color: '#262626', paddingHorizontal: 14, marginBottom: 3 },
  captionWrap:  { paddingHorizontal: 14, marginBottom: 4 },
  captionTxt:   { fontSize: 13.5, color: '#262626', lineHeight: 20 },
  captionName:  { fontWeight: '700' },
  captionTag:   { color: '#7C3AED', fontWeight: '600' },
  captionMore:  { color: '#8E8E8E' },
  chipsRow:     { paddingHorizontal: 12, paddingBottom: 6, gap: 6, flexDirection: 'row' },
  chip:         { backgroundColor: '#F4F4F4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  chipTxt:      { fontSize: 11.5, color: '#555', fontWeight: '600' },
  commentPreview:{ paddingHorizontal: 14, marginBottom: 4 },
  viewAllComments:{ fontSize: 13, color: '#8E8E8E', marginBottom: 4 },
  previewLine:  { fontSize: 13.5, color: '#262626', lineHeight: 18, marginBottom: 2 },
  previewAuthor:{ fontWeight: '700' },
  addCommentRow:{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 0.5, borderTopColor: '#F0F0F0' },
  addCommentTxt:{ fontSize: 13, color: '#ABABAB' },
  timestamp:    { fontSize: 10.5, color: '#ABABAB', paddingHorizontal: 14, paddingBottom: 10, textTransform: 'uppercase', letterSpacing: 0.3 },
});

const cs = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#fff' },
  handle:       { width: 38, height: 4, backgroundColor: '#DDD', borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  headerTitle:  { fontSize: 15, fontWeight: '700', color: '#262626' },
  closeWrap:    { width: 44, alignItems: 'flex-end' },
  closeIcon:    { fontSize: 17, color: '#8E8E8E', padding: 4 },
  divider:      { height: 0.5, backgroundColor: '#E8E8E8' },
  list:         { padding: 14, paddingBottom: 20 },
  emptyWrap:    { padding: 40, alignItems: 'center' },
  emptyTxt:     { fontSize: 14, color: '#8E8E8E', textAlign: 'center' },
  row:          { flexDirection: 'row', gap: 10, marginBottom: 20, alignItems: 'flex-start' },
  commentBody:  { flex: 1 },
  commentBubble:{ marginBottom: 4 },
  commentText:  { fontSize: 13.5, color: '#262626', lineHeight: 19 },
  commentAuthor:{ fontWeight: '700' },
  commentMeta:  { flexDirection: 'row', gap: 14, alignItems: 'center' },
  commentTime:  { fontSize: 11.5, color: '#8E8E8E' },
  replyBtn:     { fontSize: 11.5, color: '#8E8E8E', fontWeight: '700' },
  replyBar:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8F0FF', paddingHorizontal: 16, paddingVertical: 8 },
  replyBarTxt:  { fontSize: 13, color: '#7C3AED' },
  replyBarX:    { fontSize: 16, color: '#7C3AED', padding: 4 },
  composer:     { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: 0.5, borderTopColor: '#E8E8E8', backgroundColor: '#fff' },
  input:        { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9, fontSize: 14, color: '#262626', maxHeight: 80 },
  sendWrap:     { paddingVertical: 6 },
  sendBtn:      { fontSize: 14, fontWeight: '700', color: '#7C3AED' },
});
