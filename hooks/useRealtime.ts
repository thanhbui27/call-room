"use client";

import { useRoomContext } from "@livekit/components-react";
import { RoomEvent } from "livekit-client";
import { useCallback, useEffect, useRef, useState } from "react";

import { DATA_TOPIC, MAX_MESSAGE_LENGTH, REACTIONS } from "@/lib/constants";
import type { ChatMessagePayload, ReactionPayload, RealtimePayload } from "@/lib/types";

function isPayload(value: unknown): value is RealtimePayload {
  if (!value || typeof value !== "object") return false;
  const payload = value as Record<string, unknown>;
  if (payload.type === "chat") {
    return typeof payload.id === "string" && typeof payload.senderId === "string" &&
      typeof payload.senderName === "string" && typeof payload.text === "string" &&
      payload.text.length > 0 && payload.text.length <= MAX_MESSAGE_LENGTH &&
      typeof payload.timestamp === "number";
  }
  if (payload.type === "reaction") {
    return typeof payload.id === "string" && typeof payload.senderId === "string" &&
      typeof payload.senderName === "string" && typeof payload.emoji === "string" &&
      REACTIONS.includes(payload.emoji as (typeof REACTIONS)[number]) && typeof payload.timestamp === "number";
  }
  return false;
}

export function useRealtime() {
  const room = useRoomContext();
  const [messages, setMessages] = useState<ChatMessagePayload[]>([]);
  const [reactions, setReactions] = useState<ReactionPayload[]>([]);
  const reactionTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const showReaction = useCallback((reaction: ReactionPayload) => {
    setReactions((current) => [...current.slice(-11), reaction]);
    const timer = setTimeout(() => {
      setReactions((current) => current.filter((item) => item.id !== reaction.id));
      reactionTimers.current.delete(reaction.id);
    }, 3_500);
    reactionTimers.current.set(reaction.id, timer);
  }, []);

  useEffect(() => {
    const handleData = (bytes: Uint8Array, _participant: unknown, _kind: unknown, topic?: string) => {
      if (topic !== DATA_TOPIC) return;
      try {
        const payload: unknown = JSON.parse(new TextDecoder().decode(bytes));
        if (!isPayload(payload)) return;
        if (payload.type === "chat") {
          setMessages((current) => current.some((item) => item.id === payload.id) ? current : [...current, payload]);
        } else {
          showReaction(payload);
        }
      } catch {
        // Ignore malformed/untrusted data packets.
      }
    };

    room.on(RoomEvent.DataReceived, handleData);
    return () => { room.off(RoomEvent.DataReceived, handleData); };
  }, [room, showReaction]);

  useEffect(() => () => {
    reactionTimers.current.forEach((timer) => clearTimeout(timer));
    reactionTimers.current.clear();
  }, []);

  const publish = useCallback(async (payload: RealtimePayload) => {
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    await room.localParticipant.publishData(bytes, { reliable: true, topic: DATA_TOPIC });
  }, [room]);

  const sendMessage = useCallback(async (text: string) => {
    const normalized = text.trim();
    if (!normalized || normalized.length > MAX_MESSAGE_LENGTH) return;
    const payload: ChatMessagePayload = {
      type: "chat",
      id: crypto.randomUUID(),
      senderId: room.localParticipant.identity,
      senderName: room.localParticipant.name || "You",
      text: normalized,
      timestamp: Date.now(),
    };
    setMessages((current) => [...current, payload]);
    try {
      await publish(payload);
    } catch (error) {
      setMessages((current) => current.filter((item) => item.id !== payload.id));
      throw error;
    }
  }, [publish, room]);

  const sendReaction = useCallback(async (emoji: (typeof REACTIONS)[number]) => {
    const payload: ReactionPayload = {
      type: "reaction",
      id: crypto.randomUUID(),
      emoji,
      senderId: room.localParticipant.identity,
      senderName: room.localParticipant.name || "You",
      timestamp: Date.now(),
    };
    showReaction(payload);
    await publish(payload);
  }, [publish, room, showReaction]);

  return { messages, reactions, sendMessage, sendReaction };
}
