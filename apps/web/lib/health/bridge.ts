import { Capacitor } from '@capacitor/core';

export type HealthMetric =
  | 'steps'
  | 'heart_rate'
  | 'resting_heart_rate'
  | 'hrv'
  | 'active_calories'
  | 'sleep_duration'
  | 'weight'
  | 'body_fat_pct'
  | 'workout';

export interface HealthSample {
  metric: HealthMetric;
  value: number;
  unit: string;
  source: 'apple_health' | 'health_connect';
  sampled_at: string;
  metadata?: Record<string, unknown>;
}

export interface HealthBridge {
  isAvailable(): Promise<boolean>;
  requestPermissions(): Promise<boolean>;
  readSamples(
    metric: HealthMetric,
    startDate: Date,
    endDate: Date
  ): Promise<HealthSample[]>;
  writeWeight(kg: number, date: Date): Promise<void>;
  writeWorkout(params: {
    type: string;
    startDate: Date;
    endDate: Date;
    calories: number;
  }): Promise<void>;
}

export function getHealthBridge(): HealthBridge | null {
  const platform = Capacitor.getPlatform();
  if (platform === 'ios') return createAppleHealthBridge();
  if (platform === 'android') return createHealthConnectBridge();
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _capgoHealth: any = null;

async function loadCapgoHealth() {
  if (!_capgoHealth) {
    const mod = await import('@capgo/capacitor-health');
    _capgoHealth = mod.Health;
  }
  return _capgoHealth;
}

function createAppleHealthBridge(): HealthBridge {
  const TYPES_READ = [
    'HKQuantityTypeIdentifierStepCount',
    'HKQuantityTypeIdentifierHeartRate',
    'HKQuantityTypeIdentifierRestingHeartRate',
    'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
    'HKQuantityTypeIdentifierActiveEnergyBurned',
    'HKQuantityTypeIdentifierBodyMass',
    'HKQuantityTypeIdentifierBodyFatPercentage',
    'HKCategoryTypeIdentifierSleepAnalysis',
  ];

  const TYPES_WRITE = [
    'HKQuantityTypeIdentifierBodyMass',
    'HKWorkoutTypeIdentifier',
  ];

  return {
    async isAvailable() {
      try {
        const hk = await loadCapgoHealth();
        const res = await hk.isAvailable();
        return !!res?.available;
      } catch {
        return false;
      }
    },

    async requestPermissions() {
      try {
        const hk = await loadCapgoHealth();
        await hk.requestAuthorization({
          all: [],
          read: TYPES_READ,
          write: TYPES_WRITE,
        });
        return true;
      } catch {
        return false;
      }
    },

    async readSamples(metric, startDate, endDate) {
      const hk = await loadCapgoHealth();
      const typeMap: Record<string, string> = {
        steps: 'HKQuantityTypeIdentifierStepCount',
        heart_rate: 'HKQuantityTypeIdentifierHeartRate',
        resting_heart_rate: 'HKQuantityTypeIdentifierRestingHeartRate',
        hrv: 'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
        active_calories: 'HKQuantityTypeIdentifierActiveEnergyBurned',
        weight: 'HKQuantityTypeIdentifierBodyMass',
        body_fat_pct: 'HKQuantityTypeIdentifierBodyFatPercentage',
      };

      const unitMap: Record<string, string> = {
        steps: 'count',
        heart_rate: 'bpm',
        resting_heart_rate: 'bpm',
        hrv: 'ms',
        active_calories: 'kcal',
        weight: 'kg',
        body_fat_pct: '%',
      };

      const hkType = typeMap[metric];
      if (!hkType) return [];

      try {
        if (metric === 'sleep_duration') {
          const result = await hk.queryCategorySamples({
            sampleName: 'HKCategoryTypeIdentifierSleepAnalysis',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            limit: 100,
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return ((result?.resultData || []) as any[]).map((s) => ({
            metric: 'sleep_duration' as const,
            value:
              (new Date(s.endDate).getTime() -
                new Date(s.startDate).getTime()) /
              3600000,
            unit: 'hours',
            source: 'apple_health' as const,
            sampled_at: s.startDate,
          }));
        }

        const result = await hk.queryQuantitySamples({
          sampleName: hkType,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          limit: 500,
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return ((result?.resultData || []) as any[]).map((s) => ({
          metric,
          value: s.quantity || s.value || 0,
          unit: unitMap[metric] || 'unknown',
          source: 'apple_health' as const,
          sampled_at: s.startDate || s.date,
        }));
      } catch {
        return [];
      }
    },

    async writeWeight(kg, date) {
      const hk = await loadCapgoHealth();
      await hk.writeQuantitySample({
        sampleName: 'HKQuantityTypeIdentifierBodyMass',
        unitName: 'kg',
        value: kg,
        startDate: date.toISOString(),
        endDate: date.toISOString(),
      });
    },

    async writeWorkout(params) {
      const hk = await loadCapgoHealth();
      await hk.writeWorkout({
        activityType:
          params.type === 'strength'
            ? 'HKWorkoutActivityTypeTraditionalStrengthTraining'
            : 'HKWorkoutActivityTypeFunctionalStrengthTraining',
        startDate: params.startDate.toISOString(),
        endDate: params.endDate.toISOString(),
        energyBurned: params.calories,
        energyBurnedUnit: 'kcal',
      });
    },
  };
}

function createHealthConnectBridge(): HealthBridge {
  return {
    async isAvailable() {
      try {
        const hc = await loadCapgoHealth();
        const res = await hc.checkAvailability();
        return res?.availability === 'Available';
      } catch {
        return false;
      }
    },

    async requestPermissions() {
      try {
        const hc = await loadCapgoHealth();
        await hc.requestHealthPermissions({
          read: [
            'Steps',
            'HeartRate',
            'RestingHeartRate',
            'HeartRateVariabilityRmssd',
            'ActiveCaloriesBurned',
            'Weight',
            'BodyFat',
            'SleepSession',
          ],
          write: ['Weight', 'ExerciseSession'],
        });
        return true;
      } catch {
        return false;
      }
    },

    async readSamples(metric, startDate, endDate) {
      const hc = await loadCapgoHealth();
      const typeMap: Record<string, string> = {
        steps: 'Steps',
        heart_rate: 'HeartRate',
        resting_heart_rate: 'RestingHeartRate',
        hrv: 'HeartRateVariabilityRmssd',
        active_calories: 'ActiveCaloriesBurned',
        weight: 'Weight',
        body_fat_pct: 'BodyFat',
        sleep_duration: 'SleepSession',
      };

      const unitMap: Record<string, string> = {
        steps: 'count',
        heart_rate: 'bpm',
        resting_heart_rate: 'bpm',
        hrv: 'ms',
        active_calories: 'kcal',
        weight: 'kg',
        body_fat_pct: '%',
        sleep_duration: 'hours',
      };

      const recordType = typeMap[metric];
      if (!recordType) return [];

      try {
        const result = await hc.readRecords({
          type: recordType,
          timeRangeFilter: {
            type: 'between',
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
          },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return ((result?.records || []) as any[]).map((r) => {
          let value = 0;
          if (metric === 'steps') value = r.count || 0;
          else if (metric === 'sleep_duration') {
            value = r.stages
              ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
                r.stages.reduce(
                  (s: number, st: any) =>
                    s +
                    (new Date(st.endTime).getTime() -
                      new Date(st.startTime).getTime()) /
                      3600000,
                  0
                )
              : (new Date(r.endTime).getTime() -
                  new Date(r.startTime).getTime()) /
                3600000;
          } else if (r.samples) {
            value =
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              r.samples.reduce(
                (s: number, sample: any) =>
                  s +
                  (sample.beatsPerMinute ||
                    sample.heartRateVariabilityMillis ||
                    0),
                0
              ) / (r.samples.length || 1);
          } else {
            value =
              r.weight?.inKilograms ||
              r.percentage ||
              r.energy?.inKilocalories ||
              0;
          }

          return {
            metric,
            value,
            unit: unitMap[metric] || 'unknown',
            source: 'health_connect' as const,
            sampled_at: r.time || r.startTime || r.endTime,
          };
        });
      } catch {
        return [];
      }
    },

    async writeWeight(kg, date) {
      const hc = await loadCapgoHealth();
      await hc.insertRecords({
        records: [
          {
            type: 'Weight',
            time: date.toISOString(),
            weight: { unit: 'kilograms', value: kg },
          },
        ],
      });
    },

    async writeWorkout(params) {
      const hc = await loadCapgoHealth();
      await hc.insertRecords({
        records: [
          {
            type: 'ExerciseSession',
            exerciseType: 'STRENGTH_TRAINING',
            startTime: params.startDate.toISOString(),
            endTime: params.endDate.toISOString(),
            title: 'MyFitLife Workout',
          },
        ],
      });
    },
  };
}
