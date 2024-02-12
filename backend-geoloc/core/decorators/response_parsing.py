from core.utils.json_decode import json_resp_decode_error, xml_to_json_decode_error

def json_decode_error_handling(func):

    def wrapper(*args, **kwargs)->dict:
        '''Original function must return a Requests.Response obj'''

        resp = func(*args, **kwargs)
        return json_resp_decode_error(resp)
    
    return wrapper

def xml_to_json_decode_error_handling(func):

    def wrapper(*args, **kwargs)->dict:
        '''Original function must return a Requests.Response obj'''

        resp = func(*args, **kwargs)
        return xml_to_json_decode_error(resp)
    
    return wrapper