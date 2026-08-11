import type { ReactionPayload } from "@/lib/types";

export function FloatingReactions({ reactions }: { reactions: ReactionPayload[] }) {
  return (
    <div className="floating-reactions" aria-live="polite" aria-atomic="false">
      {reactions.map((reaction, index) => (
        <div key={reaction.id} className="floating-reaction" style={{ "--reaction-lane": index % 5 } as React.CSSProperties}>
          <span>{reaction.emoji}</span><small>{reaction.senderName}</small>
        </div>
      ))}
    </div>
  );
}
