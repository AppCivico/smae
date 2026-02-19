import { ApiProperty } from '@nestjs/swagger';
import { DemandaStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { MAX_LENGTH_MEDIO } from 'src/common/consts';
import { DemandaAcao, UpdateDemandaDto } from './create-demanda.dto';
import { DemandaPermissoesDto } from '../entities/demanda.entity';

export class CreateDemandaAcaoDto {
    @ApiProperty({ enum: DemandaAcao, enumName: 'DemandaAcao' })
    @IsEnum(DemandaAcao, {
        message: 'Precisa ser um dos seguintes valores: ' + Object.values(DemandaAcao).join(', '),
    })
    acao: DemandaAcao;

    @IsInt()
    @Type(() => Number)
    demanda_id: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_MEDIO)
    motivo?: string;

    @ApiProperty({ required: false, type: UpdateDemandaDto })
    @IsOptional()
    @ValidateNested()
    @Type(() => UpdateDemandaDto)
    edicao?: UpdateDemandaDto;

    mapaPermissao(): string {
        const permissionMap: Record<DemandaAcao, string> = {
            editar: 'pode_editar',
            enviar: 'pode_enviar',
            validar: 'pode_validar',
            devolver: 'pode_devolver',
            cancelar: 'pode_cancelar',
        };
        return permissionMap[this.acao];
    }

    fsmState(currentStatus: DemandaStatus): { from: DemandaStatus; to: DemandaStatus } | null {
        const transitions: Record<DemandaAcao, Partial<Record<DemandaStatus, DemandaStatus>>> = {
            editar: {
                [DemandaStatus.Registro]: DemandaStatus.Registro,
                [DemandaStatus.Validacao]: DemandaStatus.Validacao,
                [DemandaStatus.Publicado]: DemandaStatus.Publicado,
            },
            enviar: { [DemandaStatus.Registro]: DemandaStatus.Validacao },
            validar: { [DemandaStatus.Validacao]: DemandaStatus.Publicado },
            devolver: {
                [DemandaStatus.Validacao]: DemandaStatus.Registro,
                [DemandaStatus.Publicado]: DemandaStatus.Registro,
            },
            cancelar: {
                [DemandaStatus.Registro]: DemandaStatus.Encerrado,
                [DemandaStatus.Validacao]: DemandaStatus.Encerrado,
                [DemandaStatus.Publicado]: DemandaStatus.Encerrado,
            },
        };

        const toStatus = transitions[this.acao]?.[currentStatus];
        if (!toStatus) return null;

        return { from: currentStatus, to: toStatus };
    }

    validaDependencias(): void {
        if (this.acao === 'devolver' || this.acao === 'cancelar') {
            if (!this.motivo || this.motivo.trim() === '') {
                throw new Error('Motivo é obrigatório para esta ação');
            }
        }
    }

    podeExecutar(permissoes: { [key: string]: boolean } | DemandaPermissoesDto): boolean {
        return (permissoes as any)[this.mapaPermissao()] === true;
    }
}
