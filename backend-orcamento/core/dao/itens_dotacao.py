from typing import Callable
from functools import partial
from collections import OrderedDict
from .base import Dao
from .api_client import ClientDotacoes as SofClient
from core.exceptions import EmptyData

from config import SOF_API_TOKEN


class ItensDotacao:

    def __init__(self, auth_token:str=SOF_API_TOKEN)->None:

        self.sof = self.__bind_sof(auth_token)
        self.__build_methods()

    def __bind_sof(self, auth_token:str)->Callable:

        dao = Dao()
        sof = SofClient(auth_token)

        sof_dao = partial(dao, get_func=sof)

        return sof_dao

    @property
    def _keys_valores(self):

        return OrderedDict(
            orgaos = 'lstOrgaos',
            unidades = 'lstUnidades',
            funcoes = 'lstFuncoes',
            subfuncoes = 'lstSubFuncoes',
            programas = 'lstProgramas',
            projetos_atividades = 'lstProjetosAtividades',
            categorias  = 'lstCategorias',
            grupos  = 'lstGrupos',
            modalidades = 'lstModalidades',
            elementos = 'lstElementos',
            fonte_recursos = 'lstFontesRecursos'
        )

    def __get_unique_keys(self, data:list)->set:

        unique_keys = set()
        for item in data:
            unique_keys.update(tuple(item.keys()))
        
        return unique_keys

    def __solve_data_keys(self, data:list)->dict:

        
        unique_keys = self.__get_unique_keys(data)

        final_keys = {}
        for key in unique_keys:
            if key.lower().startswith('cod'):
                final_keys['cod'] = key
            elif key.lower().startswith('txt'):
                final_keys['desc'] = key
            else:
                print(f'Unexpected key: {key}')

        return final_keys
    
    def __parse_data(self, resp:list)->dict:


        if resp is None:
            return []

        keys = self.__solve_data_keys(resp)
        
        parsed = [
                    {'codigo' : item[keys['cod']],
                    'descricao' : item[keys['desc']]}
                for item in resp
                ]

        return parsed


    def __get_data(self, endpoint_name:str, ano:str, *_, **kwargs)->list:


        data_key = self._keys_valores[endpoint_name]
        resp = self.sof(data_key=data_key, attr_keys=None,
                        endpoint_name=endpoint_name, ano=ano,
                        **kwargs)
        
        return self.__parse_data(resp)


    def __build_methods(self)->None:

        for endpoint in self._keys_valores.keys():
            method = partial(self.__get_data, endpoint_name=endpoint)
            setattr(self, endpoint, method)

    def __solve_unidades(self, ano:int, data:dict)->list:

        orgaos = data['orgaos']
        unidades = []
        for org in orgaos:
            cod_orgao=org['codigo']
            try:
                unid_org = self.unidades(ano=ano, cod_orgao=cod_orgao)
            except EmptyData:
                continue
            for unid in unid_org:
                unid['cod_orgao'] = cod_orgao
            
            unidades.extend(unid_org)
            
        data['unidades'] = unidades


    def __call__(self, ano:int)->dict:

        data = {}
        for method_name in self._keys_valores.keys():
            print(method_name)
            if method_name == 'unidades':
                self.__solve_unidades(ano, data)
                continue
            method = getattr(self, method_name)
            data[method_name] = method(ano=ano)
            
        
        return data
