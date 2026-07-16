import redis
from app.core.config import settings

try:
    redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
except Exception:
    # Fallback to Mock Redis dictionary for local non-docker testing or sandbox fallback
    class MockRedis:
        def __init__(self):
            self.store = {}
        def get(self, name):
            return self.store.get(name)
        def set(self, name, value, ex=None):
            self.store[name] = value
            return True
        def delete(self, name):
            if name in self.store:
                del self.store[name]
                return True
            return False
        def incr(self, name):
            val = int(self.store.get(name, 0)) + 1
            self.store[name] = str(val)
            return val
        def expire(self, name, time):
            pass
    redis_client = MockRedis()
