import math
from typing import Optional, Tuple

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points
    on the earth (specified in decimal degrees).
    Returns distance in kilometers.
    """
    # convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # haversine formula
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    r = 6371 # Radius of earth in kilometers.
    return c * r

class NominatimGeocodingService:
    def __init__(self, mock: bool = True):
        self.mock = mock

    def geocode(self, address: str) -> Optional[Tuple[float, float]]:
        if self.mock:
            # Deterministic coordinates based on length or simple hash for mock testing
            lat = 45.4642 + (len(address) % 10) * 0.01  # Centered around Milan, Italy
            lon = 9.1900 + (len(address) % 7) * 0.01
            return lat, lon
        else:
            import urllib.request
            import urllib.parse
            import json
            try:
                # In real code we use custom agent and fetch from OSM Nominatim
                address_escaped = urllib.parse.quote(address)
                url = f"https://nominatim.openstreetmap.org/search?q={address_escaped}&format=json&limit=1"
                req = urllib.request.Request(url, headers={'User-Agent': 'MarketplacePlatform/1.0'})
                with urllib.request.urlopen(req, timeout=5) as response:
                    data = json.loads(response.read().decode())
                    if data:
                        return float(data[0]['lat']), float(data[0]['lon'])
            except Exception:
                pass
            return None
