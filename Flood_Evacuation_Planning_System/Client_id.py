"""Sentinel Hub credential and configuration helper.

Loads credentials from environment variables, optional config.json, or default values.
"""
import json
import os
from pathlib import Path
from typing import Optional

CONFIG_FILE = Path(__file__).resolve().parent / "config.json"
_file_config = {}
if CONFIG_FILE.is_file():
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            _file_config = json.load(f)
    except Exception:
        _file_config = {}

# Credentials resolution order: Env vars -> config.json -> repository defaults
CLIENT_ID = (
    os.getenv("SENTINELHUB_CLIENT_ID")
    or os.getenv("SH_CLIENT_ID")
    or os.getenv("CLIENT_ID")
    or _file_config.get("client_id")
    or "29bc5709-6b58-4b7d-9dea-e3555ebe06c6"
)

CLIENT_SECRET = (
    os.getenv("SENTINELHUB_CLIENT_SECRET")
    or os.getenv("SH_CLIENT_SECRET")
    or os.getenv("CLIENT_SECRET")
    or _file_config.get("client_secret")
    or "5mYDP6KTzysox5HEiQPp1MrNSx9Ke7Kf"
)

INSTANCE_ID = (
    os.getenv("SENTINELHUB_INSTANCE_ID")
    or os.getenv("INSTANCE_ID")
    or _file_config.get("instance_id")
    or "28134f17-0219-44f8-9787-68fd6151e94f"
)

API_URL = (
    os.getenv("SENTINELHUB_API_URL")
    or _file_config.get("api_url")
    or "https://services.sentinel-hub.com/oauth/token"
)


def get_sh_config():
    """Create and return a configured sentinelhub.SHConfig object."""
    try:
        from sentinelhub import SHConfig

        config = SHConfig()
        if CLIENT_ID:
            config.sh_client_id = CLIENT_ID
        if CLIENT_SECRET:
            config.sh_client_secret = CLIENT_SECRET
        if INSTANCE_ID:
            config.instance_id = INSTANCE_ID
        return config
    except ImportError:
        return None


def get_access_token(timeout: int = 15) -> Optional[str]:
    """Fetch OAuth access token from Sentinel Hub using client credentials."""
    import requests

    payload = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "client_credentials",
    }
    try:
        resp = requests.post(API_URL, data=payload, timeout=timeout)
        resp.raise_for_status()
        return resp.json().get("access_token")
    except Exception as exc:
        print(f"[Client_id] Token retrieval notice: {exc}")
        return None


if __name__ == "__main__":
    print(f"Sentinel Hub Client ID: {CLIENT_ID[:8]}... (configured)")
    print(f"Sentinel Hub Instance ID: {INSTANCE_ID[:8]}... (configured)")
    token = get_access_token()
    if token:
        print("Successfully obtained Sentinel Hub access token!")
    else:
        print("Note: Access token request failed (check credentials or internet connection).")
