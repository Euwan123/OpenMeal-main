import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import FileSystemStorageService, { MealAnalysis } from './FileSystemStorageService';
import DailyGoalsService from './DailyGoalsService';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface AchievementProgress extends AchievementDefinition {
  unlocked: boolean;
  unlockedAt?: string;
}

const STORAGE_KEY = '@OpenMeal/achievements';

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  { id: 'first_meal', title: 'First Bite', description: 'Log your first meal', icon: 'fork.knife' },
  { id: 'meals_5', title: 'Getting Started', description: 'Log 5 meals', icon: 'leaf' },
  { id: 'meals_15', title: 'Steady Tracker', description: 'Log 15 meals', icon: 'chart.line.uptrend.xyaxis' },
  { id: 'meals_30', title: 'Nutrition Pro', description: 'Log 30 meals', icon: 'star.fill' },
  { id: 'streak_3', title: 'Three-Day Flow', description: 'Log meals on 3 days in a row', icon: 'flame' },
  { id: 'streak_7', title: 'Week Warrior', description: 'Log meals on 7 days in a row', icon: 'calendar' },
  { id: 'recipe_creator', title: 'Pantry Chef', description: 'Generate your first ingredient recipe', icon: 'book' },
  { id: 'filipino_finder', title: 'Taste of Home', description: 'Scan a Filipino dish label', icon: 'globe' },
  { id: 'goal_day', title: 'Goal Getter', description: 'Hit your calorie goal for a day', icon: 'target' },
  { id: 'early_riser', title: 'Early Riser', description: 'Log a meal before 9 AM', icon: 'sunrise' },
  { id: 'macro_balance', title: 'Balanced Plate', description: 'Hit protein and calorie goals on the same day', icon: 'scalemass' },
  { id: 'comeback', title: 'Back on Track', description: 'Log again after missing a day', icon: 'arrow.uturn.right' },
  { id: 'jog_starter', title: 'Morning Mover', description: 'Complete your first jog reminder', icon: 'figure.run' },
  { id: 'jog_regular', title: 'Routine Runner', description: 'Complete 5 jog reminders', icon: 'bolt.fill' },
];

type AchievementState = Record<string, { unlocked: boolean; unlockedAt?: string }>;

class AchievementsService {
  private async getState(): Promise<AchievementState> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  private async saveState(state: AchievementState): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  private async unlock(id: string, state: AchievementState): Promise<AchievementState> {
    if (state[id]?.unlocked) {
      return state;
    }

    const next = {
      ...state,
      [id]: {
        unlocked: true,
        unlockedAt: new Date().toISOString(),
      },
    };

    await this.saveState(next);
    const definition = ACHIEVEMENT_DEFINITIONS.find(item => item.id === id);
    DeviceEventEmitter.emit('achievementUnlocked', {
      id,
      title: definition?.title ?? 'Achievement unlocked',
    });
    return next;
  }

  private getDayKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private getLoggingStreak(meals: MealAnalysis[]): number {
    const dayKeys = new Set(
      meals
        .filter(meal => meal.analysis && !meal.hasError)
        .map(meal => this.getDayKey(new Date(meal.timestamp)))
    );

    let streak = 0;
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);

    while (dayKeys.has(this.getDayKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }

  private hasFilipinoLabel(meal: MealAnalysis): boolean {
    const values = [
      meal.analysis?.title,
      ...(meal.analysis?.meal_items ?? []).map((item: { item_name?: string }) => item.item_name),
    ].filter(Boolean) as string[];

    return values.some(value => /\([^)]+\)/.test(value));
  }

  private async getDailyTotals(meals: MealAnalysis[], day: Date) {
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    return meals
      .filter(meal => {
        const mealDate = new Date(meal.timestamp);
        return mealDate >= start && mealDate < end && meal.analysis && !meal.hasError;
      })
      .reduce(
        (totals, meal) => ({
          calories: totals.calories + (meal.analysis?.total_meal_nutritional_values?.total_calories ?? 0),
          protein: totals.protein + (meal.analysis?.total_meal_nutritional_values?.total_protein_g ?? 0),
        }),
        { calories: 0, protein: 0 }
      );
  }

  async getProgress(): Promise<AchievementProgress[]> {
    const state = await this.getState();
    return ACHIEVEMENT_DEFINITIONS.map(definition => ({
      ...definition,
      unlocked: !!state[definition.id]?.unlocked,
      unlockedAt: state[definition.id]?.unlockedAt,
    }));
  }

  async evaluateAfterMeal(meal: MealAnalysis): Promise<void> {
    if (!meal.analysis || meal.hasError) {
      return;
    }

    let state = await this.getState();
    const meals = await FileSystemStorageService.getMealHistory();
    const completedMeals = meals.filter(item => item.analysis && !item.hasError);
    const streak = this.getLoggingStreak(completedMeals);
    const mealDate = new Date(meal.timestamp);
    const dailyTotals = await this.getDailyTotals(completedMeals, mealDate);
    const goals = await DailyGoalsService.getDailyGoals();

    if (completedMeals.length >= 1) {
      state = await this.unlock('first_meal', state);
    }
    if (completedMeals.length >= 5) {
      state = await this.unlock('meals_5', state);
    }
    if (completedMeals.length >= 15) {
      state = await this.unlock('meals_15', state);
    }
    if (completedMeals.length >= 30) {
      state = await this.unlock('meals_30', state);
    }
    if (streak >= 3) {
      state = await this.unlock('streak_3', state);
    }
    if (streak >= 7) {
      state = await this.unlock('streak_7', state);
    }
    if (meal.scanType === 'ingredients') {
      state = await this.unlock('recipe_creator', state);
    }
    if (this.hasFilipinoLabel(meal)) {
      state = await this.unlock('filipino_finder', state);
    }
    if (dailyTotals.calories >= goals.calories * 0.9 && dailyTotals.calories <= goals.calories * 1.1) {
      state = await this.unlock('goal_day', state);
    }
    if (mealDate.getHours() < 9) {
      state = await this.unlock('early_riser', state);
    }
    if (
      dailyTotals.calories >= goals.calories * 0.9 &&
      dailyTotals.protein >= goals.protein * 0.9
    ) {
      state = await this.unlock('macro_balance', state);
    }

    const dayKeys = Array.from(
      new Set(completedMeals.map(item => this.getDayKey(new Date(item.timestamp))))
    ).sort();

    if (dayKeys.length >= 2) {
      const previousDay = new Date(dayKeys[dayKeys.length - 2]);
      const latestDay = new Date(dayKeys[dayKeys.length - 1]);
      const gapDays = Math.round((latestDay.getTime() - previousDay.getTime()) / (24 * 60 * 60 * 1000));
      if (gapDays >= 2) {
        state = await this.unlock('comeback', state);
      }
    }
  }

  async recordJogSession(totalSessions: number): Promise<void> {
    let state = await this.getState();
    state = await this.unlock('jog_starter', state);
    if (totalSessions >= 5) {
      state = await this.unlock('jog_regular', state);
    }
  }
}

export default new AchievementsService();
