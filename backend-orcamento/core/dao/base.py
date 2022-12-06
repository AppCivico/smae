from typing import Callable
from functools import wraps
from requests.exceptions import HTTPError
from ..exceptions import EmptyData, UnexpectedResponse

class Dao:

    def __check_resp_status(self, resp:dict)->None:

        mdata = resp.get('metadados', {})

        status = mdata.get('txtStatus', 'missing mdata')
        if status.lower()!='ok':
            raise HTTPError(f'Erro no status da resposta: {status}')

    def __get_num_pages(self, resp:dict)->None:

        mdata = resp.get('metadados', {})
        return int(mdata['qtdPaginas'])

    def __parse_single_resp(self, data:dict, attr_keys:list)->list:

        #se nao definir, retorna como esta
        if attr_keys is None:
            return [data]

        parsed = {key : data[key] for key in 
                attr_keys}
            
        return [parsed]

    def __parse_array_resp(self, data:list, attr_keys:list)->list:

        parsed = []
        for item in data:
            #se nao definir keys, retorna como esta
            if attr_keys is not None:
                parsed_item = {key : item[key] for key in 
                attr_keys}
            else:
                parsed_item = item
            parsed.append(parsed_item)
        return parsed

    def __parse_resp(self, resp:dict, data_key:str, attr_keys:list)->list:

        self.__check_resp_status(resp)

        data = resp.get(data_key, None)

        if data is None:
            raise EmptyData(f'Empty data. Key {data_key}. Resp: {resp}')

        if type(data) is dict:
            return self.__parse_single_resp(data, attr_keys)
        
        if type(data) is list:
            return self.__parse_array_resp(data, attr_keys)

        raise UnexpectedResponse(f'Unespected data type {type(data)}. Must be dict or list.')

    def __paginate(self, get_func:Callable, data_key:str, attr_keys:list,
                 *_, **func_kwargs)->list:

        first_resp = get_func(**func_kwargs)
        #pegando a quantidade de paginas
        num_pag = self.__get_num_pages(first_resp)

        #guarda os dados
        parsed_pages = []

        #adicionando primeira resposta no array
        parsed_page = self.__parse_resp(first_resp, data_key, attr_keys)
        parsed_pages.extend(parsed_page)

        #iterando as demais paginas, se houver
        if num_pag > 1:
            #range comeca em 2, pois ja pegamos primeira pagina
            for pag in range(2,num_pag+1):
                func_kwargs['num_pag']=pag
                resp = get_func(**func_kwargs)
                parsed_page = self.__parse_resp(resp)
                parsed_pages.extend(parsed_page)
        
        return parsed_pages

    def __call__(self, get_func:Callable, data_key:str, attr_keys:list,
                *_, **func_kwargs):

        return self.__paginate(get_func, data_key, attr_keys, **func_kwargs)
