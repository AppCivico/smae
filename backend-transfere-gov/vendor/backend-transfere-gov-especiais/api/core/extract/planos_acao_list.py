import requests
from typing import Optional
from config import ID_BENEFICIARIO, BASE_URL

class ListPlanosAcao:

    base_url = BASE_URL
    endpoint = 'plano-acao/listagem'
    default_id_beneficiario = ID_BENEFICIARIO

    def __init__(self) -> None:

        if not self.base_url.endswith('/'):
            self.base_url += '/'

        if self.endpoint.startswith('/'):
            self.endpoint = self.endpoint[1:]

    def build_url_beneficiario(self, id_beneficiario:str) -> str:
        """
        Build the complete URL for the API request.
        """
        return f"{self.base_url}{self.endpoint}/?beneficiario={id_beneficiario}"

    def build_url_all(self) -> str:
        """
        Build the complete URL for the API request without a specific beneficiary.
        """
        return f"{self.base_url}{self.endpoint}/"
    
    def get_planos_acao_beneficiario(self, id_beneficiario) -> dict:
        """
        Fetch the list of action plans from the API.
        """
        url = self.build_url_beneficiario(id_beneficiario)
        response = requests.get(url)

        if response.status_code == 200:
            return response.json()
        else:
            response.raise_for_status()
            return {}
        
    def get_planos_acao_all(self) -> dict:
        """
        Fetch the list of action plans from the API without a specific beneficiary.
        """
        url = self.build_url_all()
        response = requests.get(url)

        if response.status_code == 200:
            return response.json()
        else:
            response.raise_for_status()
            return {}
    
    def __call__(self, id_beneficiario:Optional[str]=None, all:bool=False) -> dict:
        """
        Allow the instance to be called like a function to get action plans.
        """

        if all and id_beneficiario is not None:
            raise ValueError("Cannot specify 'all' and 'id_beneficiario' at the same time.")

        if all:
            return self.get_planos_acao_all()

        if id_beneficiario is None:
            id_beneficiario = self.default_id_beneficiario

        return self.get_planos_acao_beneficiario(id_beneficiario)