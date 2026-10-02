import { Directory, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { isNativeApp } from './platform'

/**
 * Hands a file to the person: a download on the web; in the app, the phone's share sheet (save to
 * Files or Drive, or send it), since Android's WebView ignores downloads. Resolves false when the
 * share sheet was closed without picking anything.
 */
export async function saveFile(blob: Blob, filename: string, title: string): Promise<boolean> {
  if (!isNativeApp()) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    return true
  }

  const { uri } = await Filesystem.writeFile({ path: filename, data: await toBase64(blob), directory: Directory.Cache })
  try {
    await Share.share({ title, files: [uri], dialogTitle: title })
    return true
  } catch (err) {
    if (String(err).toLowerCase().includes('cancel')) return false
    throw err
  }
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '')
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
