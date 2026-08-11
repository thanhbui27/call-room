"use client";

import { Send, X } from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";

import { RetroButton } from "@/components/ui/RetroButton";
import type { ChatMessagePayload } from "@/lib/types";

interface ChatPanelProps {
  messages: ChatMessagePayload[];
  localIdentity: string;
  onClose: () => void;
  onSend: (text: string) => Promise<void>;
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(timestamp);
}

export function ChatPanel({ messages, localIdentity, onClose, onSend }: ChatPanelProps) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!text.trim() || sending) return;
    const pending = text;
    setText("");
    setSending(true);
    setError("");
    try {
      await onSend(pending);
    } catch {
      setText(pending);
      setError("MESSAGE NOT SENT — CHECK CONNECTION");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  };

  return (
    <aside className="chat-panel" aria-label="Call chat">
      <header className="chat-panel__header">
        <div><span>LIVE TEXT</span><strong>MESSAGES</strong></div>
        <button onClick={onClose} aria-label="Close messages"><X size={19} /></button>
      </header>
      <div className="chat-panel__status"><span /> SESSION-ONLY CHAT · NOT SAVED</div>
      <div className="chat-messages" ref={scrollRef} aria-live="polite">
        {messages.length === 0 ? (
          <div className="chat-empty"><span>...</span><strong>NO MESSAGES YET</strong><p>Say hello without interrupting the call.</p></div>
        ) : messages.map((message) => {
          const mine = message.senderId === localIdentity;
          return (
            <article key={message.id} className={`chat-message ${mine ? "chat-message--mine" : ""}`}>
              <div className="chat-message__meta"><strong>{mine ? "YOU" : message.senderName}</strong><time dateTime={new Date(message.timestamp).toISOString()}>{formatTime(message.timestamp)}</time></div>
              <p>{message.text}</p>
            </article>
          );
        })}
      </div>
      <form className="chat-compose" onSubmit={submit}>
        <label htmlFor="chat-message">MESSAGE</label>
        <textarea id="chat-message" value={text} onChange={(event) => setText(event.target.value.slice(0, 1000))} onKeyDown={handleKeyDown} placeholder="TYPE A MESSAGE..." rows={3} />
        <div><small>{error || `${text.length}/1000 · SHIFT+ENTER FOR NEW LINE`}</small><RetroButton type="submit" compact tone="primary" disabled={!text.trim() || sending} icon={<Send size={15} />}>{sending ? "SENDING" : "SEND"}</RetroButton></div>
      </form>
    </aside>
  );
}
