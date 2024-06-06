import { Injectable } from '@nestjs/common';
import * as MinioJS from 'minio';

function headerEscape(str: string) {
    return str.replace(/[^\x20-\x7E]/g, '').replace(/([\s;"\\])/g, '\\$1');
}

@Injectable()
export class StorageService {
    private S3: MinioJS.Client;
    private BUCKET: string;

    constructor() {
        if (!process.env.S3_BUCKET) throw new Error('Please set an value for S3_BUCKET');
        if (!process.env.S3_ACCESS_KEY) throw new Error('Please set an value for S3_ACCESS_KEY');
        if (!process.env.S3_SECRET_KEY) throw new Error('Please set an value for S3_SECRET_KEY');
        if (!process.env.S3_HOST) throw new Error('Please set an value for S3_HOST');
        if (/^https?\:\:/.test(process.env.S3_HOST)) throw new Error('S3_HOST must start with https:// or http://');

        const endpoint = new URL(process.env.S3_HOST);
        this.S3 = new MinioJS.Client({
            accessKey: process.env.S3_ACCESS_KEY,
            secretKey: process.env.S3_SECRET_KEY,
            endPoint: endpoint.hostname,
            port: +endpoint.port,
            useSSL: endpoint.protocol === 'https:',
        });
        this.BUCKET = process.env.S3_BUCKET;
    }

    async getStream(key: string): Promise<NodeJS.ReadableStream> {
        return this.S3.getObject(this.BUCKET, key);
    }

    async putBlob(
        key: string,
        blob: Buffer,
        metadata: MinioJS.ItemBucketMetadata
    ): Promise<MinioJS.UploadedObjectInfo> {
        console.log(`putBlob ${key} with ${blob.length} bytes`);
        try {
            return await this.S3.putObject(this.BUCKET, key, blob, metadata);
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async getSignedUrlForDownload(key: string, ttl_secs: number, response_content_disposition = ''): Promise<string> {
        return new Promise((resolve, reject) => {
            this.S3.presignedGetObject(
                this.BUCKET,
                key,
                ttl_secs,
                {
                    ...(response_content_disposition
                        ? {
                              'response-content-disposition': `attachment; filename="${headerEscape(
                                  response_content_disposition
                              )}"`,
                          }
                        : {}),
                },
                (err, url) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(url);
                    }
                }
            );
        });
    }
}
