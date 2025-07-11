from typing import Union

from .plano_acao_basico import ParsePlanoAcaoBasico
from core.utils.datetime import is_valid_date
from core.schemas.plano_acao import PlanoAcaoDetailed as PlanoAcaoDetailedSchema

class PlanoAcaoDetailed:

    def __init__(self)->None:

        self.parsear_dados_basicos = ParsePlanoAcaoBasico().parse_plano_base
    
    def extract_modalidade(self, detalhes:dict)->str:

        return detalhes['emendaParlamentar']['programa']['modalidade']
    
    def extract_orgao(self, detalhes:dict)->Union[str, None]:
        """
        Extract the 'orgaoSuperiorF' from the action plan details.
        """
        return detalhes['emendaParlamentar']['programa']['orgaoSuperiorF']
    
    def extract_data_inicio(self, detalhes:dict)->Union[str, None]:
        """
        Extract the 'dataInicio' from the action plan details.
        """
        data_inicio = detalhes['emendaParlamentar']['programa']['dtInicioCiencia']
        
        if data_inicio and is_valid_date(data_inicio):
            return data_inicio
        
        return None
    
    def extract_data_fim(self, detalhes:dict)->Union[str, None]:
        """
        Extract the 'dataFim' from the action plan details.
        """
        data_fim = detalhes['emendaParlamentar']['programa']['dtFimCiencia']
        
        if data_fim and is_valid_date(data_fim):
            return data_fim
        
        return None

    def parse_detalhes(self, detalhes:dict)->dict:
        """
        Parse the details of an action plan.
        """
        
        parsed_details = {
            'modalidade' : self.extract_modalidade(detalhes),
            'orgao' : self.extract_orgao(detalhes),
            'dt_inicio_propostas' : self.extract_data_inicio(detalhes),
            'dt_fim_propostas' : self.extract_data_fim(detalhes),
        }

        return parsed_details
    
    def parse_all_data(self, plano_com_detalhes:dict)->dict:
        """
        Parse all data from the action plan details.
        """
        plano_basico = self.parsear_dados_basicos(plano_com_detalhes)

        parsed_details = self.parse_detalhes(plano_com_detalhes['detalhes'])

        plano_parsed_completo = {**plano_basico, **parsed_details}

        return plano_parsed_completo
    
    def __call__(self, plano_com_detalhes:dict, to_pydantic:bool=True) -> Union[dict, PlanoAcaoDetailedSchema]:
        """
        Allow the instance to be called like a function to get action plan details.
        """
        if not isinstance(plano_com_detalhes, dict) and 'detalhes' not in plano_com_detalhes:
            raise ValueError("Invalid action plan details provided.")
        parsed_data = self.parse_all_data(plano_com_detalhes)
        if not to_pydantic:
            return parsed_data
        return PlanoAcaoDetailedSchema(**parsed_data)
