import json
import xmltodict
from requests import Response

def json_resp_decode_error(resp:Response)->dict:

    try:
        return resp.json()
    except json.JSONDecodeError:
        try:
            return {'erro' : resp.txt,
                    'tipo_erro' : 'JsonDecodeError'}
        except AttributeError:
            return {'erro' : str(resp.content),
                    'tipo_erro' : 'JsonDecodeError'}
        

def xml_to_json_decode_error(resp:Response)->dict:

    try:
        t = resp.text
        return xmltodict.parse(t)
    except (AttributeError, xmltodict.expat.ExpatError):
        return {'erro' : str(resp.content),
                    'tipo_erro' : 'XMLDecodeError'}