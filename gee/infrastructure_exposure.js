// ==========================================
// CODE 1/3 — STUDY REGION
// ==========================================

var studyRegion = ee.Geometry.Rectangle([
  85.0, 20.0,
  90.5, 24.5
]);

Map.centerObject(studyRegion, 7);

Map.addLayer(
  studyRegion,
  {color: 'yellow'},
  'Cyclone Study Region'
);

print('Study region:', studyRegion);

// ==========================================
// CODE 1/3 — GRIP4 ROAD NETWORK
// ==========================================

var roads = ee.FeatureCollection(
  'projects/sat-io/open-datasets/GRIP4/South-East-Asia'
).filterBounds(studyRegion);

print('Road features:', roads.size());
print('First road:', roads.first());

Map.addLayer(
  roads.style({
    color: 'red',
    width: 1
  }),
  {},
  'GRIP4 Road Network'
);
// ==========================================
// CODE 2/3 — ROAD LENGTH
// ==========================================

var roadsInRegion = roads.map(function(feature) {
  return feature.set({
    road_length_km: feature.geometry().length(1).divide(1000)
  });
});

var totalRoadLength = roadsInRegion.aggregate_sum('road_length_km');

print(
  'Total road length in study region (km):',
  totalRoadLength
);

// ==========================================
// CODE 3/3 — ROAD EXPOSURE DATA
// ==========================================

// Keep only roads intersecting our cyclone study region.

var roadExposure = roadsInRegion
  .filterBounds(studyRegion)
  .map(function(feature) {
    return feature.set({
      infrastructure_type: 'road',
      exposed_candidate: 1
    });
  });

print('Road exposure features:', roadExposure.size());
print('Road exposure sample:', roadExposure.first());

Map.addLayer(
  roadExposure.style({
    color: 'orange',
    width: 2
  }),
  {},
  'Road Exposure Candidates'
);

// ==========================================
// CODE 1/3 — HOSPITALS (MEMORY-SAFE)
// ==========================================

var hospitals = ee.FeatureCollection.loadBigQueryTable(
  'bigquery-public-data.overture_maps.place'
)
.filterBounds(studyRegion)
.filter(
  ee.Filter.eq('categories.primary', 'hospital')
);

print('Hospital count:', hospitals.size());



// ==========================================
// CODE 2/3 — POWER PLANTS
// ==========================================

var powerPlants = ee.FeatureCollection(
  'WRI/GPPD/power_plants'
).filterBounds(studyRegion);

print('Power plant features:', powerPlants.size());
print('Power plant sample:', powerPlants.first());

// Do NOT visualize the full collection.
// The data is loaded and available for analysis.

// ==========================================
// CODE 3/3 — POWER GRID LINES
// ==========================================

var powerLines = ee.FeatureCollection(
  'projects/sat-io/open-datasets/predictive-global-power-system/distribution-transmission-lines'
).filterBounds(studyRegion);

print('Power line features:', powerLines.size());
print('Power line sample:', powerLines.first());

Map.addLayer(
  powerLines.style({
    color: 'green',
    width: 2
  }),
  {},
  'Power Grid Lines'
);

// ==========================================
// CODE 2/3 — INFRASTRUCTURE COUNTS
// ==========================================

print('========== INFRASTRUCTURE SUMMARY ==========');

print('Road features:', roads.size());
print('Power plants:', powerPlants.size());
print('Power grid lines:', powerLines.size());
print('Hospitals:', hospitals.size());

// ==========================================
// CODE 3/3 — INFRASTRUCTURE MAP
// ==========================================

// Power plants
Map.addLayer(
  powerPlants.style({
    color: 'purple',
    pointSize: 5
  }),
  {},
  'Power Plants'
);

// Hospitals
Map.addLayer(
  hospitals.style({
    color: 'blue',
    pointSize: 5
  }),
  {},
  'Hospitals'
);
// ==========================================
// CODE 1/3 — ROAD EXPOSURE SUMMARY
// ==========================================

var roadExposure = roads.filterBounds(studyRegion);

var roadLengthKm = roadExposure
  .map(function(feature) {
    return feature.set(
      'length_km',
      feature.geometry().length(1).divide(1000)
    );
  })
  .aggregate_sum('length_km');

print('================================');
print('ROAD EXPOSURE');
print('Road features:', roadExposure.size());
print('Total road length (km):', roadLengthKm);
print('================================');

// ==========================================
// CODE 2/3 — POWER EXPOSURE SUMMARY
// ==========================================

var exposedPowerPlants = powerPlants
  .filterBounds(studyRegion);

var exposedPowerLines = powerLines
  .filterBounds(studyRegion);

print('================================');
print('POWER INFRASTRUCTURE');
print('Power plants:', exposedPowerPlants.size());
print('Power grid lines:', exposedPowerLines.size());
print('================================');

// ==========================================
// CODE 3/3 — INFRASTRUCTURE SUMMARY
// ==========================================

var infrastructureSummary = ee.Dictionary({
  road_features: roadExposure.size(),
  road_length_km: roadLengthKm,
  power_plants: exposedPowerPlants.size(),
  power_grid_lines: exposedPowerLines.size(),
  hospitals: 0
});

print('================================');
print('FINAL INFRASTRUCTURE SUMMARY');
print(infrastructureSummary);
print('================================');

// ==========================================
// CODE 1/3 — INFRASTRUCTURE EXPOSURE ZONES
// ==========================================

// Buffer critical infrastructure so that we can
// perform spatial exposure analysis.

var powerPlantExposure = powerPlants.map(function(feature) {
  return feature.buffer(1000).set({
    infrastructure_type: 'power_plant'
  });
});

var powerLineExposure = powerLines.map(function(feature) {
  return feature.buffer(100).set({
    infrastructure_type: 'power_grid'
  });
});

var roadExposureZone = roads.map(function(feature) {
  return feature.buffer(50).set({
    infrastructure_type: 'road'
  });
});

print('Power plant exposure zones:', powerPlantExposure.size());
print('Power grid exposure zones:', powerLineExposure.size());
print('Road exposure zones:', roadExposureZone.size());

// ==========================================
// CODE 2/3 — INFRASTRUCTURE DENSITY
// ==========================================

// Count infrastructure within the study region.
// These become useful inputs for the Gemini layer.

var powerPlantCount = powerPlants
  .filterBounds(studyRegion)
  .size();

var powerLineCount = powerLines
  .filterBounds(studyRegion)
  .size();

var roadCount = roads
  .filterBounds(studyRegion)
  .size();

var roadLength = roads
  .filterBounds(studyRegion)
  .map(function(feature) {
    return feature.set(
      'length_km',
      feature.geometry().length(1).divide(1000)
    );
  })
  .aggregate_sum('length_km');

print('Road count:', roadCount);
print('Road length (km):', roadLength);
print('Power plants:', powerPlantCount);
print('Power grid lines:', powerLineCount);

// ==========================================
// CODE 3/3 — FINAL INFRASTRUCTURE STATISTICS
// ==========================================

var infrastructureStats = ee.Dictionary({
  roads: roadCount,
  road_length_km: roadLength,
  power_plants: powerPlantCount,
  power_grid_lines: powerLineCount,
  hospitals: 0
});

print('==========================================');
print('INFRASTRUCTURE STATISTICS FOR ML + GEMINI');
print('==========================================');
print(infrastructureStats);

Export.table.toDrive({
  collection: roads.filterBounds(studyRegion),
  description: 'cyclone_roads',
  fileFormat: 'CSV'
});

var powerInfrastructure = powerPlants
  .filterBounds(studyRegion)
  .map(function(f) {
    return f.set('infrastructure_type', 'power_plant');
  })
  .merge(
    powerLines.filterBounds(studyRegion)
      .map(function(f) {
        return f.set('infrastructure_type', 'power_grid');
      })
  );

Export.table.toDrive({
  collection: powerInfrastructure,
  description: 'cyclone_power_infrastructure',
  fileFormat: 'CSV'
});

var infrastructureZones = roadExposureZone
  .merge(powerPlantExposure)
  .merge(powerLineExposure);

Export.table.toDrive({
  collection: infrastructureZones,
  description: 'cyclone_infrastructure_exposure_zones',
  fileFormat: 'GeoJSON'
});