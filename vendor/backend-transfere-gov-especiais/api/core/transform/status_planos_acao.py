from collections import Counter
from ..extract import list_planos_acao

class StatusPlanosAcao:
    """
    Class to transform the list of action plans into a status summary.
    """

    def load_planos(self, planos_acao=None):
        self.planos_acao = planos_acao or list_planos_acao(all=True)['listaPlanosAcao']

    def get_status_summary(self, planos_acao=None) -> dict:
        """
        Get a summary of the status of action plans.
        """
        planos_acao = self.load_planos(planos_acao)
        status_counts = Counter(plano['planoAcaoSituacao'] for plano in self.planos_acao)
        return dict(status_counts)
    
    def __call__(self, planos_acao=None) -> dict:
        """
        Allow the instance to be called like a function to get the status summary.
        """
        return self.get_status_summary(planos_acao)