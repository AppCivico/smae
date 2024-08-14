from collections import OrderedDict
from core.utils.data import snake_case_ordered_dict
from typing import List

TIPOS_ACEITOS = {str, int, float, bool, dict}

def zeep_obj_to_dict(obj: object, snake_case=True)->OrderedDict:

    dict_dunder = obj.__dict__
    #os dados estao num dunder chamado values
    vals = dict_dunder.get('__values__', OrderedDict())

    if snake_case:
        vals = snake_case_ordered_dict(vals)

    for key, val in vals.items():
        if type(val) not in TIPOS_ACEITOS and val is not None:
            #checando se o objeto é um array do zeep
            if 'zeep.objects.Array' not in str(type(val)):
                vals[key] = zeep_obj_to_dict(val)
            else:
                vals[key] = [zeep_obj_to_dict(obj) for obj in val
                             if (type(obj) not in TIPOS_ACEITOS) and (val is not None)]

    return vals

def zeep_obj_array_to_dict_array(obj_array:object, snake_case=True)->List[OrderedDict]:

    parsed_data=[]
    for obj in obj_array:
        dict_obj = zeep_obj_to_dict(obj, snake_case=snake_case)
        parsed_data.append(dict_obj)
    
    return parsed_data

