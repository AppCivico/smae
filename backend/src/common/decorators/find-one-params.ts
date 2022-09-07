import { IsNumberString } from 'class-validator';

export class FindOneParams {
    @IsNumberString(undefined, { message: ':id precisa ser um número' })
    id: number;
    id2?: number
}
