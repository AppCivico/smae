import re
import urllib.parse
from fastapi import HTTPException

def url_encode(input_string):

    encoded = urllib.parse.quote_plus(input_string)
    return encoded


def check_cep(cep:str)->None:

    if not re.match(r'\d{5}-\d{3}', cep):
        raise ValueError(f'Cep {cep} fora do padrão')
    

def check_camada_exists(layer_name:str, nomes_camadas:list)->None:

    if layer_name not in nomes_camadas:
        print(layer_name)
        print(nomes_camadas.camadas)
        raise HTTPException(status_code=404, detail=f"Camada {layer_name.replace('geoportal:', '')} não encontrada")