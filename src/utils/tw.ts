import { type ClassNameValue, twJoin, twMerge } from 'tailwind-merge'

export { twJoin, twMerge }

export function cn(...inputs: ClassNameValue[]): string {
  return twMerge(twJoin(inputs))
}
