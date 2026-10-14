"""Pipeline runner and demo data generator for the Flood Evacuation Planning System.

Runs the end-to-end satellite flood detection and damage analysis pipeline,
and prepares the data for both QGIS (GeoPackage) and the Web Dashboard (public/data/).
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
OUTPUT_DIR = ROOT_DIR / "outputs" / "damage"
PUBLIC_DATA_DIR = ROOT_DIR / "public" / "data"


def run_pipeline():
    print("=" * 60)
    print("FLOOD EVACUATION PLANNING SYSTEM - PIPELINE RUNNER")
    print("=" * 60)

    # Step 1: Generate Flood Mask GeoTIFF
    print("\n[Step 1/3] Processing satellite radar imagery & generating flood mask...")
    flood_tif = ROOT_DIR / "outputs" / "flood_mask.tif"
    cmd_image = [
        sys.executable,
        str(ROOT_DIR / "image.py"),
        "--generate-mock",
        "--out",
        str(flood_tif),
    ]
    res1 = subprocess.run(cmd_image, check=True)
    if res1.returncode != 0:
        print("[Pipeline] Failed in satellite processing step.")
        return False

    # Step 2: Run Damage Analysis & Evacuation Planning
    print("\n[Step 2/3] Analyzing damage to buildings, roads, bridges & planning evacuation...")
    cmd_analysis = [
        sys.executable,
        str(ROOT_DIR / "damage_analysis.py"),
        "--flood",
        str(flood_tif),
        "--flood-values",
        "1=water,2=debris",
        "--out",
        str(OUTPUT_DIR),
    ]
    res2 = subprocess.run(cmd_analysis, check=True)
    if res2.returncode != 0:
        print("[Pipeline] Failed in damage analysis step.")
        return False

    # Step 3: Copy generated GeoJSON layers to public/data for Vite Web App
    print("\n[Step 3/3] Synchronizing datasets to Web UI public/data/ directory...")
    PUBLIC_DATA_DIR.mkdir(parents=True, exist_ok=True)

    copied = 0
    for file in OUTPUT_DIR.glob("*.geojson"):
        shutil.copy2(file, PUBLIC_DATA_DIR / file.name)
        copied += 1

    summary_file = OUTPUT_DIR / "damage_summary.json"
    if summary_file.exists():
        shutil.copy2(summary_file, PUBLIC_DATA_DIR / "damage_summary.json")
        copied += 1

    print(f"[Pipeline] Successfully synced {copied} layers to {PUBLIC_DATA_DIR.resolve()}")
    print("\nReady! Launch web dashboard with: npm run dev")
    print("=" * 60)
    return True


if __name__ == "__main__":
    success = run_pipeline()
    if not success:
        sys.exit(1)
