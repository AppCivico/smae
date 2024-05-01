import { ApiProperty } from '@nestjs/swagger';
import {
    DadosEleicaoNivel,
    MunicipioTipo,
    ParlamentarCargo,
    ParlamentarEquipeTipo,
    ParlamentarSuplente,
    ParlamentarUF,
} from '@prisma/client';
import { Transform, TransformFnParams } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { IsOnlyDate } from 'src/common/decorators/IsDateOnly';
import { DateTransform } from '../../auth/transforms/date.transform';

export class CreateParlamentarDto {
    @IsString({ message: '$property| nome: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| nome: Máximo 250 caracteres' })
    @MinLength(1, { message: '$property| nome: Mínimo 1 caractere' })
    nome: string;

    @IsString({ message: '$property| Nome popular: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| Nome popular: Máximo 250 caracteres' })
    @MinLength(1, { message: '$property| nome: Mínimo 1 caractere' })
    nome_popular: string;

    /**
     * @example YYYY-MM-DD
     */
    @IsOnlyDate()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    nascimento?: Date;

    @IsOptional()
    @IsString()
    @MaxLength(250, { message: '$property| telefone: Máximo 250 caracteres' })
    telefone?: string;

    @IsOptional()
    @IsString()
    @MaxLength(250, { message: '$property| email: Máximo 250 caracteres' })
    email?: string;

    @IsOptional()
    @IsBoolean()
    em_atividade: boolean;

    /**
     * Upload de foto
     */
    @IsOptional()
    @ValidateIf((object, value) => value !== null)
    @IsString({ message: '$property| upload_token de um arquivo de foto' })
    upload_foto?: string | null;
}

export class CreateEquipeDto {
    @IsString()
    @MaxLength(250, { message: '$property| nome: Máximo 250 caracteres' })
    nome: string;

    @IsString()
    @MaxLength(250, { message: '$property| telefone: Máximo 250 caracteres' })
    telefone: string;

    @IsString()
    @MaxLength(250, { message: '$property| email: Máximo 250 caracteres' })
    email: string;

    @ApiProperty({ enum: ParlamentarEquipeTipo, enumName: 'Cargo' })
    @IsEnum(ParlamentarEquipeTipo, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(ParlamentarEquipeTipo).join(', '),
    })
    tipo: ParlamentarEquipeTipo;
}

export class CreateMandatoDto {
    @IsNumber()
    eleicao_id: number;

    @IsNumber()
    partido_candidatura_id: number;

    @IsNumber()
    partido_atual_id: number;

    @IsOptional()
    @IsString({ message: '$property| gabinete: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| gabinete: Máximo 250 caracteres' })
    gabinete: string | null;

    @IsOptional()
    @IsString({ message: '$property| endereco: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| endereco: Máximo 250 caracteres' })
    endereco: string;

    @IsBoolean()
    eleito: boolean;

    @ApiProperty({ enum: ParlamentarCargo, enumName: 'ParlamentarCargo' })
    @IsEnum(ParlamentarCargo, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(ParlamentarCargo).join(', '),
    })
    cargo: ParlamentarCargo;

    @ApiProperty({ enum: ParlamentarUF, enumName: 'UF' })
    @IsEnum(ParlamentarUF, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(ParlamentarUF).join(', '),
    })
    uf: ParlamentarUF;

    @ApiProperty({ enum: ParlamentarSuplente, enumName: 'Suplente' })
    @IsEnum(ParlamentarSuplente, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(ParlamentarSuplente).join(', '),
    })
    @IsOptional()
    suplencia?: ParlamentarSuplente;

    @IsOptional()
    @IsNumber()
    votos_estado?: number;

    @IsOptional()
    @IsNumber()
    votos_capital?: number;

    @IsOptional()
    @IsNumber()
    votos_interior?: number;

    @IsOptional()
    @IsNumber()
    mandato_principal_id?: number;

    @IsOptional()
    @IsString({ message: '$property| ocupação: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| ocupação: Máximo 250 caracteres' })
    atuacao?: string;

    @IsOptional()
    @IsString({ message: '$property| biografia: Precisa ser alfanumérico' })
    biografia?: string;

    @IsOptional()
    @IsString()
    @MaxLength(250, { message: '$property| telefone: Máximo 250 caracteres' })
    telefone: string;

    @IsOptional()
    @IsString()
    @MaxLength(250, { message: '$property| email: Máximo 250 caracteres' })
    email: string;
}

export class CreateMandatoRepresentatividadeDto {
    @IsNumber()
    regiao_id: number;

    @IsNumber()
    mandato_id: number;

    @ApiProperty({ enum: DadosEleicaoNivel, enumName: 'DadosEleicaoNivel' })
    @IsEnum(DadosEleicaoNivel, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(DadosEleicaoNivel).join(', '),
    })
    nivel: DadosEleicaoNivel;

    @ApiProperty({ enum: MunicipioTipo, enumName: 'MunicipioTipo' })
    @IsEnum(MunicipioTipo, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(MunicipioTipo).join(', '),
    })
    @IsOptional()
    municipio_tipo?: MunicipioTipo;

    @IsNumber()
    numero_votos: number;

    // Dados de comparecimento.
    // Idealmente, não seriam enviados aqui.
    // Mas para viabilizar a v1, será enviado nesse endpoint.
    @IsOptional()
    @IsNumber()
    numero_comparecimento?: number;

    @IsOptional()
    @IsNumber(
        { maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false },
        { message: '$property| até duas casas decimais' }
    )
    @Transform((a: TransformFnParams) => (a.value === null ? null : +a.value))
    @ValidateIf((object, value) => value !== null)
    pct_participacao?: number;

    @IsOptional()
    @IsNumber()
    ranking?: number;
}

export class CreateMandatoBancadaDto {
    @IsNumber()
    mandato_id: number;

    @IsNumber()
    bancada_id: number;
}

export class CreateMandatoSuplenteDto {
    @IsNumber()
    mandato_id: number;

    @IsNumber()
    parlamentar_suplente_id: number;

    @ApiProperty({ enum: ParlamentarSuplente, enumName: 'Suplente' })
    @IsEnum(ParlamentarSuplente, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(ParlamentarSuplente).join(', '),
    })
    @IsOptional()
    suplencia?: ParlamentarSuplente;
}
