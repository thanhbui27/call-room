"use client";

import { useCallback, useEffect, useState } from "react";

import type { MediaDeviceState } from "@/lib/types";

const EMPTY_DEVICES: MediaDeviceState = { cameras: [], microphones: [], speakers: [] };

export function useMediaDevices() {
  const [devices, setDevices] = useState<MediaDeviceState>(EMPTY_DEVICES);
  const [supported, setSupported] = useState(true);

  const refresh = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      setSupported(false);
      return;
    }
    const available = await navigator.mediaDevices.enumerateDevices();
    setDevices({
      cameras: available.filter((device) => device.kind === "videoinput"),
      microphones: available.filter((device) => device.kind === "audioinput"),
      speakers: available.filter((device) => device.kind === "audiooutput"),
    });
  }, []);

  useEffect(() => {
    const task = window.setTimeout(() => void refresh().catch(() => setSupported(false)), 0);
    navigator.mediaDevices?.addEventListener?.("devicechange", refresh);
    return () => {
      window.clearTimeout(task);
      navigator.mediaDevices?.removeEventListener?.("devicechange", refresh);
    };
  }, [refresh]);

  return { devices, refresh, supported };
}
