/**
 * CreatePostScreen — Full Instagram-style post creator
 * Step 1: Media picker (gallery grid + live camera)
 * Step 2: Edit with filters
 * Step 3: Caption, hashtags, location, feelings, audience
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, ScrollView, SafeAreaView, ActivityIndicator,
  Alert, Dimensions, FlatList, StatusBar, Modal,
  KeyboardAvoidingView, Platform, Animated,
} from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import * as ImageManipulator from 'expo-image-manipulator';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createPost } from '../../services/socialService';

const { width: SW, height: SH } = Dimensions.get('window');
const GRID_SIZE = (SW - 3) / 3;

// ── Colour helpers ────────────────────────────────────────────────────────────
const AVATAR_COLORS = [['#7C3AED','#A855F7'],['#DB2777','#EC4899'],['#059669','#10B981'],['#D97706','#F59E0B']];
function avatarColors(name = '') {
  const code = name && name.length > 0 ? name.charCodeAt(0) : 65;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}
function Avatar({ name = '', size = 40 }) {
  const cols = avatarColors(name);
  return (
    <LinearGradient colors={cols} style={{ width: size, height: size, borderRadius: size / 2, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.38 }}>{name[0]?.toUpperCase() || '?'}</Text>
    </LinearGradient>
  );
}

// ── Filter definitions (ImageManipulator adjustments) ─────────────────────────
const FILTERS = [
  { name: 'Normal',   actions: [] },
  { name: 'Vivid',    actions: [{ adjust: { saturation: 0.4 } }] },
  { name: 'Warm',     actions: [{ adjust: { saturation: 0.15 } }] },
  { name: 'Cool',     actions: [{ adjust: { saturation: -0.1 } }] },
  { name: 'B&W',      actions: [{ adjust: { saturation: -1 } }] },
  { name: 'Fade',     actions: [{ adjust: { saturation: -0.3 } }] },
];

// Feelings list
const FEELINGS = [
  { emoji: '🙏', label: 'Grateful'   },
  { emoji: '⚡', label: 'Energised'  },
  { emoji: '🌙', label: 'Reflective' },
  { emoji: '🌟', label: 'Hopeful'    },
  { emoji: '🪐', label: 'Challenged' },
  { emoji: '✨', label: 'Blessed'    },
  { emoji: '😊', label: 'Happy'      },
  { emoji: '🔥', label: 'Motivated'  },
];

const ZONE_COLOR = { 'Green Zone': '#10B981', 'Red Zone': '#EF4444', 'Neutral Zone': '#F59E0B' };

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1 — Media Picker (gallery grid + camera)
// ═══════════════════════════════════════════════════════════════════════════════
function MediaPicker({ onNext, onClose }) {
  const [assets, setAssets]         = useState([]);
  const [selected, setSelected]     = useState([]);
  const [mode, setMode]             = useState('gallery'); // 'gallery' | 'camera'
  const [cameraFacing, setFacing]   = useState('back');
  const [cameraMode, setCameraMode] = useState('picture'); // 'picture' | 'video'
  const [recording, setRecording]   = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [loadingAssets, setLoadingAssets] = useState(true);
  const [camPerm, requestCamPerm]   = useCameraPermissions();
  const [micPerm, requestMicPerm]   = useMicrophonePermissions();
  const [libPerm, requestLibPerm]   = MediaLibrary.usePermissions();
  const cameraRef  = useRef(null);
  const recTimer   = useRef(null);
  const topPad     = StatusBar.currentHeight || 0;

  // Recording timer
  useEffect(() => {
    if (recording) {
      setRecSeconds(0);
      recTimer.current = setInterval(() => setRecSeconds(s => s + 1), 1000);
    } else {
      clearInterval(recTimer.current);
    }
    return () => clearInterval(recTimer.current);
  }, [recording]);

  useEffect(() => {
    (async () => {
      if (!libPerm?.granted) await requestLibPerm();
      if (!micPerm?.granted) await requestMicPerm();
      loadGallery();
    })();
  }, []);

  const loadGallery = async () => {
    setLoadingAssets(true);
    try {
      const { assets: a } = await MediaLibrary.getAssetsAsync({
        first: 60,
        mediaType: ['photo', 'video'],
        sortBy: MediaLibrary.SortBy.creationTime,
      });
      setAssets(a);
      if (a.length > 0) setSelected([a[0]]); // auto-select first
    } catch {}
    setLoadingAssets(false);
  };

  const toggleSelect = (asset) => {
    if (selected.find(s => s.id === asset.id)) {
      setSelected(s => s.filter(x => x.id !== asset.id));
    } else if (selected.length < 10) {
      setSelected(s => [...s, asset]);
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      if (cameraMode === 'picture') {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.85, base64: false });
        setSelected([{ id: 'cam_' + Date.now(), uri: photo.uri, mediaType: 'photo', width: photo.width, height: photo.height }]);
        setMode('gallery');
      } else {
        if (recording) {
          cameraRef.current.stopRecording();
          setRecording(false);
        } else {
          setRecording(true);
          const video = await cameraRef.current.recordAsync({ maxDuration: 60 });
          setRecording(false);
          if (video) {
            setSelected([{ id: 'vid_' + Date.now(), uri: video.uri, mediaType: 'video' }]);
            setMode('gallery');
          }
        }
      }
    } catch (e) {
      setRecording(false);
      Alert.alert('Error', e.message);
    }
  };

  const handleNext = () => {
    if (selected.length === 0) { Alert.alert('Select at least one photo or video'); return; }
    onNext(selected);
  };

  // Preview — first selected
  const preview = selected[0];

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Header */}
      <View style={[mp.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={onClose} style={mp.headerBtn}>
          <Text style={mp.headerX}>✕</Text>
        </TouchableOpacity>
        <Text style={mp.headerTitle}>New Post</Text>
        <TouchableOpacity onPress={handleNext} style={mp.nextBtn}>
          <Text style={mp.nextTxt}>Next ›</Text>
        </TouchableOpacity>
      </View>

      {/* Mode toggle */}
      <View style={mp.modeRow}>
        {['gallery','camera'].map(m => (
          <TouchableOpacity key={m} onPress={() => {
            setMode(m);
            if (m === 'camera' && !camPerm?.granted) requestCamPerm();
          }} style={[mp.modeBtn, mode === m && mp.modeBtnActive]}>
            <Text style={[mp.modeTxt, mode === m && mp.modeTxtActive]}>
              {m === 'gallery' ? '🖼  Gallery' : '📷  Camera'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === 'gallery' ? (
        <>
          {/* Large preview */}
          <View style={mp.previewWrap}>
            {preview ? (
              <Image source={{ uri: preview.uri }} style={mp.preview} resizeMode="cover" />
            ) : (
              <View style={[mp.preview, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#555' }}>Select a photo or video</Text>
              </View>
            )}
            {selected.length > 1 && (
              <View style={mp.multiCount}>
                <Text style={mp.multiCountTxt}>{selected.length}</Text>
              </View>
            )}
          </View>

          {/* Controls row */}
          <View style={mp.galleryControls}>
            <Text style={mp.galleryLabel}>Recents</Text>
            <View style={mp.galleryRight}>
              <TouchableOpacity style={[mp.multiBtn, selected.length > 1 && mp.multiBtnActive]} onPress={() => {}}>
                <Text style={[mp.multiBtnTxt, selected.length > 1 && { color: '#fff' }]}>Select Multiple</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Grid */}
          {loadingAssets ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : (
            <FlatList
              data={assets}
              numColumns={3}
              keyExtractor={a => a.id}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: 1.5 }} />}
              renderItem={({ item }) => {
                const selIdx = selected.findIndex(s => s.id === item.id);
                const isSel  = selIdx >= 0;
                return (
                  <TouchableOpacity
                    style={{ width: GRID_SIZE, height: GRID_SIZE, marginRight: 1.5 }}
                    onPress={() => { toggleSelect(item); setSelected(p => p.length ? p : [item]); }}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: item.uri }} style={{ width: '100%', height: '100%' }} />
                    {item.mediaType === 'video' && (
                      <View style={mp.videoBadge}><Text style={mp.videoBadgeTxt}>▶</Text></View>
                    )}
                    {isSel && (
                      <View style={mp.selOverlay}>
                        <View style={mp.selBadge}><Text style={mp.selBadgeTxt}>{selIdx + 1}</Text></View>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </>
      ) : (
        /* ── Camera ── */
        <View style={{ flex: 1 }}>
          {camPerm?.granted ? (
            <>
              <CameraView
                ref={cameraRef}
                style={{ flex: 1 }}
                facing={cameraFacing}
                mode={cameraMode}
              />
              {/* Camera controls */}
              <View style={mp.camControls}>
                {/* Recording timer */}
                {recording && (
                  <View style={mp.recTimer}>
                    <View style={mp.recDot} />
                    <Text style={mp.recTimerTxt}>
                      {String(Math.floor(recSeconds / 60)).padStart(2,'0')}:{String(recSeconds % 60).padStart(2,'0')}
                    </Text>
                  </View>
                )}
                {/* Mode toggle photo/video */}
                <View style={mp.camModeRow}>
                  {['picture','video'].map(m => (
                    <TouchableOpacity key={m} onPress={() => setCameraMode(m)} style={[mp.camModeBtn, cameraMode === m && mp.camModeBtnActive]}>
                      <Text style={[mp.camModeTxt, cameraMode === m && { color: '#fff' }]}>
                        {m === 'picture' ? 'PHOTO' : 'VIDEO'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={mp.camRow}>
                  {/* Flip */}
                  <TouchableOpacity onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')} style={mp.camSideBtn}>
                    <Text style={{ fontSize: 24, color: '#fff' }}>🔄</Text>
                  </TouchableOpacity>
                  {/* Shutter */}
                  <TouchableOpacity onPress={handleCapture} style={[mp.shutter, recording && mp.shutterRecording]}>
                    {recording
                      ? <View style={mp.shutterStop} />
                      : <View style={[mp.shutterInner, cameraMode === 'video' && { backgroundColor: '#ED4956' }]} />
                    }
                  </TouchableOpacity>
                  {/* Gallery shortcut */}
                  <TouchableOpacity onPress={() => setMode('gallery')} style={mp.camSideBtn}>
                    {assets[0] ? (
                      <Image source={{ uri: assets[0].uri }} style={{ width: 40, height: 40, borderRadius: 6, borderWidth: 2, borderColor: '#fff' }} />
                    ) : (
                      <Text style={{ fontSize: 24, color: '#fff' }}>🖼</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
              <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center', paddingHorizontal: 40 }}>Camera permission is required</Text>
              <TouchableOpacity onPress={requestCamPerm} style={[mp.nextBtn, { paddingHorizontal: 24 }]}>
                <Text style={mp.nextTxt}>Allow Camera</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const mp = StyleSheet.create({
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 12, backgroundColor: '#000' },
  headerBtn:     { width: 44, alignItems: 'flex-start' },
  headerX:       { fontSize: 22, color: '#fff' },
  headerTitle:   { fontSize: 17, fontWeight: '700', color: '#fff' },
  nextBtn:       { backgroundColor: '#7C3AED', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 7 },
  nextTxt:       { color: '#fff', fontWeight: '700', fontSize: 14 },
  modeRow:       { flexDirection: 'row', backgroundColor: '#111', borderBottomWidth: 0.5, borderBottomColor: '#333' },
  modeBtn:       { flex: 1, paddingVertical: 12, alignItems: 'center' },
  modeBtnActive: { borderBottomWidth: 2, borderBottomColor: '#7C3AED' },
  modeTxt:       { color: '#888', fontSize: 13, fontWeight: '600' },
  modeTxtActive: { color: '#fff' },
  previewWrap:   { width: SW, height: SW * 0.75, backgroundColor: '#111', position: 'relative' },
  preview:       { width: '100%', height: '100%' },
  multiCount:    { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  multiCountTxt: { color: '#fff', fontWeight: '700', fontSize: 13 },
  galleryControls:{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#111' },
  galleryLabel:  { color: '#fff', fontWeight: '700', fontSize: 14 },
  galleryRight:  { flexDirection: 'row', gap: 8 },
  multiBtn:      { borderWidth: 1, borderColor: '#555', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  multiBtnActive:{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  multiBtnTxt:   { color: '#aaa', fontSize: 12, fontWeight: '600' },
  videoBadge:    { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  videoBadgeTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  selOverlay:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(124,58,237,0.25)' },
  selBadge:      { position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#fff' },
  selBadgeTxt:   { color: '#fff', fontSize: 11, fontWeight: '800' },
  camControls:   { backgroundColor: 'rgba(0,0,0,0.7)', paddingBottom: 30, paddingTop: 16 },
  recTimer:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 },
  recDot:        { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ED4956' },
  recTimerTxt:   { color: '#fff', fontSize: 18, fontWeight: '700', letterSpacing: 2, fontVariant: ['tabular-nums'] },
  camModeRow:    { flexDirection: 'row', justifyContent: 'center', gap: 24, marginBottom: 24 },
  camModeBtn:    { paddingVertical: 4, paddingHorizontal: 14 },
  camModeBtnActive:{ borderBottomWidth: 2, borderBottomColor: '#fff' },
  camModeTxt:    { color: '#888', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  camRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 20 },
  camSideBtn:    { width: 50, height: 50, justifyContent: 'center', alignItems: 'center' },
  shutter:       { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  shutterRecording:{ borderColor: '#ED4956' },
  shutterInner:  { width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff' },
  shutterStop:   { width: 28, height: 28, borderRadius: 6, backgroundColor: '#ED4956' },
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2 — Edit (crop ratio + filters)
// ═══════════════════════════════════════════════════════════════════════════════
function EditStep({ selected, onNext, onBack }) {
  const [filterIdx, setFilterIdx] = useState(0);
  const [aspect, setAspect]       = useState('square'); // 'square' | 'portrait' | 'landscape' | 'original'
  const [processing, setProcessing] = useState(false);

  const ASPECTS = [
    { key: 'square',    label: '1:1',   ratio: [1, 1]    },
    { key: 'portrait',  label: '4:5',   ratio: [4, 5]    },
    { key: 'landscape', label: '1.91:1',ratio: [1.91, 1] },
    { key: 'original',  label: 'Original', ratio: null   },
  ];

  const previewUri = selected[0]?.uri;
  const isVideo    = selected[0]?.mediaType === 'video';

  const previewH = aspect === 'portrait' ? SW * 1.25
                 : aspect === 'landscape' ? SW * 0.525
                 : SW;

  const handleNext = async () => {
    if (isVideo || filterIdx === 0) { onNext(selected, filterIdx, aspect); return; }
    setProcessing(true);
    try {
      const processed = await Promise.all(selected.map(async (asset) => {
        if (asset.mediaType === 'video') return asset;
        const result = await ImageManipulator.manipulateAsync(
          asset.uri,
          FILTERS[filterIdx].actions.length > 0 ? FILTERS[filterIdx].actions : [],
          { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
        );
        return { ...asset, uri: result.uri };
      }));
      onNext(processed, filterIdx, aspect);
    } catch {
      onNext(selected, filterIdx, aspect);
    }
    setProcessing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Header */}
      <View style={[es.header, { paddingTop: (StatusBar.currentHeight || 0) + 8 }]}>
        <TouchableOpacity onPress={onBack} style={mp.headerBtn}>
          <Text style={mp.headerX}>‹</Text>
        </TouchableOpacity>
        <Text style={mp.headerTitle}>Edit</Text>
        <TouchableOpacity onPress={handleNext} style={mp.nextBtn} disabled={processing}>
          {processing ? <ActivityIndicator size="small" color="#fff" /> : <Text style={mp.nextTxt}>Next ›</Text>}
        </TouchableOpacity>
      </View>

      {/* Preview */}
      <View style={[es.preview, { height: previewH }]}>
        {isVideo
          ? <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' }}>
              <Text style={{ color: '#fff', fontSize: 40 }}>▶</Text>
              <Text style={{ color: '#888', marginTop: 8 }}>Video preview</Text>
            </View>
          : <Image source={{ uri: previewUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        }
        {/* Multiple count badge */}
        {selected.length > 1 && (
          <View style={[mp.multiCount, { bottom: 12, right: 12, top: undefined }]}>
            <Text style={mp.multiCountTxt}>{selected.length} selected</Text>
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Aspect ratio row */}
        {!isVideo && (
          <View style={es.section}>
            <Text style={es.sectionTitle}>CROP</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
              {ASPECTS.map(a => (
                <TouchableOpacity key={a.key} onPress={() => setAspect(a.key)} style={[es.aspectBtn, aspect === a.key && es.aspectBtnActive]}>
                  <Text style={[es.aspectTxt, aspect === a.key && { color: '#fff' }]}>{a.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Filters */}
        {!isVideo && (
          <View style={es.section}>
            <Text style={es.sectionTitle}>FILTER</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
              {FILTERS.map((f, i) => (
                <TouchableOpacity key={f.name} onPress={() => setFilterIdx(i)} style={es.filterWrap}>
                  <View style={[es.filterThumb, filterIdx === i && es.filterThumbActive]}>
                    <Image source={{ uri: previewUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    {f.name === 'B&W' && <View style={es.bwOverlay} />}
                    {f.name === 'Fade' && <View style={es.fadeOverlay} />}
                    {f.name === 'Warm' && <View style={es.warmOverlay} />}
                    {f.name === 'Cool' && <View style={es.coolOverlay} />}
                    {f.name === 'Vivid' && <View style={es.vividOverlay} />}
                  </View>
                  <Text style={[es.filterName, filterIdx === i && { color: '#7C3AED' }]}>{f.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const es = StyleSheet.create({
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 12, backgroundColor: '#000' },
  preview:       { width: SW, backgroundColor: '#111' },
  section:       { paddingHorizontal: 14, paddingVertical: 14, borderTopWidth: 0.5, borderTopColor: '#222' },
  sectionTitle:  { color: '#888', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  aspectBtn:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: '#444', backgroundColor: '#111' },
  aspectBtnActive:{ backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  aspectTxt:     { color: '#aaa', fontSize: 12, fontWeight: '600' },
  filterWrap:    { alignItems: 'center', gap: 6, width: 72 },
  filterThumb:   { width: 72, height: 72, borderRadius: 8, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent' },
  filterThumbActive:{ borderColor: '#7C3AED' },
  filterName:    { color: '#aaa', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  bwOverlay:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', mixBlendMode: 'saturation' },
  fadeOverlay:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.25)' },
  warmOverlay:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,140,0,0.15)' },
  coolOverlay:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,100,255,0.12)' },
  vividOverlay:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(180,0,255,0.08)' },
});

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 3 — Caption & Details
// ═══════════════════════════════════════════════════════════════════════════════
function CaptionStep({ selected, onPost, onBack, loading }) {
  const [content, setContent]    = useState('');
  const [feeling, setFeeling]    = useState(null);
  const [location, setLocation]  = useState('');
  const [audience, setAudience]  = useState('Everyone');
  const [showFeelings, setShowF] = useState(false);
  const [profile, setProfile]    = useState({});
  const [dailyEnergy, setDE]     = useState({});
  const topPad = StatusBar.currentHeight || 0;

  useEffect(() => {
    (async () => {
      const ps = JSON.parse(await AsyncStorage.getItem('userProfile') || '{}');
      const de = JSON.parse(await AsyncStorage.getItem('@daily_energy') || '{}');
      setProfile(ps); setDE(de);
    })();
  }, []);

  const zone      = dailyEnergy?.zone || 'Neutral Zone';
  const nakshatra = dailyEnergy?.user_Chart?.nakshatra || '';
  const fullText  = content + (feeling ? `\n\nFeeling ${feeling.emoji} ${feeling.label}` : '') + (location ? `\n📍 ${location}` : '');

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* Header */}
      <View style={[cap.header, { paddingTop: topPad + 8 }]}>
        <TouchableOpacity onPress={onBack} style={{ width: 44 }}>
          <Text style={cap.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={cap.headerTitle}>New Post</Text>
        <TouchableOpacity onPress={() => onPost(fullText)} disabled={loading || (!content.trim() && selected.length === 0)} style={[cap.shareBtn, (!content.trim() && selected.length === 0) && { opacity: 0.4 }]}>
          {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={cap.shareTxt}>Share</Text>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: 80 }} keyboardShouldPersistTaps="handled">

          {/* Media preview row */}
          <View style={cap.mediaRow}>
            {/* Avatar + caption input */}
            <View style={cap.authorWrap}>
              <Avatar name={profile.name || 'You'} size={44} />
              <TextInput
                style={cap.captionInput}
                value={content}
                onChangeText={setContent}
                placeholder="Write a caption, add hashtags..."
                placeholderTextColor="#ABABAB"
                multiline
                maxLength={2200}
                autoFocus
              />
            </View>
            {/* Thumbnail */}
            {selected[0] && (
              <Image source={{ uri: selected[0].uri }} style={cap.thumb} resizeMode="cover" />
            )}
          </View>

          {/* Selected media strip */}
          {selected.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={cap.mediaStrip} contentContainerStyle={{ gap: 4, padding: 8 }}>
              {selected.map((a, i) => (
                <View key={i} style={cap.mediaStripItem}>
                  <Image source={{ uri: a.uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  {a.mediaType === 'video' && <View style={mp.videoBadge}><Text style={mp.videoBadgeTxt}>▶</Text></View>}
                </View>
              ))}
            </ScrollView>
          )}

          <View style={cap.divider} />

          {/* Cosmic context (auto-attached) */}
          <View style={cap.cosmicCard}>
            <Text style={cap.cosmicTitle}>🪐 Cosmic Context — auto attached</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginTop: 8 }}>
              {nakshatra && <View style={cap.chip}><Text style={cap.chipTxt}>🌙 {nakshatra}</Text></View>}
              {dailyEnergy?.moon_sign && <View style={cap.chip}><Text style={cap.chipTxt}>♋ {dailyEnergy.moon_sign}</Text></View>}
              {dailyEnergy?.user_Chart?.mahadasha && <View style={cap.chip}><Text style={cap.chipTxt}>⏳ {dailyEnergy.user_Chart.mahadasha} dasha</Text></View>}
              <View style={[cap.chip, { backgroundColor: (ZONE_COLOR[zone] || '#F59E0B') + '25' }]}>
                <Text style={[cap.chipTxt, { color: ZONE_COLOR[zone] || '#F59E0B', fontWeight: '700' }]}>{zone}</Text>
              </View>
            </ScrollView>
          </View>

          <View style={cap.divider} />

          {/* Option rows */}
          {[
            { icon: '😊', label: feeling ? `Feeling ${feeling.emoji} ${feeling.label}` : 'Add Feeling/Activity', onPress: () => setShowF(p => !p) },
            { icon: '📍', label: location || 'Add Location', onPress: () => Alert.alert('Location', 'Type your location below'), isInput: true },
            { icon: '🌍', label: audience, onPress: () => setAudience(a => a === 'Everyone' ? 'Followers' : 'Everyone') },
            { icon: '🪙', label: 'Earn 5 Dharma Coins', onPress: () => {}, accent: true },
          ].map((row, i) => (
            <TouchableOpacity key={i} style={cap.row} onPress={row.onPress} activeOpacity={0.7}>
              <Text style={cap.rowIcon}>{row.icon}</Text>
              {row.isInput
                ? <TextInput
                    style={[cap.rowTxt, { flex: 1 }]}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Add Location"
                    placeholderTextColor="#ABABAB"
                  />
                : <Text style={[cap.rowTxt, row.accent && { color: '#F59E0B', fontWeight: '700' }]}>{row.label}</Text>
              }
              {!row.isInput && <Text style={cap.rowChevron}>›</Text>}
            </TouchableOpacity>
          ))}

          {/* Feelings grid */}
          {showFeelings && (
            <View style={cap.feelingsPanel}>
              <View style={cap.feelingsGrid}>
                {FEELINGS.map(f => (
                  <TouchableOpacity
                    key={f.label}
                    style={[cap.feelingChip, feeling?.label === f.label && cap.feelingChipActive]}
                    onPress={() => { setFeeling(feeling?.label === f.label ? null : f); setShowF(false); }}
                  >
                    <Text style={{ fontSize: 18 }}>{f.emoji}</Text>
                    <Text style={cap.feelingLabel}>{f.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={cap.divider} />
          <Text style={cap.charCount}>{content.length} / 2,200</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const cap = StyleSheet.create({
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#E8E8E8', backgroundColor: '#fff' },
  backArrow:     { fontSize: 28, color: '#262626', lineHeight: 32 },
  headerTitle:   { fontSize: 17, fontWeight: '700', color: '#262626' },
  shareBtn:      { backgroundColor: '#7C3AED', borderRadius: 20, paddingHorizontal: 18, paddingVertical: 7 },
  shareTxt:      { color: '#fff', fontWeight: '700', fontSize: 14 },
  mediaRow:      { flexDirection: 'row', padding: 14, gap: 12, alignItems: 'flex-start' },
  authorWrap:    { flex: 1, flexDirection: 'row', gap: 10 },
  captionInput:  { flex: 1, fontSize: 15, color: '#262626', lineHeight: 22, minHeight: 80, textAlignVertical: 'top' },
  thumb:         { width: 80, height: 80, borderRadius: 8 },
  mediaStrip:    { maxHeight: 90 },
  mediaStripItem:{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden' },
  divider:       { height: 0.5, backgroundColor: '#E8E8E8', marginVertical: 4 },
  cosmicCard:    { margin: 14, backgroundColor: '#0D0829', borderRadius: 14, padding: 14 },
  cosmicTitle:   { fontSize: 12, fontWeight: '700', color: '#F4B942' },
  chip:          { backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  chipTxt:       { fontSize: 12, color: '#fff', fontWeight: '600' },
  row:           { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#F0F0F0' },
  rowIcon:       { fontSize: 18, marginRight: 12, width: 26, textAlign: 'center' },
  rowTxt:        { flex: 1, fontSize: 14, color: '#262626' },
  rowChevron:    { fontSize: 18, color: '#ABABAB' },
  feelingsPanel: { padding: 14 },
  feelingsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  feelingChip:   { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#fff' },
  feelingChipActive:{ borderColor: '#7C3AED', backgroundColor: '#F0EEFF' },
  feelingLabel:  { fontSize: 13, color: '#262626', fontWeight: '500' },
  charCount:     { fontSize: 11.5, color: '#ABABAB', textAlign: 'right', paddingHorizontal: 16, paddingVertical: 8 },
});

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN — orchestrates the 3 steps
// ═══════════════════════════════════════════════════════════════════════════════
export default function CreatePostScreen({ navigation }) {
  const [step, setStep]       = useState(1); // 1 | 2 | 3
  const [selected, setSelected] = useState([]);
  const [editedSelected, setEditedSelected] = useState([]);
  const [loading, setLoading] = useState(false);

  const handlePickerNext = useCallback((assets) => {
    setSelected(assets);
    setStep(2);
  }, []);

  const handleEditNext = useCallback((processedAssets) => {
    setEditedSelected(processedAssets);
    setStep(3);
  }, []);

  const handlePost = async (content) => {
    if (!content.trim() && editedSelected.length === 0) {
      Alert.alert('Add something first!');
      return;
    }
    setLoading(true);
    try {
      // Resolve localUri for MediaLibrary content:// assets (both photos and videos)
      const mediaUris   = [];
      const mediaTypes  = [];
      for (const asset of editedSelected) {
        let uri = asset.uri;
        const type = asset.mediaType || 'photo';
        // If content:// URI, get localUri via MediaLibrary
        if (uri && (uri.startsWith('content://') || !uri.startsWith('file://'))) {
          try {
            const info = await MediaLibrary.getAssetInfoAsync(asset.id || asset);
            if (info?.localUri) uri = info.localUri;
          } catch {}
        }
        if (uri) { mediaUris.push(uri); mediaTypes.push(type); }
      }
      await createPost({ content: content.trim(), mediaUris, mediaTypes });
      Alert.alert('Posted! 🌟', 'Your post is live. You earned 5 Dharma coins!', [
        { text: 'View Feed', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Post failed', e.message || 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) return <MediaPicker onNext={handlePickerNext} onClose={() => navigation.goBack()} />;
  if (step === 2) return <EditStep selected={selected} onNext={handleEditNext} onBack={() => setStep(1)} />;
  return <CaptionStep selected={editedSelected} onPost={handlePost} onBack={() => setStep(2)} loading={loading} />;
}
