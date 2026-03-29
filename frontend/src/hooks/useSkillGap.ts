import { useState, useEffect } from 'react';

export interface SkillGapItem {
  skill: string;
  current_level: number;
  avg_current_level: number;
  required_level: number;
  gap: number;
  gap_percent: number;
  risk_level: string;
}

export function useSkillGap() {
  const [data, setData] = useState<SkillGapItem[]>([]);
  const [items, setItems] = useState<SkillGapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Fetch from API
    setData([]);
    setItems([]);
    setLoading(false);
  }, []);

  return { data, items, loading, error };
}
