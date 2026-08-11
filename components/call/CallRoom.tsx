"use client";

import { RoomAudioRenderer, useConnectionState, useLocalParticipant, useRemoteParticipants, useRoomContext, useTracks } from "@livekit/components-react";
import { ConnectionState, RoomEvent, Track } from "livekit-client";
import { Copy, MonitorUp, StopCircle, WifiOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { CallControls } from "@/components/call/CallControls";
import { CallHeader } from "@/components/call/CallHeader";
import { DeviceSettings } from "@/components/call/DeviceSettings";
import { ParticipantVideo } from "@/components/call/ParticipantVideo";
import { ScreenShareView } from "@/components/call/ScreenShareView";
import { WaitingRoom } from "@/components/call/WaitingRoom";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { FloatingReactions } from "@/components/reactions/FloatingReactions";
import { ReactionPicker } from "@/components/reactions/ReactionPicker";
import { RetroButton } from "@/components/ui/RetroButton";
import { Toast } from "@/components/ui/Toast";
import { useRealtime } from "@/hooks/useRealtime";
import { usePictureInPicture } from "@/hooks/usePictureInPicture";

function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3_600).toString().padStart(2, "0");
  const minutes = Math.floor((seconds % 3_600) / 60).toString().padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:${rest}`;
}

interface CallRoomProps {
  roomId: string;
  preferredSpeakerId?: string;
  onLeave: () => void;
}

export function CallRoom({ roomId, preferredSpeakerId, onLeave }: CallRoomProps) {
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const remoteParticipants = useRemoteParticipants();
  const { localParticipant, isCameraEnabled, isMicrophoneEnabled, isScreenShareEnabled } = useLocalParticipant();
  const screenShares = useTracks([Track.Source.ScreenShare]);
  const { messages, reactions, sendMessage, sendReaction } = useRealtime();
  const { pictureInPictureSupported, pictureInPictureActive, togglePictureInPicture } = usePictureInPicture();
  const [chatOpen, setChatOpen] = useState(false);
  const [reactionOpen, setReactionOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);
  const [leaving, setLeaving] = useState(false);
  const joinedAt = useRef<number | null>(null);
  const previousMessageCount = useRef(0);
  const [hadRemote, setHadRemote] = useState(() => remoteParticipants.length > 0);

  const remoteParticipant = remoteParticipants[0];
  const activeScreenShare = screenShares[0];
  const sharingLocally = activeScreenShare?.participant.identity === localParticipant.identity;

  useEffect(() => {
    const rememberRemote = () => setHadRemote(true);
    room.on(RoomEvent.ParticipantConnected, rememberRemote);
    return () => { room.off(RoomEvent.ParticipantConnected, rememberRemote); };
  }, [room]);

  useEffect(() => {
    if (connectionState !== ConnectionState.Connected) return;
    if (joinedAt.current === null) joinedAt.current = Date.now();
    const timer = window.setInterval(() => {
      if (joinedAt.current !== null) setDuration(Math.floor((Date.now() - joinedAt.current) / 1_000));
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [connectionState]);

  useEffect(() => {
    if (!chatOpen && messages.length > previousMessageCount.current) {
      const newMessages = messages.slice(previousMessageCount.current);
      setUnreadCount((count) => count + newMessages.filter((message) => message.senderId !== localParticipant.identity).length);
    }
    previousMessageCount.current = messages.length;
  }, [chatOpen, localParticipant.identity, messages]);

  useEffect(() => {
    if (!preferredSpeakerId) return;
    void room.switchActiveDevice("audiooutput", preferredSpeakerId, true).catch(() => undefined);
  }, [preferredSpeakerId, room]);

  const toggleMicrophone = useCallback(async () => {
    try { await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled); }
    catch { setToast({ message: "Microphone could not be changed.", tone: "error" }); }
  }, [isMicrophoneEnabled, localParticipant]);

  const toggleCamera = useCallback(async () => {
    try { await localParticipant.setCameraEnabled(!isCameraEnabled); }
    catch { setToast({ message: "Camera could not be changed.", tone: "error" }); }
  }, [isCameraEnabled, localParticipant]);

  const toggleScreenShare = useCallback(async () => {
    try {
      await localParticipant.setScreenShareEnabled(!isScreenShareEnabled, { audio: true });
    } catch {
      setToast({ message: "Screen sharing was cancelled or is unavailable.", tone: "error" });
    }
  }, [isScreenShareEnabled, localParticipant]);

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.matches("input, textarea, select, [contenteditable='true']") || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key.toLowerCase() === "m") void toggleMicrophone();
      if (event.key.toLowerCase() === "v") void toggleCamera();
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [toggleCamera, toggleMicrophone]);

  const copyInvite = async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`);
    setToast({ message: "Invitation copied!", tone: "success" });
  };

  const leave = async () => {
    if (leaving) return;
    setLeaving(true);
    try {
      await localParticipant.setScreenShareEnabled(false).catch(() => undefined);
      await localParticipant.setCameraEnabled(false).catch(() => undefined);
      await localParticipant.setMicrophoneEnabled(false).catch(() => undefined);
      await room.disconnect(true);
    } finally {
      onLeave();
    }
  };

  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setToast({ message: "Fullscreen is unavailable in this browser.", tone: "error" });
    }
  };

  const toggleMiniView = async () => {
    try {
      await togglePictureInPicture();
    } catch {
      setToast({ message: "Mini view is unavailable. Start a video and allow picture-in-picture in browser settings.", tone: "error" });
    }
  };

  const connectionInterrupted = connectionState === ConnectionState.Reconnecting || connectionState === ConnectionState.SignalReconnecting;

  return (
    <main className={`call-page ${chatOpen ? "chat-is-open" : ""}`}>
      <RoomAudioRenderer />
      <section className="call-surface">
        <CallHeader duration={formatDuration(duration)} />
        {connectionInterrupted ? <div className="reconnect-banner"><WifiOff size={16} /> RECONNECTING... YOUR CALL WILL RESUME AUTOMATICALLY</div> : null}
        <div className="call-stage">
          {activeScreenShare ? <ScreenShareView trackRef={activeScreenShare} local={sharingLocally} /> : remoteParticipant ? <ParticipantVideo participant={remoteParticipant} /> : <WaitingRoom roomId={roomId} />}

          {activeScreenShare && remoteParticipant ? <div className="call-stage__camera-peek"><ParticipantVideo participant={remoteParticipant} compact /></div> : null}
          <div className="local-pip"><ParticipantVideo participant={localParticipant} local compact /></div>

          {hadRemote && !remoteParticipant ? <div className="friend-disconnected"><WifiOff size={16} /><span><strong>YOUR FRIEND DISCONNECTED</strong> — THE LINE WILL STAY OPEN</span><RetroButton compact tone="ink" onClick={copyInvite} icon={<Copy size={14} />}>COPY LINK</RetroButton></div> : null}
          {sharingLocally ? <div className="share-banner"><MonitorUp size={15} /><span>YOU ARE SHARING YOUR SCREEN</span><button onClick={toggleScreenShare}><StopCircle size={14} /> STOP SHARING</button></div> : null}
          <FloatingReactions reactions={reactions} />
          {reactionOpen ? <ReactionPicker onSelect={(emoji) => { void sendReaction(emoji).catch(() => setToast({ message: "Reaction could not be sent.", tone: "error" })); setReactionOpen(false); }} /> : null}
        </div>
        <CallControls
          cameraEnabled={isCameraEnabled}
          microphoneEnabled={isMicrophoneEnabled}
          screenSharing={isScreenShareEnabled}
          chatOpen={chatOpen}
          unreadCount={unreadCount}
          reactionOpen={reactionOpen}
          pictureInPictureSupported={pictureInPictureSupported}
          pictureInPictureActive={pictureInPictureActive}
          onToggleCamera={() => void toggleCamera()}
          onToggleMicrophone={() => void toggleMicrophone()}
          onToggleScreenShare={() => void toggleScreenShare()}
          onToggleChat={() => setChatOpen((value) => { const next = !value; if (next) setUnreadCount(0); return next; })}
          onToggleReactions={() => setReactionOpen((value) => !value)}
          onOpenSettings={() => setSettingsOpen(true)}
          onFullscreen={() => void fullscreen()}
          onTogglePictureInPicture={() => void toggleMiniView()}
          onLeave={() => void leave()}
        />
      </section>
      {chatOpen ? <ChatPanel messages={messages} localIdentity={localParticipant.identity} onClose={() => setChatOpen(false)} onSend={sendMessage} /> : null}
      {settingsOpen ? <DeviceSettings onClose={() => setSettingsOpen(false)} /> : null}
      {toast ? <Toast message={toast.message} tone={toast.tone} onDismiss={() => setToast(null)} /> : null}
      {leaving ? <div className="leaving-overlay">CLOSING PRIVATE LINE...</div> : null}
    </main>
  );
}
