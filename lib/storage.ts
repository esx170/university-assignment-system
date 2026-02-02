import { supabase, supabaseAdmin } from './supabase'

export class StorageService {
  private bucket = 'submissions'

  // Upload file to Supabase Storage
  async uploadFile(file: File, userId: string, assignmentId: string): Promise<string> {
    const fileName = `${userId}/${assignmentId}/${Date.now()}-${file.name}`
    
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .upload(fileName, file)

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`)
    }

    return data.path
  }

  // Get file URL from Supabase Storage
  async getFileUrl(filePath: string): Promise<string> {
    const { data } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  // Get signed URL for private files
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .createSignedUrl(filePath, expiresIn)

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`)
    }

    return data.signedUrl
  }

  // Delete file from Supabase Storage
  async deleteFile(filePath: string): Promise<void> {
    const { error } = await supabaseAdmin.storage
      .from(this.bucket)
      .remove([filePath])

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`)
    }
  }

  // List files in a folder
  async listFiles(folder: string): Promise<any[]> {
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .list(folder)

    if (error) {
      throw new Error(`Failed to list files: ${error.message}`)
    }

    return data || []
  }
}

export const storageService = new StorageService()