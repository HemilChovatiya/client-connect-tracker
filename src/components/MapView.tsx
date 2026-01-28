import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Collector } from '@/types/tracker';
import { formatDistanceToNow } from 'date-fns';

// Fix for default marker icons
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
  const [isMapReady, setIsMapReady] = useState(false);

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

  // Handle selected collector
  useEffect(() => {
    if (!mapRef.current || !isMapReady) return;

    // Remove existing polyline
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (selectedCollector) {
      // Center on selected collector
      mapRef.current.setView(
        [selectedCollector.currentLocation.lat, selectedCollector.currentLocation.lng],
        15,
        { animate: true }
      );

      // Draw location history trail
      if (selectedCollector.locationHistory.length > 1) {
        const positions = selectedCollector.locationHistory.map(
          h => [h.location.lat, h.location.lng] as L.LatLngTuple
        );
        polylineRef.current = L.polyline(positions, {
          color: '#06b6d4',
          weight: 3,
          opacity: 0.7,
          dashArray: '10, 10',
        }).addTo(mapRef.current);
      }
    }
  }, [selectedCollector, isMapReady]);

  return (
    <div 
      ref={mapContainerRef} 
      className="w-full h-full"
      style={{ background: 'hsl(220 20% 8%)' }}
    />
  );
};
