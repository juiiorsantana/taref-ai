/**
 * Date utilities — Brazilian format (DD/MM/YYYY) and deadline detection.
 */

export const formatDateBR = (isoDate: string): string => {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

export const isOverdue = (deadline?: string): boolean => {
  if (!deadline) return false
  return new Date(deadline) < new Date(new Date().toDateString())
}

export const isDueSoon = (deadline?: string, hoursThreshold = 24): boolean => {
  if (!deadline) return false
  const diff = new Date(deadline).getTime() - Date.now()
  return diff >= 0 && diff < hoursThreshold * 60 * 60 * 1000
}

export const generateId = (): string => crypto.randomUUID()
