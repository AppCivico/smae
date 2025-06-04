import { IsDateString } from 'class-validator';

export class CreateApiLogDayDto  {
  @IsDateString()
  date: string;
}
