import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TipoPdm } from '@prisma/client';
import { Request } from 'express';

export type TipoPdmType = 'PS' | 'PDM' | 'PDM_AS_PS';

export const TipoPDM = createParamDecorator((data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return extractPdmMode(request);
});

export const extractPdmMode = (request: Request): TipoPdmType => {
    const h = request.headers['smae-tipo'];
    if (h === 'PDM') return 'PDM_AS_PS';
    if (h === 'PS') return 'PS';
    if (h) throw new BadRequestException(`Tipo de PDM desconhecido: ${h}`);

    // Fallback para Plano Setorial
    return 'PS';
};

export const PdmModoParaTipo = (tipo: TipoPdmType): TipoPdm => {
    if (tipo == 'PDM_AS_PS') return 'PDM';
    return tipo == 'PDM' ? 'PDM' : 'PS';
};

export const PdmModoParaTipoOrNull = (tipo: TipoPdmType | null): TipoPdm | null => {
    if (tipo == null) return null;
    return PdmModoParaTipo(tipo);
};
