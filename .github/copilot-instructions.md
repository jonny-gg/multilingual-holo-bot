# 全息数字人直播系统 - Copilot 指令

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## 项目概述
这是一个全息数字人直播系统，集成了多个AI服务和3D渲染技术。

## 核心组件
- `apinetwork/piapi-mcp-server` - 多模态AI生成
- `mediar-ai/screenpipe` - 实时动作捕捉
- `mem0ai/mem0-mcp` - 人格记忆库
- `translated/lara-mcp` - 多语言唇形同步

## 技术栈
- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- Three.js for 3D rendering
- WebRTC for streaming
- Socket.IO for real-time communication

## 编码约定
- 使用函数式组件和React Hooks
- 优先使用TypeScript的严格类型
- 使用Tailwind CSS进行样式设计
- 模块化架构，每个功能独立封装
- 遵循React和Next.js最佳实践

## 文件组织
- `/src/components` - React组件
- `/src/lib` - 工具函数和配置
- `/src/services` - API服务和MCP客户端
- `/src/hooks` - 自定义React Hooks
- `/src/types` - TypeScript类型定义
- `/src/app` - Next.js App Router页面

## 特殊要求
- 所有AI生成的内容需要实时处理
- 3D动画需要高性能优化
- 支持多语言国际化
- 确保7×24小时稳定运行
