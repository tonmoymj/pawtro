'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Pet } from '@/types';

// Fix Leaflet marker icons in Next.js
const createCustomIcon = (type: string, isSelected: boolean) => {
  const color = type === 'lost' ? '#9E3B36' : type === 'found' ? '#1D6B5F' : '#46577F';
  const size = isSelected ? 18 : 12;

  return L.divIcon({
    className: 'custom-map-pin',
    html: `<div style="
      width: ${size}px; 
      height: ${size}px; 
      background-color: ${color}; 
      border: 2px solid white; 
      border-radius: 99px; 
      box-shadow: 0 1px 4px rgba(0,0,0,0.35);
      ${isSelected ? 'outline: 3px solid rgba(29,107,95,0.4);' : ''}
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 12);
  }, [center, map]);
  return null;
}

interface MapViewProps {
  pets: Pet[];
  selectedPet: Pet | null;
  onSelectPet: (pet: Pet) => void;
}

export default function MapView({ pets, selectedPet, onSelectPet }: MapViewProps) {
  const center: [number, number] = selectedPet?.lat && selectedPet?.lng
    ? [selectedPet.lat, selectedPet.lng]
    : [23.777176, 90.399452]; // Default Dhaka

  return (
    <div className="w-full h-full">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ChangeView center={center} />
        {pets.map((pet) => {
          if (!pet.lat || !pet.lng) return null;
          const isSelected = selectedPet?.id === pet.id;
          return (
            <Marker
              key={pet.id}
              position={[pet.lat, pet.lng]}
              icon={createCustomIcon(pet.type, isSelected)}
              eventHandlers={{
                click: () => onSelectPet(pet),
              }}
            >
              <Popup>
                <div className="text-xs font-sans">
                  <b className="block font-bold">{pet.petName || 'পোষ্য'}</b>
                  <span>{pet.area}</span>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
