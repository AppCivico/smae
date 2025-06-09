from bs4 import BeautifulSoup
import bs4.element as elements
from typing import List, Optional
import re

from .decorators import nonetype_error_to_none, raise_for_missing_data


PATT_COMUNICADO=r"COMUNICADO\s*(?:[Nn][º°]\s*)?\d+/\d+"

class Parser:

    def __init__(self)->None:

        self.sopa = None

    def set_html(self, html:str)->None:

        self.sopa = self.__build_soup(html)

    def __build_soup(self, html:str)->BeautifulSoup:

        return BeautifulSoup(html, features="html.parser")

    @raise_for_missing_data('ultima_atualizacao')
    @nonetype_error_to_none
    def ultima_autualizacao_pagina(self)->str:

        parent = self.sopa.find('span', {'class' : 'documentModified'})
        child = parent.find('span', {'class' : 'value'})

        return child.text

    @raise_for_missing_data('artigos')
    @nonetype_error_to_none
    def __lst_artigos(self)->List[elements.Tag]:

        div_artigos = self.sopa.find('div', {'class' : 'entries'})
        lst_artigos = div_artigos.find_all('article')

        return lst_artigos

    @raise_for_missing_data('resumo')
    @nonetype_error_to_none
    def __resumo_artigo(self, artigo:elements.Tag)->elements.Tag:

        return artigo.find('span', {'class' : 'summary'}).find('a')

    @raise_for_missing_data('resumo')
    @nonetype_error_to_none
    def __titulo_artigo_raw(self, resumo_artigo:elements.Tag)->str:

        return resumo_artigo.contents[0]

    def __clean_non_breaking_space(self, text:str)->str:

        return text.replace(u'\xa0', u' ')

    def titulo_comunicado(self, titulo_raw:str)->str:

        titulo = re.sub(PATT_COMUNICADO, '', titulo_raw,
                        flags=re.IGNORECASE, count=1)

        titulo_limpo =  titulo.strip()
        titulo_limpo = re.sub('^(- |– )', '', titulo_limpo)

        return self.__clean_non_breaking_space(titulo_limpo)

    def __numero_comunicado_raw(self, titulo_raw:str)->str:

        num_string = re.search(PATT_COMUNICADO, titulo_raw,
                               flags=re.IGNORECASE).group()

        patt_num = r"(\d+/\d+)"
        apenas_num = re.search(patt_num, num_string).group()

        return apenas_num



    def numero_comunicado(self, numero_comunicado_raw:str)->int:

        apenas_numero  = numero_comunicado_raw.split('/')[0].strip()
        return int(apenas_numero)

    def ano_comunicado(self, numero_comunicado_raw:str)->int:

        apenas_ano  = numero_comunicado_raw.split('/')[1].strip()
        return int(apenas_ano)

    def link_comunicado(self, resumo:elements.Tag)->str:

        return resumo.get('href')

    def data_comunicado(self, artigo: elements.Tag) -> str:
        text = artigo.find('span', {'class': 'documentByLine'}).text
        cleaned_text = re.sub(r'\s+', ' ', text).strip()

        date_pattern = r'\b(\d{2}/\d{2}/\d{4})\b'
        time_pattern = r'(\d{1,2})h(\d{2})'

        date_match = re.search(date_pattern, cleaned_text)
        time_match = re.search(time_pattern, cleaned_text)

        if date_match and time_match:
            date = date_match.group(1)
            hours, minutes = time_match.groups()
            time = f"{int(hours):02d}:{minutes}:00"
            return f"{date} {time}"
        elif date_match:
            return date_match.group(1)
        else:
            return None

    def descricao_comunicado(self, artigo:elements.Tag)->str:

        desc = artigo.find('p', {'class' : 'description discreet'})
        if desc is None:
            return ''
        desc = desc.text
        return self.__clean_non_breaking_space(desc)

    def parse_comunicado(self, artigo:elements.Tag)->dict:

        resumo = self.__resumo_artigo(artigo)

        titulo_raw = self.__titulo_artigo_raw(resumo)
        titulo  =  self.titulo_comunicado(titulo_raw)

        numero_raw = self.__numero_comunicado_raw(titulo_raw)
        numero = self.numero_comunicado(numero_raw)
        ano = self.ano_comunicado(numero_raw)

        link = self.link_comunicado(resumo)

        data = self.data_comunicado(artigo)

        descricao = self.descricao_comunicado(artigo)

        parsed = {
            'titulo' : titulo,
            'numero' : numero,
            'ano' : ano,
            'link' : link,
            'data' : data,
            'descricao' : descricao

        }

        return parsed


    def parse_comunicados(self)->List[dict]:

        artigos = self.__lst_artigos()

        parsed_data = []
        for artigo in artigos:
            try:
                comunicado_parsed = self.parse_comunicado(artigo)
                parsed_data.append(comunicado_parsed)
            except Exception as e:
                print(artigo)
                raise(e)

        return parsed_data

    def parse_page(self)->dict:

        if self.sopa is None:
            raise ValueError('No html to parse.')

        pagina = {
            'ultima_atualizacao' : self.ultima_autualizacao_pagina(),
            'comunicados' : self.parse_comunicados()
        }

        return pagina

    def __call__(self, html:str)->dict:

        self.set_html(html)

        return self.parse_page()





