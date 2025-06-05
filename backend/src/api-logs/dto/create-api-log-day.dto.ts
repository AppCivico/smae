import { IsDateYMD } from '../../auth/decorators/date.decorator';

export class CreateApiLogDayDto {
    @IsDateYMD()
    date: Date;
}
