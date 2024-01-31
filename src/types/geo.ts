export type PointCoord = [number, number];
export type LineStringCoord = PointCoord[];
export type PolygonCoord = LineStringCoord[];
export type MultiPolygonCoord = PolygonCoord[];

export type GeometryType = 'Point' | 'LineString' | 'Polygon' 
  | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon';

export type Point3D = [number, number, number];


export type Geometry<T> = {
  coordinates: T;
  type: GeometryType;
}

export type Feature<T> = {
  geometry: Geometry<T>;
  properties: {
    Id: number; 
    Floor: number;
    name: string;
    center: PointCoord;
    centroid: PointCoord;
    gdp: number;
  };
  type: "Feature";
}

export type FeatureCollection<T> = {
  type: "FeatureCollection";
  features: Feature<T>[];
}