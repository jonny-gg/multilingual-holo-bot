'use client';

import React from 'react';
import StreamingControlPanel from '@/components/controls/StreamingControlPanel';
import { useHoloBot } from '@/hooks/useHoloBot';

export default function ControlPanel() {
  const { 
    streaming, 
    avatar,
    startStreaming, 
    stopStreaming, 
    setLanguage, 
    setEmotion 
  } = useHoloBot();

  return (
    <div className="p-4">
      <StreamingControlPanel
        session={{
          id: 'main-session',
          avatar: avatar,
          viewers: streaming.viewerCount,
          status: streaming.status,
          metrics: {
            uptime: streaming.duration,
            totalViewers: streaming.viewerCount,
            currentViewers: streaming.viewerCount,
            engagement: 0.75,
            quality: {
              fps: 30,
              bitrate: 2500,
              resolution: '1920x1080'
            }
          },
          settings: {
            language: streaming.language,
            autoResponse: true,
            responseDelay: 2,
            maxConcurrentViewers: 1000,
            moderationLevel: 'medium'
          }
        }}
        onStart={startStreaming}
        onStop={stopStreaming}
        onLanguageChange={setLanguage}
        onEmotionChange={setEmotion}
        onSettingsUpdate={(settings) => {
          // Handle settings update
          console.log('Settings updated:', settings);
        }}
      />
    </div>
  );
}
