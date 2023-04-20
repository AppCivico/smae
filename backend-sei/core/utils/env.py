from dotenv import load_dotenv
import os
from typing import Union

def get_env_variable(var_name:str)->Union[str, int, float, bool]:

    load_dotenv()

    return os.getenv(var_name)

