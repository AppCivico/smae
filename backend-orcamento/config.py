import os
from dotenv import load_dotenv 

class MissingEnvironmentVariable(Exception):
    pass

def get_my_env_var(var_name):

    #carrega valores do .env para quando rodar fora do docker
    load_dotenv()

    envvar = os.environ.get(var_name)
    if envvar is None:
        raise MissingEnvironmentVariable(f"ENV '{var_name}' must be set")
    return envvar

SOF_API_TOKEN = get_my_env_var('SOF_API_TOKEN')