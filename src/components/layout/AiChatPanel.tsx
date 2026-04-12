import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Settings, Sparkles, Trash2 } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { useAIStore } from "@/stores/aiStore";
import { Button } from "@/components/ui/Button";
import { ChatMessage } from "@/components/features/ChatMessage";
import { StreamingMessage } from "@/components/features/StreamingMessage";
import { ChatEmptyState } from "@/components/features/ChatEmptyState";
import { ModelManager } from "@/components/features/ModelManager";

export function AiChatPanel() {
  const { aiChatOpen } = useAppStore();
  const {
    messages,
    isStreaming,
    streamingContent,
    selectedModel,
    selectedOpenRouterModel,
    openRouterModels,
    provider,
    showModelManager,
    loadChatHistory,
    sendMessage,
    clearChat,
    toggleModelManager,
    loadModels,
    checkOllamaStatus,
    checkLlamaCppStatus,
    loadLlamaCppModels,
  } = useAIStore();

  // Effective model: OpenRouter uses selectedOpenRouterModel, everything else uses selectedModel
  const activeModel =
    provider === "openrouter"
      ? (openRouterModels.find((m) => m.id === selectedOpenRouterModel)?.name ?? selectedOpenRouterModel)
      : selectedModel;

  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load chat history and models when panel opens
  useEffect(() => {
    if (aiChatOpen) {
      loadChatHistory();
      loadModels();
      checkOllamaStatus();
      checkLlamaCppStatus();
      loadLlamaCppModels();
      // Focus input when panel opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [aiChatOpen, loadChatHistory, loadModels, checkOllamaStatus, checkLlamaCppStatus, loadLlamaCppModels]);

  // Auto-scroll to bottom when messages change or streaming
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, streamingContent, isThinking]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming || isThinking) return;
    const message = input.trim();
    setInput("");
    setIsThinking(true);
    
    try {
      await sendMessage(message);
    } finally {
      setIsThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!aiChatOpen) return null;

  const showLoading = isThinking || isStreaming;

  return (
    <>
      {showModelManager && <ModelManager />}

      <aside className="glass-card glass-gloss w-80 flex flex-col shrink-0 animate-in slide-in-from-right duration-300 overflow-hidden">
        {/* Header */}
        <div className="glass-interactive m-3 mb-0 flex items-center gap-3 px-4 py-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-purple/20 to-accent-magenta/20 flex items-center justify-center shrink-0">
            <Sparkles size={18} className="text-accent-purple" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-body font-medium text-white/90 block">
              AI Copilot
            </span>
            <span className="text-label text-white/40 truncate block">
              {activeModel || "No model selected"}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void clearChat()}
              disabled={messages.length === 0}
              className="text-white/30 hover:text-white/70 w-8 h-8 p-0"
            >
              <Trash2 size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleModelManager}
              className="text-white/30 hover:text-white/70 w-8 h-8 p-0"
            >
              <Settings size={16} />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-2 min-h-0"
          style={{ scrollBehavior: 'smooth' }}
        >
          {messages.length === 0 ? (
            <ChatEmptyState />
          ) : (
            <>
              {messages.map((msg, index) => (
                <ChatMessage 
                  key={msg.id} 
                  message={msg} 
                  isLatest={index === messages.length - 1 && !showLoading}
                />
              ))}
              
              {/* Thinking indicator */}
              {isThinking && !isStreaming && (
                <div className="flex gap-3 p-2">
                  <div className="w-8 h-8 rounded-lg bg-accent-purple/20 flex items-center justify-center shrink-0">
                    <Sparkles size={16} className="text-accent-purple" />
                  </div>
                  <div className="glass-interactive px-4 py-3 rounded-tl-none flex items-center gap-3">
                    <Loader2 size={16} className="animate-spin text-accent-purple" />
                    <span className="text-body text-white/60">Thinking...</span>
                  </div>
                </div>
              )}
              
              {/* Streaming response */}
              {isStreaming && (
                <StreamingMessage content={streamingContent} />
              )}
              
              <div ref={messagesEndRef} className="h-1" />
            </>
          )}
        </div>

        {/* Input */}
        <div className="p-3 pt-0 shrink-0">
          {!activeModel && (
            <div className="glass-interactive px-3 py-2 mb-2 text-center">
              <p className="text-label text-white/50">
                No model selected.{" "}
                <button
                  onClick={toggleModelManager}
                  className="text-accent-cyan hover:underline"
                >
                  Open Model Manager
                </button>
              </p>
            </div>
          )}

          <div className="glass-interactive flex items-center gap-2 px-3 py-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                activeModel
                  ? showLoading
                    ? "AI is responding..."
                    : "Ask anything..."
                  : "Select a model first"
              }
              disabled={showLoading || !activeModel}
              className="flex-1 bg-transparent text-body text-white/90 placeholder:text-white/30 outline-none disabled:cursor-not-allowed min-w-0"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleSend}
              disabled={!input.trim() || showLoading || !activeModel}
              className="w-8 h-8 p-0 shrink-0"
            >
              {showLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </Button>
          </div>

          <p className="text-label text-white/30 text-center mt-2">
            AI responses may be inaccurate. Verify important information.
          </p>
        </div>
      </aside>
    </>
  );
}
