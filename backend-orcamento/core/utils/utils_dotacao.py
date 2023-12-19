import json



class FonteSolver:
    '''Resolve problema nas fontes de dotacao utilizando os dados cacheados'''

    def __init__(self, fontes_cache_file:str = 'fontes_cache.json'):

        cache = self.get_cache(fontes_cache_file)
        self.mapper = self.build_mapper(cache)

    def get_cache(self, fontes_cache_file:str)->dict:

        with open(fontes_cache_file, 'r') as f:
            fontes_cache = json.load(f)

        return fontes_cache
    
    def build_mapper(self, cache:dict)->dict:

        return {item['descricao'] : item['codigo'] for item in cache['fonte_recursos']}

    def __call__(self, txt_fonte_recurso:str)->str:

        return self.mapper[txt_fonte_recurso]




class ParserDotacao:

    def validate_dotacao(self, dotacao_split:list)->None:

        if len(dotacao_split)!=9:
            raise ValueError(f'Dotacao fora do padrão: {".".join(dotacao_split)}')

        caracteres = ''.join(dotacao_split)

        if len(caracteres)!=27:
            raise ValueError(f'Dotacao fora do padrão: {".".join(dotacao_split)}')

    def parse_dotacao(self, dotacao:str)->dict:

        dotacao = dotacao.split('.')
        self.validate_dotacao(dotacao)

        parsed = {
            'codOrgao' : dotacao[0],
            'codUnidade' : dotacao[1],
            'codFuncao' : dotacao[2],
            'codSubFuncao' : dotacao[3],
            'codPrograma' : dotacao[4],
            'codProjetoAtividade' : dotacao[5]+dotacao[6],
            'codCategoria' : dotacao[7][0],
            'codGrupo' : dotacao[7][1],
            'codModalidade' : dotacao[7][2:4],
            'codElemento' : dotacao[7][4:6],
            #nao vou pesquisar por subelemento porque o pessoal não preenche
            #'codSubElemento' : dotacao[7][6:8],
            'codFonteRecurso' : dotacao[8]
        }

        return parsed

    def __call__(self, dotacao:str)->dict:

        return self.parse_dotacao(dotacao)

class ReconstructDotacao:


    def __init__(self)->None:

        self.solve_fonte = FonteSolver()


    def natureza_despesa(self, resp:dict)->str:
        
        estrutura = [
            resp['codCategoria'],
            resp['codGrupo'],
            resp['codModalidade'],
            resp['codElemento'],
            #subelemento vai como 00
            '00'
        ]
        
        return ''.join(str(i) for i in estrutura)

    def dotacao_txt(self, resp:dict)->str:
        

        fonte = resp['codFonteRecurso'] or self.solve_fonte(resp['txtDescricaoFonteRecurso'])

        estrutura = [
            resp['codOrgao'],
            resp['codUnidade'],
            resp['codFuncao'],
            resp['codSubFuncao'],
            resp['codPrograma'],
            str(resp['codProjetoAtividade'])[0],
            str(resp['codProjetoAtividade'])[1:],
            self.natureza_despesa(resp),
            fonte
        ]
        
        return '.'.join(str(i) for i in estrutura)

    def __call__(self, resp:dict)->str:

        return self.dotacao_txt(resp)

def validacao_dotacao(dotacao):
    print(dotacao)
    chr_per_posit = {
        0: 2,
        1: 2,
        2: 2,
        3: 3,
        4: 4,
        5: 1,
        6: 3,
        7: 8,
        8: 2
        }

    # Splitting the dotacao string and limiting the parts to the first 9 groups
    dotacao_parts = dotacao.split('.')[:9]

    for posit, item in enumerate(dotacao_parts):
        padrao = chr_per_posit[posit]

        if len(item) != padrao:
            raise ValueError(f'Dotacao {dotacao} fora do padrão na posição {posit}')

        try:
            int(item)
        except ValueError:
            raise ValueError(f'Codigo de dotação não numérica {dotacao} para posição {posit}')
