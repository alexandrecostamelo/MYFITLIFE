'use client';

import { useEffect } from 'react';
import { syncWidgetData, type WidgetData } from '@/lib/widgets/sync';

interface Props {
  data: WidgetData;
}

export function WidgetSync({ data }: Props) {
  useEffect(() => {
    syncWidgetData(data);
  }, [data]);
  return null;
}
