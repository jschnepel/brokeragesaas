// lib/sse/connection-manager.ts

import { formatSSE, type SSEPayload } from "./events";

interface Connection {
  controller: ReadableStreamDefaultController;
  userId: string;
  role: string;
}

class SSEConnectionManager {
  /** userId → set of active stream controllers (supports multiple tabs) */
  private connections = new Map<string, Set<ReadableStreamDefaultController>>();
  /** role → set of userIds with that role */
  private roleIndex = new Map<string, Set<string>>();

  addConnection(userId: string, role: string, controller: ReadableStreamDefaultController) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }
    this.connections.get(userId)!.add(controller);

    if (!this.roleIndex.has(role)) {
      this.roleIndex.set(role, new Set());
    }
    this.roleIndex.get(role)!.add(userId);
  }

  removeConnection(userId: string, controller: ReadableStreamDefaultController) {
    const controllers = this.connections.get(userId);
    if (!controllers) return;
    controllers.delete(controller);
    if (controllers.size === 0) {
      this.connections.delete(userId);
      for (const [, users] of this.roleIndex) {
        users.delete(userId);
      }
    }
  }

  sendToUser(userId: string, event: SSEPayload) {
    const controllers = this.connections.get(userId);
    if (!controllers) return;
    const data = formatSSE(event);
    const encoder = new TextEncoder();
    for (const controller of controllers) {
      try {
        controller.enqueue(encoder.encode(data));
      } catch {
        // Controller closed, will be cleaned up on cancel
      }
    }
  }

  sendToRole(role: string, event: SSEPayload) {
    const userIds = this.roleIndex.get(role);
    if (!userIds) return;
    for (const userId of userIds) {
      this.sendToUser(userId, event);
    }
  }

  get connectionCount(): number {
    let count = 0;
    for (const [, controllers] of this.connections) {
      count += controllers.size;
    }
    return count;
  }
}

// Singleton via globalThis to survive HMR reloads
const globalKey = "__sse_connection_manager__";

function getConnectionManager(): SSEConnectionManager {
  if (!(globalThis as Record<string, unknown>)[globalKey]) {
    (globalThis as Record<string, unknown>)[globalKey] = new SSEConnectionManager();
  }
  return (globalThis as Record<string, unknown>)[globalKey] as SSEConnectionManager;
}

export const connectionManager = getConnectionManager();
