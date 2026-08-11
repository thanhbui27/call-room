"use client";

import { Camera, CameraOff, Expand, Hand, MessageSquare, Mic, MicOff, MonitorUp, MoreHorizontal, PhoneOff, Settings, StopCircle } from "lucide-react";
import { useState } from "react";

interface CallControlsProps {
  cameraEnabled: boolean;
  microphoneEnabled: boolean;
  screenSharing: boolean;
  chatOpen: boolean;
  unreadCount: number;
  reactionOpen: boolean;
  onToggleCamera: () => void;
  onToggleMicrophone: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onToggleReactions: () => void;
  onOpenSettings: () => void;
  onFullscreen: () => void;
  onLeave: () => void;
}

function ControlButton({ label, active, danger, badge, children, onClick, secondary = false }: { label: string; active?: boolean; danger?: boolean; badge?: number; children: React.ReactNode; onClick: () => void; secondary?: boolean }) {
  return (
    <button className={`call-control ${active ? "is-active" : ""} ${danger ? "is-danger" : ""} ${secondary ? "is-secondary" : ""}`} onClick={onClick} aria-label={label} title={label}>
      <span>{children}{badge ? <i className="call-control__badge">{badge > 9 ? "9+" : badge}</i> : null}</span>
      <small>{label}</small>
    </button>
  );
}

export function CallControls(props: CallControlsProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  return (
    <div className="call-controls-wrap">
      {moreOpen ? (
        <div className="more-menu">
          <button onClick={() => { props.onToggleScreenShare(); setMoreOpen(false); }}>{props.screenSharing ? <StopCircle size={17} /> : <MonitorUp size={17} />}{props.screenSharing ? "STOP SHARING" : "SHARE SCREEN"}</button>
          <button onClick={() => { props.onOpenSettings(); setMoreOpen(false); }}><Settings size={17} /> DEVICE SETTINGS</button>
          <button onClick={() => { props.onFullscreen(); setMoreOpen(false); }}><Expand size={17} /> FULLSCREEN</button>
        </div>
      ) : null}
      <nav className="call-controls" aria-label="Call controls">
        <ControlButton label={props.microphoneEnabled ? "MUTE" : "UNMUTE"} active={!props.microphoneEnabled} onClick={props.onToggleMicrophone}>{props.microphoneEnabled ? <Mic size={21} /> : <MicOff size={21} />}</ControlButton>
        <ControlButton label={props.cameraEnabled ? "CAMERA" : "CAMERA OFF"} active={!props.cameraEnabled} onClick={props.onToggleCamera}>{props.cameraEnabled ? <Camera size={21} /> : <CameraOff size={21} />}</ControlButton>
        <ControlButton label={props.screenSharing ? "STOP SHARE" : "SHARE"} active={props.screenSharing} onClick={props.onToggleScreenShare} secondary>{props.screenSharing ? <StopCircle size={21} /> : <MonitorUp size={21} />}</ControlButton>
        <ControlButton label="REACT" active={props.reactionOpen} onClick={props.onToggleReactions}><Hand size={21} /></ControlButton>
        <ControlButton label="CHAT" active={props.chatOpen} badge={props.unreadCount} onClick={props.onToggleChat}><MessageSquare size={21} /></ControlButton>
        <ControlButton label="SETTINGS" onClick={props.onOpenSettings} secondary><Settings size={21} /></ControlButton>
        <ControlButton label="FULLSCREEN" onClick={props.onFullscreen} secondary><Expand size={21} /></ControlButton>
        <ControlButton label="MORE" active={moreOpen} onClick={() => setMoreOpen((value) => !value)}><MoreHorizontal size={21} /></ControlButton>
        <ControlButton label="END CALL" danger onClick={props.onLeave}><PhoneOff size={22} /></ControlButton>
      </nav>
    </div>
  );
}
