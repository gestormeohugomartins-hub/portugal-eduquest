// School year progression logic for Portuguese educational calendar

// Portuguese school year typically starts mid-September
const SCHOOL_YEAR_START_MONTH = 9; // September
const SCHOOL_YEAR_START_DAY = 15; // Approximate start date
const HELP_MODE_DAYS = 30; // First 30 days of new year have explanations

// Summer holidays typically start mid-June
const SUMMER_START_MONTH = 6;
const SUMMER_START_DAY = 15;

export type SchoolPeriod = "normal" | "review" | "new_year_help";

/**
 * Determines the current school period based on date
 */
export function getCurrentSchoolPeriod(date: Date = new Date()): SchoolPeriod {
  const month = date.getMonth() + 1; // 1-indexed
  const day = date.getDate();

  // Summer holidays: mid-June to mid-September = review period
  if (
    (month === SUMMER_START_MONTH && day >= SUMMER_START_DAY) ||
    (month > SUMMER_START_MONTH && month < SCHOOL_YEAR_START_MONTH) ||
    (month === SCHOOL_YEAR_START_MONTH && day < SCHOOL_YEAR_START_DAY)
  ) {
    return "review";
  }

  // First 30 days after school starts = help mode
  const schoolStart = new Date(date.getFullYear(), SCHOOL_YEAR_START_MONTH - 1, SCHOOL_YEAR_START_DAY);
  const helpEnd = new Date(schoolStart);
  helpEnd.setDate(helpEnd.getDate() + HELP_MODE_DAYS);

  if (date >= schoolStart && date <= helpEnd) {
    return "new_year_help";
  }

  return "normal";
}

/**
 * Checks if the student should auto-progress to the next year
 * This should happen during summer (July/August)
 */
export function shouldAutoProgress(currentYear: string, date: Date = new Date()): boolean {
  const month = date.getMonth() + 1;
  const year = parseInt(currentYear);

  // Auto-progress in July (month 7) if not already at year 4
  if (month === 7 && year < 4) {
    return true;
  }

  return false;
}

/**
 * Gets the next school year
 */
export function getNextSchoolYear(currentYear: string): string {
  const year = parseInt(currentYear);
  if (year >= 4) return "4"; // Stay at 4th year
  return (year + 1).toString();
}

/**
 * For free users, calculates the XP cap (50% of total year progression)
 * Each year has roughly 1000 XP total progression
 */
export function getFreeXpCap(schoolYear: string): number {
  return 500; // 50% of 1000 XP per year
}

/**
 * Checks if the student has hit the free version cap
 */
export function isAtFreeCap(xp: number, schoolYear: string, isPremium: boolean): boolean {
  if (isPremium) return false;
  return xp >= getFreeXpCap(schoolYear);
}

/**
 * Gets the school year for review questions during holidays
 * During summer, questions should review the year that just ended
 */
export function getReviewYear(currentYear: string): string {
  return currentYear; // Review current year during holidays
}
