"use client";

import { VideoTrack } from "@livekit/components-react";
import type { TrackReference } from "@livekit/components-core";
import { MonitorUp } from "lucide-react";

export function ScreenShareView({ trackRef, local }: { trackRef: TrackReference; local: boolean }) {
  return (
    <div className="screen-share-view">
      <VideoTrack trackRef={trackRef} />
      <div className="screen-share-view__badge"><MonitorUp size={14} /> {local ? "YOU ARE SHARING YOUR SCREEN" : `${trackRef.participant.name || "YOUR FRIEND"} IS SHARING`}</div>
    </div>
  );
}
