/**
 * Password Generation Utilities
 * Provides secure password generation and strength validation
 */

export interface PasswordOptions {
  length?: number;
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
}

export interface PasswordStrength {
  score: number; // 0-4 (0: none, 1: weak, 2: fair, 3: medium, 4: strong)
  label: string; // 'None', 'Weak', 'Fair', 'Medium', 'Strong'
  suggestions: string[];
  feedback: string;
}

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';

/**
 * Generate a random password with specified options
 * @param options Password generation options
 * @returns Generated password
 */
export function generatePassword(options: PasswordOptions = {}): string {
  const {
    length = 16,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true
  } = options;

  let chars = '';
  let password = '';

  if (uppercase) chars += UPPERCASE;
  if (lowercase) chars += LOWERCASE;
  if (numbers) chars += NUMBERS;
  if (symbols) chars += SYMBOLS;

  if (chars.length === 0) {
    chars = LOWERCASE;
  }

  // Ensure at least one character from each selected category
  if (uppercase) password += UPPERCASE[Math.floor(Math.random() * UPPERCASE.length)];
  if (lowercase) password += LOWERCASE[Math.floor(Math.random() * LOWERCASE.length)];
  if (numbers) password += NUMBERS[Math.floor(Math.random() * NUMBERS.length)];
  if (symbols) password += SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

  // Fill the rest randomly
  while (password.length < length) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Generate an easy-to-remember password (words + numbers)
 * @param wordCount Number of words to use (default: 3)
 * @param separator Character to separate words (default: '-')
 * @returns Generated memorable password
 */
export function generateMemorablePassword(wordCount: number = 3, separator: string = '-'): string {
  const words = [
    'happy', 'sunny', 'bright', 'swift', 'brave', 'clever', 'gentle', 'strong',
    'wise', 'kind', 'loyal', 'proud', 'eager', 'quick', 'fresh', 'clear',
    'simple', 'smooth', 'calm', 'warm', 'cool', 'bold', 'vivid', 'alert'
  ];

  let password = '';
  for (let i = 0; i < wordCount; i++) {
    if (i > 0) password += separator;
    password += words[Math.floor(Math.random() * words.length)];
  }

  // Add random numbers
  const number = Math.floor(Math.random() * 1000);
  password += separator + number;

  return password;
}

/**
 * Analyze password strength
 * @param password Password to analyze
 * @returns Password strength information
 */
export function analyzePasswordStrength(password: string): PasswordStrength {
  const suggestions: string[] = [];
  let score = 0;

  // Length checks
  if (password.length === 0) {
    return {
      score: 0,
      label: 'None',
      suggestions: ['Enter a password'],
      feedback: 'No password entered'
    };
  }

  if (password.length >= 8) score++;
  else suggestions.push('Use at least 8 characters');

  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // Character diversity
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSymbols = /[!@#$%^&*()_+\-={}|;:,.<>?[\]]/.test(password);

  let charTypes = 0;
  if (hasUppercase) charTypes++;
  if (hasLowercase) charTypes++;
  if (hasNumbers) charTypes++;
  if (hasSymbols) charTypes++;

  if (charTypes >= 3) score++;
  if (charTypes === 4) score++;

  if (!hasUppercase) suggestions.push('Add uppercase letters (A-Z)');
  if (!hasLowercase) suggestions.push('Add lowercase letters (a-z)');
  if (!hasNumbers) suggestions.push('Add numbers (0-9)');
  if (!hasSymbols) suggestions.push('Add symbols (!@#$%^&*)');

  // Check for common patterns (reduce score)
  const commonPatterns = ['123', '456', '789', 'abc', 'qwerty', 'password', '111', '000'];
  if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
    score = Math.max(0, score - 1);
    suggestions.push('Avoid common patterns (123, abc, etc.)');
  }

  // Cap score at 4
  score = Math.min(4, score);

  // Generate feedback
  let feedback = '';
  let label = '';
  switch (score) {
    case 0:
      label = 'None';
      feedback = 'No password entered';
      break;
    case 1:
      label = 'Weak';
      feedback = 'This password is too weak. Follow the suggestions above.';
      break;
    case 2:
      label = 'Fair';
      feedback = 'This password is fair, but could be stronger.';
      break;
    case 3:
      label = 'Medium';
      feedback = 'This is a decent password.';
      break;
    case 4:
      label = 'Strong';
      feedback = 'Excellent! This is a strong password.';
      break;
  }

  return { score, label, suggestions, feedback };
}

/**
 * Check if password meets minimum requirements
 * @param password Password to validate
 * @returns true if password meets requirements
 */
export function isPasswordValid(password: string): boolean {
  const analysis = analyzePasswordStrength(password);
  return analysis.score >= 2; // At least "Fair" strength
}

/**
 * Generate a simple PIN (numeric password)
 * @param length PIN length (default: 6)
 * @returns Generated PIN
 */
export function generatePIN(length: number = 6): string {
  let pin = '';
  for (let i = 0; i < length; i++) {
    pin += Math.floor(Math.random() * 10);
  }
  return pin;
}

/**
 * Copy text to clipboard
 * @param text Text to copy
 * @returns true if successful
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}
