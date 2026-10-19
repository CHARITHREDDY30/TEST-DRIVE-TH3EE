import { insforge, isInsForgeConfigured } from '../lib/insforge';

export interface UploadResult {
  url: string;
  key: string;
}

export const uploadService = {
  /**
   * Securely uploads an image to Cloudflare R2 via InsForge Edge Function.
   * Credentials remain strictly protected server-side.
   */
  async uploadImage(file: File, folder: string = 'products'): Promise<UploadResult> {
    if (!file) {
      throw new Error('No file selected for upload');
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, WEBP, or AVIF image.');
    }

    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSizeBytes) {
      throw new Error('File exceeds maximum size limit of 10MB.');
    }

    // Convert File to Base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        const b64 = res.includes(',') ? res.split(',')[1] : res;
        resolve(b64);
      };
      reader.onerror = () => reject(new Error('Failed to read file contents'));
      reader.readAsDataURL(file);
    });

    const response = await insforge.functions.invoke('r2-upload', {
      body: {
        filename: file.name,
        contentType: file.type,
        base64Data,
        folder
      }
    });

    if (response.error) {
      throw new Error(response.error.message || 'Image upload failed');
    }

    const data = response.data;
    if (!data || !data.url) {
      throw new Error(data?.error || 'Server did not return a public image URL');
    }

    return {
      url: data.url,
      key: data.key
    };
  }
};
