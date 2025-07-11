from typing import Callable, Optional
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

    def __is_code_key(self, key:str, check_func:Optional[Callable]=None)->bool:

        key_lower = key.lower()
        if check_func is None:
            return key_lower.startswith('cod')

        return check_func(key)


    def __is_desc_key(self, key:str, check_func:Optional[Callable]=None)->bool:

        if check_func:
            return check_func(key)

        starts = ('txt', 'text')
        key_lower = key.lower()

        for start in starts:
            if key_lower.startswith(start):
                return True
        else:
            return False

    def __solve_data_keys(self, data:list, check_func_code_key:Optional[Callable]=None,
                          check_func_desc_key:Optional[Callable]=None)->dict:


        unique_keys = self.__get_unique_keys(data)

        final_keys = {}
        for key in unique_keys:
            if self.__is_code_key(key, check_func_code_key):
                final_keys['cod'] = key
            elif self.__is_desc_key(key, check_func_desc_key):
                final_keys['desc'] = key
            else:
                print(f'Unexpected key: {key}')

        return final_keys

    def __parse_data(self, resp:list, check_func_code_key:Optional[Callable]=None,
                          check_func_desc_key:Optional[Callable]=None)->list[dict]:


        if resp is None:
            return []

        keys = self.__solve_data_keys(resp, check_func_code_key,
                                      check_func_desc_key)

        print(resp)
        parsed = [
                    {'codigo' : item[keys['cod']],
                    'descricao' : item[keys['desc']]}
                for item in resp
                ]

        return parsed


    def __get_data(self, endpoint_name:str, ano:str, check_func_code_key:Optional[Callable]=None,
                          check_func_desc_key:Optional[Callable]=None, *_, **kwargs)->list:


        data_key = self._keys_valores[endpoint_name]
        resp = self.sof(data_key=data_key, attr_keys=None,
                        endpoint_name=endpoint_name, ano=ano,
                        **kwargs)

        return self.__parse_data(resp, check_func_code_key, check_func_desc_key)


    def __is_code_orgao(self, key:str)->bool:

        return key=='codOrgao'

    def __is_desc_orgao(self, key:str)->bool:

        return key=='txtDescricaoOrgao'


    def __build_methods(self)->None:

        for endpoint in self._keys_valores.keys():

            if endpoint == 'orgaos':
                # usa colunas especificas pro endpoint de orgao
                method = partial(self.__get_data, endpoint_name=endpoint,
                                check_func_code_key=self.__is_code_orgao,
                                check_func_desc_key=self.__is_desc_orgao)
            else:
                method = partial(self.__get_data, endpoint_name=endpoint,
                                check_func_code_key=None,
                                check_func_desc_key=None)

            setattr(self, endpoint, method)

    def __solve_unidades(self, ano:int, data:dict)->None:

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