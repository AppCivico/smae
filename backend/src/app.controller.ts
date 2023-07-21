import { Controller, Get, HttpException, Query } from '@nestjs/common';
import { IsPublic } from './auth/decorators/is-public.decorator';
import * as percentile from 'percentile';
import { PrismaService } from './prisma/prisma.service';

//import { Res } from '@nestjs/common';
//import { Response } from 'express';
//
//import { join } from 'path';
//import * as ejs from 'ejs';

@Controller()
export class AppController {
    constructor(private readonly prisma: PrismaService) { }

    @IsPublic()
    @Get('/ping')
    async ping() {
        return 'pong';
    }

    @IsPublic()
    @Get('/performance-check')
    async performanceCheck(@Query() query: Record<string, string>) {
        if (query.token !== process.env.HEALTH_CHECK_TOKEN)
            throw new HttpException('mismatched HEALTH_CHECK_TOKEN', 401)

        return {
            unloaded: await this.recordPerformance(30),
            loaded: await this.recordPerformance(0)
        };
    }

    async recordPerformance(delayTime: number) {
        let executionTimes: number[] = [];
        let start = Date.now();

        await this.prisma.$transaction(async (prismaTx) => {
            while (Date.now() - start < 10000) {
                const queryStart = Date.now();
                await prismaTx.$queryRaw`select 1`;
                executionTimes.push(Date.now() - queryStart);

                if (delayTime) {
                    await new Promise(resolve => setTimeout(resolve, delayTime));
                }
            }
        });

        executionTimes.sort((a, b) => a - b);

        let min = executionTimes[0];
        let max = executionTimes[executionTimes.length - 1];
        let p50 = percentile(50, executionTimes);
        let p99 = percentile(99, executionTimes);
        let p999 = percentile(99.9, executionTimes);

        return { min, max, p50, p99, p999, executionTimes: executionTimes.length };
    }

    // exemplo de como usar o ejs via server-side
    //    @Get()
    //    @IsPublic()
    //    async getUsers(@Res() res: Response) {
    //        const data = {
    //            projectName: 'Example Project',
    //            projectStatus: 'Em Elaboração',
    //            projectDescription: 'A sample project for demonstration',
    //            orgaoResponsavel: ['Org 1', 'Org 2'],
    //            projectResponsible: 'John Doe',
    //            startDate: '2023-04-20',
    //            endDate: '2023-08-30',
    //            estimatedCost: 'R$ 500,000',
    //            resourceSource: 'Fonte de Recurso',
    //            origin: 'PDM 2021-2024, Agenda de Prioridades SGM, Outros',
    //            metaCode: 'ABC123',
    //            metaText: 'Example Text',
    //            escopo: ['asda asdas dasda dsasdasdadasdas'],
    //            etapas: ['Etapa 1', 'sadas adsdas dasdasda asdddasd asddds aaaaas asdasd', 'Foo Barr'],
    //            orgaosEnvolvidos: ['Órgão 1', 'Órgão 2', 'Órgão 3'],
    //            documentosRelacionados: ['Doc 1', 'Doc 2', 'Doc 3'],
    //            dataEntrada: '2023-04-20'
    //        };
    //
    //        return res.render('users', { ...data });
    //        //        const templatesDir = join(__dirname, '..', 'templates');
    //
    //        //        ejs.renderFile(join(templatesDir, 'users.ejs'), { users })
    //        //            .then(renderedHtml => {
    //        //                res.json({ html: renderedHtml });
    //        //            })
    //        //            .catch(error => {
    //        //                res.status(500).json({ error: 'An error occurred while rendering the template.' });
    //        //            });
    //    }
}
