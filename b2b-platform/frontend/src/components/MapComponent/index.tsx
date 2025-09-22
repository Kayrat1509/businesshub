import { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Исправление проблемы с иконками маркеров в Vite/Webpack сборке
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Интерфейс для пропсов компонента карты
interface MapComponentProps {
  latitude?: number; // Широта для отображения карты
  longitude?: number; // Долгота для отображения карты
  zoom?: number; // Уровень зума карты
  height?: string; // Высота контейнера карты
  width?: string; // Ширина контейнера карты
  markerText?: string; // Текст для всплывающего окна маркера
  className?: string; // Дополнительные CSS классы
}

const MapComponent = ({
  latitude = 51.505, // Координаты Лондона по умолчанию
  longitude = -0.09,
  zoom = 13,
  height = '400px',
  width = '100%',
  markerText = 'Маркер на карте',
  className = ''
}: MapComponentProps) => {
  // Реф для контейнера карты
  const mapRef = useRef<HTMLDivElement>(null);
  // Реф для экземпляра карты Leaflet
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    // Проверяем, что контейнер существует и карта еще не инициализирована
    if (mapRef.current && !mapInstanceRef.current) {
      // Создание экземпляра карты Leaflet
      const map = L.map(mapRef.current).setView([latitude, longitude], zoom);

      // Добавление слоя OpenStreetMap с атрибуцией
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      // Создание и добавление маркера на карту
      const marker = L.marker([latitude, longitude]).addTo(map);

      // Добавление всплывающего окна к маркеру
      marker.bindPopup(markerText);

      // Сохранение ссылки на карту для последующей очистки
      mapInstanceRef.current = map;
    }

    // Функция очистки при размонтировании компонента
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove(); // Удаление карты из DOM
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, zoom, markerText]); // Пересоздание карты при изменении координат

  return (
    <div
      id="map"
      ref={mapRef}
      className={`map-container ${className}`}
      style={{
        height,
        width,
        borderRadius: '8px', // Скругленные углы
        border: '1px solid #e2e8f0' // Легкая граница
      }}
    />
  );
};

export default MapComponent;