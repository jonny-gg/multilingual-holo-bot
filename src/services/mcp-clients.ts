// MCP 服务器客户端基类
import { shouldUseMockData, getMCPServerUrl } from '@/lib/config';

interface ClientConfig {
  endpoint?: string;
  apiKey?: string;
  models?: string[];
  captureRate?: number;
  resolution?: string;
  syncAccuracy?: number;
}

export abstract class MCPClient {
  protected config: ClientConfig;
  protected connected: boolean = false;

  constructor(config: ClientConfig) {
    this.config = config;
  }

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract isConnected(): boolean;
}

// PIAPI 多模态生成客户端
export class PIAPIClient extends MCPClient {
  private ws: WebSocket | null = null;

  async connect(): Promise<void> {
    // In demo mode, skip actual connection
    if (shouldUseMockData()) {
      this.connected = true;
      console.log('PIAPI MCP Server connected (demo mode)');
      return;
    }

    try {
      const endpoint = getMCPServerUrl('piapi');
      this.ws = new WebSocket(endpoint);
      
      this.ws.onopen = () => {
        this.connected = true;
        console.log('PIAPI MCP Server connected');
      };

      this.ws.onclose = () => {
        this.connected = false;
        console.log('PIAPI MCP Server disconnected');
      };

      this.ws.onerror = (error) => {
        console.error('PIAPI MCP Server error:', error);
        this.connected = false;
      };
    } catch (error) {
      console.error('Failed to connect to PIAPI MCP Server:', error);
      // Fallback to demo mode if connection fails
      this.connected = true;
    }
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  async generateResponse(prompt: string, context: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.isConnected()) {
      throw new Error('PIAPI client not connected');
    }

    return new Promise((resolve, reject) => {
      const message = {
        type: 'generate',
        data: {
          prompt,
          context,
          model: this.config.models?.[0] || 'default',
          temperature: 0.7,
          maxTokens: 1000
        }
      };

      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 10000);

      this.ws!.onmessage = (event) => {
        clearTimeout(timeout);
        try {
          const response = JSON.parse(event.data);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      };

      this.ws!.send(JSON.stringify(message));
    });
  }

  async generateAvatar(description: string): Promise<Record<string, unknown>> {
    if (!this.isConnected()) {
      throw new Error('PIAPI client not connected');
    }

    const message = {
      type: 'generate_avatar',
      data: {
        description,
        format: '3d_model',
        quality: 'high'
      }
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Avatar generation timeout'));
      }, 30000);

      this.ws!.onmessage = (event) => {
        clearTimeout(timeout);
        try {
          const response = JSON.parse(event.data);
          resolve(response);
        } catch (error) {
          reject(error);
        }
      };

      this.ws!.send(JSON.stringify(message));
    });
  }
}

// Screenpipe 动作捕捉客户端
export class ScreenpipeClient extends MCPClient {
  private ws: WebSocket | null = null;
  private onMotionData?: (data: Record<string, unknown>) => void;

  async connect(): Promise<void> {
    try {
      if (!this.config.endpoint) {
        throw new Error('Screenpipe endpoint not configured');
      }
      this.ws = new WebSocket(this.config.endpoint);
      
      this.ws.onopen = () => {
        this.connected = true;
        console.log('Screenpipe MCP Server connected');
        this.startCapture();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'motion_data' && this.onMotionData) {
            this.onMotionData(data.data);
          }
        } catch (error) {
          console.error('Error parsing motion data:', error);
        }
      };

      this.ws.onclose = () => {
        this.connected = false;
        console.log('Screenpipe MCP Server disconnected');
      };

      this.ws.onerror = (error) => {
        console.error('Screenpipe MCP Server error:', error);
        this.connected = false;
      };
    } catch (error) {
      console.error('Failed to connect to Screenpipe MCP Server:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  setMotionDataHandler(handler: (data: Record<string, unknown>) => void): void {
    this.onMotionData = handler;
  }

  private startCapture(): void {
    if (!this.isConnected()) return;

    const message = {
      type: 'start_capture',
      data: {
        captureRate: this.config.captureRate || 30,
        resolution: this.config.resolution || '1920x1080',
        features: ['pose', 'face', 'hands']
      }
    };

    this.ws!.send(JSON.stringify(message));
  }

  stopCapture(): void {
    if (!this.isConnected()) return;

    const message = {
      type: 'stop_capture'
    };

    this.ws!.send(JSON.stringify(message));
  }
}

// Mem0 记忆库客户端
export class Mem0Client extends MCPClient {
  private apiKey: string;

  constructor(config: ClientConfig & { apiKey: string }) {
    super(config);
    this.apiKey = config.apiKey;
  }

  async connect(): Promise<void> {
    try {
      if (!this.config.endpoint) {
        throw new Error('Mem0 endpoint not configured');
      }
      // 测试连接
      const response = await fetch(`${this.config.endpoint}/health`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (response.ok) {
        this.connected = true;
        console.log('Mem0 MCP Server connected');
      } else {
        throw new Error('Failed to connect to Mem0 MCP Server');
      }
    } catch (error) {
      console.error('Failed to connect to Mem0 MCP Server:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async storeMemory(content: string, category: string, importance: number): Promise<Record<string, unknown>> {
    if (!this.isConnected()) {
      throw new Error('Mem0 client not connected');
    }
    if (!this.config.endpoint) {
      throw new Error('Mem0 endpoint not configured');
    }

    const response = await fetch(`${this.config.endpoint}/memories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        content,
        category,
        importance,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to store memory');
    }

    return response.json();
  }

  async retrieveMemories(query: string, limit: number = 10): Promise<Record<string, unknown>[]> {
    if (!this.isConnected()) {
      throw new Error('Mem0 client not connected');
    }
    if (!this.config.endpoint) {
      throw new Error('Mem0 endpoint not configured');
    }

    const response = await fetch(`${this.config.endpoint}/memories/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        query,
        limit
      })
    });

    if (!response.ok) {
      throw new Error('Failed to retrieve memories');
    }

    const data = await response.json();
    return data.memories || [];
  }

  async updatePersonality(trait: string, examples: string[], strength: number): Promise<Record<string, unknown>> {
    if (!this.isConnected()) {
      throw new Error('Mem0 client not connected');
    }
    if (!this.config.endpoint) {
      throw new Error('Mem0 endpoint not configured');
    }

    const response = await fetch(`${this.config.endpoint}/personality`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        trait,
        examples,
        strength
      })
    });

    if (!response.ok) {
      throw new Error('Failed to update personality');
    }

    return response.json();
  }
}

// Lara 多语言唇形同步客户端
export class LaraClient extends MCPClient {
  private ws: WebSocket | null = null;

  async connect(): Promise<void> {
    try {
      if (!this.config.endpoint) {
        throw new Error('Lara endpoint not configured');
      }
      this.ws = new WebSocket(this.config.endpoint);
      
      this.ws.onopen = () => {
        this.connected = true;
        console.log('Lara MCP Server connected');
      };

      this.ws.onclose = () => {
        this.connected = false;
        console.log('Lara MCP Server disconnected');
      };

      this.ws.onerror = (error) => {
        console.error('Lara MCP Server error:', error);
        this.connected = false;
      };
    } catch (error) {
      console.error('Failed to connect to Lara MCP Server:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  async generateLipSync(text: string, language: string, voiceId: string): Promise<Record<string, unknown>> {
    if (!this.isConnected()) {
      throw new Error('Lara client not connected');
    }

    return new Promise((resolve, reject) => {
      const message = {
        type: 'generate_lipsync',
        data: {
          text,
          language,
          voiceId,
          accuracy: this.config.syncAccuracy || 0.95
        }
      };

      const timeout = setTimeout(() => {
        reject(new Error('Lip sync generation timeout'));
      }, 15000);

      this.ws!.onmessage = (event) => {
        clearTimeout(timeout);
        try {
          const response = JSON.parse(event.data);
          if (response.type === 'lipsync_result') {
            resolve(response.data);
          }
        } catch (error) {
          reject(error);
        }
      };

      this.ws!.send(JSON.stringify(message));
    });
  }

  async translateText(text: string, fromLang: string, toLang: string): Promise<string> {
    if (!this.isConnected()) {
      throw new Error('Lara client not connected');
    }

    return new Promise((resolve, reject) => {
      const message = {
        type: 'translate',
        data: {
          text,
          fromLang,
          toLang
        }
      };

      const timeout = setTimeout(() => {
        reject(new Error('Translation timeout'));
      }, 10000);

      this.ws!.onmessage = (event) => {
        clearTimeout(timeout);
        try {
          const response = JSON.parse(event.data);
          if (response.type === 'translation_result') {
            resolve(response.data.translatedText);
          }
        } catch (error) {
          reject(error);
        }
      };

      this.ws!.send(JSON.stringify(message));
    });
  }
}
