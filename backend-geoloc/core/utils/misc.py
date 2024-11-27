import re
import urllib.parse

def url_encode(input_string):
    return urllib.parse.quote(input_string)


def check_cep(cep:str)->None:

    if not re.match(r'\d{5}-\d{3}', cep):
        raise ValueError(f'Cep {cep} fora do padrão')