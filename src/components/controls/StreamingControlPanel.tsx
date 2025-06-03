'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { StreamingSession, SupportedLanguage, EmotionalState } from '@/types';

interface StreamingControlPanelProps {
  session: StreamingSession;
  onStart: () => void;
  onStop: () => void;
  onLanguageChange: (language: SupportedLanguage) => void;
  onEmotionChange: (emotion: EmotionalState) => void;
  onSettingsUpdate: (settings: Record<string, unknown>) => void;
}

export default function StreamingControlPanel({
  session,
  onStart,
  onStop,
  onLanguageChange,
  onEmotionChange,
  onSettingsUpdate
}: StreamingControlPanelProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('zh-CN');
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionalState>('neutral');
  const [autoResponse, setAutoResponse] = useState(true);
  const [responseDelay, setResponseDelay] = useState(2);
  const [moderationLevel, setModerationLevel] = useState<'low' | 'medium' | 'high'>('medium');

  const supportedLanguages: { code: SupportedLanguage; name: string; flag: string }[] = [
    { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
    { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
    { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
    { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
    { code: 'ko-KR', name: '한국어', flag: '🇰🇷' },
    { code: 'es-ES', name: 'Español', flag: '🇪🇸' },
    { code: 'fr-FR', name: 'Français', flag: '🇫🇷' },
    { code: 'de-DE', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'it-IT', name: 'Italiano', flag: '🇮🇹' },
    { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
    { code: 'ru-RU', name: 'Русский', flag: '🇷🇺' }
  ];

  const emotions: { emotion: EmotionalState; name: string; icon: string }[] = [
    { emotion: 'neutral', name: '中性', icon: '😐' },
    { emotion: 'happy', name: '开心', icon: '😊' },
    { emotion: 'excited', name: '兴奋', icon: '🤩' },
    { emotion: 'sad', name: '难过', icon: '😢' },
    { emotion: 'surprised', name: '惊讶', icon: '😲' },
    { emotion: 'confused', name: '困惑', icon: '😕' },
    { emotion: 'angry', name: '生气', icon: '😠' },
    { emotion: 'thoughtful', name: '思考', icon: '🤔' }
  ];

  const handleLanguageChange = (language: SupportedLanguage) => {
    setSelectedLanguage(language);
    onLanguageChange(language);
  };

  const handleEmotionChange = (emotion: EmotionalState) => {
    setSelectedEmotion(emotion);
    onEmotionChange(emotion);
  };

  const handleSettingsUpdate = useCallback(() => {
    onSettingsUpdate({
      autoResponse,
      responseDelay,
      moderationLevel,
      language: selectedLanguage
    });
  }, [autoResponse, responseDelay, moderationLevel, selectedLanguage, onSettingsUpdate]);

  useEffect(() => {
    handleSettingsUpdate();
  }, [autoResponse, responseDelay, moderationLevel, selectedLanguage, handleSettingsUpdate]);

  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg shadow-xl space-y-6">
      {/* 头部状态 */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">直播控制面板</h2>
        <div className="flex items-center space-x-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            session.status === 'streaming' ? 'bg-red-600' : 
            session.status === 'paused' ? 'bg-yellow-600' : 
            session.status === 'error' ? 'bg-red-800' : 'bg-gray-600'
          }`}>
            {session.status === 'streaming' ? '🔴 直播中' : 
             session.status === 'paused' ? '⏸️ 暂停' : 
             session.status === 'error' ? '❌ 错误' : '⏹️ 待机'}
          </div>
        </div>
      </div>

      {/* 直播统计 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-gray-400">当前观众</div>
          <div className="text-2xl font-bold text-blue-400">{session.metrics.currentViewers}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-gray-400">总观看量</div>
          <div className="text-2xl font-bold text-green-400">{session.metrics.totalViewers}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-gray-400">运行时间</div>
          <div className="text-xl font-bold text-yellow-400">{formatUptime(session.metrics.uptime)}</div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-gray-400">互动度</div>
          <div className="text-2xl font-bold text-purple-400">{(session.metrics.engagement * 100).toFixed(1)}%</div>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex space-x-4">
        {session.status !== 'streaming' ? (
          <button
            onClick={onStart}
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            🎥 开始直播
          </button>
        ) : (
          <button
            onClick={onStop}
            className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg font-medium transition-colors"
          >
            ⏹️ 停止直播
          </button>
        )}
        
        <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors">
          ⚙️ 高级设置
        </button>
        
        <button className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-medium transition-colors">
          📊 数据分析
        </button>
      </div>

      {/* 语言选择 */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">语言设置</h3>
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {supportedLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                selectedLanguage === lang.code
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div>{lang.flag}</div>
              <div className="text-xs mt-1">{lang.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 情感控制 */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">情感表达</h3>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {emotions.map((emotion) => (
            <button
              key={emotion.emotion}
              onClick={() => handleEmotionChange(emotion.emotion)}
              className={`p-3 rounded-lg text-center transition-colors ${
                selectedEmotion === emotion.emotion
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="text-2xl">{emotion.icon}</div>
              <div className="text-xs mt-1">{emotion.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 高级设置 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">直播设置</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 自动回复 */}
          <div className="space-y-2">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={autoResponse}
                onChange={(e) => setAutoResponse(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
              />
              <span>自动回复消息</span>
            </label>
          </div>

          {/* 回复延迟 */}
          <div className="space-y-2">
            <label className="block text-sm">回复延迟 (秒)</label>
            <input
              type="range"
              min="0.5"
              max="10"
              step="0.5"
              value={responseDelay}
              onChange={(e) => setResponseDelay(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-sm text-gray-400">{responseDelay}秒</div>
          </div>

          {/* 内容审核级别 */}
          <div className="space-y-2">
            <label className="block text-sm">内容审核级别</label>
            <select
              value={moderationLevel}
              onChange={(e) => setModerationLevel(e.target.value as 'low' | 'medium' | 'high')}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg"
            >
              <option value="low">宽松</option>
              <option value="medium">中等</option>
              <option value="high">严格</option>
            </select>
          </div>

          {/* 性能监控 */}
          <div className="space-y-2">
            <label className="block text-sm">性能监控</label>
            <div className="bg-gray-800 p-3 rounded-lg space-y-1">
              <div className="flex justify-between text-sm">
                <span>FPS:</span>
                <span className="text-green-400">{session.metrics.quality.fps}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>比特率:</span>
                <span className="text-blue-400">{session.metrics.quality.bitrate} kbps</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>分辨率:</span>
                <span className="text-yellow-400">{session.metrics.quality.resolution}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="border-t border-gray-700 pt-4">
        <h3 className="text-lg font-semibold mb-3">快捷操作</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <button className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg text-sm transition-colors">
            🎭 切换人格
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg text-sm transition-colors">
            🎵 播放音乐
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg text-sm transition-colors">
            📱 社交互动
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg text-sm transition-colors">
            🎯 目标设定
          </button>
        </div>
      </div>
    </div>
  );
}
