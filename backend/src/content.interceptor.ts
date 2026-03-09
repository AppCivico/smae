import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Parser } from '@json2csv/plainjs';
import { flatten, Transform, unwind } from '@json2csv/transforms';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
const XLSX = require('xlsx');
const { parse } = require('csv-parse');

const linhasTransforms = [
    unwind({
        paths: ['linhas', 'linhas_planejado', 'meta.indicador.series'],
    }),
    flatten(),
] satisfies [Transform<any, any>, ...Transform<any, any>[]];
const allTransforms = [unwind(), flatten()] satisfies [Transform<any, any>, ...Transform<any, any>[]];

const contType = 'Content-Type';
const json = 'application/json';
const csvType = 'text/csv';
const xslx = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const csvUnwindAll = 'text/csv; unwind-all';

@Injectable()
export class ContentInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest<Request>();
        const res = context.switchToHttp().getResponse<Response>();
        const content = req.header('Accept');
        return next.handle().pipe(
            map(async (data) => {
                if (typeof data !== 'object') return data;

                const isEmptyData = Array.isArray(data) && data.length === 0;

                switch (content) {
                    case csvType:
                    case xslx:
                        res.header(contType, csvType);
                        if (isEmptyData) {
                            data = '';
                            break;
                        }
                        const json2csvParser = new Parser({ transforms: linhasTransforms });
                        data = json2csvParser.parse(data);

                        if (content === xslx) {
                            // interface do parseCSV é apenas via callback, entao cria aqui uma forma de
                            // aguardar o parser via async/await
                            const readCsv = await new Promise((resolve, reject) => {
                                parse(data, { columns: true }, (err: any, data: any) => {
                                    if (err) throw reject(err);
                                    resolve(data);
                                });
                            });

                            const csvDataArray = XLSX.utils.json_to_sheet(readCsv);
                            const workbook = XLSX.utils.book_new();
                            XLSX.utils.book_append_sheet(workbook, csvDataArray, 'Sheet1');

                            res.write(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
                            data = null;
                        }
                        break;
                    case csvUnwindAll:
                        res.header(contType, csvType);
                        if (isEmptyData) {
                            data = '';
                            break;
                        }
                        const json2csvParserAll = new Parser({ transforms: allTransforms });
                        data = json2csvParserAll.parse(data);
                        break;

                    case json:
                    default:
                        data = data;
                        res.header(contType, json);
                        break;
                }
                return data;
            })
        );
    }
}
