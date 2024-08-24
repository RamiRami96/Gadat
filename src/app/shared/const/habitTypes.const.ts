import { SelectDataModel } from "../models/selectedData.model";

export const habitTypes: SelectDataModel[] = [
  { value: 'Health', viewValue: 'Health' },
  { value: 'Job', viewValue: 'Job' },
  { value: 'Relationships', viewValue: 'Relationships' },
];
export const healthHabits: SelectDataModel[] = [
  { value: 'Regular exercise', viewValue: 'Regular exercise' },
  { value: 'Adequate sleep', viewValue: 'Adequate sleep' },
  { value: 'Limit screen time', viewValue: 'Limit screen time' },
];
export const jobHabits: SelectDataModel[] = [
  { value: 'Daily goals', viewValue: 'Daily goals' },
  { value: 'Learn working skill', viewValue: 'Learn working skill' },
  { value: 'Take breaks', viewValue: 'Take breaks' },
];
export const relationshipHabits: SelectDataModel[] = [
  { value: 'Meet new people', viewValue: 'Meet new people' },
  { value: 'Be confidient', viewValue: 'Be confidient' },
  { value: 'Practice physical touch', viewValue: 'Practice physical Touch' },
];