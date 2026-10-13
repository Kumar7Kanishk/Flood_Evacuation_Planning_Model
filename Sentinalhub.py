from sentinelhub import SHConfig, BBox, CRS, MimeType, SentinelHubRequest, DataCollection, bbox_to_dimensions

# 🔑 Configure your credentials
config = SHConfig()
config.instance_id = "28134f17-0219-44f8-9787-68fd6151e94f"   # or use OAuth client_id/secret

# 📍 Define area of interest (example: Mandi, HP)
bbox = BBox(bbox=[76.9, 31.6, 77.1, 31.8], crs=CRS.WGS84)  # lon/lat box
size = bbox_to_dimensions(bbox, resolution=20)  # 20m resolution typical for Sentinel-1

# 📝 Define evalscript for Sentinel-1 VV polarization
evalscript = """
//VERSION=3
function setup() {
  return {
    input: ["VV"],
    output: { bands: 1 }
  };
}
function evaluatePixel(sample) {
  return [sample.VV];
}
"""

# 📦 Create request
request = SentinelHubRequest(
    data_folder='sentinel1_images',
    evalscript=evalscript,
    input_data=[SentinelHubRequest.input_data(
        DataCollection.SENTINEL1_IW,
        time_interval=("2021-07-01", "2021-07-10"),  # adjust dates
        mosaicking_order='leastCC'
    )],
    responses=[SentinelHubRequest.output_response("default", MimeType.PNG)],
    bbox=bbox,
    size=size,
    config=config
)

# 📥 Download image
image = request.get_data()[0]
print("Image shape:", image.shape)