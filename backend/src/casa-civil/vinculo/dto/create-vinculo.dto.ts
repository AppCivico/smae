import { ApiProperty } from '@nestjs/swagger';
import { CampoVinculo } from '@prisma/client';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateVinculoDto {
    @IsNumber()
    tipo_vinculo_id: number;

    @IsNumber()
    distribuicao_id: number;

    @IsEnum(CampoVinculo)
    @ApiProperty({
        description: 'Tipo do campo que será utilizado para o vínculo, pode ser endereço ou dotação.',
        enum: CampoVinculo,
        enumName: 'CampoVinculo',
    })
    campo_vinculo: CampoVinculo;

    @IsString()
    valor_vinculo: string;

    @IsOptional()
    @IsString()
    observacao?: string;

    @IsOptional()
    @IsNumber()
    meta_id?: number;

    @IsOptional()
    @IsNumber()
    iniciativa_id?: number;

    @IsOptional()
    @IsNumber()
    atividade_id?: number;

    @IsOptional()
    @IsNumber()
    projeto_id?: number;
}
