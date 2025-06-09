from core.scrapper import Scrapper

scrap = Scrapper()

def gerais():

    return scrap(gerais=True)

def especiais():

    return scrap(gerais=False, tipo_emenda='especiais')

def bancada():

    return scrap(gerais=False, tipo_emenda='bancada')

def individuais():

    return scrap(gerais=False, tipo_emenda='individuais')