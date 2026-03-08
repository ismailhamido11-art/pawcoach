import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Auto-centers map on latest position
function MapFollower({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, map.getZoom(), { animate: true, duration: 1 });
  }, [position, map]);
  return null;
}

export default function WalkMap({ path, currentPos }) {
  const defaultCenter = currentPos || [48.8566, 2.3522]; // Paris fallback
  const lastTwo = path.length >= 2 ? path.slice(-2) : null;

  return (
    <div className="w-full h-52 rounded-2xl overflow-hidden border border-border/50 shadow-sm relative">
      <MapContainer
        center={defaultCenter}
        zoom={17}
        zoomControl={false}
        scrollWheelZoom={false}
        className="w-full h-full"
        style={{ background: "#f0f0f0" }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Full path trail */}
        {path.length >= 2 && (
          <Polyline
            positions={path}
            pathOptions={{
              color: "#2D9F82",
              weight: 4,
              opacity: 0.9,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        )}

        {/* Start point */}
        {path.length > 0 && (
          <CircleMarker
            center={path[0]}
            radius={7}
            pathOptions={{ color: "#ffffff", fillColor: "#22c55e", fillOpacity: 1, weight: 2 }}
          />
        )}

        {/* Current position — pulsing dot */}
        {currentPos && (
          <>
            <CircleMarker
              center={currentPos}
              radius={14}
              pathOptions={{ color: "#2D9F82", fillColor: "#2D9F82", fillOpacity: 0.15, weight: 1 }}
            />
            <CircleMarker
              center={currentPos}
              radius={7}
              pathOptions={{ color: "#ffffff", fillColor: "#2D9F82", fillOpacity: 1, weight: 2 }}
            />
          </>
        )}

        {currentPos && <MapFollower position={currentPos} />}
      </MapContainer>

      {/* Live badge overlay */}
      <div className="absolute top-2 left-2 z-[1000] flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-white text-[10px] font-bold tracking-wider">LIVE</span>
      </div>
    </div>
  );
}