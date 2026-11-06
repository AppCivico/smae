import logging
import re
from datetime import datetime
from typing import List, Optional
from zoneinfo import ZoneInfo

from core.exceptions import MissingData

logger = logging.getLogger(__name__)

PATT_COMUNICADO=r"COMUNICADO\s*(?:[Nn][º°]\s*)?\d+/\d+"

# O portal guarda as datas em UTC; o SMAE interpreta data+hora como America/Sao_Paulo
TZ = ZoneInfo('America/Sao_Paulo')


class Parser:
    '''Converte a resposta JSON (plone.restapi) de uma pasta de comunicados
    no formato esperado por `core.schemas.comunicados.Page`.'''

    def __clean_non_breaking_space(self, text:str)->str:

        return text.replace(u'\xa0', u' ')

    def __to_local(self, iso:str)->datetime:

        return datetime.fromisoformat(iso).astimezone(TZ)

    def ultima_atualizacao_pagina(self, pagina:dict)->str:

        modified = pagina.get('modified')
        if not modified:
            raise MissingData('ultima_atualizacao')

        return self.__to_local(modified).strftime('%d/%m/%Y %Hh%M')

    def titulo_comunicado(self, titulo_raw:str)->str:

        titulo = re.sub(PATT_COMUNICADO, '', titulo_raw,
                        flags=re.IGNORECASE, count=1)

        titulo_limpo =  titulo.strip()
        titulo_limpo = re.sub('^(- |– )', '', titulo_limpo)

        return self.__clean_non_breaking_space(titulo_limpo)

    def __numero_comunicado_raw(self, titulo_raw:str)->Optional[str]:

        num_string = re.search(PATT_COMUNICADO, titulo_raw, flags=re.IGNORECASE)
        if num_string is None:
            return None

        return re.search(r"(\d+/\d+)", num_string.group()).group()

    def numero_comunicado(self, numero_comunicado_raw:str)->int:

        apenas_numero  = numero_comunicado_raw.split('/')[0].strip()
        return int(apenas_numero)

    def ano_comunicado(self, numero_comunicado_raw:str)->int:

        apenas_ano  = numero_comunicado_raw.split('/')[1].strip()
        return int(apenas_ano)

    def data_comunicado(self, item:dict)->Optional[str]:

        effective = item.get('effective')
        if not effective:
            return None

        return self.__to_local(effective).strftime('%d/%m/%Y %H:%M:%S')

    def descricao_comunicado(self, item:dict)->str:

        return self.__clean_non_breaking_space(item.get('description') or '')

    def parse_comunicado(self, item:dict)->Optional[dict]:
        '''Retorna None para itens que não são comunicados (ex: subpastas de ano)'''

        titulo_raw = item.get('title') or ''
        numero_raw = self.__numero_comunicado_raw(titulo_raw)
        data = self.data_comunicado(item)

        if numero_raw is None or data is None:
            logger.warning('Item ignorado (sem número ou data de publicação): %s', item.get('@id'))
            return None

        return {
            'titulo' : self.titulo_comunicado(titulo_raw),
            'numero' : self.numero_comunicado(numero_raw),
            'ano' : self.ano_comunicado(numero_raw),
            'link' : item['@id'],
            'data' : data,
            'descricao' : self.descricao_comunicado(item),
        }

    def parse_comunicados(self, pagina:dict)->List[dict]:

        itens = pagina.get('items')
        if itens is None:
            raise MissingData('itens')

        parsed_data = (self.parse_comunicado(item) for item in itens)

        return [c for c in parsed_data if c is not None]

    def parse_page(self, pagina:dict)->dict:

        if not isinstance(pagina, dict):
            raise ValueError('No data to parse.')

        return {
            'ultima_atualizacao' : self.ultima_atualizacao_pagina(pagina),
            'comunicados' : self.parse_comunicados(pagina),
        }

    def __call__(self, pagina:dict)->dict:

        return self.parse_page(pagina)
