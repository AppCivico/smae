import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request, Response } from 'express';
const { Parser, transforms: { flatten, unwind } } = require('json2csv');

const linhasTransforms = [unwind({ paths: ['linhas'] }), flatten({ paths: [] })];
const allTransforms = [unwind(), flatten({ paths: [] })];

const contType = 'Content-Type';
const json = 'application/json';
const csv = 'text/csv';
const csvUnwindAll = 'text/csv; unwind-all';

@Injectable()
export class ContentInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req = context.switchToHttp().getRequest<Request>();
        const res = context.switchToHttp().getResponse<Response>();
        const content = req.header('Accept');
        return next.handle().pipe(
            map((data) => {
                switch (content) {
                    case csv:
                        res.header(contType, csv);
                        const json2csvParser = new Parser({ undefined, transforms: linhasTransforms });
                        data = json2csvParser.parse(data);
                        break;
                    case csvUnwindAll:
                        res.header(contType, csv);
                        const json2csvParserAll = new Parser({ undefined, transforms: allTransforms });
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