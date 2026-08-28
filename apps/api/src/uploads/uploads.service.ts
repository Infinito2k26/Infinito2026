import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable()
export class UploadsService {
  constructor(private readonly config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get<string>('CLOUDINARY_CLOUD_NAME')!,
      api_key: this.config.get<string>('CLOUDINARY_API_KEY')!,
      api_secret: this.config.get<string>('CLOUDINARY_API_SECRET')!,
    });
  }

  async uploadProof(
    buffer: Buffer,
    mimeType: string,
    folder: string,
  ): Promise<{ key: string }> {
    const extension = MIME_EXTENSION_MAP[mimeType];
    if (!extension) {
      throw new BadRequestException(
        `Unsupported file type: ${mimeType}. Allowed: ${Object.keys(MIME_EXTENSION_MAP).join(', ')}`,
      );
    }

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: randomUUID(),
          resource_type: 'image',
          type: 'authenticated',
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(
              error instanceof Error
                ? error
                : new Error(error?.message ?? 'Cloudinary upload failed'),
            );
            return;
          }
          resolve(uploadResult);
        },
      );
      stream.end(buffer);
    });

    return { key: result.public_id };
  }

  // Requires the Cloudinary account's token-based authentication add-on for the
  // signed URL to actually expire after ttlSeconds; otherwise it stays valid indefinitely.
  getSignedGetUrl(key: string, ttlSeconds = 900): string {
    return cloudinary.url(key, {
      resource_type: 'image',
      type: 'authenticated',
      sign_url: true,
      auth_token: {
        duration: ttlSeconds,
      },
    });
  }
}
