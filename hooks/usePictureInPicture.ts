"use client";

import { useCallback, useEffect, useState } from "react";

type SafariVideoElement = HTMLVideoElement & {
  webkitPresentationMode?: string;
  webkitSetPresentationMode?: (mode: "inline" | "picture-in-picture") => void;
  webkitSupportsPresentationMode?: (mode: "picture-in-picture") => boolean;
};

type PictureInPictureDocument = Document & {
  exitPictureInPicture?: () => Promise<void>;
  pictureInPictureElement?: Element | null;
  pictureInPictureEnabled?: boolean;
};

type PictureInPictureVideo = HTMLVideoElement & {
  requestPictureInPicture?: () => Promise<unknown>;
};

function findPictureInPictureVideo(): HTMLVideoElement | null {
  const priorities = ["screen", "remote", "remote-compact", "local"];
  for (const priority of priorities) {
    const candidates = document.querySelectorAll<HTMLVideoElement>(`video[data-pip-priority='${priority}']`);
    const playing = Array.from(candidates).find((video) => video.srcObject && video.readyState > HTMLMediaElement.HAVE_NOTHING);
    if (playing) return playing;
  }
  return null;
}

function browserSupportsPictureInPicture() {
  if (typeof document === "undefined" || typeof HTMLVideoElement === "undefined") return false;
  const standard = Boolean((document as PictureInPictureDocument).pictureInPictureEnabled && "requestPictureInPicture" in HTMLVideoElement.prototype);
  const safari = "webkitSetPresentationMode" in HTMLVideoElement.prototype;
  return standard || safari;
}

export function usePictureInPicture() {
  const [supported] = useState(browserSupportsPictureInPicture);
  const [active, setActive] = useState(false);

  const enter = useCallback(async () => {
    const video = findPictureInPictureVideo();
    if (!video) throw new Error("No active video is available for mini view.");

    const pipDocument = document as PictureInPictureDocument;
    const standardVideo = video as PictureInPictureVideo;
    if (pipDocument.pictureInPictureEnabled && standardVideo.requestPictureInPicture) {
      if (pipDocument.pictureInPictureElement !== video) await standardVideo.requestPictureInPicture();
      setActive(true);
      return;
    }

    const safariVideo = video as SafariVideoElement;
    if (safariVideo.webkitSupportsPresentationMode?.("picture-in-picture") && safariVideo.webkitSetPresentationMode) {
      safariVideo.webkitSetPresentationMode("picture-in-picture");
      setActive(true);
      return;
    }

    throw new Error("Picture-in-picture is unavailable in this browser.");
  }, []);

  const exit = useCallback(async () => {
    const pipDocument = document as PictureInPictureDocument;
    if (pipDocument.pictureInPictureElement && pipDocument.exitPictureInPicture) {
      await pipDocument.exitPictureInPicture();
      setActive(false);
      return;
    }

    const safariVideo = findPictureInPictureVideo() as SafariVideoElement | null;
    if (safariVideo?.webkitPresentationMode === "picture-in-picture" && safariVideo.webkitSetPresentationMode) {
      safariVideo.webkitSetPresentationMode("inline");
    }
    setActive(false);
  }, []);

  const toggle = useCallback(async () => {
    const pipDocument = document as PictureInPictureDocument;
    const safariVideo = findPictureInPictureVideo() as SafariVideoElement | null;
    const currentlyActive = Boolean(pipDocument.pictureInPictureElement || safariVideo?.webkitPresentationMode === "picture-in-picture");
    if (currentlyActive) await exit();
    else await enter();
  }, [enter, exit]);

  useEffect(() => {
    if (!supported) return;

    const entered = () => setActive(true);
    const left = () => setActive(false);
    document.addEventListener("enterpictureinpicture", entered, true);
    document.addEventListener("leavepictureinpicture", left, true);

    let mediaSessionRegistered = false;
    if ("mediaSession" in navigator) {
      try {
        const mediaSession = navigator.mediaSession as MediaSession & {
          setActionHandler(action: "enterpictureinpicture", handler: (() => void) | null): void;
        };
        mediaSession.setActionHandler("enterpictureinpicture", () => { void enter().catch(() => undefined); });
        mediaSessionRegistered = true;
      } catch {
        // Older browsers expose Media Session but not the PiP action.
      }
    }

    return () => {
      document.removeEventListener("enterpictureinpicture", entered, true);
      document.removeEventListener("leavepictureinpicture", left, true);
      if (mediaSessionRegistered) {
        try {
          const mediaSession = navigator.mediaSession as MediaSession & {
            setActionHandler(action: "enterpictureinpicture", handler: (() => void) | null): void;
          };
          mediaSession.setActionHandler("enterpictureinpicture", null);
        } catch {
          // The browser may remove the action while the page is backgrounded.
        }
      }
    };
  }, [enter, supported]);

  return { pictureInPictureSupported: supported, pictureInPictureActive: active, togglePictureInPicture: toggle };
}
