import { Bot, Music, Wand2, HelpCircle } from "lucide-react";
import { useAIStore } from "@/stores/aiStore";

const SUGGESTIONS = [
  { icon: Music, text: "Suggest a chord progression for C minor" },
  { icon: Wand2, text: "How do I create a wide stereo bass?" },
  { icon: HelpCircle, text: "What's the best EQ for kick drums?" },
];

export function ChatEmptyState() {
  const { sendMessage } = useAIStore();

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="glass-interactive p-6 mb-4">
        <Bot size={32} className="text-accent-purple" />
      </div>

      <h3 className="text-heading font-medium text-white/90 mb-2">
        AI Copilot
      </h3>

      <p className="text-body text-white/50 mb-6 max-w-xs">
        Ask me anything about music production, theory, mixing, or sound design.
      </p>

      <div className="w-full space-y-2">
        {SUGGESTIONS.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => sendMessage(suggestion.text)}
            className="w-full glass-interactive px-4 py-3 text-left hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <suggestion.icon
                size={16}
                className="text-white/30 group-hover:text-accent-cyan transition-colors"
              />
              <span className="text-body text-white/60 group-hover:text-white/90 transition-colors">
                {suggestion.text}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
