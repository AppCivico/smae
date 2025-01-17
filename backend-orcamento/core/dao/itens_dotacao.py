from typing import Callable
from functools import partial
from collections import OrderedDict
#temporario por conta do hotfix do endpoint de fontes
import json

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
            funcoes = 'lstFuncao',
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

    def __is_code_key(self, key:str)->bool:

        key_lower = key.lower()
        return key_lower.startswith('cod')


    def __is_desc_key(self, key:str)->bool:

        starts = ('txt', 'text')

        key_lower = key.lower()

        for start in starts:
            if key_lower.startswith(start):
                return True
        else:
            return False

    def __solve_data_keys(self, data:list)->dict:


        unique_keys = self.__get_unique_keys(data)

        final_keys = {}
        for key in unique_keys:
            if self.__is_code_key(key):
                final_keys['cod'] = key
            elif self.__is_desc_key(key):
                final_keys['desc'] = key
            else:
                print(f'Unexpected key: {key}')

        return final_keys

    def __parse_data(self, resp:list)->dict:


        if resp is None:
            return []

        keys = self.__solve_data_keys(resp)

        #print(resp)
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
            #hotfix endpoint fonte quebrado - vai puxar de forma hardcoded
            if method_name!= 'fonte_recursos':
                method = getattr(self, method_name)
                data[method_name] = method(ano=ano)
            #aqui é hardcoded porque quebrou o endpoint de fontes
            else:
                with open('fontes_cache.json') as f:
                    hardcode_data = json.load(f)['fonte_recursos']
                data['fonte_recursos'] = hardcode_data


        return data
