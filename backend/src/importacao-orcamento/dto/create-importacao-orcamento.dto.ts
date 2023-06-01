import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Validate, ValidateIf } from "class-validator";
import { EitherPdmOrPortfolio } from "src/common/dto/EitherPdmOrPortfolio";

export class CreateImportacaoOrcamentoDto {

    /**
     * Upload do XLSX, XLS, CSV, etc...
     *
     * see: https://docs.sheetjs.com/docs/miscellany/formats
     *
     */
    @IsString({ message: '$property| upload_token de um arquivo de ícone' })
    upload: string;

    @ApiProperty({ example: 0 })
    @Validate(EitherPdmOrPortfolio)
    @Type(() => Number)
    pdm_id: number | undefined;

    @ApiProperty({ example: 0 })
    @Validate(EitherPdmOrPortfolio)
    @Type(() => Number)
    portfolio_id: number | undefined;

}

export class FilterImportacaoOrcamentoDto {
    @IsOptional()
    @IsInt()
    @Type(() => Number)
    pdm_id?: number;

    @IsOptional()
    @IsInt()
    @Type(() => Number)
    portfolio_id?: number;
}