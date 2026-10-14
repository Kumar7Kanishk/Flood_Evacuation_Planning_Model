# AeroSentry: Spaceborne Flood & Debris Crisis Intelligence
### Multimodal AI Hackathon 2026 — Track B: Mapping Flood Damage from Space

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://react.dev)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4-199900?logo=leaflet)](https://leafletjs.com)
[![Copernicus](https://img.shields.io/badge/Copernicus-Sentinel--1%20%2F%20GloFAS-003399)](https://dataspace.copernicus.eu)
[![OpenStreetMap](https://img.shields.io/badge/OSM-ohsome%20API-7EBC6F?logo=openstreetmap)](https://ohsome.org)

---

## 📌 Executive Summary

During catastrophic mountain hazards, ground sensors wash away, and road and telecommunication links collapse. **AeroSentry** is an autonomous crisis mapping and disaster intelligence platform built to answer three vital rescue questions directly from orbit:

1. **Where did the flood hit?** Cloud-penetrating Sentinel-1 SAR change detection and Sentinel-2 multi-spectral debris mapping.
2. **What was damaged?** Pre-event OpenStreetMap (ohsome API) spatial intersection measuring inundated buildings, severed roads, and compromised bridges.
3. **Who is cut off?** Road-network graph connectivity determining isolated settlements, affected populations, and remaining medical/food reserve timelines.

The platform includes an **AI Situation-Report Copilot** delivering non-hallucinated bilingual reports in English and the local dialect (Nepali/Hindi/regional languages), a **100-Year Disaster History Archive**, a **Smooth Timeline Scrubber**, and an **Interactive, Collapsible GIS Dashboard** built for both desktop command centers and mobile field units.

---

## 🎯 Case Study: 26 August 2026 Trishuli Flood Event

On **26 August 2026**, a high-altitude glacial collapse in the Langtang Lirung / northern Nepal catchment triggered an ice and rock avalanche, sending a catastrophic flood wave and sediment slurry down the **Bhote Koshi–Trishuli River corridor**. 

AeroSentry maps this event, isolates cut-off settlements along the gorge (such as *Syabrubesi*, *Mailung*, and *Betrawati*), and benchmarks findings against the **Copernicus Emergency Management Service (EMS) activation EMSR927**.

---

## ⚙️ Core Architecture & Pipeline

```text
       [ Sentinel-1 SAR (Radar) ]          [ Sentinel-2 (Optical) ]
       (Penetrates monsoon clouds)         (Debris plume detection)
                    │                                 │
                    ▼                                 ▼
         [ Change-Detection Engine: Δσ⁰ Backscatter Drop ]
                                │
                                ▼
                   [ outputs/flood_mask.tif ]
                                │
                                ▼
  [ Pre-Event OpenStreetMap (Snapshot: 2026-07-27 via ohsome API) ]
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
[ Inundated Buildings ]  [ Severed Roads ]      [ Damaged Bridges ]
        └───────────────────────┬───────────────────────┘
                                │
                                ▼
             [ NetworkX Graph Isolation Engine ]
            (Determines cut-off settlements & days of reserves)
                                │
                                ▼
        [ Bilingual Situation-Report Copilot (Eng + Local) ]
                                │
                                ▼
       [ Responsive React + Leaflet + Tailwind Dashboard ]
       (Live Copernicus GloFAS streamflow & 100-yr history)