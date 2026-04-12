export type AIProvider =
  | "ollama"
  | "llama_cpp"
  | "openai"
  | "anthropic"
  | "openrouter"
  | "custom"
  | "auto";

export type ModelUseCase =
  | "general"
  | "theory"
  | "production"
  | "sound-design"
  | "mixing"
  | "mastering"
  | "analysis"
  | "creative";

export interface AIConfig {
  provider: AIProvider;
  preferredLocalModel: string;
  preferredCloudModel: string;
  cloudApiKey?: string;
  cloudBaseUrl?: string;
  openrouterApiKey?: string;
  ollamaBaseUrl: string;
  llamaCppBaseUrl: string;
  timeoutMs: number;
  maxRetries: number;
  streamResponses: boolean;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  contextLength: number;
  pricingPrompt: number;
  pricingCompletion: number;
  isFree: boolean;
  topProvider: string;
}

export interface LlamaCppStatus {
  available: boolean;
  modelLoaded?: string;
  error?: string;
}

export interface LlamaCppModel {
  id: string;
  name: string;
  ownedBy: string;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  model?: string;
  createdAt: string;
}

export interface OllamaModel {
  id: string;
  name: string;
  description: string;
  sizeGb: number;
  parameterCount: string;
  useCases: ModelUseCase[];
  quantization: string;
  installed: boolean;
  downloadedAt?: string;
  version: string;
}

export interface HardwareCapabilities {
  totalMemoryGb: number;
  gpuMemoryGb?: number;
  cpuCores: number;
  cpuVendor: string;
  os: string;
  isAppleSilicon: boolean;
}

export interface ModelRecommendation {
  modelId: string;
  name: string;
  sizeGb: number;
  useCases: ModelUseCase[];
  reasoning: string;
  estimatedSpeed: "fast" | "medium" | "slow";
  quality: "basic" | "good" | "excellent";
}

export interface DownloadProgress {
  modelId: string;
  status: "downloading" | "verifying" | "completed" | "error";
  bytesDownloaded: number;
  bytesTotal: number;
  percentage: number;
  speedMbps: number;
  estimatedSecondsRemaining: number;
  error?: string;
}

export interface OllamaStatus {
  available: boolean;
  version?: string;
  error?: string;
}

export interface StreamingMessage {
  id: string;
  role: "assistant";
  content: string;
  isStreaming: boolean;
}
