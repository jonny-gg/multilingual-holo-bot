// 全息数字人系统核心类型定义

export interface Avatar {
  id: string;
  name: string;
  personality: PersonalityProfile;
  appearance: AvatarAppearance;
  voice: VoiceSettings;
  languages: SupportedLanguage[];
  memoryContext: MemoryContext;
}

export interface PersonalityProfile {
  traits: string[];
  background: string;
  speakingStyle: 'formal' | 'casual' | 'friendly' | 'professional';
  responseStyle: 'conversational' | 'formal' | 'casual';
  emotionalRange: EmotionalState[] | 'moderate' | 'wide' | 'narrow';
  knowledgeDomains: string[];
}

export interface AvatarAppearance {
  model3D: string; // 3D模型路径
  textures: {
    face: string;
    body: string;
    clothing: string;
  };
  animations: {
    idle: string[];
    speaking: string[];
    gestures: string[];
    emotions: Record<EmotionalState, string>;
  };
}

export interface VoiceSettings {
  voiceId: string;
  pitch: number;
  speed: number;
  volume: number;
  language: SupportedLanguage;
}

export type SupportedLanguage = 
  | 'zh-CN' | 'zh-TW' | 'en-US' | 'en-GB' 
  | 'ja-JP' | 'ko-KR' | 'es-ES' | 'fr-FR' 
  | 'de-DE' | 'it-IT' | 'pt-BR' | 'ru-RU';

export type EmotionalState = 
  | 'neutral' | 'happy' | 'sad' | 'excited' 
  | 'surprised' | 'confused' | 'angry' | 'thoughtful';

export interface MemoryContext {
  shortTerm: MemoryItem[];
  longTerm: MemoryItem[];
  personalityMemory: PersonalityMemory[];
}

export interface MemoryItem {
  id: string;
  content: string;
  timestamp: Date;
  importance: number; // 0-1
  category: 'conversation' | 'user_preference' | 'context' | 'fact';
}

export interface PersonalityMemory {
  id: string;
  trait: string;
  examples: string[];
  strength: number; // 0-1
}

export interface StreamingSession {
  id: string;
  avatar: Avatar;
  viewers: number;
  status: 'idle' | 'streaming' | 'paused' | 'error' | 'starting' | 'stopping' | 'stopped' | 'live';
  metrics: StreamingMetrics;
  settings: StreamingSettings;
}

export interface StreamingMetrics {
  uptime: number;
  totalViewers: number;
  currentViewers: number;
  engagement: number;
  quality: {
    fps: number;
    bitrate: number;
    resolution: string;
  };
}

export interface StreamingSettings {
  language: SupportedLanguage;
  autoResponse: boolean;
  responseDelay: number;
  maxConcurrentViewers: number;
  moderationLevel: 'low' | 'medium' | 'high';
}

export interface MotionCaptureData {
  timestamp: number;
  pose: {
    head: Vector3D;
    shoulders: Vector3D;
    arms: Vector3D[];
    hands: Vector3D[];
  };
  facial: {
    eyebrows: number;
    eyes: { left: number; right: number };
    mouth: MouthShape;
    cheeks: number;
  };
  confidence: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface MouthShape {
  openness: number;
  width: number;
  corners: number;
  phoneme: string;
}

export interface MCPServerConfig {
  piapi: {
    endpoint: string;
    apiKey: string;
    models: string[];
  };
  screenpipe: {
    endpoint: string;
    captureRate: number;
    resolution: string;
  };
  mem0: {
    endpoint: string;
    apiKey: string;
    memorySize: number;
  };
  lara: {
    endpoint: string;
    languages: SupportedLanguage[];
    syncAccuracy: number;
  };
}

export interface LiveStreamEvent {
  type: 'message' | 'join' | 'leave' | 'reaction' | 'gift';
  data: Record<string, unknown>;
  timestamp: Date;
  userId?: string;
  username?: string;
}

export interface AIResponse {
  text: string;
  emotion: EmotionalState;
  language?: SupportedLanguage;
  gestures: string[];
  voiceSettings: Partial<VoiceSettings>;
  metadata: {
    confidence: number;
    processingTime: number;
    memoryUsed: string[];
  };
}

export interface LipSyncData {
  phonemes: Array<{
    phoneme: string;
    startTime: number;
    endTime: number;
    intensity: number;
  }>;
  duration: number;
  language: SupportedLanguage;
}

export interface StreamingState {
  status: 'idle' | 'streaming' | 'paused' | 'error' | 'starting' | 'stopping' | 'stopped' | 'live';
  isLive: boolean;
  viewerCount: number;
  duration: number;
  language: SupportedLanguage;
  quality: {
    fps: number;
    bitrate: number;
    resolution: string;
  };
}

export interface ChatMessage extends LiveStreamEvent {
  id: string;
  sender: 'user' | 'ai' | 'system';
  language?: SupportedLanguage;
  aiResponse?: AIResponse;
  translated?: string;
}
