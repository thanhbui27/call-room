"use client";

import { Camera, CameraOff, ChevronDown, Mic, MicOff, Settings2, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import type { JoinSettings } from "@/components/room/room-types";
import { RetroButton } from "@/components/ui/RetroButton";
import { StatusLight } from "@/components/ui/StatusLight";
import { WindowChrome } from "@/components/ui/WindowChrome";
import { useMediaDevices } from "@/hooks/useMediaDevices";

interface PreJoinProps {
  initialName: string;
  joining: boolean;
  error?: string;
  onJoin: (settings: JoinSettings) => void;
}

function deviceLabel(device: MediaDeviceInfo, index: number, fallback: string) {
  return device.label || `${fallback} ${index + 1}`;
}

export function PreJoin({ initialName, joining, error, onJoin }: PreJoinProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeStream = useRef<MediaStream | null>(null);
  const requestVersion = useRef(0);
  const [name, setName] = useState(initialName);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [cameraId, setCameraId] = useState("");
  const [microphoneId, setMicrophoneId] = useState("");
  const [speakerId, setSpeakerId] = useState("");
  const [mediaError, setMediaError] = useState("");
  const [requesting, setRequesting] = useState(true);
  const [hasCameraTrack, setHasCameraTrack] = useState(false);
  const { devices, refresh, supported } = useMediaDevices();

  useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      const task = window.setTimeout(() => {
        setMediaError("This browser cannot access camera or microphone devices.");
        setCameraEnabled(false);
        setMicrophoneEnabled(false);
        setRequesting(false);
      }, 0);
      return () => window.clearTimeout(task);
    }

    const version = ++requestVersion.current;
    let cancelled = false;
    const nextStream = new MediaStream();

    const start = async () => {
      setRequesting(true);
      setMediaError("");
      const requests: Array<{ kind: "camera" | "microphone"; promise: Promise<MediaStream> }> = [];
      if (cameraEnabled) {
        requests.push({ kind: "camera", promise: navigator.mediaDevices.getUserMedia({
          video: cameraId ? { deviceId: { exact: cameraId }, width: { ideal: 1280 }, height: { ideal: 720 } } : { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        }) });
      }
      if (microphoneEnabled) {
        requests.push({ kind: "microphone", promise: navigator.mediaDevices.getUserMedia({
          video: false,
          audio: microphoneId ? { deviceId: { exact: microphoneId }, echoCancellation: true, noiseSuppression: true } : { echoCancellation: true, noiseSuppression: true },
        }) });
      }

      const results = await Promise.allSettled(requests.map((request) => request.promise));
      if (cancelled || version !== requestVersion.current) {
        results.forEach((result) => result.status === "fulfilled" && result.value.getTracks().forEach((track) => track.stop()));
        return;
      }

      let failed = false;
      results.forEach((result, index) => {
        if (result.status === "fulfilled") result.value.getTracks().forEach((track) => nextStream.addTrack(track));
        else {
          failed = true;
          if (requests[index].kind === "camera") setCameraEnabled(false);
          if (requests[index].kind === "microphone") setMicrophoneEnabled(false);
        }
      });

      activeStream.current?.getTracks().forEach((track) => track.stop());
      activeStream.current = nextStream;
      if (videoRef.current) videoRef.current.srcObject = nextStream;
      setHasCameraTrack(nextStream.getVideoTracks().length > 0);
      await refresh().catch(() => undefined);

      if (failed) {
        setMediaError("One or more devices could not be started. Check browser permissions or choose another device.");
      }
      setRequesting(false);
    };

    void start();
    return () => {
      cancelled = true;
      nextStream.getTracks().forEach((track) => track.stop());
    };
  }, [cameraEnabled, microphoneEnabled, cameraId, microphoneId, refresh]);

  useEffect(() => () => activeStream.current?.getTracks().forEach((track) => track.stop()), []);

  const submit = () => {
    const normalizedName = name.trim();
    if (!normalizedName) {
      setMediaError("Enter a display name before joining.");
      return;
    }
    sessionStorage.setItem("private-line-display-name", normalizedName);
    activeStream.current?.getTracks().forEach((track) => track.stop());
    activeStream.current = null;
    onJoin({
      name: normalizedName,
      cameraEnabled,
      microphoneEnabled,
      cameraId: cameraId || undefined,
      microphoneId: microphoneId || undefined,
      speakerId: speakerId || undefined,
    });
  };

  return (
    <main className="prejoin-page scanlines">
      <div className="prejoin-shell">
        <header className="prejoin-header">
          <Link href="/" className="wordmark"><span className="wordmark__icon">PL</span><span>PRIVATE<br />LINE</span></Link>
          <StatusLight label="INVITATION VERIFIED" />
        </header>
        <div className="prejoin-grid">
          <WindowChrome title="CAMERA PREVIEW — LOCAL" className="preview-window" footer={<><StatusLight label={cameraEnabled ? "CAMERA ACTIVE" : "CAMERA PAUSED"} tone={cameraEnabled ? "green" : "gray"} /><span>PREVIEW ONLY</span></>}>
            <div className="camera-preview">
              <video ref={videoRef} autoPlay muted playsInline className={cameraEnabled ? "" : "is-hidden"} />
              {!cameraEnabled || !hasCameraTrack ? (
                <div className="camera-placeholder"><div>{name.trim().slice(0, 1).toUpperCase() || "?"}</div><span>CAMERA IS OFF</span></div>
              ) : null}
              <div className="camera-preview__badge">YOU</div>
              {requesting ? <div className="camera-preview__loading">STARTING DEVICES...</div> : null}
              <div className="camera-preview__controls">
                <button className={!microphoneEnabled ? "is-off" : ""} onClick={() => setMicrophoneEnabled((value) => !value)} aria-label={microphoneEnabled ? "Mute microphone" : "Unmute microphone"} title={microphoneEnabled ? "Mute microphone" : "Unmute microphone"}>
                  {microphoneEnabled ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
                <button className={!cameraEnabled ? "is-off" : ""} onClick={() => setCameraEnabled((value) => !value)} aria-label={cameraEnabled ? "Turn camera off" : "Turn camera on"} title={cameraEnabled ? "Turn camera off" : "Turn camera on"}>
                  {cameraEnabled ? <Camera size={20} /> : <CameraOff size={20} />}
                </button>
              </div>
            </div>
          </WindowChrome>

          <section className="prejoin-panel">
            <p className="eyebrow"><span>02</span> BEFORE YOU CONNECT</p>
            <h1>LOOKING GOOD?</h1>
            <p className="prejoin-panel__intro">Check your name and equipment. Your preview is private until you join.</p>

            <label className="field-label" htmlFor="prejoin-name">DISPLAY NAME</label>
            <input id="prejoin-name" className="retro-input" value={name} onChange={(event) => setName(event.target.value)} maxLength={40} />

            <div className="device-heading"><Settings2 size={15} /> EQUIPMENT</div>
            <label className="device-select"><span><Mic size={15} /> MICROPHONE</span><select value={microphoneId} onChange={(event) => setMicrophoneId(event.target.value)} disabled={!devices.microphones.length}><option value="">SYSTEM DEFAULT</option>{devices.microphones.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{deviceLabel(device, index, "Microphone")}</option>)}</select><ChevronDown size={15} /></label>
            <label className="device-select"><span><Camera size={15} /> CAMERA</span><select value={cameraId} onChange={(event) => setCameraId(event.target.value)} disabled={!devices.cameras.length}><option value="">SYSTEM DEFAULT</option>{devices.cameras.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{deviceLabel(device, index, "Camera")}</option>)}</select><ChevronDown size={15} /></label>
            {devices.speakers.length > 0 && "setSinkId" in HTMLMediaElement.prototype ? <label className="device-select"><span>◖)) OUTPUT</span><select value={speakerId} onChange={(event) => setSpeakerId(event.target.value)}><option value="">SYSTEM DEFAULT</option>{devices.speakers.map((device, index) => <option key={device.deviceId} value={device.deviceId}>{deviceLabel(device, index, "Speaker")}</option>)}</select><ChevronDown size={15} /></label> : null}

            {!supported || mediaError || error ? <div className="inline-error" role="alert">{error || mediaError || "Media devices are not supported in this browser."}</div> : null}

            <RetroButton tone="primary" className="join-call-button" disabled={joining || requesting} onClick={submit}>
              {joining ? "CONNECTING..." : "JOIN PRIVATE CALL"}
            </RetroButton>
            <p className="privacy-note"><ShieldCheck size={15} /> Only invited people with this link can join. Maximum two participants.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
