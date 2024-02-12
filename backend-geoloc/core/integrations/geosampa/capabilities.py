

class CapabilitiesRequest:


    def json_response(self, query:dict)->None:

        query['outputFormat']='application/json'
        query['exceptions']='application/json'

    def get_capabilities(self, query:dict)->None:

        query['request']='GetCapabilities'

    def __call__(self):

        query = {}
        #JSON response not working - it always returns a xml
        #self.json_response(query)
        self.get_capabilities(query)

        return query


class DescribeFeature:

    def json_response(self, query:dict)->None:

        query['outputFormat']='application/json'
        query['exceptions']='application/json'

    def describe_feature(self, query:dict)->None:

        query['request'] = 'DescribeFeatureType'

    def feature_name(self, query:dict, feature_name:str)->None:

        query['typeName'] = feature_name

    def __call__(self, feature_name:str)->dict:

        query = {}
        self.json_response(query)
        self.describe_feature(query)
        self.feature_name(query, feature_name)

        return query