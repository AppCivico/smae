from core.exceptions import AtributeNotFound

def attr_not_found(attr:str):

    def decorator(func):

        def wrapper(self, resp, *args, **kwargs):
            try:
                return func(self, resp, *args, **kwargs)
            except KeyError:
                raise AtributeNotFound('Atributo não encontrado: ' + attr + f': {resp}')
        return wrapper
    
    return decorator