import { Type } from 'class-transformer';
import { IsArray, IsInt, Max, Min, ValidateNested } from 'class-validator';

export class RecordWithId {
    @IsInt()
    @Min(0)
    @Max(2 ** 32)
    id: number;
}

export class BatchRecordWithId {
    @IsArray()
    @Type(() => RecordWithId)
    @ValidateNested({ each: true })
    ids: RecordWithId[];
}

export class BatchSimpleIds {
    ids: number[];
}
