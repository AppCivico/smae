from typing import Callable
from functools import partial
from collections import defaultdict

from .base import Dao
from .api_client import ClientEmpenhos as SofClient
from ..utils.utils_dotacao import ReconstructDotacao

from config import SOF_API_TOKEN



class EmpenhosLiquidacoes:


    data_key = 'lstEmpenhos'

    def __init__(self, auth_token:str=SOF_API_TOKEN, return_dotacao=True)->None:

        self.return_dotacao = return_dotacao
        self.attr_keys = self.get_attr_keys()
        self.sof = self.__bind_sof(auth_token)

        self.dotacao_txt = ReconstructDotacao()


    @property
    def keys_dotacao(self):

        keys = (
            'codOrgao', 
            'codUnidade', 
            'codFuncao', 
            'codSubFuncao', 
            'codPrograma', 
            'codProjetoAtividade', 
            'codCategoria', 
            'codGrupo', 
            'codModalidade', 
            'codElemento', 
            'codFonteRecurso',
            'txDescricaoFonteRecurso'
            )

        return keys

    @property
    def value_keys(self):

        keys = (
            'valLiquidado',
            'valEmpenhadoLiquido',
            'txDescricaoProjetoAtividade'
        )

        return keys

    def get_attr_keys(self):

        keys = [k for k in self.value_keys]

        if self.return_dotacao:
            keys.extend(self.keys_dotacao)

        return keys

    def __bind_sof(self, auth_token:str)->Callable:

        dao = Dao()
        sof = SofClient(auth_token)

        sof_dao = partial(dao, get_func=sof, data_key=self.data_key,
                attr_keys=self.attr_keys)

        return sof_dao

    def parse_data(self, data):

        parsed = defaultdict(lambda: defaultdict(int))
        for d in data:
            dotacao = self.dotacao_txt(d)
            parsed[dotacao]['empenho_liquido'] += float(d['valEmpenhadoLiquido'])
            parsed[dotacao]['val_liquidado'] += float(d['valLiquidado'])
            parsed[dotacao]['projeto_atividade'] = str(d['txDescricaoProjetoAtividade'])
            parsed[dotacao]['dotacao'] = dotacao
            if 'codProcesso' in d:
                parsed[dotacao]['processo'] = d['codProcesso']
        
        #converting back to dict
        final_data = [dict(dici) for dici in parsed.values()]
        
        return final_data

    def processo(self, ano:int, mes:int, processo:int)->list:

        data = self.sof(ano=ano, mes=mes, processo=processo)

        return self.parse_data(data)

    def nota_empenho(self, ano:int, mes:int, nota_empenho:int)->list:


        attr_keys = self.attr_keys.copy()
        attr_keys.append('codProcesso')
        data = self.sof(ano=ano, mes=mes, nota_empenho=nota_empenho, attr_keys=attr_keys)

        return self.parse_data(data)

    def dotacao(self, ano:int, mes:int, dotacao:str)->list:

        data = self.sof(ano=ano, mes=mes, dotacao=dotacao)

        return self.parse_data(data)