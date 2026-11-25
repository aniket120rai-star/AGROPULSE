import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Bot,
  Camera,
  CheckCircle2,
  FlaskConical,
  Leaf,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
} from 'lucide-react';
import { QUICK_ASSISTANT_PROMPTS, SAMPLE_PLANT_PHOTOS } from '../data/agroData';
import type { TranslationBundle } from '../data/translations';
import type {
  AssistantMode,
  ChatMessage,
  DiagnosisResult,
  FarmProfile,
  LanguageCode,
} from '../types/agro';
import { ASSISTANT_ROUTES } from '../utils/assistantRouting';
import { base64ToFloat32Pcm, float32ToPcm16Base64 } from '../utils/audioPcm';
import { StatusBadge } from './StatusBadge';

interface PlantDoctorViewProps {
  farmProfile: FarmProfile;
  language: LanguageCode;
  messages: ChatMessage[];
  onAppendMessages: (newMsgs: ChatMessage[]) => void;
  onClearMessages: () => void;
  getAuthToken: () => Promise<string | null>;
  onSaveDiagnosis: (diagnosis: DiagnosisResult) => void;
  t: TranslationBundle;
}

interface VoiceTranscriptItem {
  id: string;
  speaker: 'user' | 'advisor';
  text: string;
}

const MODE_ORDER: AssistantMode[] = ['fast', 'general', 'complex', 'deep'];

export function PlantDoctorView({
  farmProfile,
  language,
  messages,
  onAppendMessages,
  onClearMessages,
  getAuthToken,
  onSaveDiagnosis,
  t,
}: PlantDoctorViewProps) {
  const [subTab, setSubTab] = useState<'assistant' | 'voice' | 'doctor'>('assistant');

  // Multi-turn Chat state
  const [chatMode, setChatMode] = useState<AssistantMode>('general');
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Live Voice Advisor state (gemini-3.8-live)
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'connecting' | 'live' | 'error'>('idle');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [micMuted, setMicMuted] = useState(false);
  const [voiceTranscripts, setVoiceTranscripts] = useState<VoiceTranscriptItem[]>([]);
  const [voiceTextPrompt, setVoiceTextPrompt] = useState('');
  const [advisorSpeaking, setAdvisorSpeaking] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const micMutedRef = useRef<boolean>(false);

  useEffect(() => {
    micMutedRef.current = micMuted;
  }, [micMuted]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, chatLoading]);

  // Plant Doctor state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSampleFilename, setSelectedSampleFilename] = useState<string | null>(
    'sample_tomato_blight_1795239879246.jpg'
  );
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [uploadedMime, setUploadedMime] = useState<string>('image/jpeg');
  const [previewUrl, setPreviewUrl] = useState<string>(SAMPLE_PLANT_PHOTOS[0].imageUrl);
  const [cropNameInput, setCropNameInput] = useState('Tomato');
  const [symptomsInput, setSymptomsInput] = useState(
    'Dark concentric brown spots on lower leaves with yellow halo'
  );
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagError, setDiagError] = useState<string | null>(null);
  const [latestDiagnosis, setLatestDiagnosis] = useState<DiagnosisResult | null>(null);

  const stopQueuedAudio = useCallback(() => {
    for (const src of activeSourcesRef.current) {
      try {
        src.stop();
      } catch {
        // Ignore already stopped source
      }
    }
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    } else {
      nextStartTimeRef.current = 0;
    }
    setAdvisorSpeaking(false);
  }, []);

  const stopVoiceSession = useCallback(() => {
    stopQueuedAudio();

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      void inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      void outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {
        // Ignore
      }
      wsRef.current = null;
    }
    setVoiceStatus('idle');
    setMicMuted(false);
  }, [stopQueuedAudio]);

  useEffect(() => {
    return () => {
      stopVoiceSession();
    };
  }, [stopVoiceSession]);

  const playPcm24Chunk = useCallback((base64Audio: string) => {
    const ctx = outputAudioCtxRef.current;
    if (!ctx) return;

    const float32 = base64ToFloat32Pcm(base64Audio);
    if (float32.length === 0) return;

    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const startAt = Math.max(ctx.currentTime, nextStartTimeRef.current);
    source.start(startAt);
    nextStartTimeRef.current = startAt + buffer.duration;
    setAdvisorSpeaking(true);

    activeSourcesRef.current.push(source);
    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
      if (activeSourcesRef.current.length === 0) {
        setAdvisorSpeaking(false);
      }
    };
  }, []);

  const startVoiceSession = async () => {
    if (voiceStatus === 'connecting' || voiceStatus === 'live') return;
    setVoiceError(null);
    setVoiceStatus('connecting');

    try {
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputCtx;
      nextStartTimeRef.current = outputCtx.currentTime;

      let micStream: MediaStream | null = null;
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = micStream;
      } catch {
        // Allow text-to-voice session even if browser microphone permission is unavailable
        setVoiceError(
          'Microphone access unavailable — live voice audio will play out and you can send spoken prompts below.'
        );
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const params = new URLSearchParams({
        location: farmProfile.location,
        soil: farmProfile.soilType,
        irrigation: farmProfile.irrigation,
        goal: farmProfile.goal,
        language,
      });
      const ws = new WebSocket(`${protocol}//${window.location.host}/live?${params.toString()}`);
      wsRef.current = ws;

      ws.onopen = () => {
        if (micStream) {
          const inputCtx = new AudioContext({ sampleRate: 16000 });
          inputAudioCtxRef.current = inputCtx;
          const source = inputCtx.createMediaStreamSource(micStream);
          const processor = inputCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;

          processor.onaudioprocess = (e) => {
            if (micMutedRef.current || ws.readyState !== WebSocket.OPEN) return;
            const channel = e.inputBuffer.getChannelData(0);
            const base64 = float32ToPcm16Base64(channel);
            ws.send(JSON.stringify({ audio: base64 }));
          };

          source.connect(processor);
          processor.connect(inputCtx.destination);
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.ready) {
            setVoiceStatus('live');
          } else if (msg.audio) {
            playPcm24Chunk(msg.audio);
          } else if (msg.interrupted) {
            stopQueuedAudio();
          } else if (msg.inputTranscript) {
            setVoiceTranscripts((prev) => [
              ...prev.slice(-24),
              { id: `in-${Date.now()}-${Math.random()}`, speaker: 'user', text: msg.inputTranscript },
            ]);
          } else if (msg.outputTranscript) {
            setVoiceTranscripts((prev) => [
              ...prev.slice(-24),
              {
                id: `out-${Date.now()}-${Math.random()}`,
                speaker: 'advisor',
                text: msg.outputTranscript,
              },
            ]);
          } else if (msg.error) {
            setVoiceError(msg.error);
            setVoiceStatus('error');
          }
        } catch {
          // Ignore malformed WS message
        }
      };

      ws.onerror = () => {
        setVoiceError('Live voice connection failed. Please try again.');
        setVoiceStatus('error');
      };

      ws.onclose = () => {
        setVoiceStatus((prev) => (prev === 'error' ? 'error' : 'idle'));
      };
    } catch (err: unknown) {
      setVoiceError(
        err instanceof Error ? err.message : 'Unable to start Gemini Live voice session.'
      );
      stopVoiceSession();
      setVoiceStatus('error');
    }
  };

  const handleSendVoiceText = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = voiceTextPrompt.trim();
    if (!trimmed || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ text: trimmed }));
    setVoiceTranscripts((prev) => [
      ...prev.slice(-24),
      { id: `txt-${Date.now()}`, speaker: 'user', text: trimmed },
    ]);
    setVoiceTextPrompt('');
  };

  const sendChatMessage = async (questionText: string) => {
    const trimmed = questionText.trim();
    if (!trimmed || chatLoading) return;

    const routeConfig = ASSISTANT_ROUTES[chatMode];
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modeLabel: routeConfig.label,
    };

    const nextHistory = [...messages, userMsg];
    onAppendMessages([userMsg]);
    setChatInput('');
    setChatError(null);
    setChatLoading(true);

    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          message: trimmed,
          history: nextHistory.slice(-10).map((m) => ({ role: m.role, content: m.content })),
          farmProfile,
          language,
          mode: chatMode,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get farming advice.');
      }

      const botMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        modelUsed: data.modelUsed,
        modeLabel: data.modeLabel || routeConfig.label,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      onAppendMessages([botMsg]);
    } catch (err: unknown) {
      setChatError(
        err instanceof Error ? err.message : 'Unable to reach AI Farming Assistant.'
      );
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendChatMessage(chatInput);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      if (commaIdx !== -1) {
        setUploadedBase64(result.slice(commaIdx + 1));
        setUploadedMime(file.type || 'image/jpeg');
        setPreviewUrl(result);
        setSelectedSampleFilename(null);
        setDiagError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: (typeof SAMPLE_PLANT_PHOTOS)[number]) => {
    const filename = sample.imageUrl.split('/').pop() || null;
    setSelectedSampleFilename(filename);
    setUploadedBase64(null);
    setPreviewUrl(sample.imageUrl);
    setCropNameInput(sample.cropName);
    setSymptomsInput(sample.hint);
    setDiagError(null);
  };

  const handleDiagnose = async () => {
    if (diagLoading) return;
    setDiagLoading(true);
    setDiagError(null);

    try {
      const token = await getAuthToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch('/api/assistant/diagnose', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          imageBase64: uploadedBase64,
          mimeType: uploadedMime,
          sampleFilename: selectedSampleFilename,
          cropName: cropNameInput,
          symptomsNote: symptomsInput,
          farmProfile,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Diagnosis failed.');
      }

      const d = data.diagnosis;
      const fullResult: DiagnosisResult = {
        id: `diag-${Date.now()}`,
        timestamp: new Date().toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        cropName: cropNameInput || 'Crop Leaf',
        imagePreview: previewUrl,
        detectedIssue: d.detectedIssue,
        confidence: d.confidence,
        status: d.status,
        summary: d.summary,
        organicTreatment: d.organicTreatment,
        chemicalTreatment: d.chemicalTreatment,
        preventionSteps: d.preventionSteps,
      };

      setLatestDiagnosis(fullResult);
      onSaveDiagnosis(fullResult);
    } catch (err: unknown) {
      setDiagError(
        err instanceof Error ? err.message : 'Unable to analyze plant image right now.'
      );
    } finally {
      setDiagLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2.5">
          <Bot className="w-6 h-6 text-[#D97706]" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-[#1E293B] tracking-tight">
            {t.headings.doctorTitle}
          </h1>
        </div>
        <p className="text-sm text-slate-600 mt-1">{t.headings.doctorSubtitle}</p>
      </div>

      {/* 3-Tab Bar: Multi-Turn Chat | Live Voice Advisor | Plant Doctor */}
      <div
        role="tablist"
        aria-label="Assistant Modes"
        className="grid grid-cols-3 rounded-xl bg-[#E8EDE9] p-1 border border-[#DCE3DE]"
      >
        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'assistant'}
          onClick={() => setSubTab('assistant')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
            subTab === 'assistant'
              ? 'bg-white text-[#1E293B] shadow-xs'
              : 'text-slate-600 hover:text-[#1E293B]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#2D6A4F] shrink-0" aria-hidden="true" />
          <span className="truncate">Ask the Assistant</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'voice'}
          onClick={() => setSubTab('voice')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
            subTab === 'voice'
              ? 'bg-white text-[#1E293B] shadow-xs'
              : 'text-slate-600 hover:text-[#1E293B]'
          }`}
        >
          <Mic className="w-4 h-4 text-[#1B4332] shrink-0" aria-hidden="true" />
          <span className="truncate">Live Voice Advisor</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={subTab === 'doctor'}
          onClick={() => setSubTab('doctor')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
            subTab === 'doctor'
              ? 'bg-white text-[#1E293B] shadow-xs'
              : 'text-slate-600 hover:text-[#1E293B]'
          }`}
        >
          <Camera className="w-4 h-4 text-[#D97706] shrink-0" aria-hidden="true" />
          <span className="truncate">Plant Doctor</span>
        </button>
      </div>

      {/* TAB 1: Multi-Turn Assistant with Model Routing */}
      {subTab === 'assistant' && (
        <section
          aria-label="Farming Assistant Chat"
          className="rounded-2xl bg-[#FAFBF9] border border-[#DCE3DE] p-5 flex flex-col justify-between min-h-[520px] space-y-4"
        >
          {/* Mode Selector Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E5EAE6]">
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Consultation depth">
              {MODE_ORDER.map((modeKey) => {
                const cfg = ASSISTANT_ROUTES[modeKey];
                const active = chatMode === modeKey;
                return (
                  <button
                    key={modeKey}
                    type="button"
                    onClick={() => setChatMode(modeKey)}
                    title={cfg.shortDesc}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      active
                        ? 'bg-[#1B4332] text-white border-[#1B4332]'
                        : 'bg-white text-[#1E293B] border-[#DCE3DE] hover:border-[#2D6A4F]'
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            {messages.length > 0 && (
              <button
                type="button"
                onClick={onClearMessages}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>New Thread</span>
              </button>
            )}
          </div>

          <div className="text-[11px] text-slate-500">
            Active mode: <span className="font-semibold text-[#1B4332]">{ASSISTANT_ROUTES[chatMode].label}</span> ·{' '}
            {ASSISTANT_ROUTES[chatMode].shortDesc}
          </div>

          <div className="space-y-4 flex-1 max-h-[360px] overflow-y-auto pr-1">
            <div className="inline-flex items-center gap-2.5 rounded-xl bg-[#EEF2EF] border border-[#DCE3DE] px-4 py-3 text-sm text-[#1E293B] max-w-2xl">
              <span aria-hidden="true">🌱</span>
              <span>
                AI Farming Assistant — Ask follow-up questions on fertilizers, crop rotation, soil pH,
                pests, or government schemes for {farmProfile.location}.
              </span>
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#1B4332] text-white'
                      : 'bg-white border border-[#DCE3DE] text-[#1E293B]'
                  }`}
                >
                  <div>{msg.content}</div>
                  <div
                    className={`flex items-center gap-2 text-[10px] mt-1.5 ${
                      msg.role === 'user' ? 'text-emerald-200' : 'text-slate-400'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {msg.role === 'assistant' && msg.modeLabel && (
                      <span>· {msg.modeLabel}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex items-center gap-2 text-sm text-[#2D6A4F] px-2">
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>
                  Analyzing via {ASSISTANT_ROUTES[chatMode].label} for {farmProfile.location}...
                </span>
              </div>
            )}

            {chatError && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{chatError}</span>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Prompts + Input */}
          <div className="space-y-3 pt-2 border-t border-[#E5EAE6]">
            <div className="flex flex-wrap gap-2">
              {QUICK_ASSISTANT_PROMPTS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => sendChatMessage(chip)}
                  disabled={chatLoading}
                  className="px-3 py-1.5 rounded-xl bg-white border border-[#DCE3DE] hover:border-[#2D6A4F] text-xs font-medium text-[#1E293B] transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>

            <form onSubmit={handleChatSubmit} className="flex items-end gap-2.5">
              <textarea
                rows={2}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendChatMessage(chatInput);
                  }
                }}
                placeholder="Ask your farming question or follow up on the previous answer..."
                aria-label="Ask your farming question"
                className="flex-1 rounded-xl border border-[#DCE3DE] bg-white px-4 py-2.5 text-sm text-[#1E293B] resize-none focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                aria-label="Send message"
                className="w-11 h-11 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] disabled:bg-slate-300 text-white flex items-center justify-center transition-colors shrink-0"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
              </button>
            </form>
          </div>
        </section>
      )}

      {/* TAB 2: Real-Time Voice Advisor (Gemini Live API) */}
      {subTab === 'voice' && (
        <section
          aria-label="Live Voice Advisor"
          className="rounded-2xl bg-[#FAFBF9] border border-[#DCE3DE] p-5 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5EAE6]">
            <div>
              <h2 className="text-base font-bold text-[#1E293B]">
                Hands-Free Live Voice Field Advisor
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Speak naturally in {language.toUpperCase()} about crops, pests, irrigation, or
                spraying schedules for {farmProfile.location}.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {voiceStatus === 'live' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setMicMuted((m) => !m)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${
                      micMuted
                        ? 'bg-amber-50 border-amber-300 text-amber-900'
                        : 'bg-white border-[#DCE3DE] text-[#1E293B] hover:border-[#2D6A4F]'
                    }`}
                  >
                    {micMuted ? (
                      <MicOff className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
                    ) : (
                      <Mic className="w-4 h-4 text-[#2D6A4F]" aria-hidden="true" />
                    )}
                    <span>{micMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopVoiceSession}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
                  >
                    <PhoneOff className="w-4 h-4" aria-hidden="true" />
                    <span>End Voice Call</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={startVoiceSession}
                  disabled={voiceStatus === 'connecting'}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] disabled:opacity-60 text-white text-sm font-semibold transition-colors"
                >
                  {voiceStatus === 'connecting' ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Mic className="w-4 h-4" aria-hidden="true" />
                  )}
                  <span>
                    {voiceStatus === 'connecting' ? 'Connecting...' : 'Start Live Voice Call'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {voiceError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" aria-hidden="true" />
              <span>{voiceError}</span>
            </div>
          )}

          {/* Voice Status & Transcript Feed */}
          <div className="rounded-xl bg-white border border-[#E5EAE6] p-4 min-h-[260px] flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-semibold text-[#1E293B]">
                <Volume2
                  className={`w-4 h-4 ${
                    advisorSpeaking
                      ? 'text-[#D97706]'
                      : voiceStatus === 'live'
                      ? 'text-[#2D6A4F]'
                      : 'text-slate-400'
                  }`}
                  aria-hidden="true"
                />
                <span>
                  {voiceStatus === 'live'
                    ? advisorSpeaking
                      ? 'Advisor speaking...'
                      : micMuted
                      ? 'Connected (mic muted)'
                      : 'Listening — speak your farming question'
                    : voiceStatus === 'connecting'
                    ? 'Connecting to live voice advisor...'
                    : 'Press "Start Live Voice Call" for real-time spoken advice'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                16kHz Mic · 24kHz Audio
              </span>
            </div>

            <div className="flex-1 max-h-56 overflow-y-auto space-y-2.5 pr-1">
              {voiceTranscripts.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  Live voice transcripts will appear here as you speak with the AgroPulse Voice
                  Advisor.
                </p>
              ) : (
                voiceTranscripts.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-xl px-3.5 py-2 text-xs leading-relaxed ${
                      item.speaker === 'user'
                        ? 'bg-[#EEF2EF] text-[#1E293B] ml-8'
                        : 'bg-emerald-50/70 border border-emerald-200 text-[#1B4332] mr-8'
                    }`}
                  >
                    <span className="font-bold mr-1.5">
                      {item.speaker === 'user' ? 'You:' : 'Advisor:'}
                    </span>
                    <span>{item.text}</span>
                  </div>
                ))
              )}
            </div>

            {voiceStatus === 'live' && (
              <form onSubmit={handleSendVoiceText} className="flex gap-2 pt-2 border-t border-slate-100">
                <input
                  type="text"
                  value={voiceTextPrompt}
                  onChange={(e) => setVoiceTextPrompt(e.target.value)}
                  placeholder="Or type a quick prompt for the voice advisor to speak back..."
                  aria-label="Send prompt to voice advisor"
                  className="flex-1 rounded-xl border border-[#DCE3DE] bg-[#FAFBF9] px-3.5 py-2 text-xs text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
                <button
                  type="submit"
                  disabled={!voiceTextPrompt.trim()}
                  className="px-4 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#1B4332] disabled:bg-slate-300 text-white text-xs font-semibold transition-colors"
                >
                  Speak Reply
                </button>
              </form>
            )}
          </div>
        </section>
      )}

      {/* TAB 3: Plant Doctor (Pest/Disease Identifier) */}
      {subTab === 'doctor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section
            aria-label="Plant Photo Input"
            className="lg:col-span-5 rounded-2xl bg-[#FAFBF9] border border-[#DCE3DE] p-5 space-y-4"
          >
            <div className="space-y-2">
              <h2 className="text-base font-bold text-[#1E293B]">Upload Leaf or Crop Photo</h2>
              <p className="text-xs text-slate-500">
                Take a clear close-up photo in natural daylight or test with a sample crop image.
              </p>
            </div>

            <div className="rounded-xl overflow-hidden border border-[#DCE3DE] bg-white h-48 relative">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={cropNameInput || 'Selected plant specimen'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6">
                  <Leaf className="w-10 h-10 mb-2" aria-hidden="true" />
                  <span className="text-xs">No leaf photo selected</span>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white border border-[#DCE3DE] hover:border-[#2D6A4F] text-sm font-semibold text-[#1E293B] transition-colors"
            >
              <Upload className="w-4 h-4 text-[#2D6A4F]" aria-hidden="true" />
              <span>Upload / Take Leaf Photo</span>
            </button>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-600">
                Or test with sample field photos:
              </div>
              <div className="grid grid-cols-3 gap-2">
                {SAMPLE_PLANT_PHOTOS.map((sample) => {
                  const filename = sample.imageUrl.split('/').pop();
                  const active = selectedSampleFilename === filename;
                  return (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => handleSelectSample(sample)}
                      className={`rounded-xl border p-1.5 text-left transition-colors ${
                        active
                          ? 'border-[#2D6A4F] bg-emerald-50/60'
                          : 'border-[#DCE3DE] bg-white hover:border-[#2D6A4F]'
                      }`}
                    >
                      <img
                        src={sample.imageUrl}
                        alt={sample.label}
                        referrerPolicy="no-referrer"
                        className="w-full aspect-[4/3] object-cover rounded-lg mb-1"
                      />
                      <div className="text-[11px] font-semibold text-[#1E293B] truncate">
                        {sample.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 pt-1">
              <div>
                <label htmlFor="doctor-crop-name" className="block text-xs font-semibold text-[#1E293B] mb-1">
                  Crop name
                </label>
                <input
                  id="doctor-crop-name"
                  type="text"
                  value={cropNameInput}
                  onChange={(e) => setCropNameInput(e.target.value)}
                  placeholder="e.g., Tomato, Paddy, Mustard"
                  className="w-full rounded-xl border border-[#DCE3DE] bg-white px-3.5 py-2 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>

              <div>
                <label htmlFor="doctor-symptoms" className="block text-xs font-semibold text-[#1E293B] mb-1">
                  Observed symptoms (optional)
                </label>
                <input
                  id="doctor-symptoms"
                  type="text"
                  value={symptomsInput}
                  onChange={(e) => setSymptomsInput(e.target.value)}
                  placeholder="e.g., Yellowing lower leaves, spots..."
                  className="w-full rounded-xl border border-[#DCE3DE] bg-white px-3.5 py-2 text-sm text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleDiagnose}
              disabled={diagLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] disabled:bg-slate-400 text-white text-sm font-semibold transition-colors"
            >
              {diagLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Analyzing Leaf Specimen...</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" aria-hidden="true" />
                  <span>{t.actions.diagnosePlant}</span>
                </>
              )}
            </button>
          </section>

          <section
            aria-label="Diagnostic Result"
            className="lg:col-span-7 rounded-2xl bg-[#FAFBF9] border border-[#DCE3DE] p-5 flex flex-col justify-between"
          >
            {diagError && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{diagError}</span>
              </div>
            )}

            {latestDiagnosis ? (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-[#E5EAE6]">
                  <div>
                    <div className="text-xs font-medium text-slate-500">
                      Detected Issue · {latestDiagnosis.cropName}
                    </div>
                    <h2 className="text-xl font-bold text-[#1E293B] mt-0.5">
                      {latestDiagnosis.detectedIssue}
                    </h2>
                    <p className="text-sm text-slate-600 mt-1">{latestDiagnosis.summary}</p>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    <StatusBadge
                      status={latestDiagnosis.status}
                      label={t.status[latestDiagnosis.status]}
                    />
                    <div className="text-xs font-semibold text-[#1B4332] tabular-nums">
                      Confidence: {latestDiagnosis.confidence}%
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Diagnostic confidence</span>
                    <span className="font-semibold text-[#1E293B] tabular-nums">
                      {latestDiagnosis.confidence}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#E2E8E4] overflow-hidden">
                    <div
                      className="h-full bg-[#2D6A4F] rounded-full"
                      style={{ width: `${latestDiagnosis.confidence}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white border border-[#E5EAE6] p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#1B4332]">
                      <Leaf className="w-4 h-4 text-[#2D6A4F]" aria-hidden="true" />
                      <span>Organic Treatment</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
                      {latestDiagnosis.organicTreatment.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-[#2D6A4F] font-bold" aria-hidden="true">
                            •
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl bg-white border border-[#E5EAE6] p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#1E293B]">
                      <FlaskConical className="w-4 h-4 text-[#D97706]" aria-hidden="true" />
                      <span>Chemical Treatment</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
                      {latestDiagnosis.chemicalTreatment.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-[#D97706] font-bold" aria-hidden="true">
                            •
                          </span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-xl bg-white border border-[#E5EAE6] p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#1E293B]">
                    <ShieldCheck className="w-4 h-4 text-[#2D6A4F]" aria-hidden="true" />
                    <span>Prevention Steps</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
                    {latestDiagnosis.preventionSteps.map((step, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2
                          className="w-3.5 h-3.5 text-[#2D6A4F] shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-xs text-slate-500">
                  Saved automatically to Recent Diagnoses in your Profile.
                </p>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 px-6 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-white border border-[#DCE3DE] flex items-center justify-center text-[#2D6A4F]">
                  <Camera className="w-7 h-7" aria-hidden="true" />
                </div>
                <h2 className="text-base font-bold text-[#1E293B]">
                  Ready to inspect your plant photo
                </h2>
                <p className="text-sm text-slate-500 max-w-md">
                  Select one of the sample crop leaves on the left or upload a photo from your
                  field, then click <strong>{t.actions.diagnosePlant}</strong> to receive organic
                  and chemical treatment steps.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
