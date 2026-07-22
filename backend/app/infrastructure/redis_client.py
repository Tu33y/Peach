import redis
from app.core.config import settings

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
    def sadd(self, name, *values):
        if name not in self.store:
            self.store[name] = set()
        for v in values:
            self.store[name].add(str(v))
        return len(values)
    def srem(self, name, *values):
        if name in self.store:
            for v in values:
                self.store[name].discard(str(v))
        return len(values)
    def sismember(self, name, value):
        if name in self.store:
            return str(value) in self.store[name]
        return False

# Attempt real connection ping, if it fails, immediately fallback to MockRedis
try:
    redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
    redis_client.ping()
except Exception:
    redis_client = MockRedis()
