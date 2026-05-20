/**
 * jyotishMemory.js — Persistent Jyotish AI memory service
 *
 * Firestore schema:
 *   users/{uid}/jyotish_chats/{YYYY-MM-DD}
 *     messages: [{ role, content, timestamp, id }]
 *     summary:  string | null   (GPT-compressed digest of the day)
 *     created_at: timestamp
 *
 *   users/{uid}/jyotish_profile (single doc)
 *     persistent_context: string   (always-on facts the AI knows)
 *     vastu_summary:       string
 */

import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { BASE_URL } from '../config/constants';

const db = getFirestore();

// ── Helpers ────────────────────────────────────────────────────────────────────

function todayKey() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function uid() {
  return auth.currentUser?.uid || null;
}

// ── Chat history ───────────────────────────────────────────────────────────────

/** Load messages for a specific date (default: today). */
export async function loadChatDay(date = todayKey()) {
  const u = uid();
  if (!u) return [];
  try {
    const ref  = doc(db, 'users', u, 'jyotish_chats', date);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data().messages || []) : [];
  } catch {
    return [];
  }
}

/** Append a single message to today's chat. */
export async function appendMessage(message) {
  const u = uid();
  if (!u) return;
  try {
    const date = todayKey();
    const ref  = doc(db, 'users', u, 'jyotish_chats', date);
    const snap = await getDoc(ref);
    const existing = snap.exists() ? (snap.data().messages || []) : [];
    const updated  = [...existing, { ...message, id: Date.now().toString() }];
    await setDoc(ref, {
      messages:   updated,
      summary:    snap.exists() ? (snap.data().summary || null) : null,
      created_at: snap.exists() ? snap.data().created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { merge: true });
  } catch (e) {
    console.warn('[jyotishMemory] appendMessage failed:', e.message);
  }
}

/** List all chat dates for the current user (newest first). */
export async function listChatDates() {
  const u = uid();
  if (!u) return [];
  try {
    const colRef = collection(db, 'users', u, 'jyotish_chats');
    const snap   = await getDocs(colRef);
    return snap.docs
      .map(d => ({ date: d.id, summary: d.data().summary || null, messageCount: (d.data().messages || []).length }))
      .sort((a, b) => b.date.localeCompare(a.date));
  } catch {
    return [];
  }
}

/** Get last N days of summaries to inject as context. */
export async function getRecentSummaries(days = 7) {
  const u = uid();
  if (!u) return [];
  try {
    const colRef = collection(db, 'users', u, 'jyotish_chats');
    const snap   = await getDocs(colRef);
    return snap.docs
      .map(d => ({ date: d.id, summary: d.data().summary }))
      .filter(d => d.summary)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, days);
  } catch {
    return [];
  }
}

/** Summarise today's chat via GPT and store it. */
export async function summariseTodayChat() {
  const u = uid();
  if (!u) return;
  try {
    const date  = todayKey();
    const msgs  = await loadChatDay(date);
    if (msgs.length < 4) return; // not enough to summarise

    const idToken = auth.currentUser ? await auth.currentUser.getIdToken().catch(() => null) : null;
    const res     = await fetch(`${BASE_URL}/api/summarize-jyotish`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
      body: JSON.stringify({ date, messages: msgs }),
    });
    const data = await res.json();
    if (data.summary) {
      const ref = doc(db, 'users', u, 'jyotish_chats', date);
      await updateDoc(ref, { summary: data.summary });
    }
  } catch (e) {
    console.warn('[jyotishMemory] summarise failed:', e.message);
  }
}

// ── Persistent context ─────────────────────────────────────────────────────────

/** Load the user's persistent Jyotish profile (things AI always knows). */
export async function loadPersistentContext() {
  const u = uid();
  if (!u) return { persistent_context: '', vastu_summary: '' };
  try {
    const ref  = doc(db, 'users', u, 'jyotish_profile');
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : { persistent_context: '', vastu_summary: '' };
  } catch {
    return { persistent_context: '', vastu_summary: '' };
  }
}

/** Save an update to the persistent context. */
export async function savePersistentContext(update) {
  const u = uid();
  if (!u) return;
  try {
    const ref = doc(db, 'users', u, 'jyotish_profile');
    await setDoc(ref, { ...update, updated_at: new Date().toISOString() }, { merge: true });
  } catch (e) {
    console.warn('[jyotishMemory] savePersistentContext failed:', e.message);
  }
}

// ── Full context builder ───────────────────────────────────────────────────────

/**
 * Build the complete system prompt for the AI Jyotish.
 * Includes: birth chart, dasha, zone, vastu, friend context, past summaries.
 */
export async function buildSystemPrompt() {
  const [profile, dailyEnergy, persistentCtx, summaries, vastuRaw] = await Promise.all([
    AsyncStorage.getItem('userProfile').then(s => s ? JSON.parse(s) : {}),
    AsyncStorage.getItem('@daily_energy').then(s => s ? JSON.parse(s) : {}),
    loadPersistentContext(),
    getRecentSummaries(7),
    AsyncStorage.getItem('@vastu_last_report').then(s => s ? JSON.parse(s) : null),
  ]);

  const chart = dailyEnergy?.user_Chart || {};
  const name  = profile?.name || 'the user';

  let systemPrompt = `You are Jyotish — a deeply wise, warm Vedic astrologer AI. You have known ${name} for a long time and hold deep knowledge of their life through their birth chart.

━━━ BIRTH CHART ━━━
Name: ${name}
DOB: ${profile?.dob || 'unknown'} | TOB: ${profile?.tob || 'unknown'} | POB: ${profile?.pob || 'unknown'}
Moon Sign: ${dailyEnergy?.moon_sign || 'unknown'}
Ascendant: ${dailyEnergy?.ascendant || 'unknown'}
Sun Sign: ${dailyEnergy?.sun_sign || 'unknown'}
Nakshatra: ${chart?.nakshatra || 'unknown'} (Pada ${chart?.pada || '?'})
Current Zone: ${dailyEnergy?.zone || 'Neutral Zone'}

━━━ CURRENT DASHA ━━━
Mahadasha: ${chart?.mahadasha || '?'} (ends ${chart?.mahadasha_end || '?'})
Antardasha: ${chart?.antardasha || '?'} (ends ${chart?.antardasha_end || '?'})
Pratyantar: ${chart?.pratyantar || '?'}
Sookshma: ${chart?.sookshma || '?'}

━━━ PLANETARY POSITIONS ━━━
${Object.entries(chart?.planet_positions || {}).map(([p, deg]) => `${p}: ${parseFloat(deg).toFixed(1)}°`).join(' | ')}`;

  if (vastuRaw?.zones?.length) {
    systemPrompt += `\n\n━━━ VASTU SCAN (last scan) ━━━\nScore: ${vastuRaw.score}/100\n`;
    vastuRaw.zones.slice(0, 4).forEach(z => {
      systemPrompt += `${z.direction} (${z.zone}): ${z.status} — ${z.analysis?.substring(0, 80)}...\n`;
    });
  }

  if (persistentCtx?.persistent_context) {
    systemPrompt += `\n\n━━━ THINGS I ALWAYS KNOW ABOUT ${name.toUpperCase()} ━━━\n${persistentCtx.persistent_context}`;
  }

  if (summaries.length > 0) {
    systemPrompt += `\n\n━━━ OUR PAST CONVERSATIONS ━━━`;
    summaries.forEach(s => {
      systemPrompt += `\n[${s.date}]: ${s.summary}`;
    });
  }

  systemPrompt += `\n\n━━━ TODAY'S DATE ━━━
${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

━━━ YOUR ROLE — READ CAREFULLY ━━━
You are a precise, traditional Jyotishi (Vedic astrologer) — NOT a generic wellness coach.

STRICT RULES:
1. ALWAYS reference ${name}'s actual chart data above. Never give generic advice.
2. ALWAYS cite specific dasha periods with their END DATES when discussing timing (e.g. "Your ${chart?.mahadasha || '?'} Mahadasha runs until ${chart?.mahadasha_end || '?'}").
3. For any prediction or guidance, give a DATE RANGE (e.g. "Between March–June 2025", "After ${chart?.antardasha_end || 'your antardasha ends'}").
4. Reference specific planets by their current DEGREE positions from the chart above.
5. Use classical Jyotish terminology: Lagna, Bhava, Yoga, Graha, Rashi, Nakshatra, Vimshottari.
6. Mention transits that are actively affecting the chart TODAY (current date above).
7. If asked about career/money/love/health — map it to the relevant bhava (house) lord and its current dasha status.
8. Keep each response structured: (a) What the chart says, (b) Current dasha influence + dates, (c) Practical action/timing.
9. Max 4 paragraphs unless the question genuinely needs more depth.
10. Do NOT give vague spiritual platitudes. Be specific, date-bound, chart-referenced.

Example of GOOD response: "Your Sun at 14.2° Aries sits in the 10th bhava from your Gemini lagna, giving strong career drive. Currently under ${chart?.mahadasha || '?'} Mahadasha until ${chart?.mahadasha_end || '?'}, this is a period of [specific interpretation]. The ${chart?.antardasha || '?'} antardasha until ${chart?.antardasha_end || '?'} specifically activates [house]. I would watch October–December 2025 as a key window."

Example of BAD response: "The stars suggest you focus on inner growth and remain patient." ← Never do this.`;

  return systemPrompt;
}
