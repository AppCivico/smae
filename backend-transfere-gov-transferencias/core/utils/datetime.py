import time
import pandas as pd
import datetime

def agora_unix_timestamp():

    return int(time.time())

def dmy_series_to_datetime(series:pd.Series)->pd.Series:
    
    #erros serao colocados como NaN
    return pd.to_datetime(series, format=r'%d/%m/%Y', errors='coerce')

def dmy_hms_str_to_datetime(date_string:str)->datetime.datetime:

    date_format = "%d/%m/%Y %H:%M:%S"
    parsed_date = datetime.datetime.strptime(date_string, date_format)

    return parsed_date