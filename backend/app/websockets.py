from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger("resqnet.ws")

ws_router = APIRouter(tags=["websockets"])


class ConnectionManager:
    """Manages real-time WebSocket connections and broadcasts across disaster response channels."""

    def __init__(self) -> None:
        self.active_connections: dict[str, set[WebSocket]] = {
            "alerts": set(),
            "sos": set(),
            "routes": set(),
            "general": set(),
        }
        self.loop: asyncio.AbstractEventLoop | None = None

    def set_loop(self, loop: asyncio.AbstractEventLoop) -> None:
        self.loop = loop

    async def connect(self, websocket: WebSocket, channel: str = "general") -> None:
        await websocket.accept()
        if self.loop is None:
            try:
                self.loop = asyncio.get_running_loop()
            except RuntimeError:
                pass

        if channel not in self.active_connections:
            self.active_connections[channel] = set()
        self.active_connections[channel].add(websocket)

        # Send greeting acknowledgement
        await websocket.send_json({
            "event": "connected",
            "channel": channel,
            "message": f"Connected to ResQNet [{channel}] live stream",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    def disconnect(self, websocket: WebSocket, channel: str = "general") -> None:
        if channel in self.active_connections:
            self.active_connections[channel].discard(websocket)

    async def broadcast(self, channel: str, message: dict[str, Any]) -> None:
        """Broadcast payload to all sockets subscribed to channel or general."""
        targets: list[WebSocket] = list(self.active_connections.get(channel, set()))
        if channel != "general":
            targets.extend(list(self.active_connections.get("general", set())))

        unique_targets = set(targets)
        dead_sockets: list[WebSocket] = []

        for socket in unique_targets:
            try:
                await socket.send_json(message)
            except Exception:
                dead_sockets.append(socket)

        for dead in dead_sockets:
            for ch in self.active_connections.values():
                ch.discard(dead)

    def broadcast_sync(self, channel: str, message: dict[str, Any]) -> None:
        """Thread-safe broadcast helper for synchronous FastAPI endpoint handlers."""
        # Ensure timestamp is attached
        if "timestamp" not in message:
            message["timestamp"] = datetime.now(timezone.utc).isoformat()

        try:
            loop = self.loop
            if loop is None:
                try:
                    loop = asyncio.get_running_loop()
                except RuntimeError:
                    pass

            if loop is not None and loop.is_running():
                asyncio.run_coroutine_threadsafe(self.broadcast(channel, message), loop)
        except Exception as e:
            logger.warning("Failed to broadcast WS event: %s", e)

    def get_stats(self) -> dict[str, int]:
        """Return active connection counts per channel."""
        return {ch: len(conns) for ch, conns in self.active_connections.items()}


manager = ConnectionManager()


async def _handle_websocket_lifecycle(websocket: WebSocket, channel: str) -> None:
    await manager.connect(websocket, channel)
    try:
        while True:
            data = await websocket.receive_json()
            # Handle heartbeat ping/pong
            action = data.get("action")
            if action == "ping":
                await websocket.send_json({
                    "event": "pong",
                    "channel": channel,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
            elif action == "subscribe":
                sub_channel = data.get("channel", channel)
                if sub_channel in manager.active_connections:
                    manager.active_connections[sub_channel].add(websocket)
                    await websocket.send_json({
                        "event": "subscribed",
                        "channel": sub_channel,
                    })
    except (WebSocketDisconnect, Exception):
        manager.disconnect(websocket, channel)


@ws_router.websocket("/ws")
async def ws_general_endpoint(websocket: WebSocket) -> None:
    """Unified WebSocket stream receiving all platform events (alerts, SOS, routes, sync)."""
    await _handle_websocket_lifecycle(websocket, "general")


@ws_router.websocket("/ws/alerts")
async def ws_alerts_endpoint(websocket: WebSocket) -> None:
    """Real-time early warning and authority hazard alert broadcast stream."""
    await _handle_websocket_lifecycle(websocket, "alerts")


@ws_router.websocket("/ws/sos")
async def ws_sos_endpoint(websocket: WebSocket) -> None:
    """Real-time citizen SOS distress calls and responder assignment stream."""
    await _handle_websocket_lifecycle(websocket, "sos")


@ws_router.websocket("/ws/routes")
async def ws_routes_endpoint(websocket: WebSocket) -> None:
    """Real-time road hazard, blockage, and safe route update stream."""
    await _handle_websocket_lifecycle(websocket, "routes")


@ws_router.get("/ws/stats")
def websocket_stats() -> dict[str, Any]:
    """Inspect active WebSocket connection counts."""
    return {"connections": manager.get_stats()}
