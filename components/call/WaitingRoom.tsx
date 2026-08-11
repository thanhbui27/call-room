"use client";

import { Clipboard, Copy, Radio, UserRoundPlus } from "lucide-react";
import { useState } from "react";

import { RetroButton } from "@/components/ui/RetroButton";

export function WaitingRoom({ roomId }: { roomId: string }) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [inviteUrl] = useState(() => typeof window === "undefined" ? "" : `${window.location.origin}/room/${roomId}`);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopyFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 2_000);
    } catch {
      setCopyFailed(true);
    }
  };

  return (
    <div className="waiting-room">
      <div className="waiting-room__radar"><Radio size={42} /><span /><span /><span /></div>
      <p className="eyebrow"><span>03</span> LINE IS OPEN</p>
      <h2>WAITING FOR YOUR FRIEND<span className="waiting-dots">...</span></h2>
      <p>You are connected. Send this one-time room address to one person.</p>
      <div className="invite-field"><Clipboard size={17} /><code>{inviteUrl || "PREPARING LINK..."}</code><RetroButton compact tone={copied ? "primary" : "ink"} onClick={copy} icon={<Copy size={15} />}>{copied ? "COPIED!" : copyFailed ? "COPY FAILED" : "COPY LINK"}</RetroButton></div>
      <div className="waiting-room__limit"><UserRoundPlus size={15} /> ONE SEAT AVAILABLE</div>
    </div>
  );
}
