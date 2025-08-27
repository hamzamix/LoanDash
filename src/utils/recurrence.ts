import { RecurrenceType, RecurrenceSettings } from '../types';

export const calculateNextDueDate = (
  currentDueDate: Date,
  recurrenceType: RecurrenceType
): Date => {
  const nextDate = new Date(currentDueDate);
  
  switch (recurrenceType) {
    case RecurrenceType.Daily:
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case RecurrenceType.Weekly:
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case RecurrenceType.Monthly:
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case RecurrenceType.Quarterly:
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case RecurrenceType.Yearly:
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      // Default to monthly if unknown type
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }
  
  return nextDate;
};

export const getRecurrenceDescription = (recurrenceSettings: RecurrenceSettings): string => {
  const { type, endDate, maxOccurrences } = recurrenceSettings;
  
  let description = '';
  
  switch (type) {
    case RecurrenceType.Daily:
      description = 'Daily';
      break;
    case RecurrenceType.Weekly:
      description = 'Weekly';
      break;
    case RecurrenceType.Monthly:
      description = 'Monthly';
      break;
    case RecurrenceType.Quarterly:
      description = 'Quarterly';
      break;
    case RecurrenceType.Yearly:
      description = 'Yearly';
      break;
    default:
      description = 'Monthly';
      break;
  }
  
  if (endDate) {
    description += ` until ${new Date(endDate).toLocaleDateString()}`;
  } else if (maxOccurrences) {
    description += ` for ${maxOccurrences} occurrences`;
  }
  
  return description;
};

