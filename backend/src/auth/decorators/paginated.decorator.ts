import { applyDecorators, Type } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PaginatedDto } from '../../common/dto/paginated.dto';

export const ApiPaginatedResponse = <TModel extends Type<any>>(model: TModel) => {
    return applyDecorators(
        ApiExtraModels(model, PaginatedDto),
        ApiOkResponse({
            schema: {
                allOf: [
                    { $ref: getSchemaPath(PaginatedDto) },
                    {
                        properties: {
                            linhas: {
                                type: 'array',
                                items: { $ref: getSchemaPath(model) },
                            },
                        },
                    },
                ],
            },
        }),
    );
};
