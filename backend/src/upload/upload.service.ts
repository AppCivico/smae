import { ReadStream } from 'fs';
import * as AWS from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TConfig, TStorageConfig } from '../../config';

@Injectable()
export class StorageService {
    private S3: AWS.S3;
    private BUCKET: string;

    constructor(private configService: ConfigService<TConfig>) {
        this.S3 = new AWS.S3({
            // Your config options
            accessKeyId: this.configService.get<TStorageConfig>('storage').accessKeyId,
            secretAccessKey: this.configService.get<TStorageConfig>('storage').secretAccessKey,
            endpoint: this.configService.get<TStorageConfig>('storage').endpoint,
            s3ForcePathStyle: true,
            signatureVersion: 'v4',
        });
        this.BUCKET = this.configService.get<TStorageConfig>('storage').bucket;
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

    // to get stream you can use file.createReadStream()
    async putStream(key: string, stream: ReadStream): Promise<AWS.S3.PutObjectOutput> {
        const file = await new Promise<AWS.S3.PutObjectOutput>((resolve, reject) => {
            const handleError = (error) => {
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
