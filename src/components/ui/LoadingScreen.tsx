import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'white' | 'purple' | 'blue' | 'green';
  className?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  color = 'purple', 
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    white: 'text-white',
    purple: 'text-purple-400',
    blue: 'text-blue-400',
    green: 'text-green-400'
  };

  return (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`} 
    />
  );
}

interface LoadingScreenProps {
  message?: string;
  progress?: number;
  details?: string[];
}

export default function LoadingScreen({ 
  message = 'Initializing Holographic System...', 
  progress,
  details = []
}: LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-black/50 backdrop-blur-sm rounded-xl p-8 max-w-md w-full border border-purple-500/20">
        <div className="text-center">
          {/* Holographic Loading Animation */}
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto">
              {/* Outer ring */}
              <div className="absolute inset-0 border-2 border-purple-500/30 rounded-full animate-spin"></div>
              {/* Middle ring */}
              <div className="absolute inset-2 border-2 border-blue-400/50 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2s' }}></div>
              {/* Inner ring */}
              <div className="absolute inset-4 border-2 border-cyan-300/70 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
              {/* Center dot */}
              <div className="absolute inset-8 bg-white rounded-full animate-pulse"></div>
            </div>
            
            {/* Holographic particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-purple-400 rounded-full animate-ping"
                  style={{
                    left: `${20 + Math.cos(i * Math.PI / 4) * 40}%`,
                    top: `${50 + Math.sin(i * Math.PI / 4) * 40}%`,
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: '2s'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Loading Message */}
          <h2 className="text-xl font-bold text-white mb-4">
            {message}
          </h2>

          {/* Progress Bar */}
          {progress !== undefined && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-400 mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Loading Details */}
          {details.length > 0 && (
            <div className="text-left">
              <h3 className="text-sm font-semibold text-gray-300 mb-2">System Status:</h3>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {details.map((detail, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                    {detail}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Subtle animations */}
          <div className="mt-6 flex justify-center space-x-1">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple inline loading component
export function InlineLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 text-gray-400">
      <LoadingSpinner size="sm" />
      <span className="text-sm">{message}</span>
    </div>
  );
}
