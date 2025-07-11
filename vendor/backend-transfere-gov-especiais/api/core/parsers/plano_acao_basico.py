
from typing import Union
from core.schemas.plano_acao import PlanoAcaoBase
import re

class ParsePlanoAcaoBasico:
    """
    Classe para parsear planos de ação básicos.
    """

    def parse_finalidade_plano(self, finalidade: str) -> list[dict[str, str]]:
        """
        Parse a single finalidade string into a list of finalidades.
        """
        finalidades = [f.strip() for f in re.split(r'[/,]', finalidade) if f.strip()]
        parsed_list = []
        for finalidade in finalidades:
            try:
                codigo, finalidade = finalidade.split('-')
            except ValueError as e:
                if 'not enough values to unpack' in str(e):
                    codigo = ''
                    finalidade = finalidade.strip()
                else:
                    print(f'Error parsing finalidade: {finalidade}', e)
                    continue

            parsed = {
                'codigo' : codigo.strip(),
                'descricao' : finalidade.strip()
                }
            
            parsed_list.append(parsed)

        return parsed_list
    
    def parse_valor_float(self, valor: str)->Union[float, None]:
        """
        Parse a string value to a float, removing any non-numeric characters.
        """
        try:
            return float(valor)
        except ValueError:
            print(f"Error parsing value: {valor}")
            return None

    
    def parse_valor_plano_acao(self, plano: dict) -> list[dict[str, float]]:
        """
        Parse the values of an action plan.
        """

        parsed = [
            {
                'tipo' : 'custeio',
                'valor': self.parse_valor_float(plano['valorCusteio'])
            },
             {
                'tipo' : 'investimento',
                'valor': self.parse_valor_float(plano['valorInvestimento'])
            }
        ]
    
        return parsed

    def parse_plano_base(self, plano:dict)->dict:

        parsed = {
            'id': plano['planoAcaoId'],
            'codigo_do_programa': plano['programaCodigo'],
            'situacao' : plano['planoAcaoSituacao'],
            'finalidades' : self.parse_finalidade_plano(plano['politicasPublicas']),
            'uf' : plano['uf'],
            'valores' : {
                'custeio' : plano['valorCusteio'],
                'investimento' : plano['valorInvestimento'],
            }

        }

        return parsed
    
    def parse_all_planos(self, planos:list[dict]) -> list[dict]:
        """
        Parse a list of action plans.
        """
        return [self.parse_plano_base(plano) for plano in planos]
    
    def __call__(self, planos:list[dict], to_pydantic:bool=True) -> Union[list[dict], 
                                                                          list[PlanoAcaoBase]]:
        """
        Allow the instance to be called like a function to parse action plans.
        """
        planos = self.parse_all_planos(planos)
        if not to_pydantic:
            return planos
        return [PlanoAcaoBase(**plano) for plano in planos]