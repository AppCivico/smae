import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { TipoUpload } from '../entities/tipo-upload';

export class CreateUploadDto {
    /**
     * tipo - local onde o documento será usado
     * @example SHAPEFILE
     * */
    @ApiProperty({ enum: TipoUpload, enumName: 'TipoUpload' })
    @IsEnum(TipoUpload, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(TipoUpload).join(', '),
    })
    tipo: TipoUpload;

    /**
     * tipo_documento_id só é necessário quando tipo = DOCUMENTO
     * @example 1
     * */
    @IsOptional()
    @IsInt({ message: '$property| Necessário ID do Tipo Documento' })
    @ValidateIf((object: CreateUploadDto) => object.tipo === TipoUpload.DOCUMENTO)
    @Type(() => Number)
    tipo_documento_id?: number | null;

    /*
     * Descrição do arquivo
     */
    @IsOptional()
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MaxLength(10000, { message: '$property| descrição: Máximo 10000 caracteres' })
    descricao?: string;

    @ApiProperty({ type: 'string', format: 'binary', required: true })
    arquivo: Express.Multer.File | Buffer;
}

export class ArquivoBaseDto {
    id: number;
    descricao: string | null;
    tamanho_bytes: number;
    nome_original: string;
    download_token: string;
    diretorio_caminho: string | null;
}
