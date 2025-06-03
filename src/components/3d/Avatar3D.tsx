'use client';

import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Avatar, MotionCaptureData, EmotionalState, LipSyncData } from '@/types';

interface Avatar3DProps {
  avatar: Avatar;
  motionData?: MotionCaptureData;
  lipSyncData?: LipSyncData;
  emotion?: EmotionalState;
  isStreaming?: boolean;
}

// 3D头像模型组件
function AvatarModel({ motionData, lipSyncData, emotion }: Avatar3DProps) {
  const meshRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const eyesRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  
  // 动画状态
  const [currentAnimation] = useState('idle');
  const [blinkTimer, setBlinkTimer] = useState(0);
  const [lipSyncTimer, setLipSyncTimer] = useState(0);

  // 头部基础材质
  const headMaterial = new THREE.MeshStandardMaterial({
    color: 0xffdbac,
    roughness: 0.7,
    metalness: 0.1
  });

  // 眼部材质
  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a4a4a,
    roughness: 0.2,
    metalness: 0.8
  });

  // 嘴部材质
  const mouthMaterial = new THREE.MeshStandardMaterial({
    color: 0xff6b9d,
    roughness: 0.6,
    metalness: 0.1
  });

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // 处理动作捕捉数据
    if (motionData) {
      // 头部旋转
      if (headRef.current && motionData.pose.head) {
        headRef.current.rotation.x = motionData.pose.head.x;
        headRef.current.rotation.y = motionData.pose.head.y;
        headRef.current.rotation.z = motionData.pose.head.z;
      }

      // 面部表情
      if (motionData.facial) {
        // 眼部动画
        if (eyesRef.current) {
          const eyeScale = 1 - (motionData.facial.eyes.left + motionData.facial.eyes.right) / 2;
          eyesRef.current.scale.y = Math.max(0.1, eyeScale);
        }

        // 嘴部动画
        if (mouthRef.current && motionData.facial.mouth) {
          mouthRef.current.scale.x = 1 + motionData.facial.mouth.width * 0.5;
          mouthRef.current.scale.y = 1 + motionData.facial.mouth.openness * 0.8;
        }
      }
    }

    // 自动眨眼
    setBlinkTimer(prev => prev + delta);
    if (blinkTimer > 3 + Math.random() * 2) { // 3-5秒眨眼一次
      setBlinkTimer(0);
      if (eyesRef.current) {
        // 快速眨眼动画
        eyesRef.current.scale.y = 0.1;
        setTimeout(() => {
          if (eyesRef.current) eyesRef.current.scale.y = 1;
        }, 100);
      }
    }

    // 唇形同步动画
    if (lipSyncData && mouthRef.current) {
      setLipSyncTimer(prev => prev + delta);
      
      const currentTime = lipSyncTimer * 1000; // 转换为毫秒
      const currentPhoneme = lipSyncData.phonemes.find(
        p => currentTime >= p.startTime && currentTime <= p.endTime
      );

      if (currentPhoneme) {
        // 根据音素调整嘴型
        const mouthShapes = getMouthShape(currentPhoneme.phoneme);
        mouthRef.current.scale.x = mouthShapes.width;
        mouthRef.current.scale.y = mouthShapes.height;
        mouthRef.current.position.y = mouthShapes.openness;
      }
    }

    // 情感表达
    if (emotion && headRef.current) {
      const emotionParams = getEmotionParams(emotion);
      
      // 调整头部倾斜
      headRef.current.rotation.z += emotionParams.headTilt * 0.1;
      
      // 调整眉毛位置（通过头部微调）
      headRef.current.position.y += emotionParams.eyebrowRaise * 0.05;
    }

    // idle 动画 - 轻微摇摆
    if (currentAnimation === 'idle') {
      meshRef.current.rotation.y += Math.sin(state.clock.elapsedTime * 0.5) * 0.01;
      meshRef.current.position.y += Math.sin(state.clock.elapsedTime * 0.3) * 0.02;
    }
  });

  return (
    <group ref={meshRef}>
      {/* 头部 */}
      <mesh ref={headRef} material={headMaterial}>
        <sphereGeometry args={[1, 32, 32]} />
      </mesh>

      {/* 眼部 */}
      <group ref={eyesRef} position={[0, 0.2, 0.8]}>
        {/* 左眼 */}
        <mesh position={[-0.3, 0, 0]} material={eyeMaterial}>
          <sphereGeometry args={[0.15, 16, 16]} />
        </mesh>
        {/* 右眼 */}
        <mesh position={[0.3, 0, 0]} material={eyeMaterial}>
          <sphereGeometry args={[0.15, 16, 16]} />
        </mesh>
      </group>

      {/* 嘴部 */}
      <mesh ref={mouthRef} position={[0, -0.3, 0.8]} material={mouthMaterial}>
        <cylinderGeometry args={[0.2, 0.15, 0.1, 8]} />
      </mesh>

      {/* 鼻子 */}
      <mesh position={[0, 0, 0.9]} material={headMaterial}>
        <coneGeometry args={[0.1, 0.3, 8]} />
      </mesh>

      {/* 头发 */}
      <mesh position={[0, 0.8, 0]} material={new THREE.MeshStandardMaterial({ color: 0x8B4513 })}>
        <sphereGeometry args={[1.1, 16, 8, 0, Math.PI]} />
      </mesh>
    </group>
  );
}

// 背景环境组件
function SceneEnvironment() {
  return (
    <>
      <Environment preset="studio" />
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} />
      <pointLight position={[-10, -10, -5]} intensity={0.3} color="#ff6b9d" />
    </>
  );
}

// 直播状态指示器
function StreamingIndicator({ isStreaming }: { isStreaming: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current && isStreaming) {
      // Fix material type issue
      const material = meshRef.current.material as THREE.MeshBasicMaterial;
      if (material && 'opacity' in material) {
        material.opacity = 0.5 + Math.sin(state.clock.elapsedTime * 4) * 0.3;
      }
    }
  });

  if (!isStreaming) return null;

  return (
    <mesh ref={meshRef} position={[-2, 2, 0]}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshBasicMaterial color="red" transparent />
    </mesh>
  );
}

// 主要的3D头像组件
export default function Avatar3D({ 
  avatar, 
  motionData, 
  lipSyncData, 
  emotion = 'neutral',
  isStreaming = false 
}: Avatar3DProps) {
  return (
    <div className="w-full h-full bg-gradient-to-b from-purple-900 to-black">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        className="w-full h-full"
      >
        <SceneEnvironment />
        <AvatarModel 
          avatar={avatar}
          motionData={motionData}
          lipSyncData={lipSyncData}
          emotion={emotion}
        />
        <StreamingIndicator isStreaming={isStreaming} />
        <OrbitControls 
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          maxDistance={10}
          minDistance={2}
        />
        
        {/* 头像名称 */}
        <Text
          position={[0, -2, 0]}
          fontSize={0.5}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {avatar.name}
        </Text>
      </Canvas>
    </div>
  );
}

// 根据音素获取嘴型
function getMouthShape(phoneme: string): { width: number; height: number; openness: number } {
  const mouthShapes: { [key: string]: { width: number; height: number; openness: number } } = {
    'A': { width: 1.3, height: 1.5, openness: 0.2 },
    'E': { width: 1.1, height: 1.2, openness: 0.1 },
    'I': { width: 0.8, height: 1.0, openness: 0.05 },
    'O': { width: 1.0, height: 1.8, openness: 0.25 },
    'U': { width: 0.7, height: 1.6, openness: 0.15 },
    'M': { width: 1.0, height: 0.8, openness: -0.1 },
    'B': { width: 1.0, height: 0.8, openness: -0.1 },
    'P': { width: 1.0, height: 0.8, openness: -0.1 },
    'F': { width: 1.2, height: 0.9, openness: 0.0 },
    'V': { width: 1.2, height: 0.9, openness: 0.0 },
    'TH': { width: 1.1, height: 1.0, openness: 0.05 },
    'S': { width: 0.9, height: 1.0, openness: 0.02 },
    'SH': { width: 0.8, height: 1.2, openness: 0.08 },
    'R': { width: 1.0, height: 1.1, openness: 0.1 },
    'L': { width: 1.0, height: 1.1, openness: 0.08 },
    'silent': { width: 1.0, height: 1.0, openness: 0.0 }
  };

  return mouthShapes[phoneme] || mouthShapes['silent'];
}

// 根据情感获取表情参数
function getEmotionParams(emotion: EmotionalState): { 
  headTilt: number; 
  eyebrowRaise: number; 
  mouthCurve: number;
} {
  const emotionParams: { [key in EmotionalState]: { headTilt: number; eyebrowRaise: number; mouthCurve: number } } = {
    'neutral': { headTilt: 0, eyebrowRaise: 0, mouthCurve: 0 },
    'happy': { headTilt: 0.1, eyebrowRaise: 0.2, mouthCurve: 0.3 },
    'sad': { headTilt: -0.1, eyebrowRaise: -0.3, mouthCurve: -0.2 },
    'excited': { headTilt: 0.2, eyebrowRaise: 0.4, mouthCurve: 0.4 },
    'surprised': { headTilt: 0, eyebrowRaise: 0.6, mouthCurve: 0.1 },
    'confused': { headTilt: 0.3, eyebrowRaise: -0.1, mouthCurve: -0.1 },
    'angry': { headTilt: -0.2, eyebrowRaise: -0.4, mouthCurve: -0.3 },
    'thoughtful': { headTilt: 0.1, eyebrowRaise: 0.1, mouthCurve: -0.1 }
  };

  return emotionParams[emotion];
}
