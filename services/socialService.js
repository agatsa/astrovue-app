/**
 * socialService.js — All social operations go through backend (admin SDK)
 * This bypasses Firestore client-side security rules entirely.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { BASE_URL } from '../config/constants';
import * as FileSystem from 'expo-file-system';

// ── Auth helper ────────────────────────────────────────────────────────────────
async function getToken() {
  try { return auth.currentUser ? await auth.currentUser.getIdToken() : null; }
  catch { return null; }
}

async function api(path, body = {}, method = 'POST') {
  const token = await getToken();
  const res   = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: method !== 'GET' ? JSON.stringify(body) : undefined,
  });
  // Safe JSON parse — show raw text if response is not JSON
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error(`[socialService] ${path} non-JSON response (${res.status}):`, text.substring(0, 300));
    throw new Error(`Server returned: ${text.substring(0, 150)}`);
  }
}

// ── Profile ────────────────────────────────────────────────────────────────────

export async function syncPublicProfile() {
  try {
    const [ps, de] = await Promise.all([
      AsyncStorage.getItem('userProfile').then(s => s ? JSON.parse(s) : {}),
      AsyncStorage.getItem('@daily_energy').then(s => s ? JSON.parse(s) : {}),
    ]);
    await api('/api/social/sync-profile', {
      name:          ps.name        || '',
      photo:         ps.photo       || '',
      bio:           ps.bio         || '',
      dob:           ps.dob         || '',
      pob:           ps.pob         || '',
      moon_sign:     de.moon_sign   || '',
      ascendant:     de.ascendant   || '',
      nakshatra:     de.user_Chart?.nakshatra || '',
      pada:          de.user_Chart?.pada      || 0,
      mahadasha:     de.user_Chart?.mahadasha || '',
      planet_positions: de.user_Chart?.planet_positions || {},
      is_influencer: ps.is_influencer || false,
    });
  } catch (e) {
    console.warn('[social] syncPublicProfile failed:', e.message);
  }
}

export async function getUserProfile(targetUid) {
  try {
    const data = await api('/api/social/profile', { uid: targetUid });
    return data.profile ? { uid: targetUid, ...data.profile } : null;
  } catch { return null; }
}

// ── Feed ───────────────────────────────────────────────────────────────────────

export async function getFeed(limitN = 30) {
  try {
    const de = JSON.parse(await AsyncStorage.getItem('@daily_energy') || '{}');
    const data = await api('/api/social/feed', {
      limit:     limitN,
      nakshatra: de.user_Chart?.nakshatra || '',
      moon_sign: de.moon_sign || '',
    });
    return data.posts || [];
  } catch { return []; }
}

// ── Posts ──────────────────────────────────────────────────────────────────────

// Upload any media file (image or video) via multipart FormData
async function uploadMediaFile(uri, mediaType = 'photo') {
  try {
    const token    = await getToken();
    const isVideo  = mediaType === 'video';
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: isVideo ? 'video/mp4' : 'image/jpeg',
      name: `upload_${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`,
    });
    const res = await fetch(`${BASE_URL}/api/upload-image-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const data = await res.json();
    return data.url || null;
  } catch (e) {
    return null;
  }
}

export async function createPost({ content, mediaUris = [], mediaTypes = [], tags = [] }) {
  const [ps, de] = await Promise.all([
    AsyncStorage.getItem('userProfile').then(s => s ? JSON.parse(s) : {}),
    AsyncStorage.getItem('@daily_energy').then(s => s ? JSON.parse(s) : {}),
  ]);

  // Upload all media via FormData (works with content:// and file:// URIs on Android)
  const media_urls  = [];
  const media_types = [];
  for (let i = 0; i < mediaUris.length; i++) {
    const uri  = mediaUris[i];
    const type = mediaTypes[i] || 'photo';
    const url  = await uploadMediaFile(uri, type);
    if (url) { media_urls.push(url); media_types.push(type); }
  }

  const data = await api('/api/social/post', {
    content,
    media_urls,
    media_types,
    media_base64: [],
    tags,
    author: {
      name:      ps.name      || 'User',
      photo:     ps.photo     || '',
      nakshatra: de.user_Chart?.nakshatra || '',
      moon_sign: de.moon_sign || '',
      ascendant: de.ascendant || '',
      zone:      de.zone      || 'Neutral Zone',
    },
    planetary_moment: {
      mahadasha:  de.user_Chart?.mahadasha  || '',
      antardasha: de.user_Chart?.antardasha || '',
      moon_sign:  de.moon_sign || '',
      ascendant:  de.ascendant || '',
      nakshatra:  de.user_Chart?.nakshatra || '',
      zone:       de.zone || '',
    },
  });

  if (data.error) throw new Error(data.error);
  return data.post_id;
}

// ── Likes ──────────────────────────────────────────────────────────────────────

export async function likePost(postId) {
  const data = await api('/api/social/like', { post_id: postId });
  return data.liked; // true = liked, false = unliked
}

// ── Follow ─────────────────────────────────────────────────────────────────────

export async function followUser(targetUid) {
  return api('/api/social/follow', { target_uid: targetUid, action: 'follow' });
}

export async function unfollowUser(targetUid) {
  return api('/api/social/follow', { target_uid: targetUid, action: 'unfollow' });
}

export async function isFollowing(targetUid) {
  // Check via feed profile — simplified; returns false if error
  try {
    const data = await api('/api/social/profile', { uid: auth.currentUser?.uid });
    return false; // placeholder — full implementation needs a dedicated endpoint
  } catch { return false; }
}

// ── Comments ───────────────────────────────────────────────────────────────────

export async function getComments(postId) {
  try {
    const data = await api('/api/social/comments', { post_id: postId });
    return data.comments || [];
  } catch { return []; }
}

export async function addComment(postId, text, replyTo = null) {
  const [ps, de] = await Promise.all([
    AsyncStorage.getItem('userProfile').then(s => s ? JSON.parse(s) : {}),
    AsyncStorage.getItem('@daily_energy').then(s => s ? JSON.parse(s) : {}),
  ]);
  return api('/api/social/comment', {
    post_id:    postId,
    text,
    reply_to:   replyTo,
    author: {
      name:      ps.name  || 'User',
      photo:     ps.photo || '',
      nakshatra: de.user_Chart?.nakshatra || '',
      moon_sign: de.moon_sign || '',
    },
  });
}

// ── Jyotish Synastry ───────────────────────────────────────────────────────────

export async function getJyotishSynastry(targetUid, targetProfile) {
  try {
    const [de, ps] = await Promise.all([
      AsyncStorage.getItem('@daily_energy').then(s => s ? JSON.parse(s) : {}),
      AsyncStorage.getItem('userProfile').then(s => s ? JSON.parse(s) : {}),
    ]);
    return api('/api/jyotish-synastry', {
      person1: {
        name: ps.name, dob: ps.dob, tob: ps.tob, pob: ps.pob,
        chart: de.user_Chart || {}, moon_sign: de.moon_sign,
        ascendant: de.ascendant, nakshatra: de.user_Chart?.nakshatra,
      },
      person2: {
        name: targetProfile.name, dob: targetProfile.dob,
        moon_sign: targetProfile.moon_sign, ascendant: targetProfile.ascendant,
        nakshatra: targetProfile.nakshatra,
        planet_positions: targetProfile.planet_positions || {},
      },
    });
  } catch { return null; }
}

// ── Search ─────────────────────────────────────────────────────────────────────

export async function searchUsers(query, by = 'any') {
  try {
    const data = await api('/api/social/search', { query, by, limit: 20 });
    return data.users || [];
  } catch { return []; }
}
