
import re
from typing import Union

from core.exceptions.basic import DadosForaDoPadrao

    

def regex_numero_processo(val:str)->str:

    #o SEMVALOR é porque essa flag existe no ambiente de homolog
    patt = r'\d{4}\.\d{4}\/\d{7}-\d(?=-SEMVALOR)?'
    haystack = str(val)
    needle = re.search(patt, haystack)
    if needle is None:
        raise DadosForaDoPadrao(500, f'Número processo fora do padrão: {val}')
    return needle.group()

def regex_numero_doc(val:str)->str:

    patt = '\d{9}'
    haystack = str(val)
    needle = re.search(patt, haystack)
    if needle is None:
        raise DadosForaDoPadrao(500, f'Número do documento fora do padrão: {val}')
    return needle.group()

def regex_data_dia_mes_ano(val:str)->str:

    patt = r'^\d{2}\/\d{2}\/\d{4}'
    haystack = str(val)
    needle = re.search(patt, haystack)
    if needle is None:
        raise DadosForaDoPadrao(500, f'Data fora do padrão: {val}')
    return needle.group()


def regex_link_web(val:str)->str:

    patt = r'^https?://(?:www\.)?[^\s/$.?#].[^\s]*$'
    haystack = str(val)
    needle = re.search(patt, haystack)
    if needle is None:
        raise DadosForaDoPadrao(500, f'Link fora do padrão: {val}')
    return needle.group()


def none_to_string(val:Union[str, None])->str:

    if val is None:
        val = ''
    return str(val)