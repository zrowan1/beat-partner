import { Sparkles } from "lucide-react";

interface StreamingMessageProps {
  content: string;
}

export function StreamingMessage({ content }: StreamingMessageProps) {
  return (
    <div className="flex gap-2 p-2 w-full">
      {/* Avatar */}
      <div className="w-7 h-7 rounded-lg bg-accent-purple/20 flex items-center justify-center shrink-0">
        <Sparkles size={14} className="text-accent-purple" />
      </div>

      {/* Message Bubble */}
      <div className="glass-interactive px-3 py-2.5 rounded-tl-none max-w-[calc(100%-40px)] min-w-0 overflow-hidden">
        {/* Content */}
        <div className="text-body text-white/90 whitespace-pre-wrap break-words overflow-wrap-anywhere">
          {content}
        </div>
        
        {/* Typing indicator */}
        <span className="inline-flex items-center gap-1 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-purple animate-pulse" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-accent-purple animate-pulse" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-accent-purple animate-pulse" style={{ animationDelay: '300ms' }} />
        </span>
      </div>
    </div>
  );
}
