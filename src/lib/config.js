/**
 * Runtime config — değerleri .env dosyasından al (VITE_ prefix zorunlu).
 * Fallback'ler sadece geliştirme ortamı içindir.
 */
export const SKETCHFAB_MODEL_UID =
  import.meta.env.VITE_SKETCHFAB_MODEL_UID || '2f69d7b59c3e4a6a8bcae041bd8e591b'

export const SKETCHFAB_API_VERSION = '1.12.1'
