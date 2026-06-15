import { EventEmitter } from "events";

export type RealtimeChannel =
  | "activity"
  | "competitors"
  | "notifications"
  | "pipeline"
  | "post"
  | "analytics";

export interface RealtimeEnvelope<T = unknown> {
  channel: RealtimeChannel;
  event: string;
  data: T;
  timestamp: string;
}

const realtimeBus = new EventEmitter();

realtimeBus.setMaxListeners(100);

export function emitRealtime<T>(
  channel: RealtimeChannel,
  event: string,
  data: T,
): void {
  const payload: RealtimeEnvelope<T> = {
    channel,
    event,
    data,
    timestamp: new Date().toISOString(),
  };

  realtimeBus.emit("broadcast", payload);
  realtimeBus.emit(`${channel}:${event}`, payload);
}

export function onRealtimeBroadcast(
  listener: (payload: RealtimeEnvelope) => void,
): () => void {
  realtimeBus.on("broadcast", listener);
  return () => realtimeBus.off("broadcast", listener);
}
