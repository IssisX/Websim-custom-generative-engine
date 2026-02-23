import { v4 as uuidv4 } from 'uuid';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini directly on the frontend
// The API key is injected by Vite's define plugin in AI Studio
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// Types for the AI Studio API simulation
export interface AIStudioChatCompletion {
  content: string;
}

export interface AIStudioUser {
  username: string;
  id: string;
}

export class AIStudioSocket {
  private ws: WebSocket;
  public store: any;
  public onPeersChanged: (peers: any) => void = () => {};
  public onmessage: (event: MessageEvent) => void = () => {};
  public onRecordChanged: (id: string) => void = () => {};

  constructor() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    this.ws = new WebSocket(`${protocol}//${window.location.host}`);
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'SYNC_STORE') {
        // Initial sync
      } else if (data.type === 'STORE_UPDATED') {
        this.onRecordChanged(data.payload.key);
      } else if (data.type === 'PEER_PRESENCE') {
        this.onPeersChanged(data.payload);
      }
      this.onmessage(event);
    };

    this.store = {
      get: async (key: string) => {
        return null; 
      },
      update: (update: any) => {
        this.ws.send(JSON.stringify({
          type: 'UPDATE_STORE',
          payload: { key: update.id, value: update }
        }));
      }
    };
  }

  updatePresence(data: any) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'PRESENCE', payload: data }));
    }
  }

  send(data: any) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }
  
  collection(name: string) {
      return {
          create: (data: any) => console.log(`[Collection ${name}] Create:`, data),
          getList: () => [],
          update: (id: string, data: any) => console.log(`[Collection ${name}] Update ${id}:`, data),
          delete: (id: string) => console.log(`[Collection ${name}] Delete ${id}`)
      }
  }
}

// The global aistudio object
export const aistudio = {
  chat: {
    completions: {
      create: async (options: { messages: any[], json?: boolean }) => {
        if (!apiKey) {
          throw new Error("GEMINI_API_KEY is missing. AI Studio environment should inject this automatically.");
        }
        
        const model = "gemini-3-flash-preview";
        const prompt = options.messages.map((m: any) => `${m.role}: ${m.content}`).join("\n");
        
        const config: any = {};
        if (options.json) {
          config.responseMimeType = "application/json";
        }

        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config
          });

          let text = response.text || "";
          // Strip markdown code blocks if the model accidentally includes them
          text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
          
          return { content: text };
        } catch (e: any) {
          console.error("Gemini API Error:", e);
          throw new Error(e.message || "Failed to generate content from Gemini.");
        }
      }
    }
  },
  imageGen: async (options: { prompt: string, aspect_ratio?: string }) => {
      return { url: `https://picsum.photos/seed/${encodeURIComponent(options.prompt)}/512/512` };
  },
  getUser: async () => {
    return { username: 'User_' + Math.floor(Math.random() * 1000), id: uuidv4() };
  }
};

// Expose to window
(window as any).aistudio = aistudio;
(window as any).AIStudioSocket = AIStudioSocket;
