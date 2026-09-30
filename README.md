# Charybdis Mind

~Team PromptForge

**Turning the chaos of the storm into predictive clarity**

Charybdis Mind is an AI-powered disaster decision-support system for understanding, predicting, and responding to cyclone-related impacts on people, roads, and critical infrastructure before and during landfall. It combines **Google Earth Engine geospatial intelligence, machine learning, disaster-aware routing, Google Gemini, and an interactive cyclone timeline** to transform environmental and infrastructure data into actionable disaster insights.

## Demo

Live demo: https://charybdis-mind.vercel.app/

Demo video: [link]


---

## 🛰️ Project Vision

Cyclone impacts are not limited to wind speed or the cyclone's path.

A cyclone can trigger flooding, disrupt roads, affect power infrastructure, reduce accessibility, and create cascading consequences across essential services.

Our system follows:

**OBSERVE → PREDICT → UNDERSTAND → ACT ↔ HUMAN FEEDBACK**

### 1. OBSERVE

Build a geospatial picture of what is happening on the ground.

The system incorporates:

* 🌀 Cyclone trajectory and wind movement
* 🛰️ Satellite observations
* 🌧️ Rainfall
* ⛰️ Elevation and slope
* 🌊 Distance to coastline
* 🌱 Land cover
* 👥 Population density
* 🛣️ Road networks
* ⚡ Power infrastructure
* 🌙 Astronomical lunar/tidal context

These datasets are processed into geospatial features that can be used for downstream risk modelling.

---

### 2. PREDICT

Use geospatial features and machine learning to estimate cyclone-related flood risk.

The current prototype uses a **Random Forest classifier** with features including:

* Distance to coast
* Elevation
* Population density
* Rainfall
* Slope

The model produces:

* Flood probability
* Low / Moderate / High risk classification
* Spatial risk predictions

The predicted risk is then linked spatially with infrastructure to identify potentially exposed roads and power infrastructure.

---

### 3. UNDERSTAND WHAT HAPPENS NEXT

Risk does not remain static as a cyclone approaches.

The system therefore explores how hazards can affect accessibility over time.

#### 🌐 Disaster-aware routing

Road-network data is combined with predicted flood risk to calculate risk-aware routing costs.

#### ⏱️ Route degradation over time

A route that is usable earlier in a cyclone event may become increasingly costly or risky as the cyclone approaches.

The prototype models this through a time-dependent degradation framework and generates alternative routes at different time-to-landfall stages.

This allows us to demonstrate:

**T−48h → T−24h → T−12h → T−6h → T−0h**

and observe how route cost changes as the event progresses.

---

### 4. ACT

The goal is to turn predictions into actionable information.

The system can generate disaster-aware insights such as:

#### 👤 Citizens

* Risk-aware preparedness information
* Evacuation context
* Safer route information
* Shelter-related information

#### 🏥 Hospitals

* Potential accessibility concerns
* Preparedness information
* Infrastructure-risk context

#### ⚡ Utilities

* Infrastructure exposure information
* Priority-risk locations

#### 🚨 Disaster Authorities

* Areas requiring attention
* Potentially affected road networks
* Infrastructure exposure
* Resource-planning context

---

## 👥 Human-in-the-Loop

Disaster situations are dynamic, and model predictions should not be treated as ground truth.

The project therefore includes a **human-feedback concept** in which citizens and responders can report real-world conditions such as:

* Road flooding
* Infrastructure damage
* Changing local conditions

Ground observations can then be used to update the situation represented by the system.

This creates a feedback loop:

**Prediction → Real-world observation → Feedback → Updated situation**

---

# 🧠 Geospatial Intelligence Pipeline

A major component of the project is the environmental and geospatial feature pipeline built using **Google Earth Engine**.

The pipeline follows:

```text
Satellite / Terrain / Rainfall / Land Cover
Population / Coastline / Infrastructure / Lunar Context
                         ↓
              Geospatial Processing
                         ↓
               Geospatial Features
                         ↓
                    ML Inputs
                         ↓
                Flood Risk Prediction
                         ↓
              Infrastructure Exposure
```

### Geospatial features currently processed

| Feature              | Purpose                          |
| -------------------- | -------------------------------- |
| Elevation            | Terrain / flood-risk context     |
| Slope                | Terrain susceptibility           |
| Rainfall             | Precipitation-related risk       |
| Land cover           | Environmental / surface context  |
| Population           | Human exposure                   |
| Distance to coast    | Coastal flood-risk context       |
| Satellite change     | Observed inundation context      |
| Roads                | Accessibility / routing          |
| Power infrastructure | Critical infrastructure exposure |
| Lunar phase          | Astronomical tidal context       |

### Lunar / tidal context

The project also explores the relationship between **cyclone timing, astronomical tides, and storm surge**.

The current implementation uses lunar phase to identify an astronomical tidal context such as a spring/neap window.

It does **not** claim to calculate instantaneous sea-surface tide height.

---

# 🤖 Machine Learning

The current prototype uses a **Random Forest Classifier** for spatial flood-risk prediction.

### Input features

```text
distance_to_coast
elevation
population
rainfall
slope
```

### Model output

```text
Flood probability
       ↓
Risk classification
       ↓
Spatial risk map
       ↓
Infrastructure exposure
       ↓
Routing risk
```

The model was trained using cyclone-related geospatial samples and evaluated on the prototype dataset.

Current prototype results include:

* **2,560** prediction locations
* **49** high-risk locations
* **574** moderate-risk locations
* **1,937** low-risk locations
* Mean predicted flood probability: **0.1635**
* Maximum predicted flood probability: **0.5267**

The current risk thresholds are **prototype/model-derived thresholds**, not calibrated operational disaster thresholds.

---

# 🛣️ Disaster-Aware Routing

The routing component combines:

**Road network + flood-risk prediction + cyclone time progression**

to estimate how route costs can change as landfall approaches.

The current prototype generates routes for:

```text
T−48h
T−24h
T−12h
T−6h
T−0h
```

Example prototype output:

| Time to landfall | Routing cost | Change from T−48h |
| ---------------- | -----------: | ----------------: |
| T−48h            |        14.23 |                0% |
| T−24h            |        20.66 |           +45.20% |
| T−12h            |        24.05 |           +68.96% |
| T−6h             |        24.62 |           +73.00% |
| T−0h             |        24.46 |           +71.85% |

These values demonstrate the **prototype's time-dependent routing mechanism** rather than representing operational road-closure predictions.

---

# 🧠 Google Gemini Advisory

The project uses **Google Gemini** to transform model outputs into human-readable disaster insights.

The advisory layer receives information such as:

* Predicted flood-risk distribution
* High-risk locations
* Road exposure
* Power-infrastructure exposure
* Risk thresholds
* Model limitations

and produces structured recommendations and priority actions.

Gemini therefore acts as an **interpretation and decision-support layer**, rather than replacing the underlying geospatial or ML model.

---

# 🗺️ Interactive Cyclone Timeline

The frontend is designed around an interactive cyclone timeline.

The cyclone dataset contains:

```text
timestamp
latitude
longitude
wind speed
```

The interface supports:

* Cyclone trajectory visualization
* Current cyclone position
* Time slider
* Wind-speed information
* Timestamp display
* Geographic map interaction
* Infrastructure layers
* Timeline-based event exploration

The timeline architecture is designed so that sample cyclone data can eventually be replaced by real cyclone-track data.

---

# 🧩 Project Architecture

```text
                    ┌─────────────────────┐
                    │  Cyclone / Weather  │
                    │  Satellite / Terrain│
                    │  Infrastructure     │
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │ Google Earth Engine │
                    │ Geospatial Pipeline │
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │ Geospatial Features │
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │ Random Forest Model │
                    │   Flood Risk        │
                    └──────────┬──────────┘
                               ↓
             ┌─────────────────┴─────────────────┐
             ↓                                   ↓
   Infrastructure Exposure              Disaster-Aware Routing
             │                                   │
             └─────────────────┬─────────────────┘
                               ↓
                    ┌─────────────────────┐
                    │   Google Gemini      │
                    │ Advisory / Insights  │
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │ Interactive Product │
                    └──────────┬──────────┘
                               ↓
                    Human / Responder
                       Feedback Loop
```

---

# 🛠️ Technology Stack

### Geospatial

* Google Earth Engine
* Sentinel-1 SAR
* Copernicus DEM
* ESA WorldCover
* WorldPop
* Geospatial processing with GeoPandas / Shapely

### Machine Learning

* Python
* Scikit-learn
* Random Forest

### AI

* Google Gemini API

### Backend

* Python
* FastAPI
* Uvicorn

### Routing

* NetworkX
* GeoPandas
* Shapely

### Frontend

* HTML / JavaScript
* Leaflet
* Tailwind CSS

---



# 👩‍💻 Team PromptForge

### Megha Chatterjee (Team Lead) — Geospatial Intelligence • Machine Learning • Routing • Backend • AI Integration • Human Feedback**

### Jaspreet Kaur — Cyclone Timeline •  Map Interaction • Unified Dashboard UI • Deployment

### Ekta Bokaria — Ground Infrastructure • Map Layers • Unified Dashboard UI

### Shreya Ranjan — Presentation & Demonstration


## Build with AI: Code for Communities 
