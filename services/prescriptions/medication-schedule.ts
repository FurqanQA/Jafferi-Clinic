import { Medicine, MedicationSchedule, Frequency } from './prescription-types';

/**
 * Generate daily medication schedule
 */
export function generateDailySchedule(
  medicine: Medicine,
  startDate: string
): MedicationSchedule {
  const schedule = generateMedicationTimes(medicine);
  const durationDays = parseDuration(medicine.duration);
  const endDate = calculateEndDate(startDate, durationDays);

  return {
    medicine_name: medicine.medicine_name,
    schedule,
    duration: medicine.duration,
    start_date: startDate,
    end_date: endDate,
  };
}

/**
 * Generate weekly medication schedule
 */
export function generateWeeklySchedule(
  medicines: Medicine[],
  startDate: string
): MedicationSchedule[] {
  return medicines.map(medicine => generateDailySchedule(medicine, startDate));
}

/**
 * Generate medication times based on frequency and timing flags
 */
function generateMedicationTimes(medicine: Medicine): Array<{
  time: string;
  dose: string;
  instructions?: string;
}> {
  const times: Array<{ time: string; dose: string; instructions?: string }> = [];

  if (medicine.morning) {
    times.push({ time: '08:00', dose: medicine.dose, instructions: 'Morning dose' });
  }

  if (medicine.afternoon) {
    times.push({ time: '12:00', dose: medicine.dose, instructions: 'Afternoon dose' });
  }

  if (medicine.evening) {
    times.push({ time: '18:00', dose: medicine.dose, instructions: 'Evening dose' });
  }

  if (medicine.night) {
    times.push({ time: '22:00', dose: medicine.dose, instructions: 'Night dose' });
  }

  // If no specific times set, use frequency-based defaults
  if (times.length === 0) {
    const frequencyTimes = getFrequencyTimes(medicine.frequency);
    frequencyTimes.forEach(time => {
      times.push({ time, dose: medicine.dose });
    });
  }

  // Add food instructions
  if (medicine.before_food) {
    times.forEach(t => t.instructions = `${t.instructions || ''} (Before food)`.trim());
  }

  if (medicine.after_food) {
    times.forEach(t => t.instructions = `${t.instructions || ''} (After food)`.trim());
  }

  if (medicine.with_food) {
    times.forEach(t => t.instructions = `${t.instructions || ''} (With food)`.trim());
  }

  if (medicine.as_needed) {
    times.forEach(t => t.instructions = `${t.instructions || ''} (As needed)`.trim());
  }

  return times;
}

/**
 * Get default times for each frequency
 */
function getFrequencyTimes(frequency: Frequency): string[] {
  switch (frequency) {
    case 'once':
    case 'daily':
      return ['09:00'];
    case 'twice_daily':
      return ['09:00', '21:00'];
    case 'three_times_daily':
      return ['08:00', '14:00', '20:00'];
    case 'four_times_daily':
      return ['08:00', '12:00', '16:00', '20:00'];
    case 'every_8_hours':
      return ['08:00', '16:00', '00:00'];
    case 'every_6_hours':
      return ['06:00', '12:00', '18:00', '00:00'];
    case 'every_4_hours':
      return ['04:00', '08:00', '12:00', '16:00', '20:00', '00:00'];
    case 'at_bedtime':
      return ['22:00'];
    case 'before_meals':
      return ['07:30', '11:30', '18:30'];
    case 'after_meals':
      return ['09:00', '13:00', '19:00'];
    case 'with_meals':
      return ['08:00', '12:00', '18:00'];
    case 'weekly':
      return ['09:00'];
    case 'biweekly':
      return ['09:00'];
    case 'monthly':
      return ['09:00'];
    case 'as_needed':
      return ['09:00'];
    default:
      return ['09:00'];
  }
}

/**
 * Parse duration string to days
 */
function parseDuration(duration: string): number {
  const match = duration.match(/^(\d+)\s*(day|week|month)s?$/i);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'day':
      return value;
    case 'week':
      return value * 7;
    case 'month':
      return value * 30;
    default:
      return value;
  }
}

/**
 * Calculate end date from start date and duration
 */
function calculateEndDate(startDate: string, durationDays: number): string {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + durationDays);
  return end.toISOString().split('T')[0];
}

/**
 * Generate reminder schedule for medication
 */
export function generateReminderSchedule(
  medicine: Medicine,
  startDate: string
): Array<{
  date: string;
  time: string;
  medicine_name: string;
  dose: string;
  instructions?: string;
}> {
  const schedule: Array<{
    date: string;
    time: string;
    medicine_name: string;
    dose: string;
    instructions?: string;
  }> = [];

  const medicationTimes = generateMedicationTimes(medicine);
  const durationDays = parseDuration(medicine.duration);
  const start = new Date(startDate);

  for (let day = 0; day < durationDays; day++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + day);
    const dateStr = currentDate.toISOString().split('T')[0];

    // Skip weekends if frequency is daily (optional - can be configured)
    // if (medicine.frequency === 'daily' && (currentDate.getDay() === 0 || currentDate.getDay() === 6)) {
    //   continue;
    // }

    medicationTimes.forEach(mt => {
      schedule.push({
        date: dateStr,
        time: mt.time,
        medicine_name: medicine.medicine_name,
        dose: mt.dose,
        instructions: mt.instructions,
      });
    });
  }

  return schedule;
}

/**
 * Placeholder for missed dose handling
 * This function is prepared for future implementation
 */
export function handleMissedDose(
  medicine: Medicine,
  missedDate: string,
  missedTime: string
): {
  shouldTake: boolean;
  action: string;
  reason: string;
} {
  // TODO: Implement missed dose logic based on medication type and time elapsed
  // This is a placeholder for future implementation
  return {
    shouldTake: false,
    action: 'Skip the missed dose and continue with next scheduled dose',
    reason: 'Missed dose handling not yet implemented',
  };
}

/**
 * Get next scheduled dose
 */
export function getNextScheduledDose(
  medicine: Medicine,
  startDate: string
): {
  date: string;
  time: string;
  dose: string;
} | null {
  const now = new Date();
  const schedule = generateReminderSchedule(medicine, startDate);

  for (const reminder of schedule) {
    const reminderDateTime = new Date(`${reminder.date}T${reminder.time}`);
    if (reminderDateTime > now) {
      return {
        date: reminder.date,
        time: reminder.time,
        dose: reminder.dose,
      };
    }
  }

  return null;
}

/**
 * Format medication schedule for display
 */
export function formatMedicationSchedule(schedule: MedicationSchedule): string {
  const lines: string[] = [];
  
  lines.push(`Medicine: ${schedule.medicine_name}`);
  lines.push(`Duration: ${schedule.duration}`);
  lines.push(`Start Date: ${schedule.start_date}`);
  lines.push(`End Date: ${schedule.end_date}`);
  lines.push('');
  lines.push('Schedule:');
  
  schedule.schedule.forEach(s => {
    lines.push(`  ${s.time} - ${s.dose}${s.instructions ? ` (${s.instructions})` : ''}`);
  });

  return lines.join('\n');
}
