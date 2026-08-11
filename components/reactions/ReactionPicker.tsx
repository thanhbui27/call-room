"use client";

import { REACTIONS } from "@/lib/constants";

interface ReactionPickerProps {
  onSelect: (emoji: (typeof REACTIONS)[number]) => void;
}

export function ReactionPicker({ onSelect }: ReactionPickerProps) {
  return (
    <div className="reaction-picker" role="menu" aria-label="Send a reaction">
      <span>QUICK REACTION</span>
      <div>{REACTIONS.map((emoji) => <button key={emoji} role="menuitem" onClick={() => onSelect(emoji)} aria-label={`Send ${emoji} reaction`}>{emoji}</button>)}</div>
    </div>
  );
}
