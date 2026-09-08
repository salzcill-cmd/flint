// @flint/server — WebSocket Support
// Real-time communication made easy

import { WebSocketServer, WebSocket } from 'ws'

// ─── Types ──────────────────────────────────────────────────────

export interface WebSocketConfig {
  /** Path for WebSocket connections (default: '/ws') */
  path?: string
  /** Enable ping/pong heartbeat (default: true) */
  heartbeat?: boolean
  /** Heartbeat interval in ms (default: 30000) */
  heartbeatInterval?: number
  /** Maximum payload size in bytes (default: 1024 * 1024 = 1MB) */
  maxPayload?: number
  /** Enable per-message compression (default: false) */
  perMessageDeflate?: boolean
}

export interface WSConnection {
  /** Unique connection ID */
  id: string
  /** WebSocket instance */
  ws: WebSocket
  /** Connection metadata */
  data: Record<string, any>
  /** Send message to this client */
  send(data: any): void
  /** Send JSON to this client */
  json(data: any): void
  /** Close connection */
  close(code?: number, reason?: string): void
  /** Subscribe to a room */
  join(room: string): void
  /** Leave a room */
  leave(room: string): void
  /** Check if in room */
  inRoom(room: string): boolean
}

export type WSHandler = (connection: WSConnection, data: any) => void
export type WSConnectHandler = (connection: WSConnection) => void
export type WSDisconnectHandler = (connection: WSConnection, reason: string) => void

// ─── WebSocket Server ───────────────────────────────────────────

export class FlintWebSocket {
  private wss: WebSocketServer | null = null
  private connections: Map<string, WSConnection> = new Map()
  private rooms: Map<string, Set<string>> = new Map()
  private handlers: Map<string, WSHandler> = new Map()
  private connectHandler: WSConnectHandler | null = null
  private disconnectHandler: WSDisconnectHandler | null = null
  private config: WebSocketConfig
  private heartbeatInterval: NodeJS.Timeout | null = null

  constructor(config: WebSocketConfig = {}) {
    this.config = {
      path: '/ws',
      heartbeat: true,
      heartbeatInterval: 30000,
      maxPayload: 1024 * 1024,
      perMessageDeflate: false,
      ...config,
    }
  }

  // ─── Attach to HTTP Server ────────────────────────────────────

  attach(server: any): void {
    this.wss = new WebSocketServer({
      server,
      path: this.config.path,
      maxPayload: this.config.maxPayload,
      perMessageDeflate: this.config.perMessageDeflate,
    })

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req)
    })

    // Start heartbeat
    if (this.config.heartbeat) {
      this.startHeartbeat()
    }
  }

  // ─── Event Handlers ───────────────────────────────────────────

  on(event: 'connect', handler: WSConnectHandler): this
  on(event: 'disconnect', handler: WSDisconnectHandler): this
  on(event: string, handler: WSHandler): this
  on(event: string, handler: WSHandler | WSConnectHandler | WSDisconnectHandler): this {
    switch (event) {
      case 'connect':
        this.connectHandler = handler as WSConnectHandler
        break
      case 'disconnect':
        this.disconnectHandler = handler as WSDisconnectHandler
        break
      default:
        this.handlers.set(event, handler as WSHandler)
    }
    return this
  }

  // ─── Handle Connection ────────────────────────────────────────

  private handleConnection(ws: WebSocket, req: any): void {
    const id = this.generateId()
    const connection: WSConnection = {
      id,
      ws,
      data: {},
      send: (data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(typeof data === 'string' ? data : JSON.stringify(data))
        }
      },
      json: (data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(data))
        }
      },
      close: (code = 1000, reason = 'Normal closure') => {
        ws.close(code, reason)
      },
      join: (room) => this.joinRoom(id, room),
      leave: (room) => this.leaveRoom(id, room),
      inRoom: (room) => this.isInRoom(id, room),
    }

    this.connections.set(id, connection)

    // Handle messages
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString())
        const { event, payload } = message
        
        if (event && this.handlers.has(event)) {
          this.handlers.get(event)!(connection, payload)
        }
      } catch (error) {
        console.error('[Flint WebSocket] Invalid message:', error)
      }
    })

    // Handle close
    ws.on('close', (reason) => {
      this.handleDisconnect(connection, reason.toString())
    })

    // Handle error
    ws.on('error', (error) => {
      console.error('[Flint WebSocket] Error:', error)
    })

    // Call connect handler
    if (this.connectHandler) {
      this.connectHandler(connection)
    }
  }

  // ─── Handle Disconnect ────────────────────────────────────────

  private handleDisconnect(connection: WSConnection, reason: string): void {
    // Remove from all rooms
    for (const room of this.rooms.keys()) {
      this.leaveRoom(connection.id, room)
    }

    // Remove connection
    this.connections.delete(connection.id)

    // Call disconnect handler
    if (this.disconnectHandler) {
      this.disconnectHandler(connection, reason)
    }
  }

  // ─── Room Management ──────────────────────────────────────────

  private joinRoom(connectionId: string, room: string): void {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set())
    }
    this.rooms.get(room)!.add(connectionId)
  }

  private leaveRoom(connectionId: string, room: string): void {
    const roomSet = this.rooms.get(room)
    if (roomSet) {
      roomSet.delete(connectionId)
      if (roomSet.size === 0) {
        this.rooms.delete(room)
      }
    }
  }

  private isInRoom(connectionId: string, room: string): boolean {
    return this.rooms.get(room)?.has(connectionId) || false
  }

  // ─── Broadcasting ─────────────────────────────────────────────

  /** Broadcast to all connections */
  broadcast(data: any): void {
    const message = typeof data === 'string' ? data : JSON.stringify(data)
    for (const connection of this.connections.values()) {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(message)
      }
    }
  }

  /** Broadcast to a room */
  toRoom(room: string, data: any): void {
    const roomSet = this.rooms.get(room)
    if (!roomSet) return

    const message = typeof data === 'string' ? data : JSON.stringify(data)
    for (const connectionId of roomSet) {
      const connection = this.connections.get(connectionId)
      if (connection && connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.send(message)
      }
    }
  }

  /** Send to specific connection */
  sendTo(connectionId: string, data: any): void {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.send(data)
    }
  }

  // ─── Heartbeat ────────────────────────────────────────────────

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const connection of this.connections.values()) {
        if (connection.ws.readyState === WebSocket.OPEN) {
          connection.ws.ping()
        }
      }
    }, this.config.heartbeatInterval)
  }

  // ─── Utility Methods ──────────────────────────────────────────

  /** Get all connections */
  getConnections(): WSConnection[] {
    return Array.from(this.connections.values())
  }

  /** Get connection count */
  getConnectionCount(): number {
    return this.connections.size
  }

  /** Get room members */
  getRoomMembers(room: string): WSConnection[] {
    const roomSet = this.rooms.get(room)
    if (!roomSet) return []

    return Array.from(roomSet)
      .map(id => this.connections.get(id))
      .filter((c): c is WSConnection => c !== undefined)
  }

  /** Get room count */
  getRoomCount(): number {
    return this.rooms.size
  }

  // ─── Cleanup ──────────────────────────────────────────────────

  close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }

    for (const connection of this.connections.values()) {
      connection.close(1000, 'Server shutting down')
    }

    this.connections.clear()
    this.rooms.clear()

    if (this.wss) {
      this.wss.close()
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }
}

// ─── Factory Function ───────────────────────────────────────────

export function createWebSocket(config?: WebSocketConfig): FlintWebSocket {
  return new FlintWebSocket(config)
}

// ─── Re-export WebSocket ────────────────────────────────────────

export { WebSocket, WebSocketServer }
