/**
 * AiJyotishScreen — Persistent AI Vedic Astrologer
 * Full Kundli context + daily chat history + cross-session memory
 * ChatGPT-style: conversations grouped by day, persistent forever
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
  SafeAreaView, Modal, ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../config/firebase';
import { BASE_URL } from '../config/constants';
import { colors, spacing, radius, typography, shadows, gradients } from '../config/theme';
import {
  loadChatDay, appendMessage, listChatDates, summariseTodayChat,
  buildSystemPrompt, savePersistentContext, loadPersistentContext,
} from '../services/jyotishMemory';

const QUICK_QUESTIONS = [
  'What does my current Dasha mean for my career?',
  'Is this a good time to make a major investment?',
  'Why do I feel emotionally drained lately?',
  'Best days this week for important decisions?',
  'What does my Moon sign say about my relationships?',
  'How does my Rahu placement affect my life path?',
];

function todayKey() { return new Date().toISOString().split('T')[0]; }
function formatDate(d) {
  const dt = new Date(d);
  const today = new Date();
  const diff  = Math.floor((today - dt) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AiJyotishScreen({ navigation }) {
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [initialising, setInit]       = useState(true);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [chatDates, setChatDates]     = useState([]);
  const [selectedDate, setDate]       = useState(todayKey());
  const [sidebarOpen, setSidebar]     = useState(false);
  const [persistModal, setPersistModal] = useState(false);
  const [persistText, setPersistText] = useState('');
  const flatRef   = useRef(null);
  const inputRef  = useRef(null);

  // Initialise — load context + today's chat
  useEffect(() => {
    (async () => {
      setInit(true);
      const [prompt, todayMsgs, dates, ctx] = await Promise.all([
        buildSystemPrompt(),
        loadChatDay(todayKey()),
        listChatDates(),
        loadPersistentContext(),
      ]);
      setSystemPrompt(prompt);
      setChatDates(dates);
      setPersistText(ctx.persistent_context || '');

      if (todayMsgs.length === 0) {
        // First message of the day
        const welcome = {
          id:   'welcome',
          role: 'assistant',
          text: `Namaste 🙏\n\nI'm Jyotish, your personal Vedic astrologer. I have full access to your birth chart, current Dasha period, and our previous conversations.\n\n${dates.length > 0 ? `I remember our last conversation from ${formatDate(dates[0]?.date)}. ` : ''}Ask me anything — career, relationships, health, timing, or what you're experiencing right now.`,
          time: new Date().toISOString(),
        };
        setMessages([welcome]);
      } else {
        setMessages(todayMsgs.map(m => ({ ...m, text: m.content })));
      }
      setInit(false);
    })();
  }, []);

  // Load a different day's chat
  const switchDay = async (date) => {
    setSidebar(false);
    setDate(date);
    const msgs = await loadChatDay(date);
    setMessages(msgs.map(m => ({ ...m, text: m.content })));
  };

  const send = useCallback(async (question) => {
    const q = (question || input).trim();
    if (!q || loading) return;
    setInput('');

    const userMsg = { id: Date.now().toString(), role: 'user', text: q, time: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    // Persist user message
    await appendMessage({ role: 'user', content: q, timestamp: new Date().toISOString() });

    try {
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken().catch(() => null) : null;

      // Build recent context (last 10 messages from current session)
      const recentHistory = messages.slice(-10).map(m => ({ role: m.role, content: m.text }));

      const res = await fetch(`${BASE_URL}/api/ai-jyotish`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
        body: JSON.stringify({
          question:      q,
          system_prompt: systemPrompt,
          history:       recentHistory,
          // No need to pass profile separately — it's in the system prompt
        }),
      });
      const data   = await res.json();
      const answer = data.answer || data.error || 'I could not fetch an answer. Please try again.';

      const aiMsg  = { id: Date.now().toString() + '_a', role: 'assistant', text: answer, time: new Date().toISOString() };
      setMessages(prev => [...prev, aiMsg]);

      // Persist AI response
      await appendMessage({ role: 'assistant', content: answer, timestamp: new Date().toISOString() });

      // Auto-summarise if we have many messages today
      const allMsgs = await loadChatDay(todayKey());
      if (allMsgs.length >= 10 && allMsgs.length % 10 === 0) {
        summariseTodayChat(); // fire and forget
      }

      // Refresh chat dates list
      listChatDates().then(setChatDates);

    } catch (e) {
      const errMsg = { id: 'err_' + Date.now(), role: 'assistant', text: 'Connection issue. Please try again.', time: new Date().toISOString() };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [input, loading, messages, systemPrompt]);

  const savePersist = async () => {
    await savePersistentContext({ persistent_context: persistText });
    // Rebuild system prompt with new context
    const newPrompt = await buildSystemPrompt();
    setSystemPrompt(newPrompt);
    setPersistModal(false);
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    const time   = item.time ? new Date(item.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '';
    return (
      <View style={[s.msgRow, isUser && s.msgRowUser]}>
        {!isUser && <View style={s.avatar}><Text style={s.avatarTxt}>🔮</Text></View>}
        <View style={[s.bubble, isUser ? s.bubbleUser : s.bubbleAI]}>
          <Text style={[s.bubbleText, isUser && s.bubbleTextUser]}>{item.text}</Text>
          <Text style={[s.msgTime, isUser && { color: 'rgba(255,255,255,0.5)' }]}>{time}</Text>
        </View>
      </View>
    );
  };

  if (initialising) {
    return (
      <LinearGradient colors={gradients.cosmic} style={s.loadingScreen}>
        <Text style={s.loadingEmoji}>🔮</Text>
        <ActivityIndicator color={colors.gold} size="large" />
        <Text style={s.loadingTxt}>Loading your Kundli context...</Text>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <LinearGradient colors={gradients.cosmic} style={s.header}>
        <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : setSidebar(true)} style={s.menuBtn}>
          <Text style={s.menuTxt}>{navigation.canGoBack() ? '‹' : '☰'}</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerEmoji}>🔮</Text>
          <View>
            <Text style={s.headerTitle}>Ask Astro</Text>
            <Text style={s.headerSub}>{selectedDate === todayKey() ? 'Today' : formatDate(selectedDate)}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {navigation.canGoBack() && (
            <TouchableOpacity onPress={() => setSidebar(true)} style={s.memBtn}>
              <Text style={s.memTxt}>☰</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setPersistModal(true)} style={s.memBtn}>
            <Text style={s.memTxt}>🧠</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Chat */}
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderMessage}
          contentContainerStyle={s.chatContent}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatRef.current?.scrollToEnd({ animated: false })}
          style={s.chat}
          keyboardShouldPersistTaps="handled"
        />

        {/* Typing indicator */}
        {loading && (
          <View style={s.typingRow}>
            <View style={s.avatar}><Text style={s.avatarTxt}>🔮</Text></View>
            <View style={s.typingBubble}>
              <ActivityIndicator size="small" color={colors.violet} />
              <Text style={s.typingTxt}>Consulting the stars...</Text>
            </View>
          </View>
        )}

        {/* Quick questions (only on first message) */}
        {messages.length <= 1 && (
          <View style={s.quickWrap}>
            <Text style={s.quickLabel}>SUGGESTED QUESTIONS</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={s.quickRow}>
                {QUICK_QUESTIONS.map((q, i) => (
                  <TouchableOpacity key={i} style={s.quickChip} onPress={() => send(q)}>
                    <Text style={s.quickChipTxt}>{q}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Input */}
        <View style={s.inputRow}>
          <TextInput
            ref={inputRef}
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about your chart, timing, relationships..."
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!input.trim() || loading) && s.sendBtnDisabled]}
            onPress={() => send()}
            disabled={!input.trim() || loading}
          >
            <LinearGradient colors={gradients.violet} style={s.sendGrad}>
              <Text style={s.sendTxt}>↑</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ── Sidebar: chat history ── */}
      <Modal visible={sidebarOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSidebar(false)}>
        <SafeAreaView style={s.sidebarRoot}>
          <LinearGradient colors={gradients.cosmic} style={s.sidebarHeader}>
            <Text style={s.sidebarTitle}>🔮 Jyotish History</Text>
            <TouchableOpacity onPress={() => setSidebar(false)}><Text style={s.sidebarClose}>✕</Text></TouchableOpacity>
          </LinearGradient>

          <TouchableOpacity style={[s.dayRow, selectedDate === todayKey() && s.dayRowActive]} onPress={() => switchDay(todayKey())}>
            <Text style={s.dayDate}>Today</Text>
            <Text style={s.daySummary}>Current conversation</Text>
          </TouchableOpacity>

          <ScrollView>
            {chatDates.filter(d => d.date !== todayKey()).map((d, i) => (
              <TouchableOpacity key={i} style={[s.dayRow, selectedDate === d.date && s.dayRowActive]} onPress={() => switchDay(d.date)}>
                <Text style={s.dayDate}>{formatDate(d.date)}</Text>
                <Text style={s.daySummary} numberOfLines={2}>
                  {d.summary || `${d.messageCount} messages`}
                </Text>
              </TouchableOpacity>
            ))}
            {chatDates.length === 0 && (
              <Text style={s.sidebarEmpty}>Your conversation history will appear here as you chat.</Text>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Persistent memory modal ── */}
      <Modal visible={persistModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPersistModal(false)}>
        <SafeAreaView style={s.persistRoot}>
          <View style={s.persistHeader}>
            <Text style={s.persistTitle}>🧠 What Jyotish Always Knows</Text>
            <TouchableOpacity onPress={() => setPersistModal(false)}><Text style={s.sidebarClose}>✕</Text></TouchableOpacity>
          </View>
          <Text style={s.persistDesc}>
            Write anything you want Jyotish to always remember — health conditions, life goals, important relationships, ongoing situations. This is added to every conversation.
          </Text>
          <TextInput
            style={s.persistInput}
            value={persistText}
            onChangeText={setPersistText}
            multiline
            placeholder={'Example:\n• I have Type 2 diabetes\n• Considering moving to Dubai in 6 months\n• My partner Priya has Moon in Leo\n• Currently in a career transition\n• My mother passed away in 2024'}
            placeholderTextColor={colors.textMuted}
          />
          <TouchableOpacity style={s.persistSaveBtn} onPress={savePersist}>
            <LinearGradient colors={gradients.violet} style={s.persistSaveBtnGrad}>
              <Text style={s.persistSaveTxt}>Save to Memory</Text>
            </LinearGradient>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: colors.cream },
  loadingScreen:   { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.lg },
  loadingEmoji:    { fontSize: 48 },
  loadingTxt:      { color: colors.white, ...typography.body },

  header:          { flexDirection: 'row', alignItems: 'center', paddingTop: 52, paddingBottom: 16, paddingHorizontal: spacing.lg },
  menuBtn:         { marginRight: 12 },
  menuTxt:         { color: colors.white, fontSize: 22 },
  headerCenter:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerEmoji:     { fontSize: 26 },
  headerTitle:     { color: colors.white, ...typography.h4 },
  headerSub:       { color: colors.violetLight, ...typography.micro },
  memBtn:          { padding: 8 },
  memTxt:          { fontSize: 22 },

  chat:            { flex: 1 },
  chatContent:     { padding: spacing.lg, paddingBottom: spacing.xxl },
  msgRow:          { flexDirection: 'row', marginBottom: spacing.lg, alignItems: 'flex-end', gap: 8 },
  msgRowUser:      { flexDirection: 'row-reverse' },
  avatar:          { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.violetMuted, justifyContent: 'center', alignItems: 'center' },
  avatarTxt:       { fontSize: 18 },
  bubble:          { maxWidth: '78%', borderRadius: radius.lg, padding: spacing.md },
  bubbleAI:        { backgroundColor: colors.white, ...shadows.sm, borderBottomLeftRadius: 4 },
  bubbleUser:      { backgroundColor: colors.violet, borderBottomRightRadius: 4 },
  bubbleText:      { ...typography.body, color: colors.textPrimary, lineHeight: 22 },
  bubbleTextUser:  { color: colors.white },
  msgTime:         { ...typography.micro, color: colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },

  typingRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: spacing.lg, marginBottom: 8 },
  typingBubble:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.lg, ...shadows.sm },
  typingTxt:       { ...typography.caption, color: colors.textMuted },

  quickWrap:       { paddingVertical: spacing.sm },
  quickLabel:      { ...typography.label, color: colors.textMuted, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  quickRow:        { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.sm },
  quickChip:       { backgroundColor: colors.violetMuted, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.full, maxWidth: 220 },
  quickChipTxt:    { ...typography.caption, color: colors.violet, fontWeight: '600' },

  inputRow:        { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.lg, paddingBottom: spacing.xl, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  input:           { flex: 1, backgroundColor: colors.surface, borderRadius: radius.xl, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, ...typography.body, color: colors.textPrimary, maxHeight: 100, borderWidth: 1, borderColor: colors.border },
  sendBtn:         { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  sendBtnDisabled: { opacity: 0.4 },
  sendGrad:        { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sendTxt:         { color: colors.white, fontSize: 20, fontWeight: '700' },

  // Sidebar
  sidebarRoot:     { flex: 1, backgroundColor: colors.cosmicDeep },
  sidebarHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 52, paddingBottom: 20, paddingHorizontal: spacing.lg },
  sidebarTitle:    { ...typography.h4, color: colors.white },
  sidebarClose:    { color: colors.white, fontSize: 20, padding: 8 },
  dayRow:          { padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  dayRowActive:    { backgroundColor: 'rgba(124,58,237,0.2)' },
  dayDate:         { ...typography.bodyBold, color: colors.white, marginBottom: 4 },
  daySummary:      { ...typography.caption, color: 'rgba(255,255,255,0.5)', lineHeight: 18 },
  sidebarEmpty:    { color: 'rgba(255,255,255,0.4)', ...typography.body, padding: spacing.xl, textAlign: 'center' },

  // Persistent memory
  persistRoot:     { flex: 1, backgroundColor: colors.surface, padding: spacing.lg },
  persistHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg, marginTop: 40 },
  persistTitle:    { ...typography.h4, color: colors.textPrimary },
  persistDesc:     { ...typography.body, color: colors.textMuted, lineHeight: 22, marginBottom: spacing.lg },
  persistInput:    { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, ...typography.body, color: colors.textPrimary, minHeight: 200, textAlignVertical: 'top', borderWidth: 1, borderColor: colors.border, flex: 1, marginBottom: spacing.lg },
  persistSaveBtn:  { borderRadius: radius.full, overflow: 'hidden' },
  persistSaveBtnGrad:{ padding: spacing.lg, alignItems: 'center' },
  persistSaveTxt:  { ...typography.h4, color: colors.white },
})
