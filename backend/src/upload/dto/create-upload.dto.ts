import { IsEnum } from "class-validator";
import { TipoUpload } from "src/upload/entities/tipo-upload";


export class CreateUploadDto {
    @IsEnum(TipoUpload, {
        message: '$property| Precisa ser um dos seguintes valores: ' + Object.values(TipoUpload).filter((e) => isNaN(Number(e))).join(', ')
    })
    tipo: string
}
