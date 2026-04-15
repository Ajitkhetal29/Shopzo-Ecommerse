"use client";

import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { GeoSearchControl, OpenStreetMapProvider } from "leaflet-geosearch";
import "leaflet-geosearch/dist/geosearch.css";

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function LeafletGeoSearch({ 
  onSearchStateChange,
  onLocationSelect
}: { 
  onSearchStateChange?: (isSearching: boolean, hasResults: boolean) => void;
  onLocationSelect?: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const provider = new OpenStreetMapProvider();
    let searchTimeout: NodeJS.Timeout;
    let isCurrentlySearching = false;

    const searchControl = GeoSearchControl({
      provider,
      style: "bar",
      showMarker: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
    });

    map.addControl(searchControl);

    // Wait for search control to be rendered
    setTimeout(() => {
      const searchInput = document.querySelector('.leaflet-geosearch-bar input') as HTMLInputElement;
      if (!searchInput) return;

      // Debounced input handler
      const handleInput = () => {
        const query = searchInput.value.trim();
        
        if (query.length > 0 && !isCurrentlySearching) {
          isCurrentlySearching = true;
          onSearchStateChange?.(true, false);
          
          // Clear previous timeout
          if (searchTimeout) clearTimeout(searchTimeout);
          
          // Set timeout to check for results
          searchTimeout = setTimeout(() => {
            checkForResults();
          }, 500);
        } else if (query.length === 0) {
          isCurrentlySearching = false;
          onSearchStateChange?.(false, false);
        }
      };

      const checkForResults = () => {
        const results = document.querySelector('.leaflet-geosearch-results, .geosearch-results, [class*="results"]');
        const hasResults = !!(results && results.children.length > 0);
        isCurrentlySearching = false;
        onSearchStateChange?.(false, hasResults);
      };

      searchInput.addEventListener('input', handleInput);
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          isCurrentlySearching = true;
          onSearchStateChange?.(true, false);
          setTimeout(checkForResults, 800);
        }
      });

      // Monitor results container with MutationObserver
      const observer = new MutationObserver(() => {
        if (isCurrentlySearching) {
          checkForResults();
        }
      });

      // Observe the entire document for result changes
      observer.observe(document.body, { 
        childList: true, 
        subtree: true,
        attributes: false
      });

      // Cleanup
      return () => {
        searchInput.removeEventListener('input', handleInput);
        if (searchTimeout) clearTimeout(searchTimeout);
        observer.disconnect();
      };
    }, 500);

    // Listen to map events for location selection from search
    const handleLocationSelect = (e: any) => {
      isCurrentlySearching = false;
      onSearchStateChange?.(false, true);
      
      // Extract coordinates from the event
      // leaflet-geosearch passes: { location: { x: lng, y: lat } }
      let lat: number | null = null;
      let lng: number | null = null;
      
      if (e && e.location) {
        // Standard geosearch format: x is lng, y is lat
        lat = e.location.y;
        lng = e.location.x;
      } else if (e && e.latlng) {
        lat = e.latlng.lat;
        lng = e.latlng.lng;
      } else if (e && (e.lat !== undefined || e.lng !== undefined)) {
        lat = e.lat || e.latitude;
        lng = e.lng || e.longitude;
      }
      
      if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
        onLocationSelect?.(lat, lng);
      }
    };

    map.on('geosearch/showlocation', handleLocationSelect);

    // Also intercept clicks on result items as a fallback
    const interceptResultClicks = () => {
      const resultLinks = document.querySelectorAll('.leaflet-geosearch-results a, .geosearch-results a');
      resultLinks.forEach(link => {
        if (!link.hasAttribute('data-listener-added')) {
          link.setAttribute('data-listener-added', 'true');
          link.addEventListener('click', (e) => {
            // Wait for the geosearch library to process the click
            // It should fire the showlocation event, but we'll also try to extract data
            setTimeout(() => {
              // Check if we got the location from the event
              // If not, try to get it from the map center (where it moved to)
              const mapCenter = map.getCenter();
              if (mapCenter) {
                // Small delay to ensure the event fired first
                setTimeout(() => {
                  onLocationSelect?.(mapCenter.lat, mapCenter.lng);
                }, 100);
              }
            }, 300);
          });
        }
      });
    };

    // Monitor for new result links being added
    const resultObserver = new MutationObserver(() => {
      interceptResultClicks();
    });

    resultObserver.observe(document.body, { childList: true, subtree: true });
    
    // Initial check after search control is rendered
    setTimeout(interceptResultClicks, 1000);

    return () => {
      map.off('geosearch/showlocation', handleLocationSelect);
      if (searchTimeout) clearTimeout(searchTimeout);
      resultObserver.disconnect();
      map.removeControl(searchControl);
    };
  }, [map, onSearchStateChange, onLocationSelect]);

  return null;
}

function ClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToLocation({ position }: { position: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 15, {
        animate: true,
        duration: 1.5,
      });
    }
  }, [position, map]);

  return null;
}

function SetMapCenter({ center }: { center: [number, number] }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, 15, {
        animate: false,
      });
    }
  }, [center, map]);

  return null;
}

type Props = {
  onLocationSelect: (lat: number, lng: number) => void;
  defaultPosition?: [number, number];
};

export default function MapPicker({ onLocationSelect, defaultPosition }: Props) {
  const [position, setPosition] = useState<[number, number] | null>(defaultPosition || null);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearchResults, setHasSearchResults] = useState(false);
  const [showNoResults, setShowNoResults] = useState(false);

  // Update position when defaultPosition changes (e.g., when edit page loads data)
  useEffect(() => {
    if (defaultPosition) {
      const [lat, lng] = defaultPosition;
      if (!position || position[0] !== lat || position[1] !== lng) {
        setPosition([lat, lng]);
      }
    }
  }, [defaultPosition, position]);

  const handleUseMyLocation = () => {
    setLoading(true);

    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        setPosition([lat, lng]);
        setUserPosition([lat, lng]);
        onLocationSelect(lat, lng);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        alert("Unable to fetch location");
        setLoading(false);
      }
    );
  };

  return (
    <div className="h-full w-full relative rounded-md overflow-hidden">
      {loading && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white bg-opacity-95 backdrop-blur-sm rounded-md">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-sm font-medium text-gray-700">Fetching your location...</p>
          </div>
        </div>
      )}
      {/* Search Loading Indicator */}
      {isSearching && (
        <div className="absolute top-20 left-4 z-[2000] px-3 py-2 bg-white rounded-md shadow-md border border-gray-200 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-700">Searching...</span>
        </div>
      )}

      {/* No Results Message */}
      {showNoResults && !isSearching && (
        <div className="absolute top-20 left-4 z-[2000] px-3 py-2 bg-white rounded-md shadow-md border border-gray-200">
          <span className="text-sm text-gray-600">No matching results found</span>
        </div>
      )}

      <button
        onClick={handleUseMyLocation}
        disabled={loading}
        className="absolute top-4 right-4 z-[2000] px-4 py-2 bg-white text-gray-700 rounded-md text-sm font-medium shadow-md hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 border border-gray-200 transition-all"
        style={{ zIndex: 2000 }}
      >
        {loading ? "Loading..." : "📍 Use my location"}
      </button>
      <MapContainer
        center={userPosition || position || defaultPosition || [20.5937, 78.9629]}
        zoom={userPosition || position || defaultPosition ? 15 : 5}
        className="h-full w-full"
        style={{ borderRadius: '0.375rem' }}
      >
        <LeafletGeoSearch 
          onSearchStateChange={(searching, hasResults) => {
            setIsSearching(searching);
            if (!searching) {
              // Search finished
              if (hasResults) {
                setHasSearchResults(true);
                setShowNoResults(false);
              } else {
                // Check if input has value to show "no results"
                const input = document.querySelector('.leaflet-geosearch-bar input') as HTMLInputElement;
                if (input && input.value.trim().length > 0) {
                  setShowNoResults(true);
                  setHasSearchResults(false);
                } else {
                  setShowNoResults(false);
                  setHasSearchResults(false);
                }
              }
            } else {
              // Search started
              setShowNoResults(false);
              setHasSearchResults(false);
            }
          }}
          onLocationSelect={(lat, lng) => {
            setPosition([lat, lng]);
            onLocationSelect(lat, lng);
          }}
        />

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {defaultPosition && !position && (
          <>
            <SetMapCenter center={defaultPosition} />
            <Marker position={defaultPosition} />
          </>
        )}

        <ClickHandler
          onPick={(lat, lng) => {
            setPosition([lat, lng]);
            onLocationSelect(lat, lng);
          }}
        />

        {position && (
          <>
            <Marker position={position} />
            <FlyToLocation position={position} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
