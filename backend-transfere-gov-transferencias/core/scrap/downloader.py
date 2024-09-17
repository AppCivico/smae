from requests import session
import pandas as pd
from functools import partial
from io import BytesIO
from zipfile import ZipFile

from core.utils.requests import max_retries_bytes_request
from config import MAX_RETRIES

USER_AGENT=('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)'
            ' Chrome/42.0.2311.135 Safari/537.36 Edge/12.246')


class Downloader:


    def __init__(self)->None:

        self.session = session()

        #definindo a sessao
        self.__set_user_agent()
        self.__set_navigation_headers()

        self.get = partial(max_retries_bytes_request, session=self.session)

        try:
            self.max_retries = int(MAX_RETRIES)
        except ValueError:
            raise RuntimeError(f'A variável de ambiente MAX_RETRIES precisa ser um integer.')

    def __set_user_agent(self):
        
        self.session.headers['User-Agent'] = USER_AGENT

    def __set_navigation_headers(self):
        
        self.session.headers['HOST'] = 'repositorio.dados.gov.br'
        self.session.headers['Referer'] = 'https://repositorio.dados.gov.br/seges/detru/'

    def download_and_unzip(self, url:str)->bytes:

        zip_bytes = BytesIO(
                self.get(url=url, max_retries=self.max_retries)
                )
        zip_in_mem = ZipFile(zip_bytes)

        #estou pressupondo que o csv é sempre o primeiro arquivo do zip
        csv_file_name = zip_in_mem.namelist()[0]
        csv_content = zip_in_mem.open(csv_file_name)

        zip_in_mem.close()

        return csv_content
            

    def parse_to_pandas(self, csv_bytes:bytes)->pd.DataFrame:


        return pd.read_csv(csv_bytes, sep=';', encoding='utf-8')

    

    def __call__(self, url:str, parse:bool=True)->str:

        csv_bytes = self.download_and_unzip(url)
        if not parse:
            return csv_bytes
        
        return self.parse_to_pandas(csv_bytes)
