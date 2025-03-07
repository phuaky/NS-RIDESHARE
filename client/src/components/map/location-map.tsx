import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import L from 'leaflet';

// Fix for default marker icons in Leaflet with React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Default center coordinates (Singapore)
const DEFAULT_CENTER = [1.3521, 103.8198];
const DEFAULT_ZOOM = 12;

interface LocationPoint {
  id: string;
  position: [number, number];
  name: string;
}

interface LocationMapProps {
  selectedLocations: LocationPoint[];
  onLocationSelect?: (location: LocationPoint) => void;
  onLocationRemove?: (locationId: string) => void;
  editable?: boolean;
  height?: string;
}

// Component that handles map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect?: (location: LocationPoint) => void }) {
  const map = useMapEvents({
    click: (e) => {
      if (onLocationSelect) {
        const newLocation: LocationPoint = {
          id: `loc-${Date.now()}`,
          position: [e.latlng.lat, e.latlng.lng],
          name: `Selected Location (${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)})`
        };
        onLocationSelect(newLocation);
      }
    }
  });
  return null;
}

export function LocationMap({ 
  selectedLocations = [], 
  onLocationSelect,
  onLocationRemove,
  editable = false,
  height = '400px'
}: LocationMapProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Search for locations using Nominatim OpenStreetMap API
  const searchLocation = async () => {
    if (!searchQuery) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching for location:', error);
    }
  };

  const selectSearchResult = (result: any) => {
    if (onLocationSelect) {
      const newLocation: LocationPoint = {
        id: `loc-${Date.now()}`,
        position: [parseFloat(result.lat), parseFloat(result.lon)],
        name: result.display_name.split(',')[0]
      };
      onLocationSelect(newLocation);
      setSearchResults([]);
      setSearchQuery('');
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Location Map</CardTitle>
        {editable && (
          <div className="flex mt-2 gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a location..."
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && searchLocation()}
            />
            <Button type="button" onClick={searchLocation} size="sm">Search</Button>
          </div>
        )}
        {searchResults.length > 0 && (
          <div className="mt-2 max-h-40 overflow-y-auto border rounded-md">
            {searchResults.map((result) => (
              <div 
                key={result.place_id} 
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => selectSearchResult(result)}
              >
                {result.display_name}
              </div>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-2">
        <div style={{ height }}>
          <MapContainer 
            center={DEFAULT_CENTER as L.LatLngExpression} 
            zoom={DEFAULT_ZOOM} 
            style={{ height: '100%', width: '100%', borderRadius: '0.375rem' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {editable && <MapClickHandler onLocationSelect={onLocationSelect} />}
            
            {selectedLocations.map((location) => (
              <Marker key={location.id} position={location.position}>
                <Popup>
                  <div>
                    <p>{location.name}</p>
                    {editable && onLocationRemove && (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => onLocationRemove(location.id)}
                        className="mt-2"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </CardContent>
    </Card>
  );
}