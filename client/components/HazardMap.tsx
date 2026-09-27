import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Polygon,
  Polyline,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import {
  HOME,
  RISK_ZONES,
  type EvacuationRoute,
  type Shelter,
} from "@/lib/stormData";
import { routeColor, severityColor, shelterColor, SW } from "@/lib/stormTheme";

type Props = {
  shelters: Shelter[];
  routes: EvacuationRoute[];
  focusShelterId?: string | null;
};

function shelterIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="width:16px;height:16px;background:${color};border:2px solid ${SW.ink};box-shadow:2px 2px 0 0 ${SW.ink}"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -10],
  });
}

const homeIcon = L.divIcon({
  className: "",
  html: `<div style="width:22px;height:22px;background:${SW.sun};border:2px solid ${SW.ink};box-shadow:3px 3px 0 0 ${SW.ink};display:flex;align-items:center;justify-content:center"><div style="width:6px;height:6px;background:${SW.ink}"></div></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
  popupAnchor: [0, -12],
});

/** Flies the map to a shelter when the user picks one from the list. */
function MapFocus({ target }: { target: Shelter | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], 16, { duration: 0.8 });
  }, [target, map]);
  return null;
}

export default function HazardMap({ shelters, routes, focusShelterId }: Props) {
  const focused =
    shelters.find((s) => s.id === focusShelterId) ??
    null;

  return (
    <div className="relative z-0 h-full w-full">
      <MapContainer
        center={HOME}
        zoom={14}
        scrollWheelZoom
        className="h-full w-full"
        style={{ background: "#e8e4d8" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Risk zones — flat color blocks with black outlines */}
        {RISK_ZONES.map((z) => (
          <Polygon
            key={z.id}
            positions={z.polygon}
            pathOptions={{
              color: SW.ink,
              weight: 2,
              fillColor: severityColor[z.severity],
              fillOpacity: 0.45,
            }}
          >
            <Popup>
              <div className="sw-popup">
                <strong>{z.name}</strong>
                <span className="uppercase">{z.severity}</span>
                <p>{z.reason}</p>
              </div>
            </Popup>
          </Polygon>
        ))}

        {/* Evacuation routes — black casing + status color */}
        {routes.map((r) => (
          <Polyline
            key={r.id}
            positions={r.path}
            pathOptions={{ color: SW.ink, weight: 7, opacity: 1 }}
          />
        ))}
        {routes.map((r) => (
          <Polyline
            key={`${r.id}-inner`}
            positions={r.path}
            pathOptions={{
              color: routeColor[r.status],
              weight: 3.5,
              opacity: 1,
              dashArray: r.status === "congested" ? "8 6" : undefined,
            }}
          >
            <Popup>
              <div className="sw-popup">
                <strong>{r.name}</strong>
                <span className="uppercase">{r.status}</span>
                <p>{r.note}</p>
              </div>
            </Popup>
          </Polyline>
        ))}

        {/* Shelters */}
        {shelters.map((s) => (
          <Marker
            key={s.id}
            position={[s.lat, s.lng]}
            icon={shelterIcon(shelterColor[s.status])}
          >
            <Popup>
              <div className="sw-popup">
                <strong>{s.name}</strong>
                <span className="uppercase">{s.status}</span>
                <p>
                  {s.occupancy}/{s.capacity} capacity · {s.kind.replace(/_/g, " ")}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Citizen position */}
        <Marker position={HOME} icon={homeIcon}>
          <Popup>
            <div className="sw-popup">
              <strong>You are here</strong>
              <p>Tap a green route to see the way to safety.</p>
            </div>
          </Popup>
        </Marker>

        <MapFocus target={focused} />
      </MapContainer>

      {/* Legend — flat blocks, no clutter */}
      <div className="sw-card-sm pointer-events-none absolute bottom-3 left-3 z-[500] flex flex-col gap-1.5 bg-white px-3 py-2.5">
        <p className="text-[10px] font-bold uppercase tracking-widest">Risk zones</p>
        {(["emergency", "warning", "watch", "advisory"] as const).map((sev) => (
          <div key={sev} className="flex items-center gap-2">
            <span
              className="inline-block size-3 border-2 border-[#111111]"
              style={{ background: severityColor[sev] }}
            />
            <span className="text-[10px] font-semibold uppercase">{sev}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
