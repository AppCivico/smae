import os
class MissingEnvironmentVariable(Exception):
    pass

def get_my_env_var(var_name):
    try:
        envvar = os.environ.get(var_name)
    except KeyError:
        raise MissingEnvironmentVariable(f"ENV '{var_name}' must be set")
    return envvar

SOF_API_TOKEN = get_my_env_var('SOF_API_TOKEN')
if not SOF_API_TOKEN:
    raise MissingEnvironmentVariable(f"ENV '{var_name}' must not be empty")
