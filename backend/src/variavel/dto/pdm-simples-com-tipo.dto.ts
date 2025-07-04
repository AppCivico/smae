import { TipoPdm } from '@prisma/client';

export class PdmSimplesComTipoDto {
    id: number;
    nome: string;
    tipo: TipoPdm;
}
