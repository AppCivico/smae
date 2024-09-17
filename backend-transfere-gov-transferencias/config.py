from dotenv import load_dotenv
from typing import Union
import os

def load_env_var(varname:str)->Union[str, int, float, bool]:


    if not os.path.exists('.env'):
        print('Creating environment from .env.example')
        with open('.env', 'w') as envfile:
            with open('.env.example', 'r') as envexample:
                content = envexample.read()
                envfile.write(content)

    load_dotenv()

    variable = os.getenv(varname)
    if variable is None:
        raise RuntimeError(f'Variavel de ambiente {varname} não definida.')
    
    return variable

DOWNLOAD_TTL_SECS = load_env_var('DOWNLOAD_TTL_SECS')
MAX_RETRIES = load_env_var('MAX_RETRIES')


COLUNAS_DADOS = [
    'COD_ORGAO_SUP_PROGRAMA',
    'DESC_ORGAO_SUP_PROGRAMA',
    'COD_PROGRAMA',
    'ID_PROGRAMA',
    'NOME_PROGRAMA',
    'SIT_PROGRAMA',
    'DATA_DISPONIBILIZACAO',
    'ANO_DISPONIBILIZACAO',
    'DT_INI_RECEB',
    'DT_FIM_RECEB',
    'MODALIDADE_PROGRAMA',
    'ACAO_ORCAMENTARIA',
    'NATUREZA_JURIDICA_PROGRAMA',
    'UF_PROGRAMA'
]

try:
    COD_PROPONENTE_CIDADE = int(load_env_var('COD_PROPONENTE_CIDADE'))
except ValueError:
    raise RuntimeError('Variável de ambiente COD_PROPONENTE_CIDADE deve ser integer.')