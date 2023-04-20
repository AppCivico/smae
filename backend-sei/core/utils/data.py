from collections import OrderedDict
from .string import camel_to_snake_case

def snake_case_dict(data:dict)->dict:

    return {camel_to_snake_case(key) : val for
            key, val in data.items()}

def snake_case_ordered_dict(data:OrderedDict)->OrderedDict:

    new_dict = OrderedDict()

    for key, val in data.items():
        snake_case_key = camel_to_snake_case(key)
        new_dict[snake_case_key] = val

    return new_dict