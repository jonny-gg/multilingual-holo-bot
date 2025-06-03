'use client';

import React, { useEffect, useState } from 'react';
import Avatar3D from '@/components/3d/Avatar3D';
import StreamingControlPanel from '@/components/controls/StreamingControlPanel';
import ChatInterface from '@/components/streaming/ChatInterface';
import PerformanceMonitor from '@/components/ui/PerformanceMonitor';
import LoadingScreen from '@/components/ui/LoadingScreen';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { useHoloBot } from '@/hooks/useHoloBot';
import { Settings, Monitor, MessageSquare, AlertCircle } from 'lucide-react';

export default function Home() {
  const {
    // State
    avatar,
    streaming,
    isInitialized,
    motionData,
    currentEmotion,
    lipSyncData,
    chatMessages,
    isProcessing,
    performance,
    errors,
    warnings,
    
    // Actions
    initialize,
    startStreaming,
    stopStreaming,
    sendMessage,
    setEmotion,
    setLanguage,
    // updateAvatar, // Commented out as it's not used
    clearErrors,
    clearWarnings,
  } = useHoloBot();

  const [sidebarView, setSidebarView] = useState<'controls' | 'chat' | 'monitor'>('controls');
  const [showErrors, setShowErrors] = useState(false);

  // Initialize the system on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Show loading screen while initializing
  if (!isInitialized) {
    return (
      <LoadingScreen 
        message="Initializing Holographic Digital Human System..."
        details={[
          'Connecting to MCP servers...',
          'Loading 3D avatar models...',
          'Initializing AI personality...',
          'Setting up motion capture...',
          'Preparing multilingual support...'
        ]}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        {/* Header */}
        <header className="bg-black/30 backdrop-blur-sm border-b border-purple-500/20 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-3xl">🤖</div>
              <div>
                <h1 className="text-xl font-bold">Holographic Digital Human</h1>
                <p className="text-sm text-gray-400">Multilingual AI Livestreaming System</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Language Indicator */}
              <div className="text-sm text-gray-300">
                Language: <span className="text-purple-400 font-medium">{streaming.language}</span>
              </div>
              
              {/* Status Indicator */}
              <div className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${
                streaming.isLive ? 'bg-red-600' : 'bg-green-600'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  streaming.isLive ? 'bg-white animate-pulse' : 'bg-white'
                }`}></div>
                {streaming.isLive ? 'LIVE' : 'READY'}
              </div>

              {/* Error Indicator */}
              {(errors.length > 0 || warnings.length > 0) && (
                <button
                  onClick={() => setShowErrors(!showErrors)}
                  className="p-2 bg-red-600/20 rounded-lg hover:bg-red-600/30 transition-colors"
                >
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Error/Warning Panel */}
        {showErrors && (errors.length > 0 || warnings.length > 0) && (
          <div className="bg-red-900/50 border-b border-red-500/20 p-4">
            <div className="max-w-7xl mx-auto">
              {errors.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-red-400 font-semibold mb-2">Errors:</h3>
                  {errors.map((error, index) => (
                    <div key={index} className="text-red-300 text-sm mb-1">• {error}</div>
                  ))}
                  <button 
                    onClick={clearErrors}
                    className="text-red-400 hover:text-red-300 text-sm underline mt-2"
                  >
                    Clear Errors
                  </button>
                </div>
              )}
              
              {warnings.length > 0 && (
                <div>
                  <h3 className="text-yellow-400 font-semibold mb-2">Warnings:</h3>
                  {warnings.map((warning, index) => (
                    <div key={index} className="text-yellow-300 text-sm mb-1">• {warning}</div>
                  ))}
                  <button 
                    onClick={clearWarnings}
                    className="text-yellow-400 hover:text-yellow-300 text-sm underline mt-2"
                  >
                    Clear Warnings
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
            
            {/* 3D Avatar Area */}
            <div className="lg:col-span-3 bg-black/30 backdrop-blur-sm rounded-xl overflow-hidden border border-purple-500/20 relative">
              <Avatar3D
                avatar={avatar}
                motionData={motionData}
                lipSyncData={lipSyncData}
                emotion={currentEmotion}
                isStreaming={streaming.isLive}
              />
              
              {/* Avatar Overlay Info */}
              <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
                <h3 className="font-semibold text-purple-400">{avatar.name}</h3>
                <p className="text-sm text-gray-300">Current Emotion: {currentEmotion}</p>
                {streaming.isLive && (
                  <p className="text-sm text-red-400">🔴 Live for {Math.floor(streaming.duration / 60)}:{(streaming.duration % 60).toString().padStart(2, '0')}</p>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Sidebar Navigation */}
              <div className="bg-black/30 backdrop-blur-sm rounded-lg p-2 border border-purple-500/20">
                <div className="grid grid-cols-3 gap-1">
                  <button
                    onClick={() => setSidebarView('controls')}
                    className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                      sidebarView === 'controls' 
                        ? 'bg-purple-600 text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSidebarView('chat')}
                    className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                      sidebarView === 'chat' 
                        ? 'bg-purple-600 text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSidebarView('monitor')}
                    className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
                      sidebarView === 'monitor' 
                        ? 'bg-purple-600 text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sidebar Content */}
              <div className="h-[calc(100%-4rem)]">
                {sidebarView === 'controls' && (
                  <StreamingControlPanel
                    session={{
                      id: 'session-1',
                      avatar,
                      viewers: streaming.viewerCount,
                      status: streaming.status,
                      metrics: {
                        uptime: streaming.duration,
                        totalViewers: streaming.viewerCount,
                        currentViewers: streaming.viewerCount,
                        engagement: 0.8,
                        quality: {
                          fps: performance.fps,
                          bitrate: 2500,
                          resolution: streaming.quality.resolution
                        }
                      },
                      settings: {
                        language: streaming.language,
                        autoResponse: true,
                        responseDelay: 2,
                        maxConcurrentViewers: 1000,
                        moderationLevel: 'medium' as const
                      }
                    }}
                    onStart={startStreaming}
                    onStop={stopStreaming}
                    onLanguageChange={setLanguage}
                    onEmotionChange={setEmotion}
                    onSettingsUpdate={() => {}}
                  />
                )}

                {sidebarView === 'chat' && (
                  <ChatInterface
                    messages={chatMessages}
                    onSendMessage={sendMessage}
                    onAIResponse={() => {}}
                    isStreaming={streaming.isLive}
                    currentLanguage={streaming.language}
                    isProcessing={isProcessing}
                  />
                )}

                {sidebarView === 'monitor' && (
                  <PerformanceMonitor
                    performance={performance}
                    streaming={{
                      viewerCount: streaming.viewerCount,
                      duration: streaming.duration,
                      isLive: streaming.isLive
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-black/30 backdrop-blur-sm border-t border-purple-500/20 p-4 mt-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-6">
              <span>Version: 1.0.0</span>
              <span>Core: PIAPI + Screenpipe + Mem0 + Lara</span>
            </div>
            <div className="flex items-center space-x-6">
              <span>24/7 Operation</span>
              <span>12 Languages Supported</span>
              <span>AI-Powered Emotions</span>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}
