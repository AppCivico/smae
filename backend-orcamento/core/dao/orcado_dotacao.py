from functools import partial
from typing import Callable

from .api_client import ClientDespesasDotacao as SofClient
from .base import Dao

from config import SOF_API_TOKEN

class OrcadoDotacao:

    data_key = 'lstDespesas'

    def __init__(self, auth_token:str=SOF_API_TOKEN)->None:

        self.sof = self.__bind_sof(auth_token)

    def __bind_sof(self, auth_token:str)->Callable:

        dao = Dao()
        sof = SofClient(auth_token)

        sof_dao = partial(dao, get_func=sof, data_key=self.data_key,
                attr_keys=self.value_keys)

        return sof_dao

    @property
    def value_keys(self)->tuple:

        keys = (
            'valOrcadoInicial',
            'valOrcadoAtualizado',
            'valDisponivel'
        )

        return keys

    def parse_data(self, data: list)->dict:

        key_map = {
            'val_orcado_inicial' : 'valOrcadoInicial',
            'val_orcado_atualizado' : 'valOrcadoAtualizado',
            'saldo_disponivel' : 'valDisponivel'
        }

        parsed_data = []
        for d in data:
            parsed = {key : d[og_key]
                    for key, og_key in key_map.items()}
            parsed_data.append(parsed)
            
        return parsed_data

    def orcado_dotacao(self, ano:int, mes:int, dotacao:str)->list:

        data = self.sof(ano=ano, mes=mes, dotacao=dotacao)

        return self.parse_data(data)