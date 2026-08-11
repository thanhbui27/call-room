"use client";

import { Camera, ChevronDown, Mic, Speaker, X } from "lucide-react";
import { useRoomContext } from "@livekit/components-react";
import { useEffect, useRef, useState } from "react";

import { RetroButton } from "@/components/ui/RetroButton";
import { useMediaDevices } from "@/hooks/useMediaDevices";

interface DeviceSettingsProps {
  onClose: () => void;
}

function label(device: MediaDeviceInfo, index: number, fallback: string) {
  return device.label || `${fallback} ${index + 1}`;
}

export function DeviceSettings({ onClose }: DeviceSettingsProps) {
  const room = useRoomContext();
  const modalRef = useRef<HTMLElement>(null);
  const { devices } = useMediaDevices();
  const [microphoneId, setMicrophoneId] = useState(room.getActiveDevice("audioinput") || "");
  const [cameraId, setCameraId] = useState(room.getActiveDevice("videoinput") || "");
  const [speakerId, setSpeakerId] = useState(room.getActiveDevice("audiooutput") || "");
  const [error, setError] = useState("");
  const [switching, setSwitching] = useState(false);
  const supportsOutput = typeof HTMLMediaElement !== "undefined" && "setSinkId" in HTMLMediaElement.prototype;

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    const focusable = Array.from(modal.querySelectorAll<HTMLElement>("button, select, input, [tabindex]:not([tabindex='-1'])"));
    focusable[0]?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const switchDevice = async (kind: MediaDeviceKind, deviceId: string) => {
    setError("");
    setSwitching(true);
    try {
      if (deviceId) await room.switchActiveDevice(kind, deviceId, true);
      if (kind === "audiooutput" && supportsOutput) {
        const audioElements = document.querySelectorAll<HTMLAudioElement>("audio");
        await Promise.all(Array.from(audioElements).map((element) => (element as HTMLAudioElement & { setSinkId(id: string): Promise<void> }).setSinkId(deviceId)));
      }
    } catch {
      setError("The selected device could not be activated.");
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={modalRef} className="device-modal" role="dialog" aria-modal="true" aria-labelledby="device-title">
        <header><div><small>CALL PREFERENCES</small><h2 id="device-title">DEVICE SETTINGS</h2></div><button onClick={onClose} aria-label="Close settings"><X size={20} /></button></header>
        <div className="device-modal__body">
          <p>Switch equipment without leaving or reconnecting to the call.</p>
          <label className="settings-select"><span><Mic size={17} /><b>MICROPHONE</b></span><div><select value={microphoneId} onChange={(event) => { setMicrophoneId(event.target.value); void switchDevice("audioinput", event.target.value); }} disabled={switching}><option value="">SYSTEM DEFAULT</option>{devices.microphones.map((device, index) => <option value={device.deviceId} key={device.deviceId}>{label(device, index, "Microphone")}</option>)}</select><ChevronDown size={16} /></div></label>
          <label className="settings-select"><span><Camera size={17} /><b>CAMERA</b></span><div><select value={cameraId} onChange={(event) => { setCameraId(event.target.value); void switchDevice("videoinput", event.target.value); }} disabled={switching}><option value="">SYSTEM DEFAULT</option>{devices.cameras.map((device, index) => <option value={device.deviceId} key={device.deviceId}>{label(device, index, "Camera")}</option>)}</select><ChevronDown size={16} /></div></label>
          {supportsOutput ? <label className="settings-select"><span><Speaker size={17} /><b>SPEAKER</b></span><div><select value={speakerId} onChange={(event) => { setSpeakerId(event.target.value); void switchDevice("audiooutput", event.target.value); }} disabled={switching}><option value="">SYSTEM DEFAULT</option>{devices.speakers.map((device, index) => <option value={device.deviceId} key={device.deviceId}>{label(device, index, "Speaker")}</option>)}</select><ChevronDown size={16} /></div></label> : <div className="settings-unavailable"><Speaker size={17} /> Speaker selection is controlled by this browser or operating system.</div>}
          {error ? <div className="inline-error" role="alert">{error}</div> : null}
        </div>
        <footer><RetroButton tone="primary" onClick={onClose}>DONE</RetroButton></footer>
      </section>
    </div>
  );
}
