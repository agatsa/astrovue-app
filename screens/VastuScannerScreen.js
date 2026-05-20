/**
 * VastuScannerScreen.js
 * AR Vastu Scanner — live camera + compass direction → zone overlay → GPT remedies
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, Animated, Dimensions, Platform, Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/constants';
import { auth } from '../config/firebase';

const { width: W, height: H } = Dimensions.get('window');

// ── Vastu direction data ──────────────────────────────────────────────────────
const VASTU_ZONES = {
  N:  { zone: 'Kubera',  deity: 'Lord Kubera',  element: 'Water', color: '#3b82f6', emoji: '💧',
        good: ['Main entrance', 'Living room', 'Career zone'], bad: ['Kitchen', 'Toilet', 'Heavy storage'] },
  NE: { zone: 'Ishanya', deity: 'Lord Shiva',   element: 'Space', color: '#8b5cf6', emoji: '🌌',
        good: ['Pooja room', 'Study', 'Water features', 'Open space'], bad: ['Toilet', 'Kitchen', 'Master bedroom'] },
  E:  { zone: 'Indra',   deity: 'Lord Indra',   element: 'Air',   color: '#10b981', emoji: '🌿',
        good: ['Living room', 'Main door', 'Children room', 'Garden'], bad: ['Toilet', 'Staircase'] },
  SE: { zone: 'Agni',    deity: 'Lord Agni',    element: 'Fire',  color: '#f97316', emoji: '🔥',
        good: ['Kitchen', 'Electrical equipment', 'Generator'], bad: ['Bedroom', 'Pooja room', 'Water tank'] },
  S:  { zone: 'Yama',    deity: 'Lord Yama',    element: 'Earth', color: '#ef4444', emoji: '⚠️',
        good: ['Heavy storage', 'Guest room'], bad: ['Main entrance', 'Pooja room', 'Children room'] },
  SW: { zone: 'Niriti',  deity: 'Nirriti',      element: 'Earth', color: '#92400e', emoji: '🏔️',
        good: ['Master bedroom', 'Safe/locker', 'Heavy furniture'], bad: ['Main entrance', 'Pooja room', 'Kitchen'] },
  W:  { zone: 'Varuna',  deity: 'Lord Varuna',  element: 'Water', color: '#0ea5e9', emoji: '🌊',
        good: ["Children's room", 'Dining room', 'Study'], bad: ['Main entrance', 'Pooja room'] },
  NW: { zone: 'Vayu',    deity: 'Lord Vayu',    element: 'Air',   color: '#6366f1', emoji: '🌬️',
        good: ['Guest room', 'Garage', 'Bathroom'], bad: ['Pooja room', 'Heavy storage'] },
};

const DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const DIR_DEGREES = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };

function degreeToDirection(deg) {
  const d = ((deg % 360) + 360) % 360;
  if (d >= 337.5 || d < 22.5)  return 'N';
  if (d < 67.5)                 return 'NE';
  if (d < 112.5)                return 'E';
  if (d < 157.5)                return 'SE';
  if (d < 202.5)                return 'S';
  if (d < 247.5)                return 'SW';
  if (d < 292.5)                return 'W';
  return 'NW';
}

// Shortest angular delta — always takes the ≤180° path (handles 359°→1° wrap)
function shortestDelta(from, to) {
  const d = ((to - from) % 360 + 360) % 360;
  return d > 180 ? d - 360 : d;
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function VastuScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [direction, setDirection]       = useState('N');
  const ringAnim      = useRef(new Animated.Value(0)).current; // ring rotation (degrees, cumulative)
  const ringDegRef    = useRef(0);   // tracks cumulative rotation to handle wrap correctly
  const headingDegRef = useRef(0);   // last calibrated heading (for calibration tap)
  const [captures, setCaptures]         = useState({}); // { N: { zone, photoUri, base64 }, ... }
  const [phase, setPhase]               = useState('calibrate'); // 'calibrate' | 'scan' | 'report'
  const [report, setReport]             = useState(null);
  const [loading, setLoading]           = useState(false);
  const [userProfile, setUserProfile]   = useState(null);
  const [calOffset, setCalOffset]       = useState(null);
  const [takingPhoto, setTakingPhoto]   = useState(false);
  const pulseAnim                       = useRef(new Animated.Value(1)).current;
  const subRef                          = useRef(null);
  const rawHeadingRef                   = useRef(0);
  const cameraRef                       = useRef(null);

  // Load user profile
  useEffect(() => {
    AsyncStorage.getItem('userProfile').then(s => {
      if (s) setUserProfile(JSON.parse(s));
    });
  }, []);

  // Pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // watchHeadingAsync — uses CLLocationManager on iOS, rotation vector on Android
  // Gives magHeading: 0–360° clockwise from magnetic north, already tilt-compensated
  const calOffsetRef = useRef(null);
  useEffect(() => { calOffsetRef.current = calOffset; }, [calOffset]);

  useEffect(() => {
    let sub = null;

    (async () => {
      // Request permission (needed on Android for heading)
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let smoothed         = -1;   // -1 = not yet initialised
      let lastAnimatedDeg  = 0;
      let lastDirectionDeg = 0;

      sub = await Location.watchHeadingAsync(({ magHeading, trueHeading, accuracy }) => {
        // acc=0 is uncalibrated — values jump 50-130°, completely unreliable
        if (accuracy < 1) return;

        // Use trueHeading if available (more accurate), else magHeading
        // Negate to correct for OPPO/Android devices that return counter-clockwise heading
        const rawH = ((trueHeading != null && trueHeading >= 0) ? trueHeading : magHeading);
        // Standard convention: 0°=N, 90°=E clockwise. Some Android devices return CCW — normalize:
        const h = (360 - rawH) % 360;

        // First reading — seed smoothed value and exit (no animation yet)
        if (smoothed < 0) {
          smoothed = h;
          rawHeadingRef.current = h;
          return;
        }

        // Outlier rejection — if reading jumps >25° from smoothed, it's sensor noise
        const jump = Math.abs(shortestDelta(smoothed, h));
        if (jump > 25) return;

        // Low-pass filter: α=0.2 → smooth but responsive (settles in ~1s)
        smoothed = (smoothed + 0.2 * shortestDelta(smoothed, h) + 360) % 360;
        rawHeadingRef.current = smoothed;

        const offset     = calOffsetRef.current;
        const calibrated = offset !== null
          ? ((smoothed - offset) % 360 + 360) % 360
          : smoothed;
        headingDegRef.current = calibrated;

        // Dead zone — don't animate for changes < 1°
        const moveDelta = Math.abs(shortestDelta(lastAnimatedDeg, (360 - calibrated) % 360));
        if (moveDelta < 1) return;
        lastAnimatedDeg = (360 - calibrated) % 360;

        // iOS-style ring animation
        const targetRingDeg = ringDegRef.current + shortestDelta(
          ((ringDegRef.current % 360) + 360) % 360,
          (360 - calibrated) % 360
        );
        ringDegRef.current = targetRingDeg;

        Animated.timing(ringAnim, {
          toValue:         targetRingDeg,
          duration:        150,   // smooth 150ms slide per degree — feels physical
          useNativeDriver: true,
        }).start();

        // Update direction label only when truly moving ≥ 3°
        const labelDelta = Math.abs(shortestDelta(lastDirectionDeg, calibrated));
        if (labelDelta >= 3 && offset !== null) {
          lastDirectionDeg = calibrated;
          setDirection(degreeToDirection(calibrated));
        }
      });
    })();

    return () => { sub?.remove(); };
  }, []);

  // Called when user taps a direction on the calibration screen
  const handleCalibrate = useCallback((chosenDir) => {
    const chosenDeg = DIR_DEGREES[chosenDir];
    // offset = raw magnetic heading when user tapped minus their chosen direction
    const offset = rawHeadingRef.current - chosenDeg;
    setCalOffset(offset);
    setPhase('scan');
  }, []);

  const currentZone = VASTU_ZONES[direction];
  const capturedCount = Object.keys(captures).length;

  const handleCapture = useCallback(async () => {
    if (captures[direction]) {
      Alert.alert('Already captured', `You have already captured ${direction}. Pan to a new direction.`);
      return;
    }
    if (!cameraRef.current) return;
    setTakingPhoto(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64:  true,
        quality: 0.35,   // keep size manageable for GPT Vision
        exif:    false,
      });
      setCaptures(prev => ({
        ...prev,
        [direction]: { ...currentZone, photoUri: photo.uri, base64: photo.base64 },
      }));
      Alert.alert(
        `${direction} captured`,
        `${currentZone.emoji} ${currentZone.zone} zone photo saved.\n\n${capturedCount + 1 >= 4 ? 'You can now generate your Vastu report!' : `Pan to next direction. (${capturedCount + 1}/8)`}`,
        [{ text: 'Continue' }]
      );
    } catch (e) {
      Alert.alert('Photo error', e.message || 'Could not take photo. Try again.');
    } finally {
      setTakingPhoto(false);
    }
  }, [direction, currentZone, captures, capturedCount]);

  const generateReport = async () => {
    if (capturedCount < 4) {
      Alert.alert('Scan more directions', 'Please capture at least 4 directions for an accurate report.');
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 45000); // 45s max
    try {
      // Get token safely with its own timeout
      let idToken = null;
      try {
        const tokenPromise = auth.currentUser?.getIdToken();
        const tokenRace    = Promise.race([
          tokenPromise,
          new Promise((_, rej) => setTimeout(() => rej(new Error('token timeout')), 5000)),
        ]);
        idToken = await tokenRace;
      } catch {
        // proceed without token — backend accepts unauthenticated for now
      }

      console.log('[Vastu] sending report request, captures:', Object.keys(captures).join(','));

      const res = await fetch(`${BASE_URL}/api/vastu-report`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          captures: Object.entries(captures).map(([dir, cap]) => ({
            direction: dir,
            zone:      cap.zone,
            element:   cap.element,
            image:     cap.base64 || null,
          })),
          profile: {
            name:     userProfile?.name || 'User',
            dob:      userProfile?.dob  || '',
            pob:      userProfile?.pob  || '',
            moonSign: userProfile?.moon_sign || '',
          },
        }),
      });

      console.log('[Vastu] response status:', res.status);
      const text = await res.text();
      console.log('[Vastu] raw response:', text.substring(0, 200));

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`Server returned ${res.status}. Check backend deployment.`);
      }
      if (data.error) throw new Error(data.error);
      setReport(data);
      setPhase('report');
    } catch (e) {
      const msg = e.name === 'AbortError'
        ? 'Request timed out (45s). The AI is taking too long — try with fewer zones or check your connection.'
        : (e.message || 'Could not generate report. Try again.');
      Alert.alert('Vastu Report Error', msg);
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  // ── Permission gate ─────────────────────────────────────────────────────────
  if (!permission) return <View style={s.center}><ActivityIndicator color="#a78bfa" /></View>;

  if (!permission.granted) {
    return (
      <View style={s.center}>
        <Text style={s.permText}>{"📷 Camera access needed for Vastu Scanner"}</Text>
        <TouchableOpacity style={s.permBtn} onPress={requestPermission}>
          <Text style={s.permBtnTxt}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Calibration screen ──────────────────────────────────────────────────────
  if (phase === 'calibrate') {
    const CAL_DIRS = [
      ['NW', 'N', 'NE'],
      ['W',  '',  'E' ],
      ['SW', 'S', 'SE'],
    ];
    return (
      <View style={s.calRoot}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>{"← Back"}</Text>
        </TouchableOpacity>
        <Text style={s.calTitle}>{"🧭 Set Your Starting Direction"}</Text>
        <Text style={s.calSub}>{"Stand and face any wall or landmark whose direction you know (e.g. your main door, a window facing East)."}{"\n\n"}{"Tap the direction you are currently facing."}</Text>

        {/* 3×3 compass grid */}
        <View style={s.calGrid}>
          {CAL_DIRS.map((row, ri) => (
            <View key={ri} style={s.calRow}>
              {row.map((d, ci) => d ? (
                <TouchableOpacity
                  key={ci}
                  style={[s.calBtn, { borderColor: VASTU_ZONES[d]?.color || '#7c3aed' }]}
                  onPress={() => handleCalibrate(d)}
                  activeOpacity={0.75}
                >
                  <Text style={s.calBtnEmoji}>{VASTU_ZONES[d]?.emoji}</Text>
                  <Text style={s.calBtnDir}>{d}</Text>
                  <Text style={s.calBtnZone}>{VASTU_ZONES[d]?.zone}</Text>
                </TouchableOpacity>
              ) : (
                <View key={ci} style={s.calCenter}>
                  <Text style={s.calCenterTxt}>{"📍\nYou"}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        <Text style={s.calHint}>{"Tip: Use a physical compass or Google Maps to confirm your direction before tapping."}</Text>
      </View>
    );
  }

  // ── Report view ─────────────────────────────────────────────────────────────
  if (phase === 'report' && report) {
    return (
      <ScrollView style={s.reportRoot} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={s.reportTitle}>🏠 Your Vastu Report</Text>
        <Text style={s.reportSub}>Personalised for {userProfile?.name || 'you'}</Text>

        {/* Overall score */}
        <View style={[s.scoreCard, { borderColor: report.score >= 70 ? '#22c55e' : report.score >= 50 ? '#f59e0b' : '#ef4444' }]}>
          <Text style={s.scoreLabel}>Vastu Score</Text>
          <Text style={[s.scoreVal, { color: report.score >= 70 ? '#22c55e' : report.score >= 50 ? '#f59e0b' : '#ef4444' }]}>
            {report.score}/100
          </Text>
          <Text style={s.scoreDesc}>{report.overall}</Text>
        </View>

        {/* Per-direction results with photos */}
        {report.zones?.map((z, i) => {
          const photoUri = captures[z.direction]?.photoUri;
          const statusColor = z.status === 'good' ? '#22c55e' : z.status === 'warning' ? '#f59e0b' : '#ef4444';
          return (
            <View key={i} style={[s.zoneCard, { borderLeftColor: VASTU_ZONES[z.direction]?.color || '#6b7280' }]}>
              <View style={s.zoneHeader}>
                <Text style={s.zoneDir}>{VASTU_ZONES[z.direction]?.emoji} {z.direction} — {z.zone}</Text>
                <View style={[s.zoneBadge, { backgroundColor: statusColor + '20' }]}>
                  <Text style={[s.zoneBadgeTxt, { color: statusColor }]}>
                    {z.status === 'good' ? '✅ Good' : z.status === 'warning' ? '⚠️ Attention' : '❌ Issue'}
                  </Text>
                </View>
              </View>

              {/* Photo + AI visual analysis */}
              {photoUri && (
                <View style={s.photoRow}>
                  <Image source={{ uri: photoUri }} style={s.zonePhoto} />
                  <View style={s.photoAnalysis}>
                    {z.items_found?.length > 0 && (
                      <>
                        <Text style={s.photoAnalysisHead}>{"👁 Detected"}</Text>
                        {z.items_found.map((item, j) => (
                          <Text key={j} style={s.photoAnalysisItem}>{"• " + item}</Text>
                        ))}
                      </>
                    )}
                    {z.items_to_remove?.length > 0 && (
                      <>
                        <Text style={[s.photoAnalysisHead, { color: '#ef4444', marginTop: 6 }]}>{"❌ Remove"}</Text>
                        {z.items_to_remove.map((item, j) => (
                          <Text key={j} style={[s.photoAnalysisItem, { color: '#fca5a5' }]}>{"• " + item}</Text>
                        ))}
                      </>
                    )}
                    {z.items_to_add?.length > 0 && (
                      <>
                        <Text style={[s.photoAnalysisHead, { color: '#22c55e', marginTop: 6 }]}>{"✅ Add"}</Text>
                        {z.items_to_add.map((item, j) => (
                          <Text key={j} style={[s.photoAnalysisItem, { color: '#86efac' }]}>{"• " + item}</Text>
                        ))}
                      </>
                    )}
                  </View>
                </View>
              )}

              <Text style={s.zoneRoom}>{"Room: " + z.room_type}</Text>
              <Text style={s.zoneAnalysis}>{z.analysis}</Text>
              {z.remedy ? <Text style={s.zoneRemedy}>{"💡 " + z.remedy}</Text> : null}
            </View>
          );
        })}

        {/* Personal remedies */}
        {report.personal_remedies?.length > 0 && (
          <View style={s.remedySection}>
            <Text style={s.remedyTitle}>🔮 Personalised Remedies</Text>
            <Text style={s.remedySub}>Based on your birth chart</Text>
            {report.personal_remedies.map((r, i) => (
              <View key={i} style={s.remedyItem}>
                <Text style={s.remedyBullet}>•</Text>
                <Text style={s.remedyTxt}>{r}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Priority action */}
        {report.priority_action && (
          <View style={s.priorityCard}>
            <Text style={s.priorityLabel}>🎯 Most Important Action</Text>
            <Text style={s.priorityTxt}>{report.priority_action}</Text>
          </View>
        )}

        <TouchableOpacity style={s.rescanBtn} onPress={() => { setPhase('calibrate'); setCaptures({}); setReport(null); setCalOffset(null); }}>
          <Text style={s.rescanTxt}>🔄 Scan Again</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ── Scanner view ────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      {/* Camera */}
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      {/* Dark overlay — top */}
      <View style={s.topOverlay}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backTxt}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={s.screenTitle}>Vastu Scanner</Text>
        <Text style={s.captureCount}>{capturedCount}/8</Text>
      </View>

      {/* Direction zone card */}
      <View style={s.zoneOverlay}>
        <View style={[s.dirBubble, { borderColor: currentZone.color }]}>
          <Text style={[s.dirLabel, { color: currentZone.color }]}>{direction}</Text>
          <Text style={[s.dirDeg, { color: currentZone.color + 'aa' }]}>{currentZone.zone}</Text>
        </View>
        <View style={[s.zoneInfoCard, { borderColor: currentZone.color + '60' }]}>
          <Text style={s.zoneTitle}>{currentZone.emoji} {currentZone.zone} Zone</Text>
          <Text style={s.zoneDeity}>{currentZone.deity} · {currentZone.element} element</Text>
          <View style={s.listsRow}>
            <View style={s.listCol}>
              <Text style={s.listHead}>✅ Good for</Text>
              {currentZone.good.slice(0, 2).map((g, i) => <Text key={i} style={s.listItem}>• {g}</Text>)}
            </View>
            <View style={s.listCol}>
              <Text style={s.listHead}>❌ Avoid</Text>
              {currentZone.bad.slice(0, 2).map((b, i) => <Text key={i} style={s.listItem}>• {b}</Text>)}
            </View>
          </View>
        </View>
      </View>

      {/* iOS-style compass rose — ring rotates, arrow stays fixed */}
      <View style={s.compassArea}>
        {/* Rotating ring with direction labels */}
        <Animated.View style={[s.compassRing, {
          transform: [{
            rotate: ringAnim.interpolate({
              inputRange:   [-7200, 7200],
              outputRange:  ['-7200deg', '7200deg'],
              extrapolate:  'extend',
            }),
          }],
        }]}>
          {DIRECTIONS.map((d, i) => {
            const rad = (i * 45) * (Math.PI / 180);
            const r   = 52;
            const cx  = r * Math.sin(rad);
            const cy  = -r * Math.cos(rad);
            const captured = !!captures[d];
            const isN      = d === 'N';
            return (
              <View key={d} style={[s.compassDot, {
                transform:       [{ translateX: cx }, { translateY: cy }],
                backgroundColor: captured ? '#22c55e' : isN ? '#ef4444' : '#ffffff20',
                borderColor:     captured ? '#22c55e' : isN ? '#ef4444' : '#ffffff40',
              }]}>
                <Text style={[s.compassDotTxt, {
                  color:      captured ? '#fff' : isN ? '#fff' : '#ffffffcc',
                  fontWeight: isN ? '900' : '600',
                }]}>{captured ? '📸' : d}</Text>
              </View>
            );
          })}
        </Animated.View>

        {/* Fixed upward triangle — always points to where phone faces */}
        <View style={s.compassArrowWrap}>
          <Text style={[s.compassArrowTxt, { color: currentZone.color }]}>▲</Text>
        </View>
        <View style={s.compassCenter} />
      </View>

      {/* Bottom controls */}
      <View style={s.bottomBar}>
        {/* Captured direction thumbnails */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.chipsRow} contentContainerStyle={{ paddingHorizontal: 4 }}>
          {DIRECTIONS.map(d => (
            <View key={d} style={[s.chip, captures[d] ? { borderColor: '#22c55e', padding: 2 } : { borderColor: '#ffffff30' }]}>
              {captures[d]?.photoUri
                ? <Image source={{ uri: captures[d].photoUri }} style={s.chipThumb} />
                : null
              }
              <Text style={[s.chipTxt, captures[d] && { color: '#22c55e' }]}>{d}{captures[d] ? ' 📸' : ''}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Capture / shutter button */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[s.captureBtn, { borderColor: captures[direction] ? '#22c55e' : currentZone.color }]}
            onPress={handleCapture}
            disabled={takingPhoto}
            activeOpacity={0.8}
          >
            {takingPhoto
              ? <ActivityIndicator color="#fff" size="small" />
              : captures[direction]
                ? <Text style={{ fontSize: 22 }}>{"✓"}</Text>
                : <View style={[s.captureBtnInner, { backgroundColor: currentZone.color }]} />
            }
          </TouchableOpacity>
        </Animated.View>
        <Text style={s.captureHint}>
          {takingPhoto ? "Taking photo..." : captures[direction] ? `📸 ${direction} photo saved` : `Tap to photograph ${direction}`}
        </Text>

        {/* Generate report button */}
        {capturedCount >= 4 && (
          <TouchableOpacity style={s.reportBtn} onPress={generateReport} disabled={loading || takingPhoto}>
            {loading
              ? <><ActivityIndicator color="#fff" /><Text style={[s.reportBtnTxt, { marginLeft: 8 }]}>{"Analysing with AI Vision..."}</Text></>
              : <Text style={s.reportBtnTxt}>{`✨ Generate Vastu Report (${capturedCount} photos)`}</Text>
            }
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#000' },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f0f0f', padding: 24 },
  permText:     { color: '#e2e8f0', fontSize: 16, textAlign: 'center', marginBottom: 20 },
  permBtn:      { backgroundColor: '#7c3aed', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  permBtnTxt:   { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Calibration screen
  calRoot:      { flex: 1, backgroundColor: '#0a0a1a', padding: 24, paddingTop: 60 },
  calTitle:     { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 12 },
  calSub:       { color: '#94a3b8', fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  calGrid:      { alignItems: 'center', marginBottom: 28 },
  calRow:       { flexDirection: 'row', marginBottom: 10 },
  calBtn:       { width: 88, height: 88, borderRadius: 16, borderWidth: 2, backgroundColor: '#1e1b4b',
                  justifyContent: 'center', alignItems: 'center', marginHorizontal: 5 },
  calBtnEmoji:  { fontSize: 22 },
  calBtnDir:    { color: '#fff', fontSize: 16, fontWeight: '900', marginTop: 2 },
  calBtnZone:   { color: '#94a3b8', fontSize: 9, marginTop: 1 },
  calCenter:    { width: 88, height: 88, borderRadius: 16, backgroundColor: '#1e293b',
                  justifyContent: 'center', alignItems: 'center', marginHorizontal: 5 },
  calCenterTxt: { color: '#64748b', fontSize: 13, textAlign: 'center', lineHeight: 18 },
  calHint:      { color: '#475569', fontSize: 12, textAlign: 'center', lineHeight: 18, paddingHorizontal: 16 },

  // Top overlay
  topOverlay:   { position: 'absolute', top: 0, left: 0, right: 0, paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16,
                  flexDirection: 'row', alignItems: 'center', backgroundColor: '#00000080' },
  backBtn:      { marginRight: 12, paddingVertical: 8 },
  backTxt:      { color: '#fff', fontSize: 16, fontWeight: '600' },
  screenTitle:  { flex: 1, color: '#fff', fontSize: 18, fontWeight: '700' },
  captureCount: { color: '#a78bfa', fontSize: 16, fontWeight: '700' },

  // Zone overlay
  zoneOverlay:  { position: 'absolute', top: 110, left: 16, right: 16 },
  dirBubble:    { alignItems: 'center', alignSelf: 'center',
                  backgroundColor: '#000000aa', borderWidth: 2, borderRadius: 20,
                  paddingHorizontal: 24, paddingVertical: 10, marginBottom: 10 },
  dirLabel:     { fontSize: 28, fontWeight: '900' },
  dirDeg:       { fontSize: 11, fontWeight: '600', marginTop: 2 },
  zoneInfoCard: { backgroundColor: '#000000cc', borderWidth: 1, borderRadius: 16, padding: 14 },
  zoneTitle:    { color: '#fff', fontSize: 17, fontWeight: '800', marginBottom: 2 },
  zoneDeity:    { color: '#94a3b8', fontSize: 12, marginBottom: 10 },
  listsRow:     { flexDirection: 'row', gap: 12 },
  listCol:      { flex: 1 },
  listHead:     { color: '#cbd5e1', fontSize: 11, fontWeight: '700', marginBottom: 4 },
  listItem:     { color: '#e2e8f0', fontSize: 12, marginBottom: 2 },

  // Compass
  compassArea:      { position: 'absolute', bottom: 220, alignSelf: 'center',
                      width: 130, height: 130, justifyContent: 'center', alignItems: 'center' },
  compassRing:      { position: 'absolute', width: 130, height: 130,
                      justifyContent: 'center', alignItems: 'center' },
  compassDot:       { position: 'absolute', width: 30, height: 30, borderRadius: 15,
                      justifyContent: 'center', alignItems: 'center', borderWidth: 1.5 },
  compassDotTxt:    { fontSize: 9, fontWeight: '700' },
  compassArrowWrap: { position: 'absolute', alignItems: 'center', justifyContent: 'flex-start',
                      height: 40, top: -20 },
  compassArrowTxt:  { fontSize: 18, fontWeight: '900' },
  compassCenter:    { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },

  // Bottom
  bottomBar:    { position: 'absolute', bottom: 0, left: 0, right: 0,
                  backgroundColor: '#000000dd', paddingBottom: 36, paddingTop: 16, paddingHorizontal: 20,
                  alignItems: 'center' },
  chipsRow:     { marginBottom: 14 },
  chip:         { borderRadius: 12, borderWidth: 1, marginRight: 8,
                  backgroundColor: '#ffffff10', alignItems: 'center', overflow: 'hidden', minWidth: 44 },
  chipThumb:    { width: 44, height: 36, borderRadius: 8, marginBottom: 2 },
  chipTxt:      { color: '#fff', fontSize: 10, fontWeight: '600', paddingHorizontal: 6, paddingBottom: 4 },
  captureBtn:   { width: 64, height: 64, borderRadius: 32, borderWidth: 3,
                  justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  captureBtnInner: { width: 46, height: 46, borderRadius: 23 },
  captureHint:  { color: '#94a3b8', fontSize: 13, marginBottom: 12 },
  reportBtn:    { backgroundColor: '#7c3aed', paddingHorizontal: 28, paddingVertical: 14,
                  borderRadius: 14, width: '100%', alignItems: 'center' },
  reportBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Report
  reportRoot:   { flex: 1, backgroundColor: '#0f0f1a' },
  reportTitle:  { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 4 },
  reportSub:    { color: '#94a3b8', fontSize: 14, marginBottom: 20 },
  scoreCard:    { backgroundColor: '#1e1b4b', borderWidth: 2, borderRadius: 16, padding: 20,
                  alignItems: 'center', marginBottom: 20 },
  scoreLabel:   { color: '#a78bfa', fontSize: 13, fontWeight: '600', marginBottom: 4 },
  scoreVal:     { fontSize: 52, fontWeight: '900', marginBottom: 6 },
  scoreDesc:    { color: '#cbd5e1', fontSize: 14, textAlign: 'center' },
  zoneCard:     { backgroundColor: '#1e1e2e', borderRadius: 12, padding: 14, marginBottom: 12, borderLeftWidth: 4 },
  zoneHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  zoneDir:      { color: '#fff', fontSize: 14, fontWeight: '700', flex: 1 },
  zoneBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  zoneBadgeTxt: { fontSize: 11, fontWeight: '700' },
  zoneRoom:        { color: '#94a3b8', fontSize: 12, marginBottom: 6 },
  zoneAnalysis:    { color: '#e2e8f0', fontSize: 13, lineHeight: 19, marginBottom: 6 },
  zoneRemedy:      { color: '#a78bfa', fontSize: 13, fontStyle: 'italic' },
  photoRow:        { flexDirection: 'row', marginBottom: 10, gap: 10 },
  zonePhoto:       { width: 100, height: 100, borderRadius: 10, backgroundColor: '#1e293b' },
  photoAnalysis:   { flex: 1, justifyContent: 'flex-start' },
  photoAnalysisHead:{ color: '#94a3b8', fontSize: 10, fontWeight: '700', marginBottom: 2 },
  photoAnalysisItem:{ color: '#cbd5e1', fontSize: 11, lineHeight: 16 },
  remedySection:{ backgroundColor: '#1a1333', borderRadius: 16, padding: 16, marginBottom: 16 },
  remedyTitle:  { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 2 },
  remedySub:    { color: '#94a3b8', fontSize: 12, marginBottom: 12 },
  remedyItem:   { flexDirection: 'row', marginBottom: 8 },
  remedyBullet: { color: '#a78bfa', fontSize: 16, marginRight: 8, marginTop: -1 },
  remedyTxt:    { color: '#e2e8f0', fontSize: 13, lineHeight: 19, flex: 1 },
  priorityCard: { backgroundColor: '#1f1235', borderWidth: 1, borderColor: '#7c3aed',
                  borderRadius: 16, padding: 16, marginBottom: 20 },
  priorityLabel:{ color: '#a78bfa', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  priorityTxt:  { color: '#fff', fontSize: 14, lineHeight: 21 },
  rescanBtn:    { backgroundColor: '#1e1e2e', padding: 16, borderRadius: 14, alignItems: 'center' },
  rescanTxt:    { color: '#a78bfa', fontWeight: '700', fontSize: 15 },
});
