import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';

/**
 * Resizes and compresses an image before uploading to avoid large payloads
 * Strips EXIF metadata to protect user privacy.
 */
export async function shrinkImage(file: File, maxDim = 1200, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Canvas to Blob failed'));
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image file'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image blob or file to Firebase Storage
 */
export async function uploadPetImage(
  file: File,
  userId: string,
  petId: string
): Promise<{ path: string; url: string }> {
  let uploadData: Blob | File = file;
  try {
    uploadData = await shrinkImage(file);
  } catch (err) {
    console.warn('Image shrink fallback to original file:', err);
    uploadData = file;
  }

  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const filePath = `pets/${userId}/${petId}/${Date.now()}_${randomSuffix}.jpg`;
  const storageRef = ref(storage, filePath);
  
  await uploadBytes(storageRef, uploadData, {
    contentType: file.type || 'image/jpeg',
  });
  
  const downloadUrl = await getDownloadURL(storageRef);
  return {
    path: filePath,
    url: downloadUrl,
  };
}

/**
 * Deletes an image from Firebase Storage
 */
export async function deletePetImage(filePath: string): Promise<void> {
  if (!filePath) return;
  try {
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn('Delete pet image notice:', err);
  }
}
