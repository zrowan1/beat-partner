import { Bot, User } from "lucide-react";
import type { AIMessage } from "@/types";

interface ChatMessageProps {
  message: AIMessage;
  isLatest?: boolean;
}

export function ChatMessage({ message, isLatest }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`
        flex gap-2 p-2 w-full
        ${isUser ? "flex-row-reverse" : ""}
      `}
    >
      {/* Avatar */}
      <div
        className={`
          w-7 h-7 rounded-lg flex items-center justify-center shrink-0
          ${isUser ? "bg-accent-cyan/20" : "bg-accent-purple/20"}
        `}
      >
        {isUser ? (
          <User size={14} className="text-accent-cyan" />
        ) : (
          <Bot size={14} className="text-accent-purple" />
        )}
      </div>

      {/* Message Bubble */}
      <div
        className={`
          glass-interactive px-3 py-2.5 
          ${isUser ? "rounded-tr-none" : "rounded-tl-none"}
          ${isLatest ? "ring-1 ring-white/5" : ""}
          max-w-[calc(100%-40px)]
          min-w-0
          overflow-hidden
        `}
      >
        {/* Content */}
        <div className="text-body text-white/90 whitespace-pre-wrap break-words overflow-wrap-anywhere">
          {message.content}
        </div>
        
        {/* Model info */}
        {message.model && (
          <p className="text-label text-white/30 mt-1.5 truncate">
            {message.model}
          </p>
        )}
      </div>
    </div>
  );
}
