import { Injectable, BadRequestException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class UploadsService {
  private readonly s3: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>('S3_BUCKET')!;
    this.s3 = new S3Client({
      endpoint: this.config.get<string>('S3_ENDPOINT'),
      region: 'us-east-1',
      credentials: {
        accessKeyId: this.config.get<string>('S3_ACCESS_KEY_ID')!,
        secretAccessKey: this.config.get<string>('S3_SECRET_ACCESS_KEY')!,
      },
      forcePathStyle: true,
    });
  }

  async uploadProof(
    buffer: Buffer,
    mimeType: string,
  ): Promise<{ key: string }> {
    const extension = MIME_EXTENSION_MAP[mimeType];
    if (!extension) {
      throw new BadRequestException(
        `Unsupported file type: ${mimeType}. Allowed: ${Object.keys(MIME_EXTENSION_MAP).join(', ')}`,
      );
    }

    const key = `ca-proof/${randomUUID()}.${extension}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );

    return { key };
  }

  async getSignedGetUrl(key: string, ttlSeconds = 900): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.s3, command, { expiresIn: ttlSeconds });
  }
}
