import { invoke } from "@tauri-apps/api/core";
import { Channel } from "@tauri-apps/api/core";
import type {
  AIMessage,
  AIProvider,
  DownloadProgress,
  HardwareCapabilities,
  LlamaCppModel,
  LlamaCppStatus,
  ModelRecommendation,
  ModelUseCase,
  OllamaModel,
  OllamaStatus,
} from "@/types";

// Ollama status check
export async function checkOllamaStatus(baseUrl?: string): Promise<OllamaStatus> {
  return invoke("check_ollama_status", { baseUrl });
}

// llama.cpp status check and model listing
export async function checkLlamaCppStatus(baseUrl?: string): Promise<LlamaCppStatus> {
  return invoke("check_llamacpp_status", { baseUrl });
}

export async function listLlamaCppModels(baseUrl?: string): Promise<LlamaCppModel[]> {
  return invoke("list_llamacpp_models", { baseUrl });
}

// Model management
export async function listOllamaModels(baseUrl?: string): Promise<OllamaModel[]> {
  return invoke("list_ollama_models", { baseUrl });
}

export async function downloadModel(
  modelId: string,
  baseUrl?: string,
  onProgress?: (progress: DownloadProgress) => void
): Promise<void> {
  const channel = new Channel<DownloadProgress>();
  
  if (onProgress) {
    channel.onmessage = onProgress;
  }
  
  return invoke("download_model", { modelId, baseUrl, onProgress: channel });
}

export async function deleteOllamaModel(
  modelId: string,
  baseUrl?: string
): Promise<void> {
  return invoke("delete_ollama_model", { modelId, baseUrl });
}

// Hardware & recommendations
export async function checkHardwareCapabilities(): Promise<HardwareCapabilities> {
  return invoke("check_hardware_capabilities");
}

export async function getModelRecommendations(
  useCase?: ModelUseCase
): Promise<ModelRecommendation[]> {
  return invoke("get_model_recommendations", { useCase });
}

// Chat
export interface SendChatMessageParams {
  projectId?: number;
  sessionId: string;
  content: string;
  model: string;
  provider: AIProvider;
  baseUrl?: string;
  apiKey?: string;
  onChunk: (chunk: string) => void;
}

export async function sendChatMessage(
  params: SendChatMessageParams
): Promise<AIMessage> {
  const { projectId, sessionId, content, model, provider, baseUrl, apiKey, onChunk } = params;

  const channel = new Channel<string>();
  channel.onmessage = onChunk;

  return invoke("send_chat_message", {
    projectId,
    sessionId,
    content,
    model,
    provider,
    baseUrl,
    apiKey,
    onChunk: channel,
  });
}

export async function loadChatHistory(
  sessionId: string,
  limit?: number
): Promise<AIMessage[]> {
  return invoke("load_chat_history", { sessionId, limit });
}

export async function clearChatHistory(sessionId: string): Promise<void> {
  return invoke("clear_chat_history", { sessionId });
}

// Generate unique session ID
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Format model size for display
export function formatModelSize(sizeGb: number): string {
  if (sizeGb >= 1) {
    return `${sizeGb.toFixed(1)} GB`;
  }
  return `${(sizeGb * 1024).toFixed(0)} MB`;
}

// Get use case label
export function getUseCaseLabel(useCase: ModelUseCase): string {
  const labels: Record<ModelUseCase, string> = {
    general: "General",
    theory: "Music Theory",
    production: "Production",
    "sound-design": "Sound Design",
    mixing: "Mixing",
    mastering: "Mastering",
    analysis: "Analysis",
    creative: "Creative",
  };
  return labels[useCase];
}

// Get use case description
export function getUseCaseDescription(useCase: ModelUseCase): string {
  const descriptions: Record<ModelUseCase, string> = {
    general: "General questions and quick tips",
    theory: "Music theory, harmony, and chords",
    production: "Production techniques and workflow",
    "sound-design": "Synthesizer programming and sound design",
    mixing: "Mixing advice, EQ, and compression",
    mastering: "Mastering techniques",
    analysis: "Detailed track analysis",
    creative: "Brainstorming and idea generation",
  };
  return descriptions[useCase];
}
