import os
from dotenv import load_dotenv
import shutil

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


ENV_PATH = os.path.join(BASE_DIR, '.env')
ENV_EXAMPLE_PATH = os.path.join(BASE_DIR, '.env.example')

def solve_dotenv_file():

    if not os.path.exists(ENV_PATH):
        print('.env file not found, creating a new one from the example.')
        if os.path.exists(ENV_EXAMPLE_PATH):
            shutil.copy(ENV_EXAMPLE_PATH, ENV_PATH)

def get_env_variable(variable_name:str):
    """
    Get an environment variable, returning a default value if not found.
    """
    solve_dotenv_file()
    load_dotenv(ENV_PATH)
    try:
        return os.environ[variable_name]
    except KeyError:
        raise RuntimeError(f"Environment variable '{variable_name}' not found. Please set it in the .env file.")


ID_BENEFICIARIO = get_env_variable('ID_BENEFICIARIO')

BASE_URL = 'https://especiais.transferegov.sistema.gov.br/maisbrasil-transferencia-especial-backend/api/public/'
CACHE_TTL_SECONDS = int(get_env_variable('CACHE_TTL_SECONDS'))