"use client"
import React, { useEffect, useState } from 'react';
import maplibregl from 'maplibre-gl';
import axios from 'axios';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Pin {
    id: number;
    lat: number;
    lng: number;
    remarks: string;
    address: string;
}

const MapComponent: React.FC = () => {
    const [map, setMap] = useState<maplibregl.Map | null>(null);
    const [pins, setPins] = useState<Pin[]>(() => JSON.parse(localStorage.getItem('pins') || '[]'));
    const [newPin, setNewPin] = useState<Partial<Pin> | null>(null);

    // Initialize MapLibre Map
    useEffect(() => {
        const mapInstance = new maplibregl.Map({
            container: 'map',
            style: 'https://demotiles.maplibre.org/style.json',
            center: [0, 0],
            zoom: 2,
        });

        mapInstance.on('click', (e) => {
            setNewPin({ lat: e.lngLat.lat, lng: e.lngLat.lng, remarks: '', address: '' });
        });

        setMap(mapInstance);

        return () => mapInstance.remove();
    }, []);

    // Fetch address from Nominatim API
    const fetchAddress = async (lat: number, lng: number): Promise<string> => {
        try {
            const response = await axios.get(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            return response.data.display_name || 'Address not found';
        } catch {
            return 'Error fetching address';
        }
    };

    // Save pin to state and local storage
    const savePin = async () => {
        if (newPin && newPin.lat && newPin.lng) {
            const address = await fetchAddress(newPin.lat, newPin.lng);
            const updatedPin: Pin = {
                id: Date.now(),
                lat: newPin.lat,
                lng: newPin.lng,
                remarks: newPin.remarks || '',
                address,
            };

            const updatedPins = [...pins, updatedPin];
            setPins(updatedPins);
            localStorage.setItem('pins', JSON.stringify(updatedPins));
            setNewPin(null);
        }
    };

    // Center map on pin when clicked in sidebar
    const navigateToPin = (pin: Pin) => {
        if (map) {
            map.flyTo({ center: [pin.lng, pin.lat], zoom: 10 });
        }
    };

    // Add markers on the map for saved pins
    useEffect(() => {
        if (map) {
            pins.forEach((pin) => {
                new maplibregl.Marker()
                    .setLngLat([pin.lng, pin.lat])
                    .setPopup(
                        new maplibregl.Popup({ offset: 25 }).setHTML(`
                            <div><strong>${pin.remarks}</strong></div>
                            <div>${pin.address}</div>
                        `)
                    )
                    .addTo(map);
            });
        }
    }, [map, pins]);

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <div id="map" style={{ flex: 1 }}></div>
            <div style={{ width: '250px', overflowY: 'auto', background: '#f4f4f4', padding: '1rem' }}>
                <h3 className='text-black'>Saved Pins</h3>
                <ul>
                    {pins.map((pin) => (
                        <li key={pin.id} onClick={() => navigateToPin(pin)}>
                            <strong className='text-black'>{pin.remarks}</strong><br />
                            <h3 className='text-black'>{pin.address}</h3>
                        </li>
                    ))}
                </ul>
            </div>

            {newPin && (
                <div style={{
                    position: 'fixed', top: '20%', left: '20%', padding: '1rem',
                    background: 'white', border: '1px solid #ccc', zIndex: 1000
                }}>
                    <h4 className='text-black'>New Pin</h4>
                    <form onSubmit={(e) => { e.preventDefault(); savePin(); }}>
                        <input
                            type="text"
                            placeholder="Enter remarks"
                            value={newPin.remarks || ''}
                            onChange={(e) => setNewPin({ ...newPin, remarks: e.target.value })}
                            className='text-black'
                        />
                        <button type="submit" className='text-black'>Save Pin</button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default MapComponent;