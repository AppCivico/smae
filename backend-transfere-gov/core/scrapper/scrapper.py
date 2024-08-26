from .build_url import UrlBuilder, TIPOS_EMENDAS
from .soup_parser import Parser
from .get_page import PageRequest

from core.utils.datetime import get_curr_year

from typing import Optional

class Scrapper:

    def __init__(self, https:bool=True)->None:

        self.build_url = UrlBuilder(https)
        self.get_page = PageRequest()
        self.parse = Parser()

    def scrape(self, *args, gerais:bool, ano:int, tipo_emenda:Optional[TIPOS_EMENDAS]=None)->dict:

        url = self.build_url(gerais=gerais, ano=ano, tipo_emenda=tipo_emenda)
        html = self.get_page(url)
        data = self.parse(html)

        return data
    
    def __call__(self, *args, gerais:bool, ano:int=None, tipo_emenda:Optional[TIPOS_EMENDAS]=None)->dict:

        ano = ano or get_curr_year()

        return self.scrape(gerais=gerais, ano=ano, tipo_emenda=tipo_emenda)