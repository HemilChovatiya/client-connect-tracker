import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Collector } from '@/types/tracker';
import { formatDistanceToNow, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Route, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;

const statusColors = {
  active: '#22c55e',
  traveling: '#f59e0b',
  offline: '#ef4444',
  idle: '#6b7280',
};

const createCollectorIcon = (status: string) => {
  const color = statusColors[status as keyof typeof statusColors] || statusColors.idle;

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

const createHistoryMarker = (index: number, isStart: boolean, isEnd: boolean, hasClient: boolean) => {
  let color = '#64748b';
  let size = 12;
  let label = '';
  
  if (isStart) {
    color = '#22c55e';
    size = 16;
    label = 'S';
  } else if (isEnd) {
    color = '#06b6d4';
    size = 16;
    label = 'E';
  } else if (hasClient) {
    color = '#f59e0b';
    size = 14;
  }

  return L.divIcon({
    className: 'history-marker',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 8px;
        font-weight: bold;
        color: white;
      ">${label}</div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

interface MapViewProps {
  collectors: Collector[];
  selectedCollector: Collector | null;
  onCollectorSelect: (collector: Collector) => void;
  showClients?: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const MapView = ({ collectors, selectedCollector, onCollectorSelect, showClients = true }: MapViewProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const clientMarkersRef = useRef<L.Marker[]>([]);
  const polylineRef = useRef<L.Polyline | null>(null);
  const historyMarkersRef = useRef<L.Marker[]>([]);
  const animatedPolylineRef = useRef<L.Polyline | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [showRouteHistory, setShowRouteHistory] = useState(true);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const center: L.LatLngTuple = [23.0225, 72.5714];
    
    const map = L.map(mapContainerRef.current, {
      center,
      zoom: 12,
      zoomControl: true,
    });

    // Satellite tile layer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, AEX, GeoEye, Getmapping'
    }).addTo(map);

    // Road labels overlay
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
    }).addTo(map);

    mapRef.current = map;
    setIsMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when collectors change
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    clientMarkersRef.current.forEach(marker => marker.remove());
    clientMarkersRef.current = [];

    // Add collector markers
    collectors.forEach(collector => {
      const marker = L.marker(
        [collector.currentLocation.lat, collector.currentLocation.lng],
        { icon: createCollectorIcon(collector.status) }
      );

      const popupContent = `
        <div style="min-width: 200px; padding: 4px; font-family: system-ui, sans-serif;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #06b6d4, #0891b2); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">
              ${collector.name.charAt(0)}
            </div>
            <div>
              <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #f8fafc;">${collector.name}</h3>
              <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; background: ${collector.status === 'active' ? 'rgba(34,197,94,0.2)' : collector.status === 'traveling' ? 'rgba(245,158,11,0.2)' : 'rgba(107,114,128,0.2)'}; color: ${collector.status === 'active' ? '#22c55e' : collector.status === 'traveling' ? '#f59e0b' : '#6b7280'};">
                ${collector.status}
              </span>
            </div>
          </div>
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">📍 ${collector.currentLocation.address || 'Unknown location'}</p>
          ${collector.currentTask ? `
            <div style="border-top: 1px solid #334155; padding-top: 8px; margin-top: 8px;">
              <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 500; color: #f8fafc;">Current Task:</p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">${collector.currentTask.client.companyName}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; font-weight: 600; color: #06b6d4;">${formatCurrency(collector.currentTask.amountToCollect)}</p>
            </div>
          ` : ''}
          <p style="margin: 8px 0 0 0; font-size: 10px; color: #64748b;">Last update: ${formatDistanceToNow(collector.currentLocation.timestamp, { addSuffix: true })}</p>
        </div>
      `;

      marker.bindPopup(popupContent, {
        className: 'custom-popup',
      });

      marker.on('click', () => onCollectorSelect(collector));
      marker.addTo(mapRef.current!);
      markersRef.current.push(marker);
    });

    // Add client markers for current tasks
    if (showClients) {
      collectors
        .filter(c => c.currentTask)
        .forEach(collector => {
          if (!collector.currentTask) return;
          
          const clientMarker = L.marker(
            [collector.currentTask.client.location.lat, collector.currentTask.client.location.lng],
            { icon: createClientIcon() }
          );

          const popupContent = `
            <div style="min-width: 180px; padding: 4px; font-family: system-ui, sans-serif;">
              <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #f8fafc;">${collector.currentTask.client.companyName}</h3>
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">${collector.currentTask.client.name}</p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">📍 ${collector.currentTask.client.address}</p>
              <div style="border-top: 1px solid #334155; padding-top: 8px; margin-top: 8px;">
                <p style="margin: 0 0 4px 0; font-size: 11px; font-weight: 500; color: #f8fafc;">Task:</p>
                <p style="margin: 0; font-size: 11px; color: #94a3b8;">${collector.currentTask.description}</p>
                <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                  <span style="font-size: 11px; color: #94a3b8;">To Collect:</span>
                  <span style="font-size: 11px; font-weight: 600; color: #06b6d4;">${formatCurrency(collector.currentTask.amountToCollect)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="font-size: 11px; color: #94a3b8;">Collected:</span>
                  <span style="font-size: 11px; font-weight: 600; color: #22c55e;">${formatCurrency(collector.currentTask.amountCollected)}</span>
                </div>
              </div>
              <p style="margin: 8px 0 0 0; font-size: 10px; color: #64748b;">Assigned to: ${collector.name}</p>
            </div>
          `;

          clientMarker.bindPopup(popupContent, {
            className: 'custom-popup',
          });
          clientMarker.addTo(mapRef.current!);
          clientMarkersRef.current.push(clientMarker);
        });
    }

    // Fit bounds to all collectors
    if (collectors.length > 0 && !selectedCollector) {
      const bounds = L.latLngBounds(
        collectors.map(c => [c.currentLocation.lat, c.currentLocation.lng] as L.LatLngTuple)
      );
      mapRef.current.fitBounds(bounds, { padding: [50, 50], animate: true });
    }
  }, [collectors, showClients, isMapReady, onCollectorSelect, selectedCollector]);

  // Handle selected collector and route history
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    // Clear existing route elements
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }
    if (animatedPolylineRef.current) {
      animatedPolylineRef.current.remove();
      animatedPolylineRef.current = null;
    }
    historyMarkersRef.current.forEach(marker => marker.remove());
    historyMarkersRef.current = [];

    if (selectedCollector) {
      // Center on selected collector
      mapRef.current.setView(
        [selectedCollector.currentLocation.lat, selectedCollector.currentLocation.lng],
        15,
        { animate: true }
      );

      // Draw location history trail with route visualization
      if (showRouteHistory && selectedCollector.locationHistory.length > 0) {
        const positions = selectedCollector.locationHistory.map(
          h => [h.location.lat, h.location.lng] as L.LatLngTuple
        );
        
        // Add current location to positions
        positions.push([selectedCollector.currentLocation.lat, selectedCollector.currentLocation.lng]);

        // Background trail (shadow effect)
        const shadowPolyline = L.polyline(positions, {
          color: '#000000',
          weight: 6,
          opacity: 0.3,
        }).addTo(mapRef.current);
        historyMarkersRef.current.push(shadowPolyline as any);

        // Main route line with gradient effect
        polylineRef.current = L.polyline(positions, {
          color: '#06b6d4',
          weight: 4,
          opacity: 0.9,
        }).addTo(mapRef.current);

        // Animated dashed overlay for direction indication
        animatedPolylineRef.current = L.polyline(positions, {
          color: '#22c55e',
          weight: 2,
          opacity: 0.8,
          dashArray: '10, 20',
          className: 'animated-route',
        }).addTo(mapRef.current);

        // Add history point markers with popups
        selectedCollector.locationHistory.forEach((history, index) => {
          const isStart = index === 0;
          const isEnd = false;
          const hasClient = !!history.clientVisited;

          const historyMarker = L.marker(
            [history.location.lat, history.location.lng],
            { icon: createHistoryMarker(index, isStart, isEnd, hasClient) }
          );

          const popupContent = `
            <div style="min-width: 160px; padding: 4px; font-family: system-ui, sans-serif;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                <div style="
                  width: 20px; height: 20px; border-radius: 50%;
                  background: ${isStart ? '#22c55e' : hasClient ? '#f59e0b' : '#64748b'};
                  display: flex; align-items: center; justify-content: center;
                  font-size: 10px; color: white; font-weight: bold;
                ">${isStart ? 'S' : index + 1}</div>
                <span style="font-size: 12px; font-weight: 600; color: #f8fafc;">
                  ${isStart ? 'Start Point' : `Stop ${index + 1}`}
                </span>
              </div>
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #94a3b8;">
                📍 ${history.location.address || 'Unknown location'}
              </p>
              <p style="margin: 0; font-size: 10px; color: #64748b;">
                🕐 ${format(history.location.timestamp, 'hh:mm a')}
              </p>
              ${history.duration > 0 ? `
                <p style="margin: 4px 0 0 0; font-size: 10px; color: #06b6d4;">
                  ⏱️ Stayed ${history.duration} min
                </p>
              ` : ''}
              ${history.clientVisited ? `
                <div style="border-top: 1px solid #334155; margin-top: 6px; padding-top: 6px;">
                  <p style="margin: 0; font-size: 10px; font-weight: 500; color: #f59e0b;">
                    🏢 ${history.clientVisited.companyName}
                  </p>
                  <p style="margin: 2px 0 0 0; font-size: 9px; color: #94a3b8;">
                    ${history.clientVisited.name}
                  </p>
                </div>
              ` : ''}
            </div>
          `;

          historyMarker.bindPopup(popupContent, { className: 'custom-popup' });
          historyMarker.addTo(mapRef.current!);
          historyMarkersRef.current.push(historyMarker);
        });

        // Add current location marker as endpoint
        const currentMarker = L.marker(
          [selectedCollector.currentLocation.lat, selectedCollector.currentLocation.lng],
          { icon: createHistoryMarker(selectedCollector.locationHistory.length, false, true, false) }
        );
        currentMarker.bindPopup(`
          <div style="min-width: 140px; padding: 4px; font-family: system-ui, sans-serif;">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
              <div style="
                width: 20px; height: 20px; border-radius: 50%;
                background: #06b6d4;
                display: flex; align-items: center; justify-content: center;
                font-size: 10px; color: white; font-weight: bold;
              ">E</div>
              <span style="font-size: 12px; font-weight: 600; color: #f8fafc;">Current Location</span>
            </div>
            <p style="margin: 0; font-size: 11px; color: #94a3b8;">
              📍 ${selectedCollector.currentLocation.address || 'Unknown'}
            </p>
            <p style="margin: 4px 0 0 0; font-size: 10px; color: #64748b;">
              Updated ${formatDistanceToNow(selectedCollector.currentLocation.timestamp, { addSuffix: true })}
            </p>
          </div>
        `, { className: 'custom-popup' });
        currentMarker.addTo(mapRef.current!);
        historyMarkersRef.current.push(currentMarker);

        // Fit bounds to show entire route
        const allPositions = [
          ...positions,
        ];
        const bounds = L.latLngBounds(allPositions);
        mapRef.current.fitBounds(bounds, { padding: [60, 60], animate: true });
      }
    }
  }, [selectedCollector, isMapReady, showRouteHistory]);

  return (
    <div className="relative w-full h-full">
      <div 
        ref={mapContainerRef} 
        className="w-full h-full"
        style={{ background: 'hsl(220 20% 8%)' }}
      />
      
      {/* Route History Toggle */}
      {selectedCollector && (
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          <Button
            variant={showRouteHistory ? "default" : "secondary"}
            size="sm"
            onClick={() => setShowRouteHistory(!showRouteHistory)}
            className={cn(
              "gap-2 shadow-lg",
              showRouteHistory && "bg-primary text-primary-foreground"
            )}
          >
            <Route className="w-4 h-4" />
            Route History
            {showRouteHistory ? (
              <Eye className="w-3 h-3" />
            ) : (
              <EyeOff className="w-3 h-3" />
            )}
          </Button>
          
          {showRouteHistory && selectedCollector.locationHistory.length > 0 && (
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-3 border border-border shadow-lg">
              <p className="text-xs font-medium text-foreground mb-2">Route Legend</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
                  <span className="text-xs text-muted-foreground">Start Point</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                  <span className="text-xs text-muted-foreground">Client Visit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#64748b]" />
                  <span className="text-xs text-muted-foreground">Stop Point</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#06b6d4]" />
                  <span className="text-xs text-muted-foreground">Current Location</span>
                </div>
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
                  <div className="w-6 h-0.5 bg-[#06b6d4]" />
                  <span className="text-xs text-muted-foreground">Route Path</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* CSS for animated route */}
      <style>{`
        .animated-route {
          animation: dash 20s linear infinite;
        }
        @keyframes dash {
          to {
            stroke-dashoffset: -1000;
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};
