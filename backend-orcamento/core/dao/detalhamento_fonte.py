
from .base import Dao
from .api_client import ClientDotacoes as SofClient
import json
from typing import Callable, Optional
from functools import partial
from core.exceptions import InvalidRequest

from config import SOF_API_TOKEN


class DetalhamentoFontes:

    def __init__(self, auth_token:str=SOF_API_TOKEN)->None:

        self.sof = self.__bind_sof(auth_token)
        self.fontes_data = self.__load_cached_fontes()
        self.fonte_numbers = self.get_fonte_numbers(self.fontes_data)

    def __bind_sof(self, auth_token:str)->Callable:

        dao = Dao()
        sof = SofClient(auth_token)

        sof_dao = partial(dao, get_func=sof)

        return sof_dao

    def __load_cached_fontes(self)->list[dict]:

        return self.sof(endpoint_name='fonte_recursos_cached', data_key='fonte_recursos', attr_keys=['codigo', 'descricao'], ano=2025)
    
    def get_fonte_numbers(self, fontes_data:list[dict])->set[int]:

        fonte_numbers = {int(fonte['codigo']) for fonte in fontes_data}

        return fonte_numbers
    
    def parse_fonte_number_param(self, fonte_number:str)->str:

        try:
            fonte_number_int = int(fonte_number)
        except ValueError:
            raise InvalidRequest(f"Invalid fonte number: {fonte_number}")
        
        if fonte_number_int not in self.fonte_numbers:
            raise InvalidRequest(f"Fonte number {fonte_number_int} not found in available fontes.")
        
        return fonte_number

    def get_detalhamentos_by_fonte_number(self, fonte_number:str, ano:int)->dict:

        fonte_number = self.parse_fonte_number_param(fonte_number)

        detalhes_fonte = self.sof(
                                  endpoint_name='fonte_recursos', 
                                  ano=ano, 
                                  cod_fonte=fonte_number,
                                  data_key='lstFonteRecurso',
                                  attr_keys=['codFonteRecurso', 'txtDescricaoFonteRecurso'])

        return detalhes_fonte
    
    def parse_detalhementos(self, detalhes_fonte:dict)->list[dict]:


        parsed_data = []
        for item in detalhes_fonte:
            parsed_item = {
                'codigo': item['codFonteRecurso'],
                'descricao': item['txtDescricaoFonteRecurso']
            }
            parsed_data.append(parsed_item)

        return parsed_data
    
    def get_parsed_detalhamentos_by_fonte_number(self, fonte_number:str, ano:int)->list[dict]:

        detalhes_fonte = self.get_detalhamentos_by_fonte_number(fonte_number, ano)
        parsed_detalhes = self.parse_detalhementos(detalhes_fonte)

        return parsed_detalhes
    
    def detalhamentos_fonte(self, fonte_number:str, ano:int)->list[dict]:

        return self.get_parsed_detalhamentos_by_fonte_number(fonte_number, ano)
    

    def __call__(self, fonte_number:str, ano:int)->list[dict]:

        return self.get_parsed_detalhamentos_by_fonte_number(fonte_number, ano)