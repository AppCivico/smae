import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { MAX_LENGTH_MEDIO } from 'src/common/consts';
import { TipoUpload } from '../entities/tipo-upload';
import { ArquivoPreviewDto } from '../../sysadmin/dto/upload/solicitar-preview.dto';

export class CreateUploadDto {
    /**
     * tipo - local onde o documento será usado
     * @example SHAPEFILE
     * */
    @ApiProperty({ enum: TipoUpload, enumName: 'TipoUpload' })
    @IsEnum(TipoUpload, {
        message: 'Precisa ser um dos seguintes valores: ' + Object.values(TipoUpload).join(', '),
    })
    tipo: TipoUpload;

    /**
     * tipo_documento_id só é necessário quando tipo = DOCUMENTO
     * @example 1
     * */
    @IsOptional()
    @IsInt({ message: 'Necessário ID do Tipo Documento' })
    @ValidateIf((object: CreateUploadDto) => object.tipo === TipoUpload.DOCUMENTO)
    @Type(() => Number)
    tipo_documento_id?: number | null;

    /*
     * Descrição do arquivo
     */
    @IsOptional()
    @IsString({ message: 'descrição: Precisa ser alfanumérico' })
    @ApiProperty({
        deprecated: true,
        description: 'Não usar, descrição deve ser colocada no documento, salvo apenas no S3 após 2024-07-08',
    })
    @ApiProperty({ deprecated: true })
    @MaxLength(MAX_LENGTH_MEDIO, { message: `O campo "Descrição" pode ser no máximo ${MAX_LENGTH_MEDIO} caracteres` })
    descricao?: string;

    @ApiProperty({ type: 'string', format: 'binary', required: true })
    arquivo: Express.Multer.File | Buffer;
}

export class ArquivoBaseDto {
    id: number;
    @ApiProperty({
        deprecated: true,
        description:
            'Sempre null, não usar, pois as descrições geralmente corretas estão nos documentos e não nos arquivos.',
    })
    descricao: string | null;
    tamanho_bytes: number;
    nome_original: string;
    download_token: string;
    diretorio_caminho: string | null;
    preview: ArquivoPreviewDto | null;
}
