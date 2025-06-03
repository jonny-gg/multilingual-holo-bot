import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Avatar,
  StreamingState,
  MotionCaptureData,
  EmotionalState, 
  ChatMessage, 
  LipSyncData,
  AIResponse,
  SupportedLanguage
} from '@/types';
import { MCPServiceManager } from '@/services/mcp-manager';
import { config } from '@/lib/config';

interface HoloBotState {
  // Core state
  avatar: Avatar;
  streaming: StreamingState;
  isInitialized: boolean;
  
  // Real-time data
  motionData?: MotionCaptureData;
  currentEmotion: EmotionalState;
  lipSyncData?: LipSyncData;
  
  // Chat and interaction
  chatMessages: ChatMessage[];
  isProcessing: boolean;
  
  // Performance metrics
  performance: {
    fps: number;
    latency: number;
    connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  };
  
  // Error handling
  errors: string[];
  warnings: string[];
}

export function useHoloBot() {
  const [state, setState] = useState<HoloBotState>({
    avatar: {
      id: 'demo-avatar',
      name: 'Aria',
      personality: {
        traits: ['friendly', 'helpful', 'professional'],
        background: 'AI assistant specialized in multilingual communication',
        speakingStyle: 'professional',
        responseStyle: 'conversational',
        emotionalRange: 'moderate',
        knowledgeDomains: ['general', 'multilingual', 'communication']
      },
      appearance: {
        model3D: 'basic_human',
        textures: {
          face: '/models/textures/face_default.jpg',
          body: '/models/textures/body_default.jpg',
          clothing: '/models/textures/clothing_default.jpg'
        },
        animations: {
          idle: ['idle_01', 'idle_02'],
          speaking: ['speak_01', 'speak_02'],
          gestures: ['wave', 'nod', 'point'],
          emotions: {
            neutral: 'emotion_neutral',
            happy: 'emotion_happy',
            sad: 'emotion_sad',
            excited: 'emotion_excited',
            surprised: 'emotion_surprised',
            confused: 'emotion_confused',
            angry: 'emotion_angry',
            thoughtful: 'emotion_thoughtful'
          }
        }
      },
      voice: {
        voiceId: 'neural-female-en',
        pitch: 1.0,
        speed: 1.0,
        volume: 1.0,
        language: 'en-US'
      },
      languages: ['en-US', 'zh-CN', 'ja-JP', 'ko-KR'],
      memoryContext: {
        shortTerm: [],
        longTerm: [],
        personalityMemory: []
      }
    },
    streaming: {
      isLive: false,
      viewerCount: 0,
      duration: 0,
      quality: {
        fps: 30,
        bitrate: 2500,
        resolution: '1080p'
      },
      language: 'en-US',
      status: 'stopped'
    },
    isInitialized: false,
    currentEmotion: 'neutral',
    chatMessages: [],
    isProcessing: false,
    performance: {
      fps: 60,
      latency: 50,
      connectionQuality: 'excellent'
    },
    errors: [],
    warnings: []
  });

  const mcpManager = useRef<MCPServiceManager | null>(null);
  const performanceInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize the system
  const initialize = useCallback(async () => {
    try {
      // Initialize MCP services with config
      const mcpConfig = {
        piapi: {
          endpoint: config.mcpServers.piapi,
          apiKey: config.apiKeys.openai || 'demo-key',
          models: ['gpt-4', 'claude-3']
        },
        screenpipe: {
          endpoint: config.mcpServers.screenpipe,
          captureRate: 30,
          resolution: '1080p'
        },
        mem0: {
          endpoint: config.mcpServers.mem0,
          apiKey: config.apiKeys.anthropic || 'demo-key',
          memorySize: 1000
        },
        lara: {
          endpoint: config.mcpServers.lara,
          languages: ['en-US', 'zh-CN', 'ja-JP', 'ko-KR'] as SupportedLanguage[],
          syncAccuracy: 0.95
        }
      };

      mcpManager.current = new MCPServiceManager(mcpConfig);
      
      await mcpManager.current.initialize();

      // Set up event handlers
      mcpManager.current.setMotionUpdateHandler((data: MotionCaptureData) => {
        setState(prev => ({ ...prev, motionData: data }));
      });

      mcpManager.current.setLipSyncGeneratedHandler((data: LipSyncData) => {
        setState(prev => ({ ...prev, lipSyncData: data }));
      });

      mcpManager.current.setResponseGeneratedHandler((response: AIResponse) => {
        handleAIResponse(response);
      });

      setState(prev => ({ ...prev, isInitialized: true }));
      startPerformanceMonitoring();
      
    } catch (error) {
      addError(`Initialization failed: ${error}`);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle AI responses
  const handleAIResponse = useCallback((response: AIResponse) => {
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'message',
      data: { text: response.text },
      timestamp: new Date(),
      sender: 'ai',
      language: response.language || state.streaming.language,
      aiResponse: response
    };

    setState(prev => ({
      ...prev,
      chatMessages: [...prev.chatMessages, newMessage],
      currentEmotion: response.emotion || 'neutral',
      isProcessing: false
    }));
  }, [state.streaming.language]);

  // Start streaming
  const startStreaming = useCallback(async () => {
    try {
      if (!mcpManager.current) {
        throw new Error('System not initialized');
      }

      setState(prev => ({
        ...prev,
        streaming: {
          ...prev.streaming,
          isLive: true,
          status: 'starting'
        }
      }));

      // Start motion capture
      await mcpManager.current.startMotionCapture();
      
      setState(prev => ({
        ...prev,
        streaming: {
          ...prev.streaming,
          status: 'live'
        }
      }));

    } catch (error) {
      addError(`Failed to start streaming: ${error}`);
      setState(prev => ({
        ...prev,
        streaming: {
          ...prev.streaming,
          isLive: false,
          status: 'error'
        }
      }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Stop streaming
  const stopStreaming = useCallback(async () => {
    try {
      if (mcpManager.current) {
        await mcpManager.current.stopMotionCapture();
      }

      setState(prev => ({
        ...prev,
        streaming: {
          ...prev.streaming,
          isLive: false,
          status: 'stopped',
          duration: 0
        }
      }));

    } catch (error) {
      addError(`Failed to stop streaming: ${error}`);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Send chat message
  const sendMessage = useCallback(async (content: string) => {
    if (!mcpManager.current || state.isProcessing) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'message',
      data: { text: content },
      timestamp: new Date(),
      sender: 'user',
      language: state.streaming.language
    };

    setState(prev => ({
      ...prev,
      chatMessages: [...prev.chatMessages, userMessage],
      isProcessing: true
    }));

    try {
      await mcpManager.current.generateResponse(content, state.avatar.id, state.streaming.language);
    } catch (error) {
      addError(`Failed to process message: ${error}`);
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Change emotion
  const setEmotion = useCallback((emotion: EmotionalState) => {
    setState(prev => ({ ...prev, currentEmotion: emotion }));
  }, []);

  // Change language
  const setLanguage = useCallback(async (language: SupportedLanguage) => {
    setState(prev => ({
      ...prev,
      streaming: {
        ...prev.streaming,
        language
      }
    }));

    // Voice settings would be updated here when available
    // if (mcpManager.current) {
    //   try {
    //     await mcpManager.current.updateLanguage(language);
    //   } catch (error) {
    //     addWarning(`Failed to update language settings: ${error}`);
    //   }
    // }
  }, []);

  // Update avatar appearance
  const updateAvatar = useCallback((updates: Partial<Avatar>) => {
    setState(prev => ({
      ...prev,
      avatar: {
        ...prev.avatar,
        ...updates
      }
    }));
  }, []);

  // Error handling
  const addError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      errors: [...prev.errors, error]
    }));
    console.error('HoloBot Error:', error);
  }, []);

  const addWarning = useCallback((warning: string) => {
    setState(prev => ({
      ...prev,
      warnings: [...prev.warnings, warning]
    }));
    console.warn('HoloBot Warning:', warning);
  }, []);

  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, errors: [] }));
  }, []);

  const clearWarnings = useCallback(() => {
    setState(prev => ({ ...prev, warnings: [] }));
  }, []);

  // Performance monitoring
  const startPerformanceMonitoring = useCallback(() => {
    performanceInterval.current = setInterval(() => {
      // Monitor FPS, latency, and connection quality
      const fps = Math.floor(60 + Math.random() * 10 - 5); // Simulated
      const latency = Math.floor(40 + Math.random() * 30); // Simulated
      
      let connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected' = 'excellent';
      if (latency > 100) connectionQuality = 'poor';
      else if (latency > 60) connectionQuality = 'good';

      setState(prev => ({
        ...prev,
        performance: {
          fps,
          latency,
          connectionQuality
        }
      }));

      // Update streaming duration
      if (state.streaming.isLive) {
        setState(prev => ({
          ...prev,
          streaming: {
            ...prev.streaming,
            duration: prev.streaming.duration + 1
          }
        }));
      }
    }, 1000);
  }, [state.streaming.isLive]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (performanceInterval.current) {
        clearInterval(performanceInterval.current);
      }
      if (mcpManager.current) {
        mcpManager.current.disconnect();
      }
    };
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    initialize,
    startStreaming,
    stopStreaming,
    sendMessage,
    setEmotion,
    setLanguage,
    updateAvatar,
    
    // Error handling
    addError,
    addWarning,
    clearErrors,
    clearWarnings,
  };
}
