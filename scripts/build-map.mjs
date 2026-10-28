// Gera src/data/brazil-map.ts a partir de scripts/brazil-states.geojson.
// Uso: node scripts/build-map.mjs
import fs from "node:fs";
import { geoMercator, geoPath } from "d3-geo";

const WIDTH = 600;
const HEIGHT = 620;
const TOLERANCE = 0.7;

const REGION_BY_UF = {
  AC: "N", AM: "N", AP: "N", PA: "N", RO: "N", RR: "N", TO: "N",
  AL: "NE", BA: "NE", CE: "NE", MA: "NE", PB: "NE", PE: "NE", PI: "NE", RN: "NE", SE: "NE",
  DF: "CO", GO: "CO", MS: "CO", MT: "CO",
  ES: "SE", MG: "SE", RJ: "SE", SP: "SE",
  PR: "S", RS: "S", SC: "S",
};

const SOURCE = "scripts/brazil-states.geojson";
const SOURCE_URL =
  "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson";

if (!fs.existsSync(SOURCE)) {
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`Falha ao baixar a geometria: ${res.status}`);
  fs.writeFileSync(SOURCE, await res.text());
}

const geo = JSON.parse(fs.readFileSync(SOURCE, "utf8"));
const projection = geoMercator().fitSize([WIDTH, HEIGHT], geo);
const areaPath = geoPath(projection);

function perpDist(p, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy);
  if (len === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  return Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / len;
}

function simplify(points, tol) {
  if (points.length < 3) return points;
  let maxD = 0;
  let idx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], points[0], points[points.length - 1]);
    if (d > maxD) {
      maxD = d;
      idx = i;
    }
  }
  if (maxD > tol) {
    const left = simplify(points.slice(0, idx + 1), tol);
    const right = simplify(points.slice(idx), tol);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[points.length - 1]];
}

function ringArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a / 2);
}

function ringToPath(ring) {
  const projected = ring.map((c) => projection(c));
  const simplified = simplify(projected, TOLERANCE);
  if (simplified.length < 4 || ringArea(simplified) < 2) return "";
  return (
    "M" +
    simplified.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L") +
    "Z"
  );
}

function featureToPath(feature) {
  const { type, coordinates } = feature.geometry;
  const polygons = type === "Polygon" ? [coordinates] : coordinates;
  return polygons
    .flatMap((poly) => poly.map(ringToPath))
    .filter(Boolean)
    .join("");
}

const states = geo.features.map((f) => {
  const uf = f.properties.sigla;
  const [cx, cy] = areaPath.centroid(f);
  return {
    uf,
    name: f.properties.name,
    region: REGION_BY_UF[uf],
    d: featureToPath(f),
    area: areaPath.area(f),
    cx,
    cy,
  };
});

const regionCentroids = {};
for (const r of ["N", "NE", "CO", "SE", "S"]) {
  const list = states.filter((s) => s.region === r);
  const total = list.reduce((acc, s) => acc + s.area, 0);
  regionCentroids[r] = {
    x: +(list.reduce((acc, s) => acc + s.cx * s.area, 0) / total).toFixed(1),
    y: +(list.reduce((acc, s) => acc + s.cy * s.area, 0) / total).toFixed(1),
  };
}

const out = `// Arquivo gerado por scripts/build-map.mjs — não editar manualmente.
// Fonte da geometria: click_that_hood (brazil-states.geojson), projeção Mercator simplificada.
import type { RegionId } from "./model";

export const MAP_VIEWBOX = "0 0 ${WIDTH} ${HEIGHT}";

export interface StateShape {
  uf: string;
  name: string;
  region: RegionId;
  d: string;
}

export const STATE_SHAPES: StateShape[] = ${JSON.stringify(
  states.map(({ uf, name, region, d }) => ({ uf, name, region, d })),
  null,
  0,
)};

export const REGION_LABEL_POS: Record<RegionId, { x: number; y: number }> = ${JSON.stringify(regionCentroids)};
`;

fs.writeFileSync("src/data/brazil-map.ts", out);
console.log(
  "ok",
  states.length,
  "estados,",
  (Buffer.byteLength(out) / 1024).toFixed(0),
  "KB",
);
