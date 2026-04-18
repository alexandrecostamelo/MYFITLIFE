import { supabase } from './_client';
import { achievements } from './achievements-data';

async function main() {
  console.log(`Inserindo ${achievements.length} conquistas...`);
  for (const a of achievements) {
    const { error } = await supabase.from('achievements').upsert(a, { onConflict: 'slug' });
    if (error) { console.error('Erro em', a.slug, error); process.exit(1); }
  }
  console.log('Seed de conquistas concluído.');
}

main().catch((err) => { console.error(err); process.exit(1); });
