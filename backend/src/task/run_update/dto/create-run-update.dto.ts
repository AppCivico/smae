import { ApiProperty } from '@nestjs/swagger';
import {
    getMetadataStorage,
    IsArray,
    IsEnum,
    IsInt,
    IsString,
    registerDecorator,
    ValidateNested,
    ValidationArguments,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';
import { NumberArrayTransformOrUndef } from 'src/auth/transforms/number-array.transform';
import { Transform, Type, plainToInstance } from 'class-transformer';
import { UpdateProjetoDto } from 'src/pp/projeto/dto/update-projeto.dto';
import { validate } from 'class-validator';
import { TipoAtualizacaoEmLote } from '@prisma/client';

@ValidatorConstraint({ name: 'VerificaOpsParaTipo', async: true })
export class VerificaOpsParaTipoConstraint implements ValidatorConstraintInterface {
    async validate(ops: UpdateOperacaoDto[], args: ValidationArguments) {
        const dto = args.object as CreateRunUpdateDto;
        const tipo = dto.tipo;
        const colunasPermitidas = this.buscaColsPermitidas(tipo);

        // Verifica colunas válidas
        if (!ops.every((op) => colunasPermitidas.includes(op.col))) {
            return false;
        }

        // Valida valores do 'set' conforme o DTO alvo
        const targetDtoClass = tipoToDtoMap[tipo];
        if (!targetDtoClass) return false;

        for (const op of ops) {
            const dummyInstance = plainToInstance(
                targetDtoClass,
                { [op.col]: op.set }, // Mapeia o valor para a coluna
                { enableImplicitConversion: true }
            ) as object;

            const errors = await validate(dummyInstance, {
                skipMissingProperties: true,
                forbidUnknownValues: false,
            });

            if (errors.length > 0) {
                console.log(errors);
                args.constraints[0] = this.formataErro(op, errors);
                return false;
            }
        }

        return true;
    }

    defaultMessage(args: ValidationArguments) {
        console.log(args);
        return args.constraints[0] || 'Uma ou mais operações possuem valores inválidos';
    }

    private buscaColsPermitidas(tipo: TipoAtualizacaoEmLote): string[] {
        const dtoClass = tipoToDtoMap[tipo];
        if (!dtoClass) return [];

        const metadataStorage = getMetadataStorage();
        const validationMetadatas = metadataStorage.getTargetValidationMetadatas(dtoClass, '', false, false);

        return [...new Set(validationMetadatas.map((m) => m.propertyName))];
    }

    private formataErro(op: UpdateOperacaoDto, errors: any[]): string {
        const mensagens = errors
            .map((e) => Object.values(e.constraints || {}))
            .flat()
            .join(', ');
        return `Operação na coluna "${op.col}" inválida: ${mensagens}`;
    }
}

export function VerificaOpsParaTipo() {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            constraints: [],
            validator: VerificaOpsParaTipoConstraint,
        });
    };
}

const tipoToDtoMap: Record<TipoAtualizacaoEmLote, any> = {
    [TipoAtualizacaoEmLote.ProjetoMDO]: UpdateProjetoDto,
    [TipoAtualizacaoEmLote.ProjetoPP]: UpdateProjetoDto,
};

export class UpdateOperacaoDto {
    @IsString()
    col: string;

    @IsString()
    set: string;
}

export class CreateRunUpdateDto {
    @ApiProperty({
        description: 'Tipo da atualização em lote.',
        enum: TipoAtualizacaoEmLote,
        enumName: 'TipoAtualizacaoEmLote',
        example: TipoAtualizacaoEmLote.ProjetoMDO,
    })
    @IsEnum(TipoAtualizacaoEmLote)
    tipo: TipoAtualizacaoEmLote;

    @IsArray()
    @IsInt({ each: true, message: '$property| Cada item precisa ser um número inteiro' })
    @Transform(NumberArrayTransformOrUndef)
    ids: number[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateOperacaoDto)
    @VerificaOpsParaTipo()
    ops: UpdateOperacaoDto[];
}
