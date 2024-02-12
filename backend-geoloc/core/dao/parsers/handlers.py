class AtributeNotFound(Exception):
    pass

def attr_not_found(msg:str):

    def decorator(func):

        def wrapper(self, resp, *args, **kwargs):
            try:
                return func(self, resp, *args, **kwargs)
            except KeyError:
                raise AtributeNotFound(msg + f': {resp}')
        return wrapper
    
    return decorator