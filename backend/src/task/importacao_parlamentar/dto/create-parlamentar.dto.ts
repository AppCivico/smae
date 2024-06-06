import { IsString } from 'class-validator';

export class CreateImportacaoParlamentarDto {
    @IsString()
    upload_token: string;
}
