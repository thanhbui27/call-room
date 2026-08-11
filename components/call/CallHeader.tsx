"use client";

import { LockKeyhole, Radio } from "lucide-react";
import Link from "next/link";

import { ConnectionIndicator } from "@/components/call/ConnectionIndicator";

export function CallHeader({ duration }: { duration: string }) {
  return (
    <header className="call-header">
      <Link href="/" className="call-header__brand" aria-label="Private Line home"><Radio size={16} /><strong>PRIVATE LINE</strong></Link>
      <div className="call-header__center"><LockKeyhole size={13} /> PRIVATE 1:1 CHANNEL <span>•</span> <time>{duration}</time></div>
      <ConnectionIndicator />
    </header>
  );
}
