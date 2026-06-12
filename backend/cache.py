import time

_store: dict = {}

def get(key: str):
    entry = _store.get(key)
    if entry:
        val, ts, ttl = entry
        if time.time() - ts < ttl:
            return val
        del _store[key]
    return None

def set(key: str, value, ttl: int = 300):
    _store[key] = (value, time.time(), ttl)
