"""Satellite image processing and flood mask detection pipeline.

Processes Sentinel-1 SAR / Optical satellite imagery to identify inundated
areas, extract water masks, and generate georeferenced GeoTIFFs for damage analysis.
"""
import argparse
import os
import sys
from pathlib import Path
from typing import Optional, Tuple

import numpy as np

try:
    import rasterio
    from rasterio.transform import from_bounds
except ImportError:
    rasterio = None
    from_bounds = None


def sar_amplitude_to_db(array: np.ndarray, eps: float = 1e-7) -> np.ndarray:
    """Convert linear SAR amplitude or power to Decibels (dB)."""
    return 10.0 * np.log10(np.maximum(array, eps))


def otsu_threshold(image_1d: np.ndarray, num_bins: int = 256) -> float:
    """Compute Otsu's optimal bimodal threshold for water separation."""
    hist, bin_edges = np.histogram(image_1d, bins=num_bins)
    bin_centers = (bin_edges[:-1] + bin_edges[1:]) / 2.0
    total_pixels = image_1d.size

    current_max = 0.0
    threshold = bin_centers[0]
    weight_b = 0.0
    sum_b = 0.0
    total_sum = np.dot(hist, bin_centers)

    for i in range(num_bins):
        weight_b += hist[i]
        if weight_b == 0:
            continue
        weight_f = total_pixels - weight_b
        if weight_f == 0:
            break

        sum_b += hist[i] * bin_centers[i]
        mean_b = sum_b / weight_b
        mean_f = (total_sum - sum_b) / weight_f

        between_var = weight_b * weight_f * ((mean_b - mean_f) ** 2)
        if between_var > current_max:
            current_max = between_var
            threshold = bin_centers[i]

    return float(threshold)


def detect_flood_water(
    sar_array: np.ndarray,
    fixed_threshold_db: Optional[float] = -15.5,
) -> np.ndarray:
    """Detect flood water pixels from Sentinel-1 SAR VV polarization array.

    Water surfaces act like mirrors, reflecting radar waves away from the sensor,
    resulting in very low radar backscatter (< -15 dB).

    Returns:
        mask: uint8 array where 1 = Flood water, 2 = Wet soil/debris, 0 = Dry.
    """
    if sar_array.ndim > 2:
        sar_array = sar_array.squeeze()

    # Determine if values are already in dB or linear amplitude
    min_val, max_val = np.nanmin(sar_array), np.nanmax(sar_array)
    if min_val >= 0.0 and max_val > 1.0:
        db = sar_amplitude_to_db(sar_array / max_val)
    elif min_val >= 0.0 and max_val <= 1.0:
        db = sar_amplitude_to_db(sar_array)
    else:
        db = sar_array  # already in dB

    if fixed_threshold_db is not None:
        thresh = fixed_threshold_db
    else:
        valid_pixels = db[np.isfinite(db)]
        thresh = otsu_threshold(valid_pixels)

    mask = np.zeros(db.shape, dtype=np.uint8)
    # Deep water / high-confidence flood
    mask[db <= thresh] = 1
    # Debris / saturated river banks (slightly higher backscatter)
    mask[(db > thresh) & (db <= (thresh + 2.5))] = 2

    return mask


def generate_synthetic_flood_mask(
    bbox: Tuple[float, float, float, float] = (76.90, 31.60, 77.10, 31.80),
    width: int = 500,
    height: int = 500,
) -> Tuple[np.ndarray, Tuple[float, float, float, float]]:
    """Generate realistic synthetic river valley flood simulation (e.g. Beas river in Mandi, HP).

    Useful for development, CI/CD testing, and demonstrating the evacuation pipeline.
    """
    min_lon, min_lat, max_lon, max_lat = bbox
    lons = np.linspace(min_lon, max_lon, width)
    lats = np.linspace(max_lat, min_lat, height)  # top to bottom
    lon_grid, lat_grid = np.meshgrid(lons, lats)

    # Main meandering river centerline through the valley
    center_lon = min_lon + (max_lon - min_lon) * 0.48
    river_path = center_lon + 0.035 * np.sin((lat_grid - min_lat) * 25.0)

    # Distance to river centerline
    dist_to_river = np.abs(lon_grid - river_path)

    # Flood inundation zone: river channel + overflow into floodplain
    mask = np.zeros((height, width), dtype=np.uint8)

    # Core inundated zone (approx 800m - 1.2km width)
    flood_extent = 0.012 + 0.006 * np.cos((lat_grid - min_lat) * 18.0)
    mask[dist_to_river <= flood_extent] = 1

    # Tributaries branching out
    tributary1 = (min_lat + 0.08) + 0.3 * (lon_grid - center_lon)
    dist_trib1 = np.abs(lat_grid - tributary1)
    mask[(dist_trib1 <= 0.004) & (lon_grid > center_lon)] = 1

    # Wet debris / mud flow zone along margins
    debris_margin = flood_extent + 0.003
    mask[(dist_to_river > flood_extent) & (dist_to_river <= debris_margin)] = 2

    return mask, bbox


def save_geotiff(
    data: np.ndarray,
    output_path: str,
    bbox: Tuple[float, float, float, float],
    crs_epsg: int = 4326,
):
    """Save 2D numpy array as a georeferenced GeoTIFF."""
    if rasterio is None:
        raise RuntimeError("rasterio package is required to export GeoTIFFs.")

    min_lon, min_lat, max_lon, max_lat = bbox
    height, width = data.shape
    transform = from_bounds(min_lon, min_lat, max_lon, max_lat, width, height)

    p = Path(output_path)
    p.parent.mkdir(parents=True, exist_ok=True)

    with rasterio.open(
        p,
        "w",
        driver="GTiff",
        height=height,
        width=width,
        count=1,
        dtype=data.dtype,
        crs=f"EPSG:{crs_epsg}",
        transform=transform,
        nodata=0,
    ) as dst:
        dst.write(data, 1)

    print(f"[image.py] Saved georeferenced flood mask to: {p.resolve()}")


def main():
    parser = argparse.ArgumentParser(description="Sentinel satellite image processor and flood mask generator")
    parser.add_argument("--input", help="Path to input satellite GeoTIFF / raw raster")
    parser.add_argument("--out", default="outputs/flood_mask.tif", help="Path to output flood mask GeoTIFF")
    parser.add_argument("--threshold", type=float, default=-15.5, help="SAR VV water threshold in dB")
    parser.add_argument("--bbox", nargs=4, type=float, default=[76.90, 31.60, 77.10, 31.80],
                        metavar=("MIN_LON", "MIN_LAT", "MAX_LON", "MAX_LAT"),
                        help="Bounding box coordinates in EPSG:4326")
    parser.add_argument("--generate-mock", action="store_true",
                        help="Generate a realistic synthetic flood mask for Mandi, HP AOI")

    args = parser.parse_args()

    if args.generate_mock or not args.input:
        print("[image.py] Generating synthetic flood scenario for testing & evacuation planning...")
        mask, bbox = generate_synthetic_flood_mask(bbox=tuple(args.bbox))
        save_geotiff(mask, args.out, bbox=bbox)
        print(f"[image.py] Generated flood mask: {mask.shape}, inundated pixels: {np.sum(mask == 1)}")
    else:
        if not Path(args.input).exists():
            print(f"[image.py] Error: Input file '{args.input}' not found.", file=sys.stderr)
            sys.exit(1)
        with rasterio.open(args.input) as src:
            arr = src.read(1)
            b = src.bounds
            bbox = (b.left, b.bottom, b.right, b.top)
            epsg = src.crs.to_epsg() or 4326
        mask = detect_flood_water(arr, fixed_threshold_db=args.threshold)
        save_geotiff(mask, args.out, bbox=bbox, crs_epsg=epsg)


if __name__ == "__main__":
    main()
