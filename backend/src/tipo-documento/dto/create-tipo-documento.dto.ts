import { IsOptional, IsString, MaxLength, registerDecorator, ValidationOptions } from 'class-validator';

function CheckExt(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'IsOnlyDate',
            target: object.constructor,
            propertyName: propertyName,
            constraints: [],
            options: {
                message: '$property| Envie os formatos separado por virgulas, eg: doc, docx, txt',
                ...validationOptions,
            },
            validator: {
                validate(value: any) {
                    return (
                        typeof value === 'string' &&
                        /^(?:(?:[\w0-9]{1,8}))(?:\s*\,\s*(?:[\w0-9]{1,8})){0,99}$/.test(value)
                    );
                },
            },
        });
    };
}

export class CreateTipoDocumentoDto {
    /**
     * Extensão separada por virgula
     * passar na regexp: /^(?:(?:[\w0-9]{1,8}))(?:\s*\,\s*(?:[\w0-9]{1,8})){0,99}$/
     * @example "doc, docx"
     */
    @IsOptional()
    @CheckExt()
    extensoes?: string | null;

    /**
     * Descrição
     */
    @IsString({ message: '$property| Descrição: Precisa ser alfanumérico' })
    @MaxLength(2048, { message: 'O campo "Descrição" deve ter no máximo 2048 caracteres' })
    descricao: string;

    /**
     * Código do tipo de upload [usar para identificar os lugares onde pode ser aceito]
     * @example PDM
     */
    @IsString({ message: '$property| Código: Precisa ser alfanumérico' })
    codigo: string;

    /**
     * Título
     */
    @IsString({ message: '$property| Código: Precisa ser alfanumérico' })
    titulo: string;
}
