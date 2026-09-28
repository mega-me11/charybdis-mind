var studyArea = ee.Geometry.Rectangle([
  87.8, 21.5,
  88.5, 22.5
]);

Map.centerObject(studyArea, 9);

Map.addLayer(
  studyArea,
  {},
  'Study Area'
);


// =========================
// 1. ELEVATION
// =========================

var dem = ee.ImageCollection('COPERNICUS/DEM/GLO30_2024_1')
  .mosaic();

Map.addLayer(
  dem.clip(studyArea),
  {
    min: 0,
    max: 100
  },
  'Elevation'
);

print('Elevation:', dem);


// =========================
// 2. SLOPE
// =========================

var slope = ee.Terrain.slope(dem);

Map.addLayer(
  slope.clip(studyArea),
  {
    min: 0,
    max: 30
  },
  'Slope'
);

print('Slope:', slope);


// =========================
// 3. RAINFALL
// =========================

var rainfallCollection = ee.ImageCollection(
  'UCSB-CHG/CHIRPS/DAILY'
)
  .filterBounds(studyArea)
  .filterDate('2025-09-01', '2025-09-27');

print(
  'Number of rainfall images:',
  rainfallCollection.size()
);

var rainfall = rainfallCollection
  .select('precipitation')
  .sum();

Map.addLayer(
  rainfall.clip(studyArea),
  {
    min: 0,
    max: 300
  },
  'Rainfall'
);

print('Rainfall:', rainfall);


// =========================
// 4. LAND COVER
// =========================

var landCover = ee.ImageCollection(
  'ESA/WorldCover/v200'
)
  .first();

Map.addLayer(
  landCover
    .select('Map')
    .clip(studyArea),
  {},
  'Land Cover'
);

print('Land Cover:', landCover);

var water = landCover
  .select('Map')
  .eq(80);

Map.addLayer(
  water.clip(studyArea),
  {
    min: 0,
    max: 1
  },
  'Water'
);

print('Water mask:', water);

// =========================
// 5. DISTANCE FROM COAST
// =========================

// Use only the water band
var waterMask = water.select([0]);

// Find the land-water boundary
var coastline = waterMask
  .focal_max(1)
  .neq(waterMask);

// Keep only one band
coastline = coastline.select([0]);

// Distance from coastline in pixels
var distanceToCoast = coastline
  .fastDistanceTransform(512, 'pixels', 'squared_euclidean')
  .sqrt()
  .rename('distance_to_coast');

Map.addLayer(
  distanceToCoast.clip(studyArea),
  {
    min: 0,
    max: 500
  },
  'Distance to Coast'
);

print('Distance to Coast:', distanceToCoast);


// =========================
// 6. POPULATION DENSITY
// =========================

var population = ee.Image(
  'WorldPop/GP/100m/pop/IND_2020'
);

Map.addLayer(
  population.clip(studyArea),
  {
    min: 0,
    max: 500
  },
  'Population Density'
);

print('Population Density:', population);


// =========================
// 7. FEATURE STACK
// =========================

// Keep only the actual elevation band
var elevation = dem.select('DEM');

// Combine our numerical features
var featureStack = ee.Image.cat([
  elevation.rename('elevation'),
  slope.rename('slope'),
  rainfall.rename('rainfall'),
  distanceToCoast.rename('distance_to_coast'),
  population.rename('population')
]);

print('Feature Stack:', featureStack);
print('Feature Bands:', featureStack.bandNames());

// =========================
// 8. SAMPLE FEATURE STACK
// =========================

var samples = featureStack.sample({
  region: studyArea,
  scale: 100,
  numPixels: 5000,
  geometries: true,
  seed: 42
});

print('ML Samples:', samples);
print('Number of samples:', samples.size());




// =========================
// 9. EXPORT ML DATA
// =========================

Export.table.toDrive({
  collection: samples,
  description: 'Cyclone_Geospatial_Features',
  fileFormat: 'CSV'
});


// ================================
// AMPHAN 2020 — SENTINEL-1 FLOOD TEST
// ================================

// Use the same study area
var amphanBefore = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(studyArea)
  .filterDate('2020-05-01', '2020-05-19')
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.listContains(
    'transmitterReceiverPolarisation', 'VV'
  ))
  .select('VV');

var amphanAfter = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(studyArea)
  .filterDate('2020-05-21', '2020-06-05')
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.listContains(
    'transmitterReceiverPolarisation', 'VV'
  ))
  .select('VV');

print('Amphan BEFORE images:', amphanBefore.size());
print('Amphan AFTER images:', amphanAfter.size());

// ================================
// CREATE BEFORE / AFTER COMPOSITES
// ================================

var before = amphanBefore.median();
var after = amphanAfter.median();

Map.addLayer(
  before.clip(studyArea),
  {min: -25, max: 0},
  'Sentinel-1 BEFORE'
);

Map.addLayer(
  after.clip(studyArea),
  {min: -25, max: 0},
  'Sentinel-1 AFTER'
);

print('Before composite:', before);
print('After composite:', after);

// ================================
// SAR CHANGE DETECTION
// ================================

// Difference between BEFORE and AFTER radar backscatter
var change = after.subtract(before);

Map.addLayer(
  change.clip(studyArea),
  {min: -5, max: 5},
  'SAR Change'
);

print('SAR Change:', change);

// ================================
// CANDIDATE INUNDATION MASK
// ================================

// Negative VV change = radar backscatter decreased
var candidateFlood = change.lt(-2);

Map.addLayer(
  candidateFlood.selfMask().clip(studyArea),
  {palette: ['blue']},
  'Candidate Inundation'
);

print('Candidate Inundation:', candidateFlood);


// ================================
// REMOVE PERMANENT WATER
// ================================

// Keep only pixels that were NOT already classified as permanent water
var floodMask = candidateFlood
  .and(water.not());

Map.addLayer(
  floodMask.selfMask().clip(studyArea),
  {palette: ['red']},
  'Observed Amphan Inundation'
);

print('Observed Amphan Inundation:', floodMask);

var inundatedArea = floodMask
  .selfMask()
  .multiply(ee.Image.pixelArea());

var totalInundatedArea = inundatedArea.reduceRegion({
  reducer: ee.Reducer.sum(),
  geometry: studyArea,
  scale: 10,
  maxPixels: 1e10
});

print(
  'Estimated Amphan inundation area (m²):',
  totalInundatedArea.get('VV')
);

print(
  'Estimated Amphan inundation area (km²):',
  ee.Number(totalInundatedArea.get('VV')).divide(1e6)
);


// ================================
// CREATE ML LABEL
// ================================

var floodLabel = floodMask
  .rename('flood_label')
  .uint8();

Map.addLayer(
  floodLabel.selfMask().clip(studyArea),
  {palette: ['red']},
  'ML Flood Label'
);

print('Flood Label:', floodLabel);


// ================================
// AMPHAN ML DATASET
// ================================

var amphanFeatureStack = featureStack.addBands(
  floodMask.rename('flood_label').uint8()
);

var amphanSamples = amphanFeatureStack.sample({
  region: studyArea,
  scale: 10,
  numPixels: 10000,
  geometries: true,
  seed: 42
});

print('Amphan ML Dataset:', amphanSamples);
print('Amphan sample count:', amphanSamples.size());
print(
  'Amphan bands:',
  amphanFeatureStack.bandNames()
);

var amphanSamples = amphanFeatureStack.sample({
  region: studyArea,
  scale: 10,
  numPixels: 3000,
  geometries: true,
  seed: 42
});

print('Amphan sample count:', amphanSamples.size());
print('Amphan bands:', amphanFeatureStack.bandNames());

var classCounts = amphanSamples.aggregate_histogram('flood_label');

print(
  'Flood label distribution:',
  classCounts
);

// ================================
// EXPORT AMPHAN ML DATASET
// ================================

Export.table.toDrive({
  collection: amphanSamples,
  description: 'Amphan_ML_Dataset',
  fileFormat: 'CSV'
});


// ==========================================
// REUSABLE CYCLONE EVENT PIPELINE
// ==========================================

function buildCycloneDataset(eventName, beforeStart, eventStart, eventEnd, afterEnd) {

  // Sentinel-1 BEFORE
  var beforeCollection = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(studyArea)
    .filterDate(beforeStart, eventStart)
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filter(ee.Filter.listContains(
      'transmitterReceiverPolarisation', 'VV'
    ))
    .select('VV');

  // Sentinel-1 AFTER
  var afterCollection = ee.ImageCollection('COPERNICUS/S1_GRD')
    .filterBounds(studyArea)
    .filterDate(eventEnd, afterEnd)
    .filter(ee.Filter.eq('instrumentMode', 'IW'))
    .filter(ee.Filter.listContains(
      'transmitterReceiverPolarisation', 'VV'
    ))
    .select('VV');

  var before = beforeCollection.median();
  var after = afterCollection.median();

  // SAR change
  var change = after.subtract(before);

  // Candidate inundation
  var candidateFlood = change.lt(-2);

  // Remove permanent water
  var floodMask = candidateFlood.and(water.not());

  // Event rainfall
  var eventRainfall = ee.ImageCollection(
    'UCSB-CHG/CHIRPS/DAILY'
  )
    .filterBounds(studyArea)
    .filterDate(eventStart, eventEnd)
    .select('precipitation')
    .sum();

  // Event-specific feature stack
  var eventFeatures = ee.Image.cat([
    dem.select('DEM').rename('elevation'),
    slope.rename('slope'),
    eventRainfall.rename('rainfall'),
    distanceToCoast.rename('distance_to_coast'),
    population.rename('population'),
    floodMask.rename('flood_label').uint8()
  ]);

  return eventFeatures;
}

// ==========================================
// CHECK MULTI-CYCLONE DATA AVAILABILITY
// ==========================================

var fani = buildCycloneDataset(
  'FANI',
  '2019-04-20',
  '2019-05-03',
  '2019-05-05',
  '2019-05-15'
);

var yaas = buildCycloneDataset(
  'YAAS',
  '2021-05-15',
  '2021-05-26',
  '2021-05-28',
  '2021-06-07'
);

var remal = buildCycloneDataset(
  'REMAL',
  '2024-05-15',
  '2024-05-26',
  '2024-05-28',
  '2024-06-07'
);

print('Fani bands:', fani.bandNames());
print('Yaas bands:', yaas.bandNames());
print('Remal bands:', remal.bandNames());


// ==========================================
// SAMPLE MULTI-CYCLONE DATASETS
// ==========================================

var faniSamples = fani.sample({
  region: studyArea,
  scale: 10,
  numPixels: 2000,
  geometries: true,
  seed: 42
});

var yaasSamples = yaas.sample({
  region: studyArea,
  scale: 10,
  numPixels: 2000,
  geometries: true,
  seed: 42
});

var remalSamples = remal.sample({
  region: studyArea,
  scale: 10,
  numPixels: 2000,
  geometries: true,
  seed: 42
});

print('Fani samples:', faniSamples.size());
print('Yaas samples:', yaasSamples.size());
print('Remal samples:', remalSamples.size());

// ==========================================
// EXPORT MULTI-CYCLONE DATA
// ==========================================

Export.table.toDrive({
  collection: faniSamples,
  description: 'Fani_ML_Dataset',
  fileFormat: 'CSV'
});

Export.table.toDrive({
  collection: yaasSamples,
  description: 'Yaas_ML_Dataset',
  fileFormat: 'CSV'
});

Export.table.toDrive({
  collection: remalSamples,
  description: 'Remal_ML_Dataset',
  fileFormat: 'CSV'
});

// ==========================================
// EXPORT MULTI-CYCLONE DATA
// ==========================================

Export.table.toDrive({
  collection: faniSamples,
  description: 'Fani_ML_Dataset',
  fileFormat: 'CSV'
});

Export.table.toDrive({
  collection: yaasSamples,
  description: 'Yaas_ML_Dataset',
  fileFormat: 'CSV'
});

Export.table.toDrive({
  collection: remalSamples,
  description: 'Remal_ML_Dataset',
  fileFormat: 'CSV'
});

var roadExposureMask = floodMask.selfMask();

Map.addLayer(
  roadExposureMask.clip(studyArea),
  {palette: ['red']},
  'Flooded Infrastructure Area'
);

// ==========================================
// TIDE / LUNAR CONTEXT — CELL 1
// ==========================================

// Example cyclone reference point.
// We will later replace this with the actual
// cyclone trajectory/timestamps from the trajectory teammate.

var cycloneTime = ee.Date('2024-10-25T12:00:00');
var cycloneLocation = ee.Geometry.Point([86.0, 20.0]);

print('Cyclone reference time:', cycloneTime);
print('Cyclone reference location:', cycloneLocation);

// ==========================================
// TIDE / LUNAR CONTEXT — CELL 2
// ==========================================

// Approximate lunar phase using the synodic month.
// Reference new moon: 2000-01-06 18:14 UTC
var referenceNewMoon = ee.Date('2000-01-06T18:14:00');

var synodicMonth = 29.530588853;

// Days elapsed since reference new moon
var daysSinceNewMoon = cycloneTime
  .difference(referenceNewMoon, 'day');

// Fraction of the current lunar cycle
var lunarCycle = daysSinceNewMoon
  .divide(synodicMonth)
  .subtract(
    daysSinceNewMoon
      .divide(synodicMonth)
      .floor()
  );

// Convert to degrees
var lunarPhaseDegrees = lunarCycle.multiply(360);

// Classify the approximate phase
var lunarPhase = ee.String(
  ee.Algorithms.If(
    lunarCycle.lt(0.0625), 'New Moon',
    ee.Algorithms.If(
      lunarCycle.lt(0.1875), 'Waxing Crescent',
      ee.Algorithms.If(
        lunarCycle.lt(0.3125), 'First Quarter',
        ee.Algorithms.If(
          lunarCycle.lt(0.4375), 'Waxing Gibbous',
          ee.Algorithms.If(
            lunarCycle.lt(0.5625), 'Full Moon',
            ee.Algorithms.If(
              lunarCycle.lt(0.6875), 'Waning Gibbous',
              ee.Algorithms.If(
                lunarCycle.lt(0.8125), 'Last Quarter',
                ee.Algorithms.If(
                  lunarCycle.lt(0.9375), 'Waning Crescent',
                  'New Moon'
                )
              )
            )
          )
        )
      )
    )
  )
);

print('Lunar phase fraction:', lunarCycle);
print('Lunar phase angle:', lunarPhaseDegrees);
print('Approximate lunar phase:', lunarPhase);

// ==========================================
// TIDE / LUNAR CONTEXT — CELL 3
// ==========================================

// Copernicus Marine global ocean physics.
// Daily sea-surface height (zos) at ~8 km resolution.

var oceanData = ee.ImageCollection(
  'COPERNICUS/MARINE/GLOBAL_ANALYSISFORECAST_PHY_DAILY'
)
.filterDate(
  cycloneTime.advance(-1, 'day'),
  cycloneTime.advance(1, 'day')
)
.select('zos');

print('Ocean observations available:', oceanData.size());

// Get the closest available daily observation.
var seaSurfaceHeight = oceanData
  .sort('system:time_start')
  .first();

// Extract sea-surface height at the cyclone location.
var localSeaSurfaceHeight = seaSurfaceHeight
  .reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: cycloneLocation,
    scale: 10000,
    maxPixels: 1e8
  })
  .get('zos');

print(
  'Sea-surface height at cyclone location (m):',
  localSeaSurfaceHeight
);

// Visualize the sea-surface-height layer.
Map.centerObject(cycloneLocation, 7);

Map.addLayer(
  seaSurfaceHeight,
  {
    min: -1,
    max: 1,
    palette: [
      '08306b',
      '2171b5',
      '6baed6',
      'c7e9b4',
      'fdae6b',
      'e6550d',
      'a63603'
    ]
  },
  'Sea Surface Height'
);

Map.addLayer(
  cycloneLocation,
  {color: 'red'},
  'Cyclone Reference Location'
);

// ==========================================
// TIDE / LUNAR CONTEXT — CELL 4
// ==========================================

// Lunar phase fraction from Cell 2
// 0.0  = New Moon
// 0.25 = First Quarter
// 0.50 = Full Moon
// 0.75 = Last Quarter

// Approximate tidal-range context.
//
// Spring tides occur near:
// - New Moon
// - Full Moon
//
// Neap tides occur near:
// - First Quarter
// - Last Quarter

var tidalContext = ee.String(
  ee.Algorithms.If(
    lunarCycle.lt(0.125),
    'Spring Tide Window',
    ee.Algorithms.If(
      lunarCycle.lt(0.375),
      'Neap Tide Window',
      ee.Algorithms.If(
        lunarCycle.lt(0.625),
        'Spring Tide Window',
        ee.Algorithms.If(
          lunarCycle.lt(0.875),
          'Neap Tide Window',
          'Spring Tide Window'
        )
      )
    )
  )
);

print('Lunar phase:', lunarPhase);
print('Tidal context:', tidalContext);

// ==========================================
// TIDE / LUNAR CONTEXT — CELL 5
// ==========================================

// Numerical contextual feature.
//
// 1 = Spring-tide window
// 0 = Neap-tide window

var tidalContextScore = ee.Number(
  ee.Algorithms.If(
    tidalContext.equals('Spring Tide Window'),
    1,
    0
  )
);

print('Tidal context score:', tidalContextScore);

// ==========================================
// TIDE / LUNAR CONTEXT — CELL 6
// ==========================================

var tidalContextSummary = ee.Dictionary({
  cyclone_time: cycloneTime.format('YYYY-MM-dd HH:mm'),
  longitude: cycloneLocation.coordinates().get(0),
  latitude: cycloneLocation.coordinates().get(1),
  lunar_phase: lunarPhase,
  lunar_phase_angle: lunarPhaseDegrees,
  tidal_context: tidalContext,
  tidal_context_score: tidalContextScore
});

print('Tidal / Lunar Context:', tidalContextSummary);