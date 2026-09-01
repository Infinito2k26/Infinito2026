import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import { Env } from '../config/env.schema';

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
};

// Cloudinary stores non-image files (rulebook PDFs) under resource_type
// 'raw' — 'image' only works for formats it can transform/thumbnail.
// Inferred from the key's extension so getSignedGetUrl (which only ever
// receives the key, not the original mimetype) can match it at read time.
function resourceTypeForKey(key: string): 'image' | 'raw' {
  return key.endsWith('.pdf') ? 'raw' : 'image';
}

export const LOCAL_UPLOAD_DIR = join(process.cwd(), 'local-uploads');

@Injectable()
export class UploadsService {
  private readonly useLocalDisk: boolean;

  constructor(private readonly config: ConfigService<Env, true>) {
    const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME', {
      infer: true,
    });
    this.useLocalDisk = !cloudName;

    if (!this.useLocalDisk) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: this.config.get('CLOUDINARY_API_KEY', { infer: true }),
        api_secret: this.config.get('CLOUDINARY_API_SECRET', { infer: true }),
      });
    }
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

    if (this.useLocalDisk) {
      // ponytail: no CLOUDINARY_CLOUD_NAME configured (local dev) — write to
      // disk under local-uploads/ instead of failing every upload outright.
      const filename = `${randomUUID()}.${extension}`;
      const dir = join(LOCAL_UPLOAD_DIR, folder);
      await mkdir(dir, { recursive: true });
      await writeFile(join(dir, filename), buffer);
      return { key: `${folder}/${filename}` };
    }

    // 'raw' resource types don't get an extension auto-appended by Cloudinary
    // the way 'image' does — embed it in the public_id so resourceTypeForKey
    // can classify the stored key correctly later (in getSignedGetUrl).
    const isRaw = extension === 'pdf';
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: isRaw ? `${randomUUID()}.${extension}` : randomUUID(),
          resource_type: isRaw ? 'raw' : 'image',
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
    if (this.useLocalDisk) {
      const port = this.config.get('PORT', { infer: true });
      return `http://localhost:${port}/local-uploads/${key}`;
    }

    return cloudinary.url(key, {
      resource_type: resourceTypeForKey(key),
      type: 'authenticated',
      sign_url: true,
      auth_token: {
        duration: ttlSeconds,
      },
    });
  }
}
