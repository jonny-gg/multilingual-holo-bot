import React from 'react';
import { Activity, Wifi, Clock, Users } from 'lucide-react';

interface PerformanceMetrics {
  fps: number;
  latency: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
}

interface StreamingMetrics {
  viewerCount: number;
  duration: number;
  isLive: boolean;
}

interface PerformanceMonitorProps {
  performance: PerformanceMetrics;
  streaming: StreamingMetrics;
  className?: string;
}

export default function PerformanceMonitor({ 
  performance, 
  streaming, 
  className = '' 
}: PerformanceMonitorProps) {
  const getConnectionColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-yellow-400';
      case 'poor': return 'text-orange-400';
      case 'disconnected': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm rounded-lg p-4 ${className}`}>
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <Activity className="w-4 h-4" />
        Performance Monitor
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* FPS */}
        <div className="bg-black/30 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">FPS</span>
            <span className={`text-lg font-bold ${
              performance.fps >= 55 ? 'text-green-400' : 
              performance.fps >= 30 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {performance.fps}
            </span>
          </div>
          <div className="mt-1 h-1 bg-gray-700 rounded overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                performance.fps >= 55 ? 'bg-green-400' : 
                performance.fps >= 30 ? 'bg-yellow-400' : 'bg-red-400'
              }`}
              style={{ width: `${Math.min(100, (performance.fps / 60) * 100)}%` }}
            />
          </div>
        </div>

        {/* Latency */}
        <div className="bg-black/30 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Latency</span>
            <span className={`text-lg font-bold ${
              performance.latency <= 50 ? 'text-green-400' : 
              performance.latency <= 100 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {performance.latency}ms
            </span>
          </div>
          <div className="mt-1 h-1 bg-gray-700 rounded overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                performance.latency <= 50 ? 'bg-green-400' : 
                performance.latency <= 100 ? 'bg-yellow-400' : 'bg-red-400'
              }`}
              style={{ width: `${Math.max(0, 100 - (performance.latency / 200) * 100)}%` }}
            />
          </div>
        </div>

        {/* Connection Quality */}
        <div className="bg-black/30 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Connection</span>
            <div className="flex items-center gap-1">
              <Wifi className={`w-4 h-4 ${getConnectionColor(performance.connectionQuality)}`} />
              <span className={`text-sm font-medium capitalize ${getConnectionColor(performance.connectionQuality)}`}>
                {performance.connectionQuality}
              </span>
            </div>
          </div>
        </div>

        {/* Stream Duration */}
        <div className="bg-black/30 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Duration</span>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">
                {formatDuration(streaming.duration)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Status */}
      {streaming.isLive && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-red-400">LIVE</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-300">
              <Users className="w-4 h-4" />
              {streaming.viewerCount} viewers
            </div>
          </div>
        </div>
      )}

      {/* Status Indicators */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${
              performance.fps >= 50 ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
            <span className="text-gray-400">Render</span>
          </div>
          <div className="text-center">
            <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${
              performance.latency <= 100 ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
            <span className="text-gray-400">Network</span>
          </div>
          <div className="text-center">
            <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${
              streaming.isLive ? 'bg-green-400' : 'bg-gray-400'
            }`}></div>
            <span className="text-gray-400">Stream</span>
          </div>
        </div>
      </div>
    </div>
  );
}
