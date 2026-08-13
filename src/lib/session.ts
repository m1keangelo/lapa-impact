/**
 * Donor session helpers — the donor code (nanoid Base58, Firestore doc ID)
 * lives in sessionStorage so "My Impact" survives refreshes within a tab.
 * Shared by Navbar, the home mini code input, login and impact pages.
 */

export const DONOR_CODE_KEY = 'lapa:donorCode';

export function getDonorCode(): string | null {
  try {
    return sessionStorage.getItem(DONOR_CODE_KEY);
  } catch {
    return null;
  }
}

export function setDonorCode(code: string): void {
  try {
    sessionStorage.setItem(DONOR_CODE_KEY, code);
  } catch {
    /* private mode — ignore */
  }
}

export function clearDonorCode(): void {
  try {
    sessionStorage.removeItem(DONOR_CODE_KEY);
  } catch {
    /* ignore */
  }
}

/** Donor codes are 12-char nanoid Base58. */
export const DONOR_CODE_LENGTH = 12;

export function isPlausibleDonorCode(code: string): boolean {
  return new RegExp(`^[1-9A-HJ-NP-Za-km-z]{${DONOR_CODE_LENGTH}}$`).test(code.trim());
}
