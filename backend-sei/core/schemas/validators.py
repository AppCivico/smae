


def s_n_to_bool(val:str)->bool:

    val = str(val).lower().strip()
    if val == 's':
        return True
    elif val == 'n':
        return False
    #casos em que ja esta booleano
    elif val == 'false':
        return False
    elif val == 'true':
        return True
    else:
        raise ValueError(f'Unexpected S/N val: {val}. Type: {type(val)}')