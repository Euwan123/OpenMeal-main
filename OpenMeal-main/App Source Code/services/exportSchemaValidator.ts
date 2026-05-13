export const MAX_IMPORT_JSON_BYTES = 45 * 1024 * 1024;
export const MAX_IMPORT_MEALS = 20000;
const MAX_BASE64_FIELD_CHARS = 22 * 1024 * 1024;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function validateDailyGoals(goals: unknown): void {
  if (goals == null) return;
  if (typeof goals !== 'object' || Array.isArray(goals)) {
    throw new Error('Invalid daily_goals object');
  }
  const g = goals as Record<string, unknown>;
  for (const key of ['calories', 'protein', 'fats', 'carbs']) {
    const n = g[key];
    if (n !== undefined && (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > 200000)) {
      throw new Error(`Invalid daily_goals.${key}`);
    }
  }
}

function validateReminders(reminders: unknown): void {
  if (reminders == null) return;
  if (!Array.isArray(reminders)) {
    throw new Error('Invalid meal_reminders');
  }
  if (reminders.length > 200) {
    throw new Error('Too many meal reminders');
  }
  for (const r of reminders) {
    if (!r || typeof r !== 'object') throw new Error('Invalid reminder entry');
    const o = r as Record<string, unknown>;
    if (!isNonEmptyString(o.id) || !isNonEmptyString(o.name) || !isNonEmptyString(o.time)) {
      throw new Error('Invalid reminder fields');
    }
    if (typeof o.enabled !== 'boolean') {
      throw new Error('Invalid reminder enabled flag');
    }
  }
}

function validateMeals(meals: unknown): void {
  if (!Array.isArray(meals)) {
    throw new Error('Missing or invalid meals array');
  }
  if (meals.length > MAX_IMPORT_MEALS) {
    throw new Error(`Import contains too many meals (max ${MAX_IMPORT_MEALS})`);
  }
  for (const meal of meals) {
    if (!meal || typeof meal !== 'object') {
      throw new Error('Invalid meal entry');
    }
    const m = meal as Record<string, unknown>;
    if (!isNonEmptyString(m.id) || !isNonEmptyString(m.timestamp)) {
      throw new Error('Invalid meal data: missing required fields');
    }
    if (m.image_data !== undefined && typeof m.image_data === 'string' && m.image_data.length > MAX_BASE64_FIELD_CHARS) {
      throw new Error('Import meal image data is too large');
    }
    if (m.after_image_data !== undefined && typeof m.after_image_data === 'string' && m.after_image_data.length > MAX_BASE64_FIELD_CHARS) {
      throw new Error('Import meal after image data is too large');
    }
  }
}

export function parseAndValidateImportJson(jsonContent: string): unknown {
  if (jsonContent.length > MAX_IMPORT_JSON_BYTES) {
    throw new Error('Import file is too large');
  }
  let data: unknown;
  try {
    data = JSON.parse(jsonContent);
  } catch {
    throw new Error('Import file is not valid JSON');
  }
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data format');
  }
  const d = data as Record<string, unknown>;
  if (!isNonEmptyString(d.version)) {
    throw new Error('Missing or invalid version field');
  }
  if (!isNonEmptyString(d.export_date)) {
    throw new Error('Missing or invalid export_date field');
  }
  validateMeals(d.meals);
  validateDailyGoals(d.daily_goals);
  validateReminders(d.meal_reminders);
  if (d.user_profile != null) {
    if (typeof d.user_profile !== 'object' || Array.isArray(d.user_profile)) {
      throw new Error('Invalid user_profile');
    }
    const p = d.user_profile as Record<string, unknown>;
    if (p.age !== undefined && (typeof p.age !== 'number' || p.age < 1 || p.age > 130)) {
      throw new Error('Invalid user_profile.age');
    }
  }
  if (d.app_preferences != null) {
    if (typeof d.app_preferences !== 'object' || Array.isArray(d.app_preferences)) {
      throw new Error('Invalid app_preferences');
    }
    const ap = d.app_preferences as Record<string, unknown>;
    if (ap.ai_model !== undefined && typeof ap.ai_model !== 'string') {
      throw new Error('Invalid app_preferences.ai_model');
    }
  }
  return data;
}
