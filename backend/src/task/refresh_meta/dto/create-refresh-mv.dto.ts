import { IsInt } from 'class-validator';

export class CreateRefreshMetaDto {
    @IsInt()
    meta_id: number;
}
