'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LiveStreamEvent, AIResponse } from '@/types';

interface ChatInterfaceProps {
  messages: LiveStreamEvent[];
  onSendMessage: (message: string) => void;
  onAIResponse?: (response: AIResponse) => void;
  isStreaming: boolean;
  currentLanguage: string;
  isProcessing?: boolean;
}

interface ChatMessage extends LiveStreamEvent {
  aiResponse?: AIResponse;
  translated?: string;
}

export default function ChatInterface({
  messages,
  onSendMessage,
  // onAIResponse, // Commented out as it's not used
  isStreaming,
  currentLanguage,
  // isProcessing = false // Commented out as it's not used
}: ChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showAIResponses, setShowAIResponses] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // 更新聊天消息
  useEffect(() => {
    setChatMessages(messages.map(msg => ({ ...msg, aiResponse: undefined, translated: undefined })));
  }, [messages]);

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, autoScroll]);

  // 监听滚动，判断是否需要自动滚动
  const handleScroll = () => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setAutoScroll(isNearBottom);
    }
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() && isStreaming) {
      onSendMessage(inputMessage);
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: Date): string => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getMessageIcon = (type: string): string => {
    switch (type) {
      case 'message': return '💬';
      case 'join': return '👋';
      case 'leave': return '👋';
      case 'reaction': return '❤️';
      case 'gift': return '🎁';
      default: return '📝';
    }
  };

  const getMessageColor = (type: string): string => {
    switch (type) {
      case 'message': return 'text-white';
      case 'join': return 'text-green-400';
      case 'leave': return 'text-gray-400';
      case 'reaction': return 'text-pink-400';
      case 'gift': return 'text-yellow-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="bg-gray-900 text-white rounded-lg shadow-xl flex flex-col h-full">
      {/* 聊天头部 */}
      <div className="border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">实时聊天</h3>
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={showAIResponses}
                onChange={(e) => setShowAIResponses(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
              />
              <span>显示AI回复</span>
            </label>
            <div className={`px-2 py-1 rounded-full text-xs ${
              isStreaming ? 'bg-green-600' : 'bg-red-600'
            }`}>
              {isStreaming ? '在线' : '离线'}
            </div>
          </div>
        </div>
      </div>

      {/* 聊天消息区域 */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
        onScroll={handleScroll}
      >
        {chatMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">💬</div>
            <p>暂无聊天消息</p>
            <p className="text-sm">等待观众互动...</p>
          </div>
        ) : (
          chatMessages.map((message, index) => (
            <div key={index} className="space-y-2">
              {/* 原始消息 */}
              <div className="flex items-start space-x-3">
                <div className="text-lg">{getMessageIcon(message.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-blue-400">
                      {message.username || '匿名用户'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(message.timestamp)}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      message.type === 'message' ? 'bg-blue-900' :
                      message.type === 'join' ? 'bg-green-900' :
                      message.type === 'leave' ? 'bg-gray-700' :
                      message.type === 'reaction' ? 'bg-pink-900' :
                      'bg-yellow-900'
                    }`}>
                      {message.type}
                    </span>
                  </div>
                  <div className={`${getMessageColor(message.type)}`}>
                    {typeof message.data === 'string' 
                      ? message.data 
                      : (message.data as { text?: string }).text || JSON.stringify(message.data)
                    }
                  </div>
                  
                  {/* 翻译结果 */}
                  {message.translated && (
                    <div className="mt-2 p-2 bg-gray-800 rounded-lg border-l-4 border-blue-500">
                      <div className="text-xs text-gray-400 mb-1">翻译 ({currentLanguage}):</div>
                      <div className="text-blue-300">{message.translated}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* AI回复 */}
              {showAIResponses && message.aiResponse && (
                <div className="ml-8 p-3 bg-purple-900/50 rounded-lg border border-purple-700">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="text-lg">🤖</div>
                    <span className="font-medium text-purple-400">AI助手</span>
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(new Date())}
                    </span>
                    <span className="text-xs px-2 py-1 bg-purple-800 rounded-full">
                      {message.aiResponse.emotion}
                    </span>
                  </div>
                  <div className="text-purple-100 mb-2">
                    {message.aiResponse.text}
                  </div>
                  
                  {/* AI响应元数据 */}
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <span>置信度: {(message.aiResponse.metadata.confidence * 100).toFixed(1)}%</span>
                    <span>耗时: {message.aiResponse.metadata.processingTime}ms</span>
                    {message.aiResponse.gestures.length > 0 && (
                      <span>手势: {message.aiResponse.gestures.join(', ')}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 聊天输入区域 */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isStreaming ? "输入消息..." : "直播未开始"}
            disabled={!isStreaming}
            className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleSendMessage}
            disabled={!isStreaming || !inputMessage.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-medium transition-colors"
          >
            发送
          </button>
        </div>
        
        {/* 快捷回复 */}
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            '👋 欢迎来到直播间',
            '❤️ 感谢关注',
            '🎁 感谢礼物',
            '🤔 这是个好问题',
            '😊 很高兴认识你',
            '🎵 播放音乐'
          ].map((quickReply, index) => (
            <button
              key={index}
              onClick={() => onSendMessage(quickReply)}
              disabled={!isStreaming}
              className="text-xs bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed px-3 py-1 rounded-full transition-colors"
            >
              {quickReply}
            </button>
          ))}
        </div>
      </div>

      {/* 滚动提示 */}
      {!autoScroll && (
        <div className="absolute bottom-20 right-4">
          <button
            onClick={() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              setAutoScroll(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-full shadow-lg transition-colors"
          >
            ⬇️ 新消息
          </button>
        </div>
      )}
    </div>
  );
}
