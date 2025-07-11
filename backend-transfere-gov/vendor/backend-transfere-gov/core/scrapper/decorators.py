from core.exceptions import MissingData
from functools import wraps

def raise_for_missing_data(atributo:str):

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)
            if result is None:
                raise MissingData(atributo)
            return result
        return wrapper
    return decorator

def nonetype_error_to_none(func):

    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except AttributeError as exc:
            if str(exc) == "'NoneType' object has no attribute 'find'":
                return None
            else:
                raise exc
    return wrapper
