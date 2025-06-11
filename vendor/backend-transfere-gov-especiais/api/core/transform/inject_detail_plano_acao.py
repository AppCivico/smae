from core.extract import detail_plano_acao
from typing import Optional
import copy

class InjectDetailsPlanoAcao:
    """
    Class to handle the transformation of an action plan into a detailed format.
    """

    def inject_details(self, plano_acao:dict) -> dict:
        """
        Injects the detials on a 'detalhes' attribute.
        """

        plano_acao = copy.deepcopy(plano_acao)

        plano_id = plano_acao['planoAcaoId']
        details = detail_plano_acao(plano_id)
        plano_acao['detalhes'] = details

        return plano_acao

    def __call__(self, plano_acao:dict) -> dict:
        """
        Allow the instance to be called like a function to get the details attribute.
        """
        return self.inject_details(plano_acao)