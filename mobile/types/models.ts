export type Pet = {
  id: string;
  owner_id: string;
  name: string;
  species: string;
  breed?: string | null;
  gender?: string | null;
  birth_date?: string | null;
  weight?: number | null;
  color?: string | null;
  photo_url?: string | null;
  notes?: string | null;
  microchip_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

export type Vaccination = {
  id: string;
  pet_id: string;
  vaccine_name: string;
  date_administered: string;
  next_due_date?: string | null;
  veterinarian?: string | null;
  notes?: string | null;
  document_url?: string | null;
  created_at: string;
};

export type Medication = {
  id: string;
  pet_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string | null;
  notes?: string | null;
  is_completed: boolean;
  created_at: string;
};

export type Visit = {
  id: string;
  pet_id: string;
  veterinarian_name: string;
  clinic_name?: string | null;
  visit_date: string;
  reason?: string | null;
  diagnosis?: string | null;
  treatment?: string | null;
  notes?: string | null;
  next_visit_date?: string | null;
  created_at: string;
};

export type WeightRecord = {
  id: string;
  pet_id: string;
  weight: number;
  recorded_at: string;
  notes?: string | null;
};

export type WeightStats = {
  current: number | null;
  minimum: number | null;
  maximum: number | null;
  change_from_previous: number | null;
  records: WeightRecord[];
};

export type Reminder = {
  id: string;
  pet_id: string;
  type: string;
  title: string;
  description?: string | null;
  due_at: string;
  repeat_rule: string;
  completed: boolean;
  completed_at?: string | null;
  created_at: string;
};

export type NutritionPlan = {
  id: string;
  pet_id: string;
  food_name: string;
  brand?: string | null;
  feeding_amount: string;
  feeding_frequency: string;
  notes?: string | null;
  is_active: boolean;
};

export type FeedingLog = {
  id: string;
  pet_id: string;
  food_name: string;
  amount: string;
  fed_at: string;
  notes?: string | null;
};

export type Dashboard = {
  pet: Pet;
  upcoming_vaccination?: Vaccination | null;
  active_medications: Medication[];
  upcoming_visit?: Visit | null;
  todays_reminders: Reminder[];
  recent_weights: WeightRecord[];
  todays_feedings: FeedingLog[];
  recent_visits: Visit[];
};

export type HealthPassport = {
  pet: Pet;
  vaccinations: Vaccination[];
  medications: Medication[];
  visits: Visit[];
  weights: WeightRecord[];
  nutrition_plans: NutritionPlan[];
  important_notes?: string | null;
};

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};
