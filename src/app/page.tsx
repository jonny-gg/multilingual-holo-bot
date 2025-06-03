'use client';

import React, { useState, useEffect } from 'react';
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import Avatar3D from '@/components/3d/Avatar3D';
import ControlPanel from '@/components/ui/ControlPanel';
import ChatInterface from '@/components/streaming/ChatInterface';
import PerformanceMonitor from '@/components/ui/PerformanceMonitor';
import SystemDashboard from '@/components/ui/SystemDashboard';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useHoloBot } from '@/hooks/useHoloBot';
import { usePrometheusMetrics } from '@/hooks/usePrometheusMetrics';
import { Monitor, MessageSquare, Settings, Server } from 'lucide-react';

export default function HoloBotPage() {
  const { 
    isInitialized, 
    avatar,
    streaming,
    performance,
    currentEmotion,
    chatMessages,
    motionData,
    lipSyncData,
    sendMessage,
    errors,
    initialize
  } = useHoloBot();
  
  const {
    recordPerformanceMetrics,
    recordStreamingMetrics,
    recordChatMetrics,
    recordSystemMetrics
  } = usePrometheusMetrics();
  
  const [activeTab, setActiveTab] = useState<'controls' | 'chat' | 'monitor' | 'dashboard'>('controls');
  const [audioLevel, setAudioLevel] = useState(0);

  // Initialize on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Record metrics when performance data changes
  useEffect(() => {
    if (performance) {
      recordPerformanceMetrics(performance);
    }
  }, [performance, recordPerformanceMetrics]);

  // Record metrics when streaming data changes
  useEffect(() => {
    if (streaming) {
      recordStreamingMetrics({
        viewerCount: streaming.viewerCount,
        isLive: streaming.isLive,
        duration: streaming.duration,
        language: streaming.language,
        quality: streaming.quality.resolution || '1080p'
      });
    }
  }, [streaming, recordStreamingMetrics]);

  // Record chat metrics when messages change
  useEffect(() => {
    if (chatMessages.length > 0) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      recordChatMetrics({
        messagesReceived: chatMessages.filter(m => m.sender === 'user').length,
        messagesProcessed: chatMessages.filter(m => m.sender === 'ai').length,
        aiResponseTime: 500, // Simulated response time
        language: lastMessage.language || streaming.language
      });
    }
  }, [chatMessages, recordChatMetrics, streaming.language]);

  // Record system metrics periodically
  useEffect(() => {
    const systemMetricsInterval = setInterval(() => {
      recordSystemMetrics({
        memoryUsage: typeof window !== 'undefined' && 'performance' in window 
          ? (performance as { memory?: { usedJSHeapSize?: number } }).memory?.usedJSHeapSize || 0 
          : 0,
        cpuUsage: 0, // Can't get real CPU usage in browser
        errorCount: errors.length,
        warningCount: 0, // Add warning count if available
        uptime: Math.floor(Date.now() / 1000)
      });
    }, 30000); // Every 30 seconds

    return () => clearInterval(systemMetricsInterval);
  }, [errors.length, recordSystemMetrics, performance]);

  // Simulate audio level for demonstration
  useEffect(() => {
    const interval = setInterval(() => {
      if (streaming.isLive) {
        setAudioLevel(Math.random() * 0.8 + 0.1);
      } else {
        setAudioLevel(0);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [streaming.isLive]);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  if (errors.length > 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-center">
          <h1 className="text-2xl font-bold mb-4">System Error</h1>
          <p className="text-gray-300">{errors[0]}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Main 3D Viewport */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          className="bg-gradient-to-br from-gray-900 to-black"
        >
          <Suspense fallback={null}>
            {/* Lighting */}
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <pointLight position={[-10, -10, -5]} intensity={0.5} />
            
            {/* Environment */}
            <Environment preset="studio" />
            
            {/* Avatar */}
            <Avatar3D 
              avatar={avatar}
              motionData={motionData}
              lipSyncData={lipSyncData}
              emotion={currentEmotion}
              isStreaming={streaming.isLive}
            />
            
            {/* Camera Controls */}
            <OrbitControls
              enablePan={false}
              enableZoom={true}
              enableRotate={true}
              minDistance={2}
              maxDistance={10}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI - Math.PI / 6}
            />
          </Suspense>
        </Canvas>

        {/* Overlay UI */}
        <div className="absolute top-4 left-4 flex space-x-2">
          <div className="bg-black/50 backdrop-blur-md rounded-lg px-3 py-2 text-sm">
            Language: <span className="text-blue-400">{streaming.language}</span>
          </div>
          <div className="bg-black/50 backdrop-blur-md rounded-lg px-3 py-2 text-sm">
            Expression: <span className="text-green-400">{currentEmotion}</span>
          </div>
        </div>

        {/* Audio Level Indicator */}
        {audioLevel > 0 && (
          <div className="absolute bottom-4 left-4">
            <div className="bg-black/50 backdrop-blur-md rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm">Audio Level: {Math.round(audioLevel * 100)}%</span>
              </div>
              <div className="w-32 h-2 bg-gray-700 rounded-full mt-2">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-red-500 rounded-full transition-all duration-100"
                  style={{ width: `${audioLevel * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('controls')}
            className={`flex-1 flex items-center justify-center space-x-1 py-3 px-2 text-xs font-medium transition-colors ${
              activeTab === 'controls'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Settings size={14} />
            <span>Controls</span>
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex items-center justify-center space-x-1 py-3 px-2 text-xs font-medium transition-colors ${
              activeTab === 'chat'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <MessageSquare size={14} />
            <span>Chat</span>
          </button>
          <button
            onClick={() => setActiveTab('monitor')}
            className={`flex-1 flex items-center justify-center space-x-1 py-3 px-2 text-xs font-medium transition-colors ${
              activeTab === 'monitor'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Monitor size={14} />
            <span>Monitor</span>
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 flex items-center justify-center space-x-1 py-3 px-2 text-xs font-medium transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            <Server size={14} />
            <span>System</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'controls' && (
            <div className="h-full overflow-y-auto">
              <ControlPanel />
            </div>
          )}
          {activeTab === 'chat' && (
            <div className="h-full">
              <ChatInterface 
                messages={chatMessages}
                onSendMessage={sendMessage}
                isStreaming={streaming.isLive}
                currentLanguage={streaming.language}
              />
            </div>
          )}
          {activeTab === 'monitor' && (
            <div className="h-full overflow-y-auto">
              <PerformanceMonitor 
                performance={performance}
                streaming={{
                  viewerCount: streaming.viewerCount,
                  duration: streaming.duration,
                  isLive: streaming.isLive
                }}
              />
            </div>
          )}
          {activeTab === 'dashboard' && (
            <div className="h-full overflow-y-auto">
              <SystemDashboard />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}