import { RecurrenceType, RecurrenceSettings } from '../types';

/**
 * Calculate the next due date based on recurrence settings
 * @param currentDueDate - Current due date
 * @param recurrenceSettings - Recurrence configuration
 * @returns Next due date or null if recurrence has ended
 */
export function calculateNextDueDate(
  currentDueDate: string,
  recurrenceSettings: RecurrenceSettings,
  currentOccurrence: number = 1
): string | null {
  if (recurrenceSettings.type === RecurrenceType.None) {
    return null;
  }

  // Check if we've reached the maximum occurrences
  if (recurrenceSettings.maxOccurrences && currentOccurrence >= recurrenceSettings.maxOccurrences) {
    return null;
  }

  const currentDate = new Date(currentDueDate);
  let nextDate = new Date(currentDate);

  switch (recurrenceSettings.type) {
    case RecurrenceType.Weekly:
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case RecurrenceType.BiWeekly:
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case RecurrenceType.Monthly:
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case RecurrenceType.Quarterly:
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    default:
      return null;
  }

  // Check if we've passed the end date
  if (recurrenceSettings.endDate && nextDate > new Date(recurrenceSettings.endDate)) {
    return null;
  }

  return nextDate.toISOString();
}

/**
 * Get human-readable recurrence description
 * @param recurrenceSettings - Recurrence configuration
 * @returns Human-readable description
 */
export function getRecurrenceDescription(recurrenceSettings: RecurrenceSettings): string {
  if (recurrenceSettings.type === RecurrenceType.None) {
    return 'One-time';
  }

  let description = '';
  
  switch (recurrenceSettings.type) {
    case RecurrenceType.Weekly:
      description = 'Weekly';
      break;
    case RecurrenceType.BiWeekly:
      description = 'Bi-weekly';
      break;
    case RecurrenceType.Monthly:
      description = 'Monthly';
      break;
    case RecurrenceType.Quarterly:
      description = 'Quarterly';
      break;
  }

  if (recurrenceSettings.maxOccurrences) {
    description += ` (${recurrenceSettings.maxOccurrences} times)`;
  } else if (recurrenceSettings.endDate) {
    const endDate = new Date(recurrenceSettings.endDate).toLocaleDateString();
    description += ` (until ${endDate})`;
  }

  return description;
}

/**
 * Check if a debt should create a new recurrence
 * @param debt - The debt object
 * @param currentOccurrence - Current occurrence number
 * @returns Whether to create a new recurrence
 */
export function shouldCreateNewRecurrence(
  recurrenceSettings: RecurrenceSettings,
  currentOccurrence: number
): boolean {
  if (recurrenceSettings.type === RecurrenceType.None) {
    return false;
  }

  // Check maximum occurrences
  if (recurrenceSettings.maxOccurrences && currentOccurrence >= recurrenceSettings.maxOccurrences) {
    return false;
  }

  // Check end date
  if (recurrenceSettings.endDate && new Date() > new Date(recurrenceSettings.endDate)) {
    return false;
  }

  return true;
}

/**
 * Generate upcoming recurrence dates
 * @param startDate - Start date for recurrence
 * @param recurrenceSettings - Recurrence configuration
 * @param count - Number of future dates to generate
 * @returns Array of upcoming dates
 */
export function generateUpcomingDates(
  startDate: string,
  recurrenceSettings: RecurrenceSettings,
  count: number = 5
): string[] {
  const dates: string[] = [];
  let currentDate = startDate;
  let occurrence = 1;

  for (let i = 0; i < count; i++) {
    const nextDate = calculateNextDueDate(currentDate, recurrenceSettings, occurrence);
    if (!nextDate) break;
    
    dates.push(nextDate);
    currentDate = nextDate;
    occurrence++;
  }

  return dates;
}

