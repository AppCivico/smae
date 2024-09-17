from core.dao import DAO
import datetime
from typing import Dict
from core.utils.datetime import dmy_hms_str_to_datetime

class UltimaAtualiz:

    def __init__(self, dao_obj:DAO)->None:

        self.dao = dao_obj

    def __clean_string(self, string_return:str)->str:

        remove='\ufeff'
        clean = string_return.replace(remove, '').strip()

        return clean
    
    def __parse_to_datetime(self, clean_string:str)->datetime.datetime:

        return dmy_hms_str_to_datetime(clean_string)
    
    def __to_dict(self, datetime_obj:datetime.datetime)->dict:

        return {'ultima_atualizacao' : datetime_obj}
    
    def __pipeline(self)->Dict[str, datetime.datetime]:

        raw_string = self.dao.ultima_atualizacao
        cleaned = self.__clean_string(raw_string)
        datetime_obj = self.__parse_to_datetime(cleaned)
        parsed = self.__to_dict(datetime_obj)

        return parsed

    def __call__(self)->Dict[str, datetime.datetime]:

        return self.__pipeline()