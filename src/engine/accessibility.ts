import type { Graph, ScenarioMetrics } from '../types';
import type { LSOAFeatureCollection } from '../data/loadLSOA';
import { allPairsMeanTravelTime } from './dijkstra';

export function computeBaseline(graph: Graph): Map<string, number> {
  return allPairsMeanTravelTime(graph);
}

export function computeDelta(
  baseline: Map<string, number>,
  modified: Map<string, number>,
): Map<string, number> {
  const delta = new Map<string, number>();
  for (const [id, baseVal] of baseline) {
    const modVal = modified.get(id);
    if (modVal !== undefined) {
      // Negative delta = improvement (shorter travel time)
      delta.set(id, modVal - baseVal);
    }
  }
  return delta;
}

export function applyLSOADeltas(
  geojson: LSOAFeatureCollection,
  stationDeltas: Map<string, number>,
): Map<string, number> {
  const lsoaDeltas = new Map<string, number>();

  for (const feature of geojson.features) {
    const nearestId = feature.properties.nearestStationId;
    if (nearestId) {
      const delta = stationDeltas.get(nearestId) ?? 0;
      feature.properties.delta = delta;
      lsoaDeltas.set(feature.properties.LSOA21CD, delta);
    }
  }

  return lsoaDeltas;
}

export function computeMetrics(
  stationDeltas: Map<string, number>,
  lsoaDeltas: Map<string, number>,
): ScenarioMetrics {
  let netTime = 0;
  let stationsBenefited = 0;
  let stationsPenalised = 0;
  let maxBenefit = 0;
  let maxPenalty = 0;

  for (const [, d] of stationDeltas) {
    netTime += d;
    if (d < -0.001) {
      stationsBenefited++;
      maxBenefit = Math.max(maxBenefit, Math.abs(d));
    } else if (d > 0.001) {
      stationsPenalised++;
      maxPenalty = Math.max(maxPenalty, d);
    }
  }

  let lsoasBenefited = 0;
  let lsoasPenalised = 0;
  let lsoaTotal = 0;

  for (const [, d] of lsoaDeltas) {
    lsoaTotal += d;
    if (d < -0.001) lsoasBenefited++;
    else if (d > 0.001) lsoasPenalised++;
  }

  const avgImpact = stationDeltas.size > 0 ? netTime / stationDeltas.size : 0;

  return {
    netTimeImpact: netTime,
    stationsBenefited,
    stationsPenalised,
    lsoasBenefited,
    lsoasPenalised,
    maxBenefit,
    maxPenalty,
    avgImpact,
  };
}
