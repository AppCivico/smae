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

    @property
    def _endpoint_field_mapping(self):
        """Define specific field mappings for each endpoint based on API documentation"""
        return {
            'orgaos': {
                'code_key': 'codOrgao',
                'desc_key': 'txtDescricaoOrgao'
            },
            'unidades': {
                'code_key': 'codUnidade',
                'desc_key': 'txtDescricaoUnidade'
            },
            'funcoes': {
                'code_key': 'codFuncao',
                'desc_key': 'textDescricaoFuncao' # Note: typo in original ...
            },
            'subfuncoes': {
                'code_key': 'codSubFuncao',
                'desc_key': 'txtDescricaoSubFuncao'
            },
            'programas': {
                'code_key': 'codPrograma',
                'desc_key': 'txtDescricaoPrograma'
            },
            'projetos_atividades': {
                'code_key': 'codProjetoAtividade',
                'desc_key': 'txtDescricaoProjetoAtividade'
            },
            'categorias': {
                'code_key': 'codCategoria',
                'desc_key': 'txtDescricaoCategoria'
            },
            'grupos': {
                'code_key': 'codGrupo',
                'desc_key': 'txtDescricaoGrupo'
            },
            'modalidades': {
                'code_key': 'codModalidade',
                'desc_key': 'txtDescricaoModalidade'
            },
            'elementos': {
                'code_key': 'codElemento',
                'desc_key': 'txtDescricaoElemento'
            },
            'fonte_recursos': {
                'code_key': 'codFonteRecurso',
                'desc_key': 'txtDescricaoFonteRecurso'
            }
        }

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

    def __solve_data_keys(self, data:list, endpoint_name:str,
                         check_func_code_key:Optional[Callable]=None,
                         check_func_desc_key:Optional[Callable]=None)->dict:

        # First try to use specific field mapping for this endpoint
        field_mapping = self._endpoint_field_mapping.get(endpoint_name)
        if field_mapping:
            unique_keys = self.__get_unique_keys(data)
            expected_code = field_mapping['code_key']
            expected_desc = field_mapping['desc_key']

            # Check if expected keys exist in the data
            if expected_code in unique_keys and expected_desc in unique_keys:
                return {
                    'cod': expected_code,
                    'desc': expected_desc
                }
            else:
                print(f"Warning: Expected keys {expected_code}, {expected_desc} not found for {endpoint_name}")
                print(f"Available keys: {unique_keys}")

        # Fallback to the original logic if specific mapping doesn't work
        unique_keys = self.__get_unique_keys(data)

        final_keys = {}
        for key in unique_keys:
            if self.__is_code_key(key, check_func_code_key):
                final_keys['cod'] = key
            elif self.__is_desc_key(key, check_func_desc_key):
                final_keys['desc'] = key
            else:
                print(f'Unexpected key for {endpoint_name}: {key}')

        return final_keys

    def __parse_data(self, resp:list, endpoint_name:str,
                    check_func_code_key:Optional[Callable]=None,
                    check_func_desc_key:Optional[Callable]=None)->list[dict]:

        if resp is None:
            return []

        keys = self.__solve_data_keys(resp, endpoint_name, check_func_code_key,
                                      check_func_desc_key)

        if 'cod' not in keys or 'desc' not in keys:
            raise ValueError(f"Could not determine code and description keys for endpoint {endpoint_name}. Available keys: {self.__get_unique_keys(resp)}")

        print(f"Using keys for {endpoint_name}: {keys}")
        parsed = [
                    {'codigo' : str(item[keys['cod']]),
                    'descricao' : str(item[keys['desc']])}
                for item in resp
                ]

        return parsed


    def __get_data(self, endpoint_name:str, ano:str, check_func_code_key:Optional[Callable]=None,
                          check_func_desc_key:Optional[Callable]=None, *_, **kwargs)->list:


        data_key = self._keys_valores[endpoint_name]
        resp = self.sof(data_key=data_key, attr_keys=None,
                        endpoint_name=endpoint_name, ano=ano,
                        **kwargs)

        return self.__parse_data(resp, endpoint_name, check_func_code_key, check_func_desc_key)


    def __create_specific_check_functions(self, endpoint_name:str):
        """Create specific check functions for an endpoint if needed"""
        field_mapping = self._endpoint_field_mapping.get(endpoint_name)
        if not field_mapping:
            return None, None

        expected_code = field_mapping['code_key']
        expected_desc = field_mapping['desc_key']

        def is_code_key(key: str) -> bool:
            return key == expected_code

        def is_desc_key(key: str) -> bool:
            return key == expected_desc

        return is_code_key, is_desc_key


    def __build_methods(self)->None:

        for endpoint in self._keys_valores.keys():
            # Create specific check functions for each endpoint
            check_func_code_key, check_func_desc_key = self.__create_specific_check_functions(endpoint)

            method = partial(self.__get_data, endpoint_name=endpoint,
                            check_func_code_key=check_func_code_key,
                            check_func_desc_key=check_func_desc_key)

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
            print(f"Processing {method_name}")
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