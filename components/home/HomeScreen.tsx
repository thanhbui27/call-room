"use client";

import { ArrowRight, Link2, LockKeyhole, Radio, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { RetroButton } from "@/components/ui/RetroButton";
import { StatusLight } from "@/components/ui/StatusLight";
import { Toast } from "@/components/ui/Toast";
import { WindowChrome } from "@/components/ui/WindowChrome";
import { ROOM_ID_PATTERN } from "@/lib/constants";

function getRoomId(value: string): string | null {
  const candidate = value.trim();
  if (ROOM_ID_PATTERN.test(candidate)) return candidate;
  try {
    const url = new URL(candidate);
    const roomId = url.pathname.split("/").filter(Boolean).at(-1) ?? "";
    return ROOM_ID_PATTERN.test(roomId) ? roomId : null;
  } catch {
    return null;
  }
}

export function HomeScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [joinValue, setJoinValue] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const task = window.setTimeout(() => setName(sessionStorage.getItem("private-line-display-name") ?? ""), 0);
    return () => window.clearTimeout(task);
  }, []);

  const rememberName = () => {
    const normalized = name.trim();
    if (!normalized) {
      setError("Type your display name first.");
      return null;
    }
    sessionStorage.setItem("private-line-display-name", normalized);
    return normalized;
  };

  const createRoom = async (event: FormEvent) => {
    event.preventDefault();
    if (!rememberName()) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/rooms", { method: "POST" });
      const data = (await response.json()) as { roomId?: string; error?: string };
      if (!response.ok || !data.roomId) throw new Error(data.error || "Could not create a private room.");
      router.push(`/room/${data.roomId}`);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not create a private room.");
      setBusy(false);
    }
  };

  const joinRoom = (event: FormEvent) => {
    event.preventDefault();
    if (!rememberName()) return;
    const roomId = getRoomId(joinValue);
    if (!roomId) {
      setError("That invitation link does not look right.");
      return;
    }
    router.push(`/room/${roomId}`);
  };

  return (
    <main className="home-page scanlines">
      <div className="home-page__orb home-page__orb--one" />
      <div className="home-page__orb home-page__orb--two" />
      <div className="home-shell">
        <header className="brand-row">
          <Link href="/" className="wordmark" aria-label="Private Line home">
            <span className="wordmark__icon"><Radio size={20} strokeWidth={3} /></span>
            <span>PRIVATE<br />LINE</span>
          </Link>
          <StatusLight label="SERVICE ONLINE" pulse />
        </header>

        <div className="home-grid">
          <section className="home-copy">
            <p className="eyebrow"><span>01</span> PRIVATE VIDEO CHANNEL</p>
            <h1>Two people.<br /><em>One private line.</em></h1>
            <p className="home-copy__lede">
              Open a room, send the link, and talk face to face. No accounts, no audience, no noise.
            </p>
            <div className="feature-tape" aria-label="Product features">
              <span><LockKeyhole size={16} /> PRIVATE</span>
              <span><UsersRound size={16} /> 2 PEOPLE</span>
              <span><Radio size={16} /> LIVE</span>
            </div>
          </section>

          <WindowChrome
            title="PRIVATE LINE — NEW CONNECTION"
            className="connect-window"
            footer={<><StatusLight label="SECURE CHANNEL READY" /><span>v1.0</span></>}
          >
            <form className="connect-form" onSubmit={createRoom}>
              <div className="form-step">
                <span className="form-step__number">1</span>
                <div><strong>IDENTIFY YOURSELF</strong><small>This is what your friend will see.</small></div>
              </div>
              <label className="field-label" htmlFor="display-name">DISPLAY NAME</label>
              <input
                id="display-name"
                className="retro-input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="TYPE YOUR NAME..."
                maxLength={40}
                autoComplete="name"
                autoFocus
              />
              <RetroButton className="create-button" tone="primary" type="submit" disabled={busy} icon={<ArrowRight size={20} />}>
                {busy ? "OPENING LINE..." : "CREATE PRIVATE ROOM"}
              </RetroButton>
              <div className="or-rule"><span>OR</span></div>
              {!showJoin ? (
                <RetroButton className="join-reveal" tone="ghost" onClick={() => setShowJoin(true)} icon={<Link2 size={17} />}>
                  I HAVE AN INVITATION LINK
                </RetroButton>
              ) : (
                <div className="join-box">
                  <label className="field-label" htmlFor="invite-link">INVITATION LINK OR ROOM ID</label>
                  <div className="join-box__row">
                    <input
                      id="invite-link"
                      className="retro-input"
                      value={joinValue}
                      onChange={(event) => setJoinValue(event.target.value)}
                      placeholder="PASTE LINK..."
                    />
                    <RetroButton tone="ink" onClick={joinRoom}>JOIN</RetroButton>
                  </div>
                </div>
              )}
            </form>
          </WindowChrome>
        </div>

        <footer className="home-footer">
          <span>END-TO-END MEDIA VIA LIVEKIT</span>
          <span>MAXIMUM CAPACITY: 2</span>
        </footer>
      </div>
      {error ? <Toast message={error} tone="error" onDismiss={() => setError("")} /> : null}
    </main>
  );
}
