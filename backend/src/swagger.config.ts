import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { AppModuleCasaCivil } from './app.module.casa-civil';
import { AppModuleCommon } from './app.module.common';
import { AppModuleOrcamento } from './app.module.orcamento';
import { AppModulePdm } from './app.module.pdm';
import { AppModuleProjeto } from './app.module.projeto';
import { AppModuleWorkflow } from './app.module.workflow';
import { BlocoNotasModule } from './bloco-nota/bloco-notas.module';
import { API_TAG, SysadminModule } from './sysadmin/sysadmin.module';

/**
 * Swagger configuration for SMAE API documentation
 *
 * URL Structure:
 * - /api/ - Base/Common modules (login, auth, pessoa, etc.) - MAIN PAGE
 * - /api/swagger - Full application (all modules)
 * - /api/swagger-pdm - Programa de Metas
 * - /api/swagger-projetos - Projetos
 * - /api/swagger-casa-civil - Casa Civil
 * - /api/swagger-workflow - Workflow
 * - /api/swagger-orcamento - Orçamento
 * - /api/swagger-bloco-notas - Bloco de notas
 */

const BASE_DESCRIPTION = `*SMAE* (Sistema de Monitoramento e Acompanhamento Estratégico) é um software livre e de código aberto.

### CONVERSÃO AUTOMÁTICA PARA CSV

<p>
Todos os endpoints que devolvem \`application/json\` também podem devolver CSV, utilize o
header \`Accept: text/csv\` para explodir apenas as linhas, ou então \`Accept: text/csv; unwind-all\`
(mais lento, que expande tudo) que transforma todas as arrays em items.
<br>Por padrão todos os campos deep são achatados (flatten).<br>
</p>
</div>

----

# Add to insomnia

Usar o link do swagger + "-json"

# Outras Documentações

- [API Completa](/api/swagger)
- [Módulos de Programa de Metas](/api/swagger-pdm)
- [Módulos de Projetos](/api/swagger-projetos)
- [Módulos Casa Civil](/api/swagger-casa-civil)
- [Módulos Workflow](/api/swagger-workflow)
- [Módulos Orçamento](/api/swagger-orcamento)
- [Módulos de bloco de notas](/api/swagger-bloco-notas)
- [Módulos Sysadmin](/api/swagger-sysadmin)
`;

/**
 * Creates the base Swagger document builder with common configuration
 */
function createBaseConfig(title: string, description: string = BASE_DESCRIPTION): DocumentBuilder {
    return new DocumentBuilder()
        .setTitle(title)
        .setDescription(description)
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'Bearer',
            },
            'access-token'
        )
        .setVersion('1.0')
        .addGlobalParameters({
            name: 'smae-sistemas',
            in: 'header',
            required: false,
            content: {
                'application/json': {
                    schema: {
                        type: 'string',
                        example: 'SMAE,ProgramaDeMetas,PDM,CasaCivil,Projetos,PlanoSetorial,MDO',
                        description: `Lista de sistemas separados por vírgula, ex: "sistema1,sistema2"`,
                    },
                },
            },
        });
}

interface SwaggerRouteInfo {
    route: string;
    title: string;
    tags: string[];
    moduleCount: number;
}

/**
 * Sets up a Swagger module at the specified route
 */
function setupSwaggerModule(
    route: string,
    app: INestApplication,
    config: Omit<OpenAPIObject, 'paths'>,
    includeModules: any[],
    allowedTags?: string[]
): SwaggerRouteInfo {
    let document = SwaggerModule.createDocument(app, config, {
        include: includeModules,
        deepScanRoutes: true,
    });

    // Filter tags if specified
    if (allowedTags && allowedTags.length > 0) {
        type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options' | 'trace';
        type PathItem = Record<string, any>;
        type PathsObject = Record<string, PathItem>;

        document = {
            ...document,
            tags: document.tags?.filter((tag) => allowedTags.includes(tag.name)),
            paths: Object.entries(document.paths as PathsObject).reduce<PathsObject>((acc, [path, methods]) => {
                const filteredMethods = Object.entries(methods).reduce<PathItem>((methodAcc, [method, operation]) => {
                    if (operation && Array.isArray(operation.tags)) {
                        const hasAllowedTag = operation.tags.some((tag: string) => allowedTags.includes(tag));
                        if (hasAllowedTag) {
                            methodAcc[method as HttpMethod] = operation;
                        }
                    } else {
                        methodAcc[method as HttpMethod] = operation;
                    }
                    return methodAcc;
                }, {});
                if (Object.keys(filteredMethods).length > 0) {
                    acc[path] = filteredMethods;
                }
                return acc;
            }, {}),
        };
    }

    SwaggerModule.setup(route, app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            filter: '',
            syntaxHighlight: false,
            docExpansion: 'list',
        },
    });

    return {
        route,
        title: config.info?.title || route,
        tags: document.tags?.map((t) => t.name) || [],
        moduleCount: includeModules.length,
    };
}

/**
 * Sets up all Swagger documentation endpoints
 * @returns Array of loaded route information
 */
export function setupSwaggerDocumentation(app: INestApplication): SwaggerRouteInfo[] {
    const loadedRoutes: SwaggerRouteInfo[] = [];

    // 1. MAIN PAGE (/api/) - Base/Common modules (login, auth, pessoa, etc.)
    const baseConfig = createBaseConfig('SMAE - OpenAPI - Módulos Fundamentais', BASE_DESCRIPTION)
        .addTag('Autenticação', 'Login e autorização')
        .addTag('Pessoa', 'Gestão de pessoas e usuários')
        .addTag('Órgão', 'Órgãos e unidades administrativas')
        .addTag('Upload', 'Upload de arquivos')
        .addTag('Público', 'Rotas públicas')
        .addTag('Minha Conta', 'Dados do próprio usuário')
        .addTag('default', 'Informações do sistema');

    loadedRoutes.push(setupSwaggerModule('api', app, baseConfig.build(), [AppModuleCommon]));

    // 2. Full Application (/api/swagger)
    const fullDescription = BASE_DESCRIPTION.replace(
        '# Outras Documentações',
        '# Documentação\n\nEsta página contém a documentação completa de TODOS os módulos da API.\n\n# Outras Documentações'
    );
    const fullConfig = createBaseConfig('SMAE - OpenAPI - API Completa', fullDescription)
        .addTag('Público', 'Rotas públicas')
        .addTag('Minha Conta', 'Dados do próprio usuário')
        .addTag('default', 'Informações do sistema');

    loadedRoutes.push(setupSwaggerModule('api/swagger', app, fullConfig.build(), []));

    // 3. PDM (Programa de Metas)
    const configPdm = createBaseConfig('SMAE - OpenAPI - Módulos Programa de Metas');
    loadedRoutes.push(setupSwaggerModule('api/swagger-pdm', app, configPdm.build(), [AppModulePdm]));

    // 4. Projects (Projetos)
    const configProjeto = createBaseConfig('SMAE - OpenAPI - Módulos de Projetos');
    loadedRoutes.push(setupSwaggerModule('api/swagger-projetos', app, configProjeto.build(), [AppModuleProjeto]));

    // 5. Casa Civil
    const configCasaCivil = createBaseConfig('SMAE - OpenAPI - Módulos Casa Civil');
    loadedRoutes.push(setupSwaggerModule('api/swagger-casa-civil', app, configCasaCivil.build(), [AppModuleCasaCivil]));

    // 6. Workflow
    const configWorkflow = createBaseConfig('SMAE - OpenAPI - Módulos Workflow');
    loadedRoutes.push(setupSwaggerModule('api/swagger-workflow', app, configWorkflow.build(), [AppModuleWorkflow]));

    // 7. Orcamento
    const configOrcamento = createBaseConfig('SMAE - OpenAPI - Módulos Orçamento');
    loadedRoutes.push(setupSwaggerModule('api/swagger-orcamento', app, configOrcamento.build(), [AppModuleOrcamento]));

    // 8. Bloco de Notas
    const blocoNotasConfig = createBaseConfig('SMAE - OpenAPI - Bloco de notas');
    loadedRoutes.push(setupSwaggerModule('api/swagger-bloco-notas', app, blocoNotasConfig.build(), [BlocoNotasModule]));

    // 9. Sysadmin - Filter to show only the sysadmin tag
    const sysadminConfig = createBaseConfig('SMAE - OpenAPI - Módulos Sysadmin');
    loadedRoutes.push(
        setupSwaggerModule('api/swagger-sysadmin', app, sysadminConfig.build(), [SysadminModule], [API_TAG])
    );

    return loadedRoutes;
}

/**
 * Gets the Swagger API description
 */
export function getSwaggerDescription(): string {
    return BASE_DESCRIPTION;
}
