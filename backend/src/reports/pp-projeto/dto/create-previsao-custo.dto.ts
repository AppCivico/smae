import { Transform } from 'class-transformer';
import { IsInt } from 'class-validator';


export class CreateRelProjetoDto {
    /**
     * ID do projeto para criar o relatório
     * @example ""
     */
    @IsInt()
    @Transform(({ value }: any) => +value)
    projeto_id: number;
}
