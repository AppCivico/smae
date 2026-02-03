import { ApiProperty } from '@nestjs/swagger';
import { DemandaSituacao, DemandaStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { MAX_LENGTH_MEDIO } from 'src/common/consts';
import { DemandaPermissoesDto } from '../../entities/demanda.entity';

export const DemandaAcao = {
    enviar: 'enviar',
    validar: 'validar',
    devolver: 'devolver',
    cancelar: 'cancelar',
} as const;

export type DemandaAcao = (typeof DemandaAcao)[keyof typeof DemandaAcao];

export class CreateDemandaAcaoDto {
    @ApiProperty({ enum: DemandaAcao, enumName: 'DemandaAcao' })
    @IsEnum(DemandaAcao, {
        message: 'Precisa ser um dos seguintes valores: ' + Object.values(DemandaAcao).join(', '),
    })
    acao: DemandaAcao;

    @IsInt()
    @Transform(({ value }: any) => +value)
    demanda_id: number;

    @ApiProperty({ enum: DemandaSituacao, enumName: 'DemandaSituacao', required: false })
    @IsOptional()
    @IsEnum(DemandaSituacao)
    situacao_encerramento?: DemandaSituacao;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_MEDIO)
    motivo?: string;

    mapaPermissao(): string {
        const permissionMap: Record<DemandaAcao, string> = {
            enviar: 'pode_enviar',
            validar: 'pode_validar',
            devolver: 'pode_devolver',
            cancelar: 'pode_cancelar',
        };
        return permissionMap[this.acao];
    }

    fsmState(currentStatus: DemandaStatus): { from: DemandaStatus; to: DemandaStatus } | null {
        const transitions: Record<DemandaAcao, Partial<Record<DemandaStatus, DemandaStatus>>> = {
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

        if (this.acao === 'cancelar' && !this.situacao_encerramento) {
            throw new Error('Situação de encerramento é obrigatória para cancelar uma demanda');
        }
    }

    podeExecutar(permissoes: { [key: string]: boolean } | DemandaPermissoesDto): boolean {
        return (permissoes as any)[this.mapaPermissao()] === true;
    }
}
