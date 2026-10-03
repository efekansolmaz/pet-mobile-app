import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'Name is required'),
});

export const petSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  species: z.string().min(1, 'Species is required'),
  breed: z.string().optional(),
  gender: z.string().optional(),
  birth_date: z.string().optional(),
  weight: z.string().optional(),
  color: z.string().optional(),
  notes: z.string().optional(),
});

export const vaccinationSchema = z.object({
  vaccine_name: z.string().min(1, 'Vaccine name is required'),
  date_administered: z.string().min(1, 'Date is required'),
  next_due_date: z.string().optional(),
  veterinarian: z.string().optional(),
  notes: z.string().optional(),
});

export const medicationSchema = z.object({
  medication_name: z.string().min(1, 'Medication name is required'),
  dosage: z.string().min(1, 'Dosage is required'),
  frequency: z.string().min(1, 'Frequency is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  notes: z.string().optional(),
});

export const visitSchema = z.object({
  veterinarian_name: z.string().min(1, 'Veterinarian is required'),
  clinic_name: z.string().optional(),
  visit_date: z.string().min(1, 'Visit date is required'),
  reason: z.string().optional(),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
  notes: z.string().optional(),
  next_visit_date: z.string().optional(),
});

export const reminderSchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  due_at: z.string().min(1, 'Due date is required'),
  repeat_rule: z.string().min(1),
});

export const nutritionSchema = z.object({
  food_name: z.string().min(1, 'Food name is required'),
  brand: z.string().optional(),
  feeding_amount: z.string().min(1, 'Amount is required'),
  feeding_frequency: z.string().min(1, 'Frequency is required'),
  notes: z.string().optional(),
});

export const weightSchema = z.object({
  weight: z.string().min(1, 'Weight is required'),
  notes: z.string().optional(),
});
