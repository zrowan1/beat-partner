export type AIProvider = "ollama" | "openai" | "anthropic" | "custom" | "auto";

export interface AIConfig {
  provider: AIProvider;
  preferredLocalModel: string;
  preferredCloudModel: string;
  cloudApiKey?: string;
  cloudBaseUrl?: string;
  ollamaBaseUrl: string;
  timeoutMs: number;
  maxRetries: number;
  streamResponses: boolean;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model?: string;
  createdAt: string;
}
