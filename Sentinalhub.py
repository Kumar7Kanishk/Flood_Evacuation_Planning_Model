from pathlib import Path
import numpy as np
import rasterio
from rasterio.transform import from_bounds
from sentinelhub import (
    SHConfig, BBox, CRS, MimeType, SentinelHubRequest, DataCollection, bbox_to_dimensions
)
from Client_id import CLIENT_ID, CLIENT_SECRET, INSTANCE_ID

# 1. Setup Sentinel Hub
config = SHConfig()
config.sh_client_id = CLIENT_ID
config.sh_client_secret = CLIENT_SECRET
config.instance_id = INSTANCE_ID

# 2. Area of Interest (Mandi, HP coordinates)
bbox_coords = [76.9, 31.6, 77.1, 31.8]
bbox = BBox(bbox=bbox_coords, crs=CRS.WGS84)
size = bbox_to_dimensions(bbox, resolution=20)

evalscript = """
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

def fetch_and_create_flood_mask(output_tif_path="outputs/flood_mask.tif"):
    Path("outputs").mkdir(parents=True, exist_ok=True)

    print("🛰️ Downloading Sentinel-1 SAR imagery...")
    request = SentinelHubRequest(
        evalscript=evalscript,
        input_data=[SentinelHubRequest.input_data(
            DataCollection.SENTINEL1_IW,
            time_interval=("2023-07-01", "2023-08-30"),
            mosaicking_order='leastCC'
        )],
        responses=[SentinelHubRequest.output_response("default", MimeType.TIFF)],
        bbox=bbox,
        size=size,
        config=config
    )

    data = request.get_data()[0]
    vv = data[:, :, 0]

    # Convert SAR power to Decibels (dB)
    with np.errstate(divide='ignore'):
        vv_db = 10 * np.log10(np.where(vv <= 0, 1e-5, vv))

    # Water has very low backscatter (dark pixels in radar)
    flood_mask = np.where(vv_db < -16.0, 1, 0).astype(np.int32)

    height, width = flood_mask.shape
    transform = from_bounds(bbox_coords[0], bbox_coords[1], bbox_coords[2], bbox_coords[3], width, height)

    with rasterio.open(
        output_tif_path,
        'w',
        driver='GTiff',
        height=height,
        width=width,
        count=1,
        dtype=np.int32,
        crs='EPSG:4326',
        transform=transform,
        nodata=0
    ) as dst:
        dst.write(flood_mask, 1)

    print(f"✅ Created flood mask at {output_tif_path}")

if __name__ == "__main__":
    fetch_and_create_flood_mask()