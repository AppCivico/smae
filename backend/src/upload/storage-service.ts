import { Injectable } from '@nestjs/common';
import * as MinioJS from 'minio';
import { UploadedObjectInfo } from 'minio/dist/main/internal/type';

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
        if (/^https?::/.test(process.env.S3_HOST)) throw new Error('S3_HOST must start with https:// or http://');

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
    ): Promise<UploadedObjectInfo> {
        console.log(`putBlob ${key} with ${blob.length} bytes`);
        try {
            return await this.S3.putObject(this.BUCKET, key, blob, undefined, metadata);
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    async saveAsFile(key: string, filePath: string): Promise<void> {
        await this.S3.fGetObject(this.BUCKET, key, filePath);
        return;
    }

    async getSignedUrlForDownload(key: string, ttl_secs: number, response_content_disposition = ''): Promise<string> {
        const presignedUrl = await this.S3.presignedGetObject(this.BUCKET, key, ttl_secs, {
            ...(response_content_disposition
                ? {
                      'response-content-disposition': `attachment; filename="${headerEscape(
                          response_content_disposition
                      )}"`,
                  }
                : {}),
        });
        return presignedUrl;
    }

    /**
     * Gets the metadata headers for an object without downloading the full content
     * @param key The key of the object in the storage
     * @returns The metadata headers as an object
     */
    async getObjectMetadata(key: string): Promise<MinioJS.ItemBucketMetadata> {
        try {
            // Use statObject to get only the metadata without downloading the object content
            const stat = await this.S3.statObject(this.BUCKET, key);
            return stat.metaData;
        } catch (error) {
            console.error(`Error getting metadata for object ${key}:`, error);
            throw error;
        }
    }
}
