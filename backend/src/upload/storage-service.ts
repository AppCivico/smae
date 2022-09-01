import { ReadStream } from 'fs';
import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import { Injectable, InternalServerErrorException } from '@nestjs/common';


@Injectable()
export class StorageService {
    private S3: AWS.S3;
    private BUCKET: string;

    constructor() {

        if (!process.env.S3_BUCKET) throw 'Please set an value for S3_BUCKET';
        if (!process.env.S3_ACCESS_KEY) throw 'Please set an value for S3_ACCESS_KEY';
        if (!process.env.S3_SECRET_KEY) throw 'Please set an value for S3_SECRET_KEY';
        if (!process.env.S3_HOST) throw 'Please set an value for S3_HOST';
        if (/^https?\:\:/.test(process.env.S3_HOST)) throw 'S3_HOST must start with https:// or http://';

        this.S3 = new AWS.S3({
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_KEY,
            endpoint: process.env.S3_HOST,
            s3ForcePathStyle: true,
            signatureVersion: 'v4',
        });
        this.BUCKET = process.env.S3_BUCKET;
    }

    async getBlob(key: string): Promise<PromiseResult<AWS.S3.GetObjectOutput, AWS.AWSError>> {
        const params = { Bucket: this.BUCKET, Key: key };
        const blob = await this.S3.getObject(params).promise();

        return blob;
    }

    async putBlob(blobName: string, blob: Buffer): Promise<PromiseResult<AWS.S3.PutObjectOutput, AWS.AWSError>> {
        const params = { Bucket: this.BUCKET, Key: blobName, Body: blob };
        const uploadedBlob = await this.S3.putObject(params).promise();

        return uploadedBlob;
    }

    // file.createReadStream() pra buscar do upload do nest
    async putStream(key: string, stream: ReadStream): Promise<AWS.S3.PutObjectOutput> {
        const file = await new Promise<AWS.S3.PutObjectOutput>((resolve, reject) => {
            const handleError = (error: any) => {
                reject(error);
            };
            const chunks: Buffer[] = [];

            stream.on('data', (chunk: Buffer) => {
                chunks.push(chunk);
            });

            stream.once('end', async () => {
                const fileBuffer = Buffer.concat(chunks);

                try {
                    const uploaded = await this.putBlob(key, fileBuffer);

                    resolve(uploaded);
                } catch (error) {
                    handleError(new InternalServerErrorException(error));
                }
            });

            stream.on('error', (error) => handleError(new InternalServerErrorException(error)));
        });

        return file;
    }
}
