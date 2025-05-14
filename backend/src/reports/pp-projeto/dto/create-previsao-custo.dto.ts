import { Transform } from 'class-transformer';
import { IsInt } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateRelProjetoDto {
    /**
     * ID do projeto para criar o relatório
     * @example ""
     */
    @IsInt()
    @Transform(({ value }: any) => +value)
    @Expose()
    projeto_id: number;
}
