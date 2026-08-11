"use client";

import { ArrowLeft, CircleOff, LoaderCircle, LockKeyhole, RadioTower, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { RetroButton } from "@/components/ui/RetroButton";
import { StatusLight } from "@/components/ui/StatusLight";
import { WindowChrome } from "@/components/ui/WindowChrome";

type StateKind = "checking" | "invalid" | "full" | "error" | "ended";

const CONTENT: Record<Exclude<StateKind, "checking">, { code: string; title: string; body: string }> = {
  invalid: {
    code: "ERR 404",
    title: "LINE NOT FOUND",
    body: "This invitation is invalid or the private room has expired.",
  },
  full: {
    code: "LINE BUSY",
    title: "ROOM FULL",
    body: "This private room already has two people. Ask your friend to open a new line.",
  },
  error: {
    code: "CONNECTION ERROR",
    title: "CAN'T OPEN THE LINE",
    body: "The secure call service could not be reached. Check the setup or try again.",
  },
  ended: {
    code: "CALL ENDED",
    title: "LINE CLOSED",
    body: "Your camera and microphone have been released. Thanks for calling.",
  },
};

interface StateScreenProps {
  kind: StateKind;
  detail?: string;
  onRetry?: () => void;
}

export function StateScreen({ kind, detail, onRetry }: StateScreenProps) {
  const router = useRouter();
  const checking = kind === "checking";
  const content = kind === "checking" ? CONTENT.error : CONTENT[kind];

  return (
    <main className="state-page scanlines">
      <WindowChrome title="PRIVATE LINE — SYSTEM MESSAGE" className="state-window" footer={<StatusLight label={checking ? "CHECKING CHANNEL" : "CHANNEL CLOSED"} tone={checking ? "amber" : "red"} pulse={checking} />}>
        <div className="state-window__content">
          <div className={`state-window__icon state-window__icon--${kind}`}>
            {checking ? <LoaderCircle className="spin" size={42} /> : kind === "full" ? <UsersRound size={42} /> : kind === "invalid" ? <CircleOff size={42} /> : <RadioTower size={42} />}
          </div>
          {checking ? (
            <>
              <p className="eyebrow">SECURE HANDSHAKE</p>
              <h1>LOCATING PRIVATE LINE...</h1>
              <p>Please hold while we verify this invitation.</p>
            </>
          ) : (
            <>
              <p className="state-window__code">{content.code}</p>
              <h1>{content.title}</h1>
              <p>{detail || content.body}</p>
              <div className="state-window__actions">
                {onRetry && kind === "error" ? <RetroButton tone="primary" onClick={onRetry}>TRY AGAIN</RetroButton> : null}
                <RetroButton tone={kind === "ended" ? "primary" : "neutral"} onClick={() => router.push("/")} icon={<ArrowLeft size={17} />}>BACK TO HOME</RetroButton>
              </div>
            </>
          )}
        </div>
        <div className="state-window__notice"><LockKeyhole size={14} /> NO MEDIA CONNECTION WAS LEFT OPEN</div>
      </WindowChrome>
    </main>
  );
}
