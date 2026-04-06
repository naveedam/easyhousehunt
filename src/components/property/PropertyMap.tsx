import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapProperty {
  id: string;
  title: string;
  rent: number;
  latitude: number | null;
  longitude: number | null;
}

interface Props {
  properties: MapProperty[];
  center?: [number, number];
}

const defaultIcon = new Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function PropertyMap({ properties, center = [12.9716, 77.5946] }: Props) {
  const validProperties = properties.filter(p => p.latitude && p.longitude);

  return (
    <div className="rounded-xl overflow-hidden border h-[400px] lg:h-full lg:min-h-[500px]">
      <MapContainer center={center} zoom={12} className="h-full w-full" scrollWheelZoom={false}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {validProperties.map(p => (
          <Marker key={p.id} position={[p.latitude!, p.longitude!]} icon={defaultIcon}>
            <Popup>
              <div className="font-body">
                <strong>{p.title}</strong>
                <br />
                ₹{p.rent.toLocaleString('en-IN')}/mo
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
