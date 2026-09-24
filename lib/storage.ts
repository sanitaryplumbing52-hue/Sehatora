import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Storage abstraction for uploaded user photos and generated try-on images.
 *
 * Photos are private by default (see PHOTO PRIVACY, section 14): objects are
 * never written to a publicly listable location and reads always go through
 * a short-lived signed URL, whether the backing store is S3-compatible
 * object storage (production) or the local filesystem (demo mode, no cloud
 * credentials required).
 */
export interface StorageProvider {
  readonly name: "s3" | "local";
  putObject(key: string, buffer: Buffer, contentType: string): Promise<void>;
  getSignedReadUrl(key: string, expiresInSeconds?: number): Promise<string>;
  deleteObject(key: string): Promise<void>;
}

const SIGNING_SECRET = process.env.STORAGE_SIGNING_SECRET || process.env.NEXTAUTH_SECRET || "styleai-dev-secret";
const LOCAL_STORAGE_DIR = path.join(process.cwd(), ".data", "uploads");

function signLocalToken(key: string, expiresAt: number): string {
  const payload = `${key}:${expiresAt}`;
  const sig = crypto.createHmac("sha256", SIGNING_SECRET).update(payload).digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyLocalToken(token: string): { key: string; valid: boolean } {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [key, expiresAtStr, sig] = decoded.split(":");
    if (!key || !expiresAtStr || !sig) return { key: "", valid: false };
    const expected = crypto
      .createHmac("sha256", SIGNING_SECRET)
      .update(`${key}:${expiresAtStr}`)
      .digest("hex");
    const validSig = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    const notExpired = Date.now() < Number(expiresAtStr);
    return { key, valid: validSig && notExpired };
  } catch {
    return { key: "", valid: false };
  }
}

class LocalStorageProvider implements StorageProvider {
  readonly name = "local" as const;

  async putObject(key: string, buffer: Buffer): Promise<void> {
    const filePath = path.join(LOCAL_STORAGE_DIR, key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
  }

  async getSignedReadUrl(key: string, expiresInSeconds = 900): Promise<string> {
    const token = signLocalToken(key, Date.now() + expiresInSeconds * 1000);
    return `/api/files/${encodeURIComponent(key)}?token=${token}`;
  }

  async deleteObject(key: string): Promise<void> {
    const filePath = path.join(LOCAL_STORAGE_DIR, key);
    await fs.rm(filePath, { force: true });
  }

  async readObject(key: string): Promise<Buffer> {
    const filePath = path.join(LOCAL_STORAGE_DIR, key);
    return fs.readFile(filePath);
  }
}

class S3StorageProvider implements StorageProvider {
  readonly name = "s3" as const;
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET!;
    this.client = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID!,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: Boolean(process.env.S3_ENDPOINT),
    });
  }

  async putObject(key: string, buffer: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ServerSideEncryption: "AES256",
      })
    );
  }

  async getSignedReadUrl(key: string, expiresInSeconds = 900): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
      expiresIn: expiresInSeconds,
    });
  }

  async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

let cached: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (cached) return cached;
  const hasS3 = Boolean(process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY);
  cached = hasS3 ? new S3StorageProvider() : new LocalStorageProvider();
  return cached;
}

export function getLocalStorageProvider(): LocalStorageProvider {
  return getStorageProvider() as LocalStorageProvider;
}

export function buildPhotoKey(userId: string, filename: string): string {
  const ext = path.extname(filename) || ".jpg";
  return `photos/${userId}/${crypto.randomUUID()}${ext}`;
}
