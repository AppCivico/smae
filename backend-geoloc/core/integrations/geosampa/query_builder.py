
class WithinQueryBuilder:
    '''Builds dwithin queries using cql filter on Web Feature Service'''


    def __init__(self, api_version:str)->None:

        self.api_version = api_version
    
    def set_request_action(self, query:dict)->None:

        query['request'] = 'GetFeature'

    def set_camada(self, camada:str, query:dict)->None:

        query['typeName'] = camada

    def set_to_json(self, query:dict)->None:

        query['outputFormat']='application/json'
        query['exceptions']='application/json'

    def solve_geom_type(self, geom_type:str)->str:

        tipos = {
            'poligono' : 'ge_poligono',
            'linha' : 'ge_linha',
            'multipoligono' : 'ge_multipoligono',
        }

        try:
            return tipos[geom_type]
        except KeyError:
            raise ValueError(f'Tipo de geometria {geom_type} não aceito.')

    def distance_within(self, x:float, y:float, precision:int,geom_type:str, query:dict)->None:


        geom_type = self.solve_geom_type(geom_type)
        query['cql_filter'] = f'DWITHIN({geom_type},POINT({x} {y}),{precision},meters)'


    def build_query_config(self, query:dict)->None:

        self.set_request_action(query)
        self.set_to_json(query)

    def build_within_query(self, camada:str, x:float, y:float, precision:float, 
                           geom_type:str, query:dict)->None:
        
        self.set_camada(camada, query)
        self.distance_within(x, y, precision, geom_type, query)


    def __call__(self, camada:str, x:float, y:float, precision:float, geom_type='poligono')->str:

        query = dict()
        self.build_query_config(query)
        self.build_within_query(camada, x, y, precision, geom_type, query)

        return query