
export interface Remedy {
  srNo: string;
  abbreviation: string;
  name: string;
}

export type Potency = '30C' | '200C' | '1M';

export const POTENCIES: Potency[] = ['30C', '200C', '1M'];

export type ClientSelections = Record<string, Set<Potency>>;

export interface SelectedRemedy extends Remedy {
  potencies: Potency[];
}