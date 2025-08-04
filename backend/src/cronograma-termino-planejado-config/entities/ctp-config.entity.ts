import { ModuloSistema } from 'src/generated/prisma/client';

export class CTPConfigDto {
    modulo_sistema: ModuloSistema;
    para: string;
    texto_inicial: string;
    texto_final: string;
    assunto_global: string;
    assunto_orgao: string;
}
