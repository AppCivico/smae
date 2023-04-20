

def letra_minuscula_comeco(txt:str)->str:
    if txt[0].isupper():
        txt = txt[0].lower()+txt[1:]
    return txt

def letra_maiuscula_comeco(txt:str)->str:
    if txt[0].islower():
        txt = txt[0].upper()+txt[1:]
    return txt

def snake_to_camel_case(txt:str, inicio_minuscula=True)->str:

    if inicio_minuscula:
        txt = letra_minuscula_comeco(txt)
    else:
        txt = letra_maiuscula_comeco(txt)
    if "_" in txt:
        splited = txt.split('_')
        new_text=[]
        for i, item in enumerate(splited):
            if i > 0:
                item = letra_maiuscula_comeco(item)
            new_text.append(item)
        txt = ''.join(new_text)
    return txt

def camel_to_snake_case(text:str)->str:
    
    new_text = []
    for i, char in enumerate(text):
        
        if char.isupper():
            char = char.lower()
            if i > 1:
                 new_text.append('_')
                    
        new_text.append(char)
        
    return ''.join(new_text)
    


    