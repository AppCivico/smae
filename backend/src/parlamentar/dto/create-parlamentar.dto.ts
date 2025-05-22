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
import { IsValidCPF } from '../../common/decorators/IsValidCPF';
import { MAX_LENGTH_DEFAULT, MAX_LENGTH_HTML, MAX_LENGTH_MEDIO } from 'src/common/consts';

export class CreateParlamentarDto {
    @IsString({ message: '$property| nome: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Nome' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    @MinLength(1, { message: '$property| nome: Mínimo 1 caractere' })
    nome: string;

    @IsString({ message: '$property| Nome popular: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Nome popular' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    @MinLength(1, { message: '$property| nome: Mínimo 1 caractere' })
    nome_popular: string;

    /**
     * @example YYYY-MM-DD
     */
    @IsOnlyDate()
    @IsOptional()
    @Transform(DateTransform)
    @ValidateIf((object, value) => value !== null)
    nascimento?: Date;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Telefone' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    telefone?: string;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'E-mail' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
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

    @IsValidCPF()
    cpf: string;
}

export class CreateEquipeDto {
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'Nome' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
    nome: string;

    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Telefone' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    telefone: string;

    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'E-mail' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
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
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo 'Atuação' deve ter no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    atuacao?: string;

    @IsOptional()
    @IsString({ message: '$property| biografia: Precisa ser alfanumérico' })
    @MaxLength(MAX_LENGTH_HTML, { message: `O campo "Biografia" pode ser no máximo ${MAX_LENGTH_HTML} caracteres` })
    biografia?: string;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, {
        message: `O campo 'Telefone' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres`,
    })
    telefone: string;

    @IsOptional()
    @IsString()
    @MaxLength(MAX_LENGTH_DEFAULT, { message: `O campo 'E-mail' deve ter no máximo ${MAX_LENGTH_DEFAULT} caracteres` })
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
