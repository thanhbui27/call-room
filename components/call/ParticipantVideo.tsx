"use client";

import { VideoTrack, useConnectionQualityIndicator, useIsSpeaking, useTracks } from "@livekit/components-react";
import { ConnectionQuality, type Participant, Track } from "livekit-client";
import { MicOff, Signal, SignalLow } from "lucide-react";

interface ParticipantVideoProps {
  participant: Participant;
  local?: boolean;
  compact?: boolean;
}

export function ParticipantVideo({ participant, local = false, compact = false }: ParticipantVideoProps) {
  const cameraRefs = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }]);
  const cameraRef = cameraRefs.find((trackRef) => trackRef.participant.identity === participant.identity);
  const speaking = useIsSpeaking(participant);
  const { quality } = useConnectionQualityIndicator({ participant });
  const hasVideo = Boolean(cameraRef?.publication && !cameraRef.publication.isMuted);
  const initial = (participant.name || participant.identity || "?").slice(0, 1).toUpperCase();

  return (
    <div className={`participant-video ${local ? "participant-video--local" : ""} ${compact ? "participant-video--compact" : ""} ${speaking ? "is-speaking" : ""}`}>
      {hasVideo && cameraRef?.publication ? <VideoTrack trackRef={cameraRef} muted={local} className={local ? "is-mirrored" : ""} /> : (
        <div className="participant-video__placeholder"><div>{initial}</div><span>{local ? "YOUR CAMERA IS OFF" : "CAMERA IS OFF"}</span></div>
      )}
      <div className="participant-video__label">
        <strong>{local ? "YOU" : participant.name || "YOUR FRIEND"}</strong>
        {!participant.isMicrophoneEnabled ? <MicOff size={13} aria-label="Microphone muted" /> : null}
        {quality === ConnectionQuality.Poor || quality === ConnectionQuality.Lost ? <SignalLow size={13} aria-label="Poor connection" /> : <Signal size={13} aria-label="Good connection" />}
      </div>
      {speaking ? <span className="participant-video__speaking">SPEAKING</span> : null}
    </div>
  );
}
