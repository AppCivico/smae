import { ApiPropertyOptional } from '@nestjs/swagger';
import { PosicaoLogotipo } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { DateTransform } from '../../../auth/transforms/date.transform';
import { IsOnlyDate } from '../../../common/decorators/IsDateOnly';
import { MAX_LENGTH_DEFAULT, MAX_LENGTH_MEDIO } from '../../../common/consts';

export class UpsertTermoEncerramentoDto {
    /**
     * Token do upload do ícone (ou download_token existente para manter o mesmo)
     * Para remover o ícone, envie sobrescrever_icone=true e icone_upload_token=null
     */
    @ApiPropertyOptional({ description: 'Upload token ou download token do ícone' })
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @IsString({ message: 'icone_upload_token: deve ser uma string' })
    icone_upload_token?: string | null;

    /**
     * Se true, permite sobrescrever o ícone mesmo que já exista um salvo.
     * Necessário para trocar ou remover o ícone.
     */
    @ApiPropertyOptional({ description: 'Se true, sobrescreve o ícone existente' })
    @IsOptional()
    @IsBoolean()
    sobrescrever_icone?: boolean;

    // --- Campos de Data e Custo (Editáveis) ---

    @ApiPropertyOptional({ description: 'Data de início planejado (YYYY-MM-DD)' })
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    previsao_inicio?: Date | null;

    @ApiPropertyOptional({ description: 'Data de término planejado (YYYY-MM-DD)' })
    @IsOptional()
@IsOnlyDate()
@Transform(DateTransform)

    previsao_termino?: Date | null;

    @ApiPropertyOptional({ description: 'Data de início real (YYYY-MM-DD)' })
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    data_inicio_real?: Date | null;

    @ApiPropertyOptional({ description: 'Data de término real (YYYY-MM-DD)' })
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    data_termino_real?: Date | null;

    @ApiPropertyOptional()
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @IsNumber({}, { message: 'previsao_custo: deve ser um número' })
    previsao_custo?: number | null;

    @ApiPropertyOptional()
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @IsNumber({}, { message: 'valor_executado_total: deve ser um número' })
    valor_executado_total?: number | null;

    // --- Campos de Texto / Justificativa ---

    @ApiPropertyOptional({ description: 'ID da Justificativa (ProjetoTipoEncerramento)' })
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @IsNumber({}, { message: 'justificativa_id: deve ser um número' })
    justificativa_id?: number | null;

    @ApiPropertyOptional({ maxLength: MAX_LENGTH_MEDIO })
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @IsString({ message: 'justificativa_complemento: deve ser uma string' })
    @MaxLength(MAX_LENGTH_MEDIO, { message: `justificativa_complemento: máximo ${MAX_LENGTH_MEDIO} caracteres` })
    justificativa_complemento?: string | null;

    @ApiPropertyOptional({ maxLength: MAX_LENGTH_MEDIO })
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @IsString({ message: 'responsavel_encerramento_nome: deve ser uma string' })
    @MaxLength(MAX_LENGTH_MEDIO, { message: `responsavel_encerramento_nome: máximo ${MAX_LENGTH_MEDIO} caracteres` })
    responsavel_encerramento_nome?: string | null;

    @ApiPropertyOptional({ description: 'Data do encerramento (YYYY-MM-DD)' })
    @IsOptional()
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    data_encerramento?: Date | null;

    @ApiPropertyOptional({ description: 'Assinatura (texto ou base64)', maxLength: MAX_LENGTH_DEFAULT })
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @IsString({ message: 'assinatura: deve ser uma string' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `assinatura: máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    assinatura?: string | null;

    @ApiPropertyOptional({ enum: PosicaoLogotipo })
    @IsOptional()
    @IsEnum(PosicaoLogotipo, { message: 'posicao_logotipo: deve ser Esquerda, Centro ou Direita' })
    posicao_logotipo?: PosicaoLogotipo;
}
