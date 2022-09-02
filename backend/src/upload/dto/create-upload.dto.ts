import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsOptional, IsPositive, IsString, MaxLength, ValidateIf } from "class-validator";
import { TipoUpload } from "src/upload/entities/tipo-upload";


export class CreateUploadDto {
    /**
     * tipo - local onde o documento será usado
     * @example SHAPEFILE
    * */
    @ApiProperty({ enum: TipoUpload, enumName: 'TipoUpload' })
    @IsEnum(TipoUpload, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(TipoUpload).filter((e) => isNaN(Number(e))).join(', ')
    })
    tipo: string

    /**
     * tipo_documento_id só é necessário quando tipo = DOCUMENTO
     * @example 1
    * */
    @IsOptional()
    @IsPositive({ message: '$property| Necessário ID do Tipo Documento' })
    @ValidateIf((object: CreateUploadDto) => object.tipo == 'DOCUMENTO')
    @Type(() => Number)
    tipo_documento_id?: number | null

    /*
     * Descrição do arquivo
     */
    @IsOptional()
    @IsString({ message: '$property| descrição: Precisa ser alfanumérico' })
    @MaxLength(10000, { message: '$property| descrição: Máximo 10000 caracteres' })
    descricao?: string

    @ApiProperty({ type: 'string', format: 'binary', required: true })
    arquivo: Express.Multer.File

}
