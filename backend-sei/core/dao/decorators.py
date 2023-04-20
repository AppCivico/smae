from core.soap import SEIClient
from core.utils.data import snake_case_dict

def set_client(func):

    client = SEIClient()
    def wraped(*args, **kwargs):
        
        return func(client, *args, **kwargs)

    return wraped