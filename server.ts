import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  // Middleware
  app.use(express.json());

  // WebSocket Server
  const wss = new WebSocketServer({ server });

  // Store for shared state (simulating room.store)
  const sharedStore: Record<string, any> = {
    worldState: { objects: [] },
  };

  // Connected clients
  const clients = new Set<WebSocket>();

  wss.on("connection", (ws) => {
    clients.add(ws);

    // Send initial state
    ws.send(JSON.stringify({ type: "SYNC_STORE", payload: sharedStore }));

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === "UPDATE_STORE") {
          const { key, value } = data.payload;
          sharedStore[key] = value;
          // Broadcast to others
          const updateMsg = JSON.stringify({ type: "STORE_UPDATED", payload: { key, value } });
          clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(updateMsg);
            }
          });
        } else if (data.type === "PRESENCE") {
          // Broadcast presence
          const presenceMsg = JSON.stringify({ type: "PEER_PRESENCE", payload: data.payload });
          clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(presenceMsg);
            }
          });
        }
      } catch (e) {
        console.error("WS Error:", e);
      }
    });

    ws.on("close", () => {
      clients.delete(ws);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving would go here
    app.use(express.static("dist"));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
