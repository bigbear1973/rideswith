interface WeatherConditions {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  description: string;
  icon: string;
  precipitationChance: number;
}

interface WeatherForecast {
  datetime: Date;
  conditions: WeatherConditions;
}

export async function getWeatherForecast(
  latitude: number,
  longitude: number,
  datetime: Date
): Promise<WeatherForecast | null> {
  const apiKey = process.env.WEATHER_API_KEY;

  if (!apiKey) {
    console.warn('WEATHER_API_KEY not configured');
    return null;
  }

  try {
    // Using OpenWeatherMap One Call API 3.0
    const response = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely&units=metric&appid=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();

    // Find the hourly forecast closest to the requested time
    const targetTime = datetime.getTime() / 1000;
    const hourlyData = data.hourly || [];

    let closestForecast = hourlyData[0];
    let minDiff = Math.abs((hourlyData[0]?.dt || 0) - targetTime);

    for (const hour of hourlyData) {
      const diff = Math.abs(hour.dt - targetTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestForecast = hour;
      }
    }

    if (!closestForecast) {
      return null;
    }

    return {
      datetime: new Date(closestForecast.dt * 1000),
      conditions: {
        temperature: closestForecast.temp,
        feelsLike: closestForecast.feels_like,
        humidity: closestForecast.humidity,
        windSpeed: closestForecast.wind_speed,
        windDirection: closestForecast.wind_deg,
        description: closestForecast.weather[0]?.description || '',
        icon: closestForecast.weather[0]?.icon || '',
        precipitationChance: (closestForecast.pop || 0) * 100,
      },
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return null;
  }
}

export function getWeatherIconUrl(iconCode: string): string {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}

export function formatWeatherForRide(weather: WeatherForecast): string {
  const { conditions } = weather;
  const temp = Math.round(conditions.temperature);
  const wind = Math.round(conditions.windSpeed * 3.6); // m/s to km/h
  const rain = Math.round(conditions.precipitationChance);

  let summary = `${temp}°C, ${conditions.description}`;

  if (wind > 20) {
    summary += `, ${wind} km/h wind`;
  }

  if (rain > 30) {
    summary += `, ${rain}% chance of rain`;
  }

  return summary;
}
