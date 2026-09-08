// @flint/server — File Upload Middleware
// Handle multipart form data and file uploads

import { IncomingForm, type File, type Fields, type Files } from 'formidable'
import type { IncomingMessage } from 'http'

// ─── Types ──────────────────────────────────────────────────────

export interface UploadConfig {
  /** Upload directory (default: './uploads') */
  uploadDir?: string
  /** Maximum file size in bytes (default: 10MB) */
  maxFileSize?: number
  /** Allowed MIME types (default: all) */
  allowedTypes?: string[]
  /** Maximum number of files (default: 10) */
  maxFiles?: number
  /** Keep file extension (default: true) */
  keepExtensions?: boolean
  /** Generate unique filename (default: true) */
  uniqueFilename?: boolean
}

export interface UploadedFile {
  /** Original filename */
  originalFilename: string
  /** Saved filepath */
  filepath: string
  /** File MIME type */
  mimetype: string
  /** File size in bytes */
  size: number
}

export interface UploadResult {
  /** Uploaded files */
  files: UploadedFile[]
  /** Form fields */
  fields: Record<string, any>
}

// ─── Upload Middleware ──────────────────────────────────────────

export function upload(config: UploadConfig = {}) {
  const {
    uploadDir = './uploads',
    maxFileSize = 10 * 1024 * 1024, // 10MB
    allowedTypes,
    maxFiles = 10,
    keepExtensions = true,
    uniqueFilename = true,
  } = config

  return async (c: any, next: () => Promise<void>) => {
    // Only handle multipart/form-data
    const contentType = c.req.header('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return next()
    }

    const form = new IncomingForm({
      uploadDir,
      keepExtensions,
      maxFileSize,
      maxFiles,
      filename: uniqueFilename ? undefined : undefined,
      filter: ({ mimetype }) => {
        if (allowedTypes && !allowedTypes.includes(mimetype || '')) {
          return false
        }
        return true
      },
    })

    try {
      const { fields, files } = await new Promise<UploadResult>((resolve, reject) => {
        form.parse(c.req.raw, (err: any, fields: Fields, files: Files) => {
          if (err) {
            reject(err)
            return
          }

          const uploadedFiles: UploadedFile[] = []
          
          // Process files
          for (const [key, value] of Object.entries(files)) {
            const fileArray = Array.isArray(value) ? value : [value]
            for (const file of fileArray) {
              if (file) {
                uploadedFiles.push({
                  originalFilename: file.originalFilename || 'unknown',
                  filepath: file.filepath,
                  mimetype: file.mimetype || 'application/octet-stream',
                  size: file.size,
                })
              }
            }
          }

          // Process fields
          const processedFields: Record<string, any> = {}
          for (const [key, value] of Object.entries(fields)) {
            processedFields[key] = Array.isArray(value) && value.length === 1 
              ? value[0] 
              : value
          }

          resolve({
            files: uploadedFiles,
            fields: processedFields,
          })
        })
      })

      // Set validated data
      c.set('uploadedFiles', files)
      c.set('uploadedFields', fields)

      return next()
    } catch (error: any) {
      // Handle specific errors
      if (error.code === 'LIMIT_FILE_SIZE') {
        return c.json({
          error: `File terlalu besar. Maksimal ${Math.round(maxFileSize / 1024 / 1024)}MB`,
        }, 413)
      }

      if (error.code === 'LIMIT_FILE_COUNT') {
        return c.json({
          error: `Terlalu banyak file. Maksimal ${maxFiles} file`,
        }, 400)
      }

      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return c.json({
          error: 'Field file tidak diharapkan',
        }, 400)
      }

      return c.json({
        error: 'Gagal upload file',
        details: error.message,
      }, 500)
    }
  }
}

// ─── Storage Utilities ──────────────────────────────────────────

import { promises as fs } from 'fs'
import path from 'path'

/** Move uploaded file to permanent location */
export async function moveFile(
  file: UploadedFile,
  destDir: string,
  options?: { filename?: string }
): Promise<UploadedFile> {
  const filename = options?.filename || file.originalFilename
  const destPath = path.join(destDir, filename)
  
  await fs.mkdir(destDir, { recursive: true })
  await fs.rename(file.filepath, destPath)
  
  return {
    ...file,
    filepath: destPath,
  }
}

/** Delete uploaded file */
export async function deleteFile(filepath: string): Promise<void> {
  try {
    await fs.unlink(filepath)
  } catch (error) {
    console.error('[Flint Upload] Failed to delete file:', error)
  }
}

/** Get file extension */
export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase()
}

/** Get MIME type from extension */
export function getMimeType(filename: string): string {
  const ext = getFileExtension(filename)
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

/** Check if file is image */
export function isImage(mimetype: string): boolean {
  return mimetype.startsWith('image/')
}

/** Check if file is document */
export function isDocument(mimetype: string): boolean {
  return [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ].includes(mimetype)
}
