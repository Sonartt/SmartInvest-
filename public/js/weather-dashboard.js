/**
 * Weather Dashboard
 * Minimal weather display for demonstration
 */

(function() {
  'use strict';

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    initWeatherDashboard();
  });

  async function initWeatherDashboard() {
    const container = document.getElementById('weather-container');
    if (!container) return;

    try {
      // Default to Nairobi, Kenya (SmartInvest Africa headquarters)
      const city = 'Nairobi';
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        displayWeather(result, container);
      }
    } catch (error) {
      console.warn('Weather data unavailable:', error);
      container.innerHTML = '<p class="text-gray-600">Weather data unavailable</p>';
    }
  }

  function displayWeather(location, container) {
    container.innerHTML = `
      <div class="card p-6">
        <h2 class="text-2xl font-bold gradient-text mb-4">${location.name}, ${location.country}</h2>
        <p class="text-gray-600">Weather feature is in beta. Try your location:</p>
        <input 
          type="text" 
          id="city-search" 
          class="w-full mt-2 px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-500" 
          placeholder="Enter city name"
        >
        <button 
          onclick="searchWeather()" 
          class="mt-2 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
        >
          Search
        </button>
      </div>
    `;
  }

  window.searchWeather = async function() {
    const city = document.getElementById('city-search')?.value || '';
    if (!city) return alert('Please enter a city name');
    
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`
      );
      const data = await response.json();
      if (data.results?.length > 0) {
        displayWeather(data.results[0], document.getElementById('weather-container'));
      } else {
        alert('City not found');
      }
    } catch (error) {
      console.error('Weather search error:', error);
      alert('Unable to fetch weather data');
    }
  };
})();
