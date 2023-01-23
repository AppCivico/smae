import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreatePortfolioDto {
    /**
    * Sigla
    */
    @IsOptional()
    @IsString({ message: '$property| sigla: Precisa ser alfanumérico' })
    @MaxLength(200, { message: '$property| sigla: Máximo 200 caracteres' })
    titulo: string
}
