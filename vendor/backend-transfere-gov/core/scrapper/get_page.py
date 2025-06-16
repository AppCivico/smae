from requests import session
from http import HTTPStatus
from requests.exceptions import HTTPError
import time


RETRY_CODES = [
    HTTPStatus.TOO_MANY_REQUESTS,
    HTTPStatus.INTERNAL_SERVER_ERROR,
    HTTPStatus.BAD_GATEWAY,
    HTTPStatus.SERVICE_UNAVAILABLE,
    HTTPStatus.GATEWAY_TIMEOUT,
]

MAX_RETRIES=3

USER_AGENT=('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)'
            ' Chrome/42.0.2311.135 Safari/537.36 Edge/12.246')

class PageRequest:


    def __init__(self)->None:

        self.session = session()

        #definindo a sessao
        self.__set_user_agent()
        self.__set_navigation_headers()

    def __set_user_agent(self):
        
        self.session.headers['User-Agent'] = USER_AGENT

    def __set_navigation_headers(self):
        
        self.session.headers['HOST'] = 'www.gov.br'
        self.session.headers['Referer'] = 'https://www.gov.br/transferegov/pt-br/comunicados'

    def __get_n_retries(self, url:str)->str:
        '''Faz o get da pagina de determinada url, tentando MAX_RETRIES vezes'''
        
        for n in range(MAX_RETRIES):
            try:
                with self.session.get(url) as response:
                    response.raise_for_status()
                    return response.text
            except HTTPError as exc:
                code = exc.response.status_code
                
                if code in RETRY_CODES:
                    # retry after n seconds
                    time.sleep(n)
                    continue
                raise
        else:
            raise RuntimeError(f'Max retries exceeded for url: {url}. HTTP Exception: {exc}. Status code: {code}')
    

    def __call__(self, url:str)->str:

        return self.__get_n_retries(url)



    

