from config import CACHE_TTL_SECONDS
from time import time


class Cache:

    def __init__(self):
        self.cache = {}
        self.ttl = CACHE_TTL_SECONDS

    def check_ttl(self, key:str) -> bool:
        """
        Check if the item in the cache is still valid based on its TTL.
        """

        _, timestamp = self.cache[key]
        if time() - timestamp < self.ttl:
            return True
        else:
            print(f"Cache expired for key: {key}")
            del self.cache[key]
            return False

    def get(self, key):
        """
        Retrieve an item from the cache.
        """
        if key in self.cache:
            if self.check_ttl(key):
                value = self.cache[key][0]
                print(f"Cache fetch for key: {key}")
                return value
            else:
                return None
        else:
            return None

    def set(self, key, value):
        """
        Store an item in the cache.
        """
        print('Setting cache for key:', key)
        self.cache[key] = (value, time())

    def clear(self):
        """
        Clear the cache.
        """
        self.cache.clear()

def cache_property(property_name:str):
    cache = Cache()
    def decorator(func):
        def wrapper(*args, **kwargs):
           
            cached_value = cache.get(property_name)
            if cached_value is not None:
                return cached_value
            result = func(*args, **kwargs)
            cache.set(property_name, result)
            return result
        
        return wrapper
    return decorator
