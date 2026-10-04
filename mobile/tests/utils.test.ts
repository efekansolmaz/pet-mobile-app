import assert from 'node:assert';
import test from 'node:test';

import {
  loginSchema,
  medicationSchema,
  nutritionSchema,
  petSchema,
  reminderSchema,
  vaccinationSchema,
  weightSchema,
} from '../utils/validation.ts';
import { greeting, petAge } from '../utils/dates.ts';

test('validation schemas: loginSchema accepts valid emails and passwords', () => {
  const valid = loginSchema.safeParse({ email: 'user@example.com', password: 'Password123' });
  assert.strictEqual(valid.success, true);

  const badEmail = loginSchema.safeParse({ email: 'not-an-email', password: 'Password123' });
  assert.strictEqual(badEmail.success, false);

  const shortPass = loginSchema.safeParse({ email: 'user@example.com', password: '123' });
  assert.strictEqual(shortPass.success, false);
});

test('validation schemas: petSchema requires name and species', () => {
  const valid = petSchema.safeParse({ name: 'Max', species: 'dog', weight: '28.4' });
  assert.strictEqual(valid.success, true);

  const missingName = petSchema.safeParse({ name: '', species: 'dog' });
  assert.strictEqual(missingName.success, false);
});

test('validation schemas: vaccination and medication schemas', () => {
  const vac = vaccinationSchema.safeParse({
    vaccine_name: 'Rabies',
    date_administered: '2026-01-01',
  });
  assert.strictEqual(vac.success, true);

  const med = medicationSchema.safeParse({
    medication_name: 'Apoquel',
    dosage: '16 mg',
    frequency: 'once daily',
    start_date: '2026-10-01',
  });
  assert.strictEqual(med.success, true);
});

test('validation schemas: reminder and weight schemas', () => {
  const rem = reminderSchema.safeParse({
    type: 'medication',
    title: 'Give Apoquel',
    due_at: '2026-10-04T18:00:00Z',
    repeat_rule: 'daily',
  });
  assert.strictEqual(rem.success, true);

  const weight = weightSchema.safeParse({ weight: '12.4' });
  assert.strictEqual(weight.success, true);
});

test('dates: petAge calculates human-readable age', () => {
  assert.strictEqual(petAge(null), 'Age unknown');
  const recentBirth = new Date();
  recentBirth.setMonth(recentBirth.getMonth() - 3);
  assert.strictEqual(petAge(recentBirth.toISOString()), 'Under 1 year');
});

test('dates: greeting returns string', () => {
  const g = greeting();
  assert.ok(['Good morning', 'Good afternoon', 'Good evening'].includes(g));
});
