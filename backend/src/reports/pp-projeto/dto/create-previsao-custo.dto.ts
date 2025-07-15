import { Transform } from 'class-transformer';
import { IsInt } from 'class-validator';
import { Expose } from 'class-transformer';
import { NumberTransformOrUndef } from '../../../auth/transforms/number.transform';

export class CreateRelProjetoDto {
    /**
     * ID do projeto para criar o relatório
     * @example ""
     */
    @IsInt()
    @Transform(NumberTransformOrUndef)
    @Expose()
    projeto_id: number;
}
