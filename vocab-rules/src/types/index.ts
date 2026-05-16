export interface VocabRule {
  id: string;
  name: string;
  description: string;
  eventKey: string;
  condition: string;
  action: string;
  priority: number;
  active: boolean;
  hitCount: number;
  lastHitAt: string | null;
  createdAt: string;
}
