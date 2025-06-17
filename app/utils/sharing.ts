export function generateShareUrl(token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
  return `${baseUrl}/shared/${token}`
} 