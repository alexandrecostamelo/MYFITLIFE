import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error('Faltam SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no packages/db/.env');
}

export const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});
