const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const MAX_AVATAR_BYTES = 512 * 1024

export async function resizeProfileImage(file) {
  if (!file || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPG, PNG, or WebP profile photo.')
  }
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Choose an image smaller than 5 MB.')

  const image = await createImageBitmap(file)
  try {
    const scale = Math.min(1, 512 / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Could not process this image.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82))
    if (!blob || blob.size > MAX_AVATAR_BYTES) {
      throw new Error('Photo could not be compressed to the 512 KB profile limit.')
    }

    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Could not read the processed photo.'))
      reader.onerror = () => reject(new Error('Could not read the processed photo.'))
      reader.readAsDataURL(blob)
    })
  } finally {
    image.close()
  }
}
