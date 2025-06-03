// MCP 服务管理器 - 统一管理所有MCP服务
import { PIAPIClient, ScreenpipeClient, Mem0Client, LaraClient } from './mcp-clients';
import { MCPServerConfig, MotionCaptureData, AIResponse, LipSyncData, SupportedLanguage, EmotionalState } from '@/types';

export class MCPServiceManager {
  private piapi: PIAPIClient;
  private screenpipe: ScreenpipeClient;
  private mem0: Mem0Client;
  private lara: LaraClient;
  private connected: boolean = false;

  constructor(private config: MCPServerConfig) {
    this.piapi = new PIAPIClient(config.piapi);
    this.screenpipe = new ScreenpipeClient(config.screenpipe);
    this.mem0 = new Mem0Client(config.mem0);
    this.lara = new LaraClient(config.lara);
  }

  async initialize(): Promise<void> {
    try {
      console.log('Initializing MCP services...');
      
      // 并行连接所有服务
      await Promise.all([
        this.piapi.connect(),
        this.screenpipe.connect(),
        this.mem0.connect(),
        this.lara.connect()
      ]);

      this.connected = true;
      console.log('All MCP services connected successfully');

      // 设置动作捕捉数据处理器
      this.screenpipe.setMotionDataHandler((data: Record<string, unknown>) => {
        this.handleMotionData(data as unknown as MotionCaptureData);
      });

    } catch (error) {
      console.error('Failed to initialize MCP services:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await Promise.all([
      this.piapi.disconnect(),
      this.screenpipe.disconnect(),
      this.mem0.disconnect(),
      this.lara.disconnect()
    ]);
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected && 
           this.piapi.isConnected() && 
           this.screenpipe.isConnected() && 
           this.mem0.isConnected() && 
           this.lara.isConnected();
  }

  // 处理实时动作捕捉数据
  private handleMotionData(data: MotionCaptureData): void {
    // 这里可以添加动作数据的预处理逻辑
    // 例如：平滑处理、异常值过滤等
    this.onMotionUpdate?.(data);
  }

  private onMotionUpdate?: (data: MotionCaptureData) => void;
  private onResponseGenerated?: (response: AIResponse) => void;
  private onLipSyncGenerated?: (lipSync: LipSyncData) => void;

  // 设置回调函数
  setMotionUpdateHandler(handler: (data: MotionCaptureData) => void): void {
    this.onMotionUpdate = handler;
  }

  setResponseGeneratedHandler(handler: (response: AIResponse) => void): void {
    this.onResponseGenerated = handler;
  }

  setLipSyncGeneratedHandler(handler: (lipSync: LipSyncData) => void): void {
    this.onLipSyncGenerated = handler;
  }

  // 生成AI响应（核心对话逻辑）
  async generateResponse(
    message: string, 
    avatarId: string, 
    language: string = 'zh-CN'
  ): Promise<AIResponse> {
    try {
      // 1. 从记忆库检索相关记忆
      const memories = await this.mem0.retrieveMemories(message, 5);
      
      // 2. 构建上下文
      const context = {
        message,
        language,
        memories: memories.map((m: Record<string, unknown>) => m.content as string),
        timestamp: new Date().toISOString()
      };

      // 3. 生成AI响应
      const response = await this.piapi.generateResponse(message, context);

      // 4. 存储新的记忆
      await this.mem0.storeMemory(
        `User: ${message} | Assistant: ${response.text as string}`,
        'conversation',
        0.8
      );

      const aiResponse: AIResponse = {
        text: response.text as string,
        emotion: (response.emotion as EmotionalState) || 'neutral',
        gestures: (response.gestures as string[]) || [],
        voiceSettings: (response.voiceSettings as Record<string, unknown>) || {},
        metadata: {
          confidence: (response.confidence as number) || 0.8,
          processingTime: (response.processingTime as number) || 0,
          memoryUsed: memories.map((m: Record<string, unknown>) => m.id as string)
        }
      };

      // 5. 触发回调
      this.onResponseGenerated?.(aiResponse);

      return aiResponse;
    } catch (error) {
      console.error('Failed to generate AI response:', error);
      throw error;
    }
  }

  // 生成多语言唇形同步
  async generateLipSync(
    text: string, 
    language: string, 
    voiceId: string
  ): Promise<LipSyncData> {
    try {
      const lipSyncData = await this.lara.generateLipSync(text, language, voiceId);
      
      const result: LipSyncData = {
        phonemes: (lipSyncData.phonemes as Array<{
          phoneme: string;
          startTime: number;
          endTime: number;
          intensity: number;
        }>) || [],
        duration: (lipSyncData.duration as number) || 0,
        language: language as SupportedLanguage
      };

      this.onLipSyncGenerated?.(result);
      return result;
    } catch (error) {
      console.error('Failed to generate lip sync:', error);
      throw error;
    }
  }

  // 翻译文本
  async translateText(
    text: string, 
    fromLang: string, 
    toLang: string
  ): Promise<string> {
    try {
      return await this.lara.translateText(text, fromLang, toLang);
    } catch (error) {
      console.error('Failed to translate text:', error);
      throw error;
    }
  }

  // 开始动作捕捉
  startMotionCapture(): void {
    if (this.screenpipe.isConnected()) {
      // screenpipe 在连接时会自动开始捕捉
      console.log('Motion capture started');
    }
  }

  // 停止动作捕捉
  stopMotionCapture(): void {
    if (this.screenpipe.isConnected()) {
      this.screenpipe.stopCapture();
      console.log('Motion capture stopped');
    }
  }

  // 更新角色人格
  async updatePersonality(
    trait: string, 
    examples: string[], 
    strength: number
  ): Promise<void> {
    try {
      await this.mem0.updatePersonality(trait, examples, strength);
      console.log(`Personality trait "${trait}" updated`);
    } catch (error) {
      console.error('Failed to update personality:', error);
      throw error;
    }
  }

  // 生成3D头像
  async generateAvatar(description: string): Promise<Record<string, unknown>> {
    try {
      return await this.piapi.generateAvatar(description);
    } catch (error) {
      console.error('Failed to generate avatar:', error);
      throw error;
    }
  }

  // 批量处理消息（用于7x24小时直播）
  async processStreamMessages(messages: string[]): Promise<AIResponse[]> {
    const responses: AIResponse[] = [];
    
    for (const message of messages) {
      try {
        const response = await this.generateResponse(message, 'default', 'zh-CN');
        responses.push(response);
        
        // 添加延迟以避免过快响应
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error processing stream message:', error);
      }
    }
    
    return responses;
  }

  // 健康检查
  async healthCheck(): Promise<{ [key: string]: boolean }> {
    return {
      piapi: this.piapi.isConnected(),
      screenpipe: this.screenpipe.isConnected(),
      mem0: this.mem0.isConnected(),
      lara: this.lara.isConnected(),
      overall: this.isConnected()
    };
  }

  // 获取服务统计信息
  getServiceStats(): Record<string, unknown> {
    return {
      connected: this.isConnected(),
      services: {
        piapi: { connected: this.piapi.isConnected() },
        screenpipe: { connected: this.screenpipe.isConnected() },
        mem0: { connected: this.mem0.isConnected() },
        lara: { connected: this.lara.isConnected() }
      },
      timestamp: new Date().toISOString()
    };
  }
}
