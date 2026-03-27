"""
TikTok Live Connector for Kadro Kur
Compatible with TikTokLive >= 6.0
"""

import sys
import asyncio
import json
import time
import signal
import websockets
from TikTokLive import TikTokLiveClient
from TikTokLive.events import (
    ConnectEvent,
    DisconnectEvent,
    LikeEvent,
    GiftEvent,
    CommentEvent,
    JoinEvent,
)

# --- CLI Arguments ---
if len(sys.argv) < 4:
    print("Usage: python tiktok_connector.py <tiktok_username> <ws_port> <session_id>")
    sys.exit(1)

TIKTOK_USERNAME = sys.argv[1].lstrip("@")
WS_PORT = int(sys.argv[2])
SESSION_ID = sys.argv[3]

# --- Persistent WebSocket connection ---
ws_connection = None
reconnect_attempts = 0
MAX_RECONNECT_ATTEMPTS = 5
shutting_down = False


async def ensure_ws():
    """Ensure we have a live WebSocket connection to the Node.js server."""
    global ws_connection
    if ws_connection is None or ws_connection.closed:
        ws_connection = await websockets.connect(f"ws://localhost:{WS_PORT}")
    return ws_connection


async def send_to_node(event_type, data):
    """Send an event payload to the Node.js server over WebSocket."""
    try:
        ws = await ensure_ws()
        payload = json.dumps({
            "session_id": SESSION_ID,
            "type": event_type,
            "data": data,
            "timestamp": time.time(),
        })
        await ws.send(payload)
    except Exception as e:
        print(f"WS error: {e}", flush=True)


# --- TikTok Client (v6+ API) ---
client = TikTokLiveClient(unique_id=TIKTOK_USERNAME)


# --- Event Handlers ---

@client.on(ConnectEvent)
async def on_connect(event: ConnectEvent):
    """Fires when successfully connected to the TikTok Live room."""
    global reconnect_attempts
    reconnect_attempts = 0
    print(f"Connected to @{TIKTOK_USERNAME} live room", flush=True)
    await send_to_node("connected", {
        "username": TIKTOK_USERNAME,
        "room_id": client.room_id,
    })


@client.on(DisconnectEvent)
async def on_disconnect(event: DisconnectEvent):
    """Fires when disconnected. Attempts auto-reconnect."""
    global reconnect_attempts, shutting_down

    if shutting_down:
        return

    print(f"Disconnected from @{TIKTOK_USERNAME}", flush=True)
    await send_to_node("disconnected", {
        "username": TIKTOK_USERNAME,
        "reason": "stream_ended",
    })

    reconnect_attempts += 1
    if reconnect_attempts <= MAX_RECONNECT_ATTEMPTS:
        delay = min(5 * reconnect_attempts, 30)
        print(f"Reconnect attempt {reconnect_attempts}/{MAX_RECONNECT_ATTEMPTS} in {delay}s...", flush=True)
        await asyncio.sleep(delay)
        try:
            await client.start()
        except Exception as e:
            print(f"Reconnect failed: {e}", flush=True)
    else:
        print("Max reconnect attempts reached. Exiting.", flush=True)
        await send_to_node("error", {
            "username": TIKTOK_USERNAME,
            "message": "Max reconnect attempts reached",
        })


@client.on(LikeEvent)
async def on_like(event: LikeEvent):
    """Fires on like events. Uses event.likes for combo count."""
    like_count = getattr(event, "likes", 1) or 1
    user = getattr(event, "user", None)
    username = getattr(user, "unique_id", "unknown") if user else "unknown"
    nickname = getattr(user, "nickname", username) if user else username
    user_id = getattr(user, "user_id", None) if user else None

    await send_to_node("like", {
        "username": username,
        "nickname": nickname,
        "user_id": str(user_id) if user_id else None,
        "likes": like_count,
    })


@client.on(GiftEvent)
async def on_gift(event: GiftEvent):
    """Fires on gift events. Only process when streak is complete."""
    # For streakable gifts, only process when the streak is done
    gift = getattr(event, "gift", None)
    if gift and getattr(gift, "streakable", False):
        if getattr(event, "streaking", False):
            return

    user = getattr(event, "user", None)
    username = getattr(user, "unique_id", "unknown") if user else "unknown"
    nickname = getattr(user, "nickname", username) if user else username
    user_id = getattr(user, "user_id", None) if user else None

    gift_name = getattr(gift, "name", "unknown") if gift else "unknown"
    gift_id = getattr(gift, "id", None) if gift else None
    diamond_count = getattr(gift, "diamond_count", 0) if gift else 0
    repeat_count = getattr(event, "repeat_count", 1) or 1

    await send_to_node("gift", {
        "username": username,
        "nickname": nickname,
        "user_id": str(user_id) if user_id else None,
        "gift_name": gift_name,
        "gift_id": gift_id,
        "diamond_count": diamond_count,
        "repeat_count": repeat_count,
        "total_diamonds": diamond_count * repeat_count,
    })


@client.on(CommentEvent)
async def on_comment(event: CommentEvent):
    """Fires when a comment is received."""
    user = getattr(event, "user", None)
    username = getattr(user, "unique_id", "unknown") if user else "unknown"
    nickname = getattr(user, "nickname", username) if user else username
    user_id = getattr(user, "user_id", None) if user else None
    comment = getattr(event, "comment", "")

    await send_to_node("comment", {
        "username": username,
        "nickname": nickname,
        "user_id": str(user_id) if user_id else None,
        "comment": comment,
    })


@client.on(JoinEvent)
async def on_join(event: JoinEvent):
    """Fires when a user joins the live."""
    user = getattr(event, "user", None)
    username = getattr(user, "unique_id", "unknown") if user else "unknown"
    nickname = getattr(user, "nickname", username) if user else username

    await send_to_node("join", {
        "username": username,
        "nickname": nickname,
    })


# --- Clean Shutdown ---

def handle_sigterm(*args):
    """Handle SIGTERM for graceful shutdown."""
    global shutting_down
    shutting_down = True
    print("Received SIGTERM, shutting down...", flush=True)

    async def _cleanup():
        await send_to_node("shutdown", {
            "username": TIKTOK_USERNAME,
            "reason": "sigterm",
        })
        global ws_connection
        if ws_connection and not ws_connection.closed:
            await ws_connection.close()

    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(_cleanup())
        else:
            loop.run_until_complete(_cleanup())
    except Exception:
        pass

    sys.exit(0)


signal.signal(signal.SIGTERM, handle_sigterm)
signal.signal(signal.SIGINT, handle_sigterm)


# --- Entry Point ---

if __name__ == "__main__":
    print(
        f"Starting TikTok connector for @{TIKTOK_USERNAME} "
        f"(WS port: {WS_PORT}, session: {SESSION_ID})",
        flush=True,
    )
    client.run()
