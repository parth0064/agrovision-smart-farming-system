const https = require('https');

/**
 * Fetch current weather data from WeatherAPI.com
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<{temperature: number, humidity: number, description: string, city: string, icon: string} | null>}
 */
const getWeather = (lat, lng) => {
    return new Promise((resolve) => {
        const apiKey = process.env.WEATHER_API_KEY;

        if (!apiKey) {
            console.warn('WEATHER_API_KEY is not set in environment variables');
            return resolve(null);
        }

        const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lng}&aqi=no`;

        https.get(url, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                try {
                    const parsed = JSON.parse(data);

                    if (parsed.error) {
                        console.error('WeatherAPI error:', parsed.error.message);
                        return resolve(null);
                    }

                    resolve({
                        temperature: Math.round(parsed.current.temp_c),
                        feels_like: Math.round(parsed.current.feelslike_c),
                        humidity: parsed.current.humidity,
                        description: parsed.current.condition?.text || 'Unknown',
                        icon: parsed.current.condition?.icon || '',
                        city: parsed.location?.name || 'Unknown',
                        wind_speed: parsed.current.wind_kph ? (parsed.current.wind_kph / 3.6).toFixed(1) : 0,
                        rainfall: parsed.current.precip_mm || 0
                    });
                } catch (err) {
                    console.error('Failed to parse weather response:', err.message);
                    resolve(null);
                }
            });
        }).on('error', (err) => {
            console.error('Weather API request failed:', err.message);
            resolve(null);
        });
    });
};

module.exports = { getWeather };
