import { createHash } from "crypto";
import { Server } from "http";
import { Duplex } from "stream";
import { logger } from "@/utils/logger";
import { onRealtimeBroadcast, RealtimeEnvelope } from "@/realtime/events";

interface WebSocketClient {
  socket: Duplex;
}

const WS_MAGIC = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

function encodeFrame(message: string): Buffer {
  const payload = Buffer.from(message, "utf8");
  const payloadLength = payload.length;

  let header: Buffer;

  if (payloadLength < 126) {
    header = Buffer.alloc(2);
    header[0] = 0x81;
    header[1] = payloadLength;
  } else if (payloadLength < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(payloadLength, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x81;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(payloadLength), 2);
  }

  return Buffer.concat([header, payload]);
}

function createAcceptValue(secWebSocketKey: string): string {
  return createHash("sha1")
    .update(secWebSocketKey + WS_MAGIC)
    .digest("base64");
}

export function attachRealtimeWebSocketServer(server: Server): void {
  const clients = new Set<WebSocketClient>();

  server.on("upgrade", (req, socket) => {
    if (req.url !== "/ws") {
      socket.destroy();
      return;
    }

    const key = req.headers["sec-websocket-key"];
    const upgradeHeader = req.headers["upgrade"];

    if (!key || upgradeHeader?.toLowerCase() !== "websocket") {
      socket.destroy();
      return;
    }

    const acceptKey = createAcceptValue(key);

    const responseHeaders = [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${acceptKey}`,
      "",
      "",
    ];

    socket.write(responseHeaders.join("\r\n"));

    const client: WebSocketClient = { socket };
    clients.add(client);

    logger.info(`[Realtime] WebSocket connected. Clients: ${clients.size}`);

    socket.on("close", () => {
      clients.delete(client);
      logger.info(
        `[Realtime] WebSocket disconnected. Clients: ${clients.size}`,
      );
    });

    socket.on("error", () => {
      clients.delete(client);
    });

    // We currently use one-way push only; incoming frames are ignored.
    socket.on("data", () => undefined);
  });

  onRealtimeBroadcast((payload: RealtimeEnvelope) => {
    if (clients.size === 0) return;

    const frame = encodeFrame(JSON.stringify(payload));

    for (const client of clients) {
      if (!client.socket.destroyed) {
        client.socket.write(frame);
      }
    }
  });

  logger.info("[Realtime] Native WebSocket server attached at /ws");
}
