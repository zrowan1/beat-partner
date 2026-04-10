import { create } from "zustand";
import type {
  AIProvider,
  AIMessage,
  OllamaModel,
  HardwareCapabilities,
  ModelRecommendation,
  ModelUseCase,
  DownloadProgress,
} from "@/types";
import * as aiApi from "@/services/aiApi";
import toast from "react-hot-toast";

const DEFAULT_CHAT_HISTORY_LIMIT = 100;

interface AIState {
  // Provider & Models
  provider: AIProvider;
  availableProviders: AIProvider[];
  ollamaBaseUrl: string;
  cloudApiKey: string | null;
  cloudBaseUrl: string | null;
  models: OllamaModel[];
  selectedModel: string | null;
  isLoadingModels: boolean;

  // Hardware
  hardware: HardwareCapabilities | null;
  isLoadingHardware: boolean;
  recommendations: ModelRecommendation[];
  isLoadingRecommendations: boolean;

  // Downloads
  activeDownloads: Map<string, DownloadProgress>;

  // Chat
  messages: AIMessage[];
  sessionId: string;
  isStreaming: boolean;
  streamingContent: string;
  chatHistoryLimit: number;

  // UI State
  showModelManager: boolean;
  ollamaStatus: "unknown" | "available" | "unavailable";

  // Actions
  setProvider: (provider: AIProvider) => void;
  setOllamaBaseUrl: (url: string) => void;
  setCloudApiKey: (key: string | null) => void;
  setCloudBaseUrl: (url: string | null) => void;
  setSelectedModel: (modelId: string | null) => void;
  setChatHistoryLimit: (limit: number) => void;
  toggleModelManager: () => void;

  // Async actions
  checkOllamaStatus: () => Promise<void>;
  loadModels: () => Promise<void>;
  loadHardwareInfo: () => Promise<void>;
  loadRecommendations: (useCase?: ModelUseCase) => Promise<void>;
  downloadModel: (modelId: string) => Promise<void>;
  deleteModel: (modelId: string) => Promise<void>;

  // Chat actions
  loadChatHistory: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => Promise<void>;
  updateStreamingContent: (content: string) => void;
  finalizeStreamingMessage: () => void;
}

export const useAIStore = create<AIState>((set, get) => ({
  // Initial state
  provider: "auto",
  availableProviders: ["auto", "ollama", "openai", "anthropic", "custom"],
  ollamaBaseUrl: "http://localhost:11434",
  cloudApiKey: null,
  cloudBaseUrl: null,
  models: [],
  selectedModel: null,
  isLoadingModels: false,

  hardware: null,
  isLoadingHardware: false,
  recommendations: [],
  isLoadingRecommendations: false,

  activeDownloads: new Map(),

  messages: [],
  sessionId: aiApi.generateSessionId(),
  isStreaming: false,
  streamingContent: "",
  chatHistoryLimit: DEFAULT_CHAT_HISTORY_LIMIT,

  showModelManager: false,
  ollamaStatus: "unknown",

  // Actions
  setProvider: (provider) => set({ provider }),

  setOllamaBaseUrl: (url) => set({ ollamaBaseUrl: url }),

  setCloudApiKey: (key) => set({ cloudApiKey: key }),

  setCloudBaseUrl: (url) => set({ cloudBaseUrl: url }),

  setSelectedModel: (modelId) => set({ selectedModel: modelId }),

  setChatHistoryLimit: (limit) => set({ chatHistoryLimit: limit }),

  toggleModelManager: () =>
    set((state) => ({ showModelManager: !state.showModelManager })),

  // Async actions
  checkOllamaStatus: async () => {
    try {
      const { ollamaBaseUrl } = get();
      const status = await aiApi.checkOllamaStatus(ollamaBaseUrl);

      set({ ollamaStatus: status.available ? "available" : "unavailable" });

      if (status.available) {
        toast.success(`Ollama connected${status.version ? ` (v${status.version})` : ""}`);
      }
    } catch (error) {
      console.error("Ollama status check failed:", error);
      set({ ollamaStatus: "unavailable" });
    }
  },

  loadModels: async () => {
    set({ isLoadingModels: true });

    try {
      const { ollamaBaseUrl, selectedModel } = get();
      const models = await aiApi.listOllamaModels(ollamaBaseUrl);

      set({
        models,
        isLoadingModels: false,
        selectedModel: selectedModel || (models.length > 0 ? models[0].id : null),
      });
    } catch (error) {
      console.error("Failed to load models:", error);
      set({ 
        models: [],
        isLoadingModels: false,
        selectedModel: null,
      });
      // Don't throw here - let the caller decide if this is an error
      throw error;
    }
  },

  loadHardwareInfo: async () => {
    set({ isLoadingHardware: true });

    try {
      const hardware = await aiApi.checkHardwareCapabilities();
      set({ hardware, isLoadingHardware: false });
    } catch (error) {
      set({ isLoadingHardware: false });
      toast.error("Failed to detect hardware");
      console.error("Failed to detect hardware:", error);
    }
  },

  loadRecommendations: async (useCase) => {
    set({ isLoadingRecommendations: true });

    try {
      const recommendations = await aiApi.getModelRecommendations(useCase);
      set({ recommendations, isLoadingRecommendations: false });
    } catch (error) {
      set({ isLoadingRecommendations: false });
      console.error("Failed to load recommendations:", error);
    }
  },

  downloadModel: async (modelId: string) => {
    const { ollamaBaseUrl } = get();

    toast.loading(`Downloading ${modelId}...`, { id: `download-${modelId}` });

    try {
      await aiApi.downloadModel(modelId, ollamaBaseUrl, (progress) => {
        set((state) => ({
          activeDownloads: new Map(state.activeDownloads).set(modelId, progress),
        }));

        if (progress.status === "completed") {
          toast.success(`${modelId} downloaded!`, { id: `download-${modelId}` });
          get().loadModels();
        } else if (progress.status === "error") {
          toast.error(`Failed to download ${modelId}`, { id: `download-${modelId}` });
        }
      });
    } catch (error) {
      toast.error(`Failed to download ${modelId}`, { id: `download-${modelId}` });
      console.error("Download error:", error);
    }
  },

  deleteModel: async (modelId: string) => {
    const { ollamaBaseUrl, selectedModel, models } = get();

    try {
      await aiApi.deleteOllamaModel(modelId, ollamaBaseUrl);
      toast.success(`${modelId} deleted`);

      const filteredModels = models.filter((m) => m.id !== modelId);

      set({
        models: filteredModels,
        selectedModel:
          selectedModel === modelId ? filteredModels[0]?.id || null : selectedModel,
      });
    } catch (error) {
      toast.error(`Failed to delete ${modelId}`);
      console.error("Delete error:", error);
    }
  },

  // Chat actions
  loadChatHistory: async () => {
    const { sessionId, chatHistoryLimit } = get();

    try {
      const messages = await aiApi.loadChatHistory(sessionId, chatHistoryLimit);
      set({ messages });
    } catch (error) {
      console.error("Failed to load chat history:", error);
    }
  },

  sendMessage: async (content: string) => {
    const { sessionId, selectedModel, provider, ollamaBaseUrl, cloudApiKey, messages } = get();

    if (!selectedModel) {
      toast.error("Please select a model first");
      return;
    }

    // Add user message immediately
    const userMessage: AIMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    set({
      messages: [...messages, userMessage],
      isStreaming: true,
      streamingContent: "",
    });

    try {
      let streamedContent = "";

      await aiApi.sendChatMessage({
        projectId: undefined,
        sessionId,
        content,
        model: selectedModel,
        provider,
        baseUrl: ollamaBaseUrl,
        apiKey: cloudApiKey ?? undefined,
        onChunk: (chunk) => {
          streamedContent += chunk;
          set({ streamingContent: streamedContent });
        },
      });

      set({ isStreaming: false, streamingContent: "" });

      // Reload messages to get the assistant message from DB
      get().loadChatHistory();
    } catch (error) {
      set({ isStreaming: false, streamingContent: "" });
      toast.error("Failed to send message");
      console.error("Chat error:", error);
    }
  },

  clearChat: async () => {
    const { sessionId } = get();

    try {
      await aiApi.clearChatHistory(sessionId);
      set({
        messages: [],
        sessionId: aiApi.generateSessionId(),
      });
      toast.success("Chat cleared");
    } catch (error) {
      toast.error("Failed to clear chat");
      console.error("Clear chat error:", error);
    }
  },

  updateStreamingContent: (content: string) => {
    set({ streamingContent: content });
  },

  finalizeStreamingMessage: () => {
    set({ isStreaming: false, streamingContent: "" });
  },
}));
