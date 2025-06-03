# 全息数字人直播系统 (Holographic Digital Human Livestreaming System)

A comprehensive multilingual holographic digital human livestreaming system with AI-powered interactions, real-time motion capture, and cross-platform streaming capabilities.

## 🌟 Features

- **🤖 AI-Powered Digital Humans**: Multi-modal AI generation with personality memory
- **🎭 Real-time 3D Animation**: Motion capture integration with facial expressions
- **🌍 12-Language Support**: Real-time translation and lip-sync technology
- **📹 Live Streaming**: 7×24 continuous streaming for e-commerce
- **💬 Interactive Chat**: Real-time viewer engagement with AI responses
- **🎨 Emotion Control**: Dynamic emotional expressions and reactions

## 🏗️ Architecture

### Core Components

1. **PIAPI MCP Server** (`apinetwork/piapi-mcp-server`)
   - Multimodal AI content generation
   - Text, image, and video processing

2. **Screenpipe** (`mediar-ai/screenpipe`)
   - Real-time motion capture
   - Skeletal tracking and facial recognition

3. **Mem0 MCP** (`mem0ai/mem0-mcp`)
   - Personality memory database
   - Consistent character behavior

4. **Lara MCP** (`translated/lara-mcp`)
   - Multilingual lip-sync
   - Real-time phoneme generation

### Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **3D Rendering**: Three.js, React Three Fiber
- **Styling**: Tailwind CSS, Framer Motion
- **Real-time**: Socket.IO, WebSocket
- **State Management**: React Hooks

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- WebCamera (for motion capture)
- Microphone (for voice input)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd multilingual-holo-bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

### Environment Setup

Create a `.env.local` file:

```env
# MCP Server Endpoints
PIAPI_MCP_URL=ws://localhost:8001
SCREENPIPE_MCP_URL=ws://localhost:8002
MEM0_MCP_URL=ws://localhost:8003
LARA_MCP_URL=ws://localhost:8004

# API Keys (when using real services)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Main application page
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── 3d/               # 3D rendering components
│   ├── controls/         # Control panels
│   ├── streaming/        # Streaming interfaces
│   └── ui/               # UI components
├── services/             # MCP clients and services
│   ├── mcp-clients.ts    # Individual MCP clients
│   └── mcp-manager.ts    # Service orchestration
├── types/                # TypeScript definitions
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configurations
├── stores/               # State management
└── utils/                # Helper functions
```

## 🎮 Usage

### Basic Operation

1. **Start the Application**
   - Launch the dev server: `npm run dev`
   - Open browser to http://localhost:3000

2. **Configure Avatar**
   - Select language (12 supported)
   - Set personality traits
   - Adjust appearance settings

3. **Begin Streaming**
   - Click "Start Streaming"
   - Enable camera/microphone
   - Start interacting with viewers

## 🔧 Development Status

### ✅ Completed
- [x] Project setup with Next.js 15 + TypeScript
- [x] 3D avatar system with Three.js
- [x] MCP service integration layer
- [x] Real-time chat interface
- [x] Streaming control panel
- [x] Type-safe architecture
- [x] Basic emotion system

### 🚧 In Progress  
- [ ] MCP server deployment
- [ ] Motion capture integration
- [ ] Voice synthesis
- [ ] Production optimization

### 📋 TODO
- [ ] Add 3D models and textures
- [ ] Deploy MCP servers
- [ ] Audio streaming pipeline
- [ ] Performance optimization
- [ ] Production deployment

## 🧪 Demo Mode

The application currently runs in demo mode with:
- Mock MCP responses
- Simulated motion capture
- Basic 3D avatar
- Interactive controls

## 📚 Next Steps

1. **Setup MCP Servers**: Deploy and configure the 4 MCP servers
2. **3D Assets**: Add realistic avatar models and animations  
3. **Audio Integration**: Implement voice synthesis and streaming
4. **Performance**: Optimize for real-time processing
5. **Deployment**: Production environment setup
