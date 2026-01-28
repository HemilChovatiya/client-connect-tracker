import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Collector, Task } from '@/types/tracker';
import { formatDistanceToNow } from 'date-fns';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;

const createCollectorIcon = (status: string) => {
  const colors = {
    active: '#22c55e',
    traveling: '#f59e0b',
    offline: '#ef4444',
    idle: '#6b7280',
  };
  const color = colors[status as keyof typeof colors] || colors.idle;

  return L.divIcon({
    className: 'custom-collector-marker',
    html: `
      <div style="position: relative;">
        <div style="
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, ${color}, ${color}dd);
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
          </svg>
        </div>
        ${status === 'active' ? `
          <div style="
            position: absolute;
            top: -4px;
            right: -4px;
            width: 14px;
            height: 14px;
            background: ${color};
            border: 2px solid white;
            border-radius: 50%;
            animation: pulse 1.5s infinite;
          "></div>
        ` : ''}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

const createClientIcon = () => {
  return L.divIcon({
    className: 'custom-client-marker',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #06b6d4, #0891b2);
        border: 2px solid white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(6,182,212,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

interface MapViewProps {
  collectors: Collector[];
  selectedCollector: Collector | null;
  onCollectorSelect: (collector: Collector) => void;
  showClients?: boolean;
}

const FitBounds = ({ collectors, selectedCollector }: { collectors: Collector[]; selectedCollector: Collector | null }) => {
  const map = useMap();

  if (selectedCollector) {
    map.setView(
      [selectedCollector.currentLocation.lat, selectedCollector.currentLocation.lng],
      15,
      { animate: true }
    );
  } else if (collectors.length > 0) {
    const bounds = L.latLngBounds(
      collectors.map(c => [c.currentLocation.lat, c.currentLocation.lng])
    );
    map.fitBounds(bounds, { padding: [50, 50], animate: true });
  }

  return null;
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const MapView = ({ collectors, selectedCollector, onCollectorSelect, showClients = true }: MapViewProps) => {
  // Ahmedabad center
  const center: [number, number] = [23.0225, 72.5714];

  return (
    <MapContainer
      center={center}
      zoom={12}
      className="map-container w-full h-full"
      zoomControl={true}
    >
      {/* Satellite tile layer */}
      <TileLayer
        attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, AEX, GeoEye, Getmapping'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      {/* Road labels overlay */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://stamen-tiles.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.png"
        opacity={0.7}
      />

      {/* Location history trails for selected collector */}
      {selectedCollector && selectedCollector.locationHistory.length > 1 && (
        <Polyline
          positions={selectedCollector.locationHistory.map(h => [h.location.lat, h.location.lng] as [number, number])}
          pathOptions={{
            color: '#06b6d4',
            weight: 3,
            opacity: 0.7,
            dashArray: '10, 10',
          }}
        />
      )}

      {/* Collector markers */}
      {collectors.map(collector => (
        <Marker
          key={collector.id}
          position={[collector.currentLocation.lat, collector.currentLocation.lng]}
          icon={createCollectorIcon(collector.status)}
          eventHandlers={{
            click: () => onCollectorSelect(collector),
          }}
        >
          <Popup>
            <div className="min-w-[200px] p-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                  {collector.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{collector.name}</h3>
                  <span className={`status-badge status-${collector.status}`}>
                    {collector.status}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                📍 {collector.currentLocation.address}
              </p>
              {collector.currentTask && (
                <div className="border-t border-border pt-2 mt-2">
                  <p className="text-xs font-medium">Current Task:</p>
                  <p className="text-xs text-muted-foreground">
                    {collector.currentTask.client.companyName}
                  </p>
                  <p className="text-xs text-primary font-medium">
                    {formatCurrency(collector.currentTask.amountToCollect)}
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Last update: {formatDistanceToNow(collector.currentLocation.timestamp, { addSuffix: true })}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Client markers for current tasks */}
      {showClients && collectors
        .filter(c => c.currentTask)
        .map(collector => collector.currentTask && (
          <Marker
            key={`client-${collector.currentTask.clientId}`}
            position={[collector.currentTask.client.location.lat, collector.currentTask.client.location.lng]}
            icon={createClientIcon()}
          >
            <Popup>
              <div className="min-w-[180px] p-1">
                <h3 className="font-semibold text-foreground">{collector.currentTask.client.companyName}</h3>
                <p className="text-xs text-muted-foreground">{collector.currentTask.client.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  📍 {collector.currentTask.client.address}
                </p>
                <div className="border-t border-border pt-2 mt-2">
                  <p className="text-xs font-medium">Task:</p>
                  <p className="text-xs text-muted-foreground">{collector.currentTask.description}</p>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs">To Collect:</span>
                    <span className="text-xs font-semibold text-primary">
                      {formatCurrency(collector.currentTask.amountToCollect)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs">Collected:</span>
                    <span className="text-xs font-semibold text-status-active">
                      {formatCurrency(collector.currentTask.amountCollected)}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Assigned to: {collector.name}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}

      <FitBounds collectors={collectors} selectedCollector={selectedCollector} />
    </MapContainer>
  );
};
