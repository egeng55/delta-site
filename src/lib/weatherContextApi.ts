import { DELTA_API_URL, fetchWithRetry } from "./api";

export type WeatherContextResponse = {
  summary: string;
  weather: Record<string, unknown>;
  source: string;
};

export async function getWeatherContextForCoordinates({
  latitude,
  longitude,
  timezone,
}: {
  latitude: number;
  longitude: number;
  timezone: string;
}): Promise<WeatherContextResponse> {
  const query = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    timezone,
  });
  const response = await fetchWithRetry(`${DELTA_API_URL}/context/weather?${query.toString()}`, {}, 0, 10000);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof payload.detail === "string" ? payload.detail : "Weather context unavailable";
    throw new Error(detail);
  }
  return payload as WeatherContextResponse;
}

export async function resolveBrowserWeatherContext(): Promise<WeatherContextResponse | null> {
  if (typeof window === "undefined" || !window.navigator.geolocation) {
    return null;
  }
  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    window.navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 10 * 60 * 1000,
    });
  }).catch(() => null);

  if (!position) return null;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "auto";
  return getWeatherContextForCoordinates({
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    timezone,
  });
}
