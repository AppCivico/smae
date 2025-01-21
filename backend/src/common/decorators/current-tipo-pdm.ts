import { BadRequestException, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TipoPdm } from '@prisma/client';
import { Request } from 'express';
import { ExtractValidSistemas } from '../../auth/strategies/jwt.strategy';

export type TipoPdmType = 'PS' | 'PDM' | 'PDM_AS_PS';

export const TipoPDM = createParamDecorator((data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    return extractPdmMode(request);
});

export const extractPdmMode = (request: Request): TipoPdmType => {
    const sistemas = ExtractValidSistemas(request);

    if (!sistemas) return 'PS';

    const parts = sistemas.filter((s) => s !== 'SMAE');
    if (parts.length > 1) {
        throw new BadRequestException('Apenas um smae-sistema pode enviado por vez para a API neste endpoint.');
    }

    const h = parts[0];
    if (h === 'ProgramaDeMetas') return 'PDM_AS_PS';
    if (h === 'PDM') return 'PS';

    throw new BadRequestException(`smae-sistema '${h}' não é um sistema válido para este endpoint.`);
};

export const PdmModoParaTipo = (tipo: TipoPdmType): TipoPdm => {
    if (tipo == 'PDM_AS_PS') return 'PDM';
    return tipo == 'PDM' ? 'PDM' : 'PS';
};

export const PdmModoParaTipoOrNull = (tipo: TipoPdmType | null): TipoPdm | null => {
    if (tipo == null) return null;
    return PdmModoParaTipo(tipo);
};
