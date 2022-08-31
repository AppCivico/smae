import { registerDecorator, ValidationOptions } from 'class-validator';

export function CheckExt(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'IsOnlyDate',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [],
            options: {
                message: '$property| Envie os formatos separado por virgulas, eg: .doc, .docx, .txt',
                ...validationOptions,
            },
            validator: {
                validate(value: any) {
                    // TODO
                    return true;
                },
            },

        });
    };
}


import { IsOptional, IsPositive, IsString, MaxLength, MinLength } from "class-validator";

export class CreateTipoDocumentoDto {
    /**
    * Extensão separada por virgula
    * @example .doc, .docx
    */
    @IsOptional()
    @CheckExt()
    extensoes?: string | null

    /**
    * Descrição
    */
    @IsString({ message: '$property| Descrição: Precisa ser alfanumérico' })
    @MaxLength(250, { message: '$property| Descrição: Máximo 250 caracteres' })
    descricao: string

    /**
    * Código do tipo de upload [usar para identificar os lugares onde pode ser aceito]
    * @example PDM
    */
    @IsString({ message: '$property| Código: Precisa ser alfanumérico' })
    codigo: string

    /**
    * Título
    */
    @IsString({ message: '$property| Código: Precisa ser alfanumérico' })
    titulo: string



}
