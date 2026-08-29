const STORAGE_KEY_PASSWORD = 'fvm_app_password_v1';
const STORAGE_KEY_SESSION_AUTH = 'fvm_app_session_auth_v1';
const STORAGE_KEY_REMEMBER_AUTH = 'fvm_app_remember_auth_v1';

export const DEFAULT_PASSWORD = 'a1b2c3';

/**
 * Retrieve the current configured password (defaults to 'a1b2c3')
 */
export function getAppPassword(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PASSWORD);
    if (saved && saved.trim()) {
      return saved;
    }
  } catch (e) {
    console.error('Error reading app password:', e);
  }
  return DEFAULT_PASSWORD;
}

/**
 * Update the app password
 */
export function saveAppPassword(newPassword: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_PASSWORD, newPassword);
  } catch (e) {
    console.error('Error saving app password:', e);
  }
}

/**
 * Reset password to default 'a1b2c3'
 */
export function resetAppPasswordToDefault(): void {
  try {
    localStorage.setItem(STORAGE_KEY_PASSWORD, DEFAULT_PASSWORD);
  } catch (e) {
    console.error('Error resetting password:', e);
  }
}

/**
 * Verify if the entered password matches the stored password
 */
export function verifyAppPassword(entered: string): boolean {
  const current = getAppPassword();
  return entered === current;
}

/**
 * Check if the user is authenticated in the current session or remembered
 */
export function isUserAuthenticated(): boolean {
  try {
    // Check session first
    const sessionAuth = sessionStorage.getItem(STORAGE_KEY_SESSION_AUTH);
    if (sessionAuth === 'true') {
      return true;
    }

    // Check remember me token
    const rememberAuth = localStorage.getItem(STORAGE_KEY_REMEMBER_AUTH);
    if (rememberAuth === 'true') {
      return true;
    }
  } catch (e) {
    console.error('Error checking authentication state:', e);
  }
  return false;
}

/**
 * Set user as authenticated
 */
export function setUserAuthenticated(authenticated: boolean, remember: boolean = false): void {
  try {
    if (authenticated) {
      sessionStorage.setItem(STORAGE_KEY_SESSION_AUTH, 'true');
      if (remember) {
        localStorage.setItem(STORAGE_KEY_REMEMBER_AUTH, 'true');
      } else {
        localStorage.removeItem(STORAGE_KEY_REMEMBER_AUTH);
      }
    } else {
      sessionStorage.removeItem(STORAGE_KEY_SESSION_AUTH);
      localStorage.removeItem(STORAGE_KEY_REMEMBER_AUTH);
    }
  } catch (e) {
    console.error('Error setting auth state:', e);
  }
}

/**
 * Log out and lock the app
 */
export function logoutUser(): void {
  setUserAuthenticated(false, false);
}
