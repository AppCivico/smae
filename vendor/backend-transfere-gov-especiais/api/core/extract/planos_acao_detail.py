from typing import Any, Union
import requests
from config import BASE_URL


class PlanoAcaoDetail:
    """
    Class to handle the extraction of action plan details from an API.
    """

    base_url: str = BASE_URL
    endpoint: str = 'plano-acao'
    
    def __init__(self) -> None:

        if not self.base_url.endswith('/'):
            self.base_url += '/'

        if self.endpoint.startswith('/'):
            self.endpoint = self.endpoint[1:]
        if self.endpoint.endswith('/'):
            self.endpoint = self.endpoint[:-1]

    def build_url(self, id_plano_acao: str) -> str:
        """
        Build the complete URL for the API request.
        """
        return f"{self.base_url}{self.endpoint}/{id_plano_acao}"
    
    def get_plano_acao_detail(self, id_plano_acao: str) -> dict:
        """
        Fetch the details of a specific action plan from the API.
        """
        url = self.build_url(id_plano_acao)
        response = requests.get(url)

        if response.status_code == 200:
            return response.json()
        else:
            response.raise_for_status()
            return {}
        
    def __check_id_plano_acao(self, id_plano_acao: Union[str, int]) -> bool:
        """
        Check if the provided action plan ID is valid.
        """

        if isinstance(id_plano_acao, int):
            return True

        return isinstance(id_plano_acao, str) and id_plano_acao.isdigit() and len(id_plano_acao) > 0
        
    def __call__(self, id_plano_acao:str) -> Any:
        """
        Allow the instance to be called like a function to get action plan details.
        """
        if not self.__check_id_plano_acao(id_plano_acao):
            raise ValueError("Invalid action plan ID provided.")
        
        return self.get_plano_acao_detail(id_plano_acao)