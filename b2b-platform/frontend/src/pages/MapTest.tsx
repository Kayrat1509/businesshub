import React from 'react';
import MapComponent from '../components/MapComponent';

// Тестовая страница для демонстрации работы карты
const MapTest = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-white mb-8">Тест карты с геолокацией</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Карта Лондона (координаты по умолчанию) */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Лондон (по умолчанию)</h2>
          <MapComponent
            latitude={51.505}
            longitude={-0.09}
            zoom={13}
            height="300px"
            markerText="Лондон - центр города"
          />
        </div>

        {/* Карта Алматы */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Алматы, Казахстан</h2>
          <MapComponent
            latitude={43.2220}
            longitude={76.8512}
            zoom={12}
            height="300px"
            markerText="Алматы - крупнейший город Казахстана"
          />
        </div>

        {/* Карта Москвы */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Москва, Россия</h2>
          <MapComponent
            latitude={55.7558}
            longitude={37.6176}
            zoom={11}
            height="300px"
            markerText="Москва - столица России"
          />
        </div>

        {/* Карта Токио */}
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Токио, Япония</h2>
          <MapComponent
            latitude={35.6762}
            longitude={139.6503}
            zoom={12}
            height="300px"
            markerText="Токио - столица Японии"
          />
        </div>
      </div>

      {/* Большая карта */}
      <div className="card p-6 mt-8">
        <h2 className="text-xl font-semibold text-white mb-4">Большая карта - Бишкек, Кыргызстан</h2>
        <MapComponent
          latitude={42.8746}
          longitude={74.5698}
          zoom={13}
          height="400px"
          markerText="Бишкек - столица Кыргызстана"
        />
      </div>
    </div>
  );
};

export default MapTest;