import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the current URL of the application, handling various deployment environments
 * This is used to provide a dynamic return URL for the Stripe Customer Portal
 * @param path Optional path to append to the base URL
 * @returns The complete URL with origin and path
 */
export function getCurrentUrl(path: string = ''): string {
  const baseUrl = window.location.origin;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
