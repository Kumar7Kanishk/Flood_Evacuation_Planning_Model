"""Sentinel Hub satellite imagery retrieval module.

Downloads Sentinel-1 SAR (Synthetic Aperture Radar) imagery for flood mapping
and water surface detection over an Area of Interest (AOI).
"""
import argparse
import os
import sys
from pathlib import Path
from typing import Optional, Tuple

import numpy as np

try:
    from sentinelhub import (
        BBox,
        CRS,
        DataCollection,
        MimeType,
        SHConfig,
        SentinelHubRequest,
        bbox_to_dimensions,
    )
except ImportError:
    BBox = CRS = DataCollection = MimeType = SHConfig = SentinelHubRequest = bbox_to_dimensions = None

from Client_id import CLIENT_ID, CLIENT_SECRET, INSTANCE_ID, get_sh_config

# Default AOI: Mandi, Himachal Pradesh, India (vulnerable flood valley)
DEFAULT_BBOX = [76.9, 31.6, 77.1, 31.8]
DEFAULT_START_DATE = "2023-07-01"
DEFAULT_END_DATE = "2023-07-15"

# Evalscript for Sentinel-1 GRD (VV polarization and Decibel scaling)
S1_EVALSCRIPT = """
//VERSION=3
function setup() {
  return {
    input: ["VV"],
    output: { bands: 1, sampleType: "FLOAT32" }
  };
}
function evaluatePixel(sample) {
  return [sample.VV];
}
"""


def build_config() -> SHConfig:
    """Build Sentinel Hub config from Client_id helper with fallback."""
    cfg = get_sh_config()
    if cfg is None:
        cfg = SHConfig()
        if CLIENT_ID and CLIENT_SECRET:
            cfg.sh_client_id = CLIENT_ID
            cfg.sh_client_secret = CLIENT_SECRET
        if INSTANCE_ID:
            cfg.instance_id = INSTANCE_ID
    return cfg


def download_sentinel1_image(
    bbox_coords: Tuple[float, float, float, float] = tuple(DEFAULT_BBOX),
    time_interval: Tuple[str, str] = (DEFAULT_START_DATE, DEFAULT_END_DATE),
    resolution: int = 20,
    output_folder: str = "sentinel1_images",
    config: Optional[SHConfig] = None,
) -> Optional[np.ndarray]:
    """Download Sentinel-1 SAR image for given bounding box and date range.

    Args:
        bbox_coords: (min_lon, min_lat, max_lon, max_lat) in WGS84.
        time_interval: (start_date_str, end_date_str) e.g. ('2023-07-01', '2023-07-15').
        resolution: Spatial resolution in meters (default: 20m).
        output_folder: Directory to cache downloaded tiles.
        config: Sentinel Hub configuration object.

    Returns:
        np.ndarray: 2D or 3D numpy array of SAR values, or None if download fails.
    """
    if BBox is None:
        print("[Sentinalhub] Error: sentinelhub package is not installed.", file=sys.stderr)
        return None

    if config is None:
        config = build_config()

    out_path = Path(output_folder)
    out_path.mkdir(parents=True, exist_ok=True)

    bbox = BBox(bbox=list(bbox_coords), crs=CRS.WGS84)
    size = bbox_to_dimensions(bbox, resolution=resolution)

    print(f"[Sentinalhub] Fetching Sentinel-1 imagery for BBox={bbox_coords}, Size={size}...")

    request = SentinelHubRequest(
        data_folder=str(out_path),
        evalscript=S1_EVALSCRIPT,
        input_data=[
            SentinelHubRequest.input_data(
                DataCollection.SENTINEL1_IW,
                time_interval=time_interval,
                mosaicking_order="leastCC",
            )
        ],
        responses=[SentinelHubRequest.output_response("default", MimeType.TIFF)],
        bbox=bbox,
        size=size,
        config=config,
    )

    try:
        data = request.get_data(save_data=True)
        if data and len(data) > 0:
            image = data[0]
            print(f"[Sentinalhub] Successfully retrieved SAR imagery. Array shape: {image.shape}")
            return image
        print("[Sentinalhub] No image data returned for given time interval and AOI.")
        return None
    except Exception as exc:
        print(f"[Sentinalhub] API call failed: {exc}", file=sys.stderr)
        return None


def main():
    parser = argparse.ArgumentParser(description="Download Sentinel-1 SAR imagery for flood detection")
    parser.add_argument("--bbox", nargs=4, type=float, default=DEFAULT_BBOX,
                        metavar=("MIN_LON", "MIN_LAT", "MAX_LON", "MAX_LAT"),
                        help="Bounding box in WGS84 degrees")
    parser.add_argument("--start", default=DEFAULT_START_DATE, help="Start date (YYYY-MM-DD)")
    parser.add_argument("--end", default=DEFAULT_END_DATE, help="End date (YYYY-MM-DD)")
    parser.add_argument("--res", type=int, default=20, help="Resolution in meters (default: 20)")
    parser.add_argument("--out", default="sentinel1_images", help="Output directory")

    args = parser.parse_args()

    image = download_sentinel1_image(
        bbox_coords=tuple(args.bbox),
        time_interval=(args.start, args.end),
        resolution=args.res,
        output_folder=args.out,
    )

    if image is not None:
        print(f"Downloaded imagery saved in '{args.out}'. Shape: {image.shape}")
    else:
        print("Could not retrieve imagery from Sentinel Hub. Using fallback simulated dataset if needed.")


if __name__ == "__main__":
    main()