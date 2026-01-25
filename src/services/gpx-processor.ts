import { parseStringPromise } from 'xml2js';

interface GpxPoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: Date;
}

interface GpxData {
  name?: string;
  description?: string;
  points: GpxPoint[];
  totalDistanceKm: number;
  elevationGainM: number;
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function parseGpx(gpxContent: string): Promise<GpxData | null> {
  try {
    const result = await parseStringPromise(gpxContent);
    const gpx = result.gpx;

    // Get track or route points
    const points: GpxPoint[] = [];
    let name: string | undefined;
    let description: string | undefined;

    // Try to get track points first
    if (gpx.trk) {
      const track = gpx.trk[0];
      name = track.name?.[0];
      description = track.desc?.[0];

      for (const segment of track.trkseg || []) {
        for (const pt of segment.trkpt || []) {
          points.push({
            lat: parseFloat(pt.$.lat),
            lon: parseFloat(pt.$.lon),
            ele: pt.ele ? parseFloat(pt.ele[0]) : undefined,
            time: pt.time ? new Date(pt.time[0]) : undefined,
          });
        }
      }
    }
    // Fall back to route points
    else if (gpx.rte) {
      const route = gpx.rte[0];
      name = route.name?.[0];
      description = route.desc?.[0];

      for (const pt of route.rtept || []) {
        points.push({
          lat: parseFloat(pt.$.lat),
          lon: parseFloat(pt.$.lon),
          ele: pt.ele ? parseFloat(pt.ele[0]) : undefined,
        });
      }
    }

    if (points.length === 0) {
      return null;
    }

    // Calculate total distance
    let totalDistanceKm = 0;
    for (let i = 1; i < points.length; i++) {
      totalDistanceKm += haversineDistance(
        points[i - 1].lat,
        points[i - 1].lon,
        points[i].lat,
        points[i].lon
      );
    }

    // Calculate elevation gain
    let elevationGainM = 0;
    for (let i = 1; i < points.length; i++) {
      if (points[i].ele && points[i - 1].ele) {
        const gain = points[i].ele! - points[i - 1].ele!;
        if (gain > 0) elevationGainM += gain;
      }
    }

    // Calculate bounds
    const lats = points.map((p) => p.lat);
    const lons = points.map((p) => p.lon);
    const bounds = {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLon: Math.min(...lons),
      maxLon: Math.max(...lons),
    };

    return {
      name,
      description,
      points,
      totalDistanceKm,
      elevationGainM,
      bounds,
    };
  } catch (error) {
    console.error('Error parsing GPX:', error);
    return null;
  }
}

export function generateGpx(
  points: GpxPoint[],
  metadata?: { name?: string; description?: string }
): string {
  const header = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RidesWith"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    ${metadata?.name ? `<name>${metadata.name}</name>` : ''}
    ${metadata?.description ? `<desc>${metadata.description}</desc>` : ''}
  </metadata>
  <trk>
    ${metadata?.name ? `<name>${metadata.name}</name>` : ''}
    <trkseg>`;

  const trackPoints = points
    .map(
      (p) => `      <trkpt lat="${p.lat}" lon="${p.lon}">
        ${p.ele ? `<ele>${p.ele}</ele>` : ''}
        ${p.time ? `<time>${p.time.toISOString()}</time>` : ''}
      </trkpt>`
    )
    .join('\n');

  const footer = `    </trkseg>
  </trk>
</gpx>`;

  return `${header}\n${trackPoints}\n${footer}`;
}
