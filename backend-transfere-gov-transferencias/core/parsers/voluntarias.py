import pandas as pd
import numpy as np
from typing import Union

from core.dao import DAO
from core.utils.datetime import dmy_series_to_datetime
from config import COLUNAS_DADOS

class PropostasVoluntarias:

    COLUNAS_DT_PRAZO = {'inicio' : 'DT_PROG_INI_RECEB_PROP', 
                    'fim' : 'DT_PROG_FIM_RECEB_PROP'}

    def __init__(self, dao_obj:DAO)->None:

        self.dao = dao_obj
        self.__set_tables()
        self.final_result=None

    def __set_tables(self):

        self.programas = self.dao.programas.copy(deep=True)
        self.programa_proponente = self.dao.programa_proponente.copy(deep=True)
        self.__colunas_dt()
        self.__solve_ids()
        self.__fill_na_to_none()

    def __fill_na_to_none(self):

        self.programas = self.programas.replace({np.nan: None})

    def __solve_ids(self):

        self.programas['ID_PROGRAMA'] = self.programas['ID_PROGRAMA'].astype(int)
        self.programa_proponente['ID_PROGRAMA'] = self.programas['ID_PROGRAMA'].astype(int)
        self.programa_proponente['ID_PROPONENTE'] = self.programa_proponente['ID_PROPONENTE'].astype(int)

    def __colunas_dt(self):

        for col in self.COLUNAS_DT_PRAZO.values():
            self.programas[col] = dmy_series_to_datetime(self.programas[col])
            
    def __recebimento_iniciado(self):

        self.programas['recebimento_iniciado'] = self.programas[
                                                    self.COLUNAS_DT_PRAZO['inicio']
                                                    ]<=pd.Timestamp.today()

    def __aux_fim_recebimento_vazio(self, row)->bool:

        if row['recebimento_nao_finalizado'] == True:
            return True

        if pd.isnull(row[self.COLUNAS_DT_PRAZO['fim']]):
            return True
        
        return False
    
    def __rebecimento_nao_finalizado(self):

        self.programas['recebimento_nao_finalizado'] = self.programas[
                                                        self.COLUNAS_DT_PRAZO['fim']
                                                        ]>=pd.Timestamp.today()
        self.programas['recebimento_nao_finalizado'] = self.programas.apply(self.__aux_fim_recebimento_vazio, axis=1)

    def __programa_disponivel(self):

        self.programas['programa_disponivel'] = self.programas['SIT_PROGRAMA']!='INATIVO'

    def __nao_e_emenda(self):

        self.programas['not_emenda'] = self.programas['DT_PROG_INI_EMENDA_PAR'].isnull()

    def __nao_e_proponente_especifico(self):

        self.programas['not_prop_especifico'] = self.programas['DT_PROG_INI_BENEF_ESP'].isnull()

    def __sem_proponente(self):

        col_id = 'ID_PROGRAMA'
        ids_programas_com_prop = self.programa_proponente[col_id].unique()
        self.programas['sem_proponente'] = ~self.programas[col_id].isin(ids_programas_com_prop)

    def __para_estado_sp(self):

        self.programas['para_sp'] = self.programas['UF_PROGRAMA']=='SP'

    def __para_municipio(self):

        para_muns = self.programas['NATUREZA_JURIDICA_PROGRAMA']=='Administração Pública Municipal'
        self.programas['para_municipio'] = para_muns

    def __create_cols_filtros(self):

        self.__recebimento_iniciado()
        self.__rebecimento_nao_finalizado()
        self.__programa_disponivel()
        self.__nao_e_emenda()
        self.__nao_e_proponente_especifico()
        self.__sem_proponente()
        self.__para_estado_sp()
        self.__para_municipio()

    def __filtro_final(self):

        colunas_filtros = [
            'recebimento_iniciado',
            'recebimento_nao_finalizado',
            'programa_disponivel',
            'not_emenda',
            'not_prop_especifico',
            'sem_proponente',
            'para_sp',
            'para_municipio'
        ]

        self.programas['is_interesse'] = self.programas[colunas_filtros].all(axis=1)

    def __filtrar(self):

        self.__create_cols_filtros()
        self.__filtro_final()
        self.programas = self.programas[self.programas['is_interesse']].reset_index(drop=True)

    def __selecionar_colunas(self):

        colunas_lower =  [col.lower() for col in COLUNAS_DADOS]
        self.programas = self.programas[colunas_lower].copy()

    def __rename_colunas(self):

        remapped = {val : col for col, val in self.COLUNAS_DT_PRAZO.items()}
        for col in self.programas.columns:
            if col in remapped:
                if remapped[col]=='fim':
                    self.programas.rename({col : 'DT_FIM_RECEB'}, axis=1, inplace=True)
                if remapped[col]=='inicio':
                    self.programas.rename({col : 'DT_INI_RECEB'}, axis=1, inplace=True)

        self.programas.rename({col : col.lower() for col in COLUNAS_DADOS}, inplace=True, axis=1)

    def __pipeline(self, json:bool):

        if not self.dao.check_download_alive('programas'):
            #reset tables if download is stale
            self.__set_tables()

        self.__filtrar()
        self.__rename_colunas()
        self.__selecionar_colunas()
        if not json:
            return self.programas
        return self.programas.to_dict(orient='records')

    def __cached(self, json:bool=True)->Union[dict, pd.DataFrame]:

        if self.final_result is None:
            self.final_result = self.__pipeline(json)
        if not self.dao.check_download_alive:
            self.final_result = self.__pipeline(json)

        return self.final_result
    
    def __call__(self, json:bool=True):

        return self.__cached(json)

        

        