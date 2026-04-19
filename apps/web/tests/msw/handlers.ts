import { supabaseHandlers } from './supabase-handlers';
import { anthropicHandlers } from './anthropic-handlers';

export const handlers = [
  ...supabaseHandlers,
  ...anthropicHandlers,
];
