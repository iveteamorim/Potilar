export async function compressImage(file: File, maxSize = 1600, quality = 0.78) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.size < 900_000) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) return file;

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality);
  });

  if (!blob || blob.size >= file.size) return file;

  const name = file.name.replace(/\.[^.]+$/, '') || 'foto';
  return new File([blob], `${name}.jpg`, { type: 'image/jpeg' });
}
