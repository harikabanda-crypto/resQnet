/**
 * ResQNet Real-Time WebSocket Service
 * Provides auto-reconnecting WebSocket connection to the backend
 * with event subscription and pub/sub routing.
 */

class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.statusListeners = new Set();
    this.reconnectTimer = null;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 15000;
    this.shouldReconnect = true;
    this.isConnected = false;
  }

  getWebSocketUrl(channel = '') {
    const envUrl = import.meta.env.VITE_WS_URL;
    if (envUrl) {
      return `${envUrl}${channel ? `/${channel}` : ''}`;
    }
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${proto}//${host}/ws${channel ? `/${channel}` : ''}`;
  }

  connect(channel = '') {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const url = this.getWebSocketUrl(channel);
    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectDelay = 1000;
        this._notifyStatus(true);
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this._dispatch(payload);
        } catch {
          // Plain text or ping message
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this._notifyStatus(false);
        if (this.shouldReconnect) {
          this._scheduleReconnect(channel);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[WebSocketService] WebSocket error:', err);
        this.ws?.close();
      };
    } catch (err) {
      console.warn('[WebSocketService] Connection failed:', err);
      this._scheduleReconnect(channel);
    }
  }

  _scheduleReconnect(channel) {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxReconnectDelay);
      this.connect(channel);
    }, this.reconnectDelay);
  }

  _notifyStatus(status) {
    this.statusListeners.forEach((listener) => {
      try {
        listener(status);
      } catch (err) {
        console.error('[WebSocketService] Status listener error:', err);
      }
    });
  }

  _dispatch(message) {
    const eventType = message.event || message.type || 'message';
    const callbacks = this.listeners.get(eventType);
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(message.data !== undefined ? message.data : message);
        } catch (err) {
          console.error(`[WebSocketService] Listener error for ${eventType}:`, err);
        }
      });
    }

    // Also dispatch to wildcard '*' listeners
    const wildcard = this.listeners.get('*');
    if (wildcard) {
      wildcard.forEach((cb) => {
        try {
          cb(message);
        } catch (err) {
          console.error('[WebSocketService] Wildcard listener error:', err);
        }
      });
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  onStatusChange(callback) {
    this.statusListeners.add(callback);
    callback(this.isConnected);
    return () => this.statusListeners.delete(callback);
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
      return true;
    }
    return false;
  }

  disconnect() {
    this.shouldReconnect = false;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this._notifyStatus(false);
  }
}

export const wsService = new WebSocketService();
export default wsService;
