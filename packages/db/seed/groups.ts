import { supabase } from './_client';
import { groups } from './groups-data';

async function main() {
  console.log(`Inserindo ${groups.length} grupos...`);
  for (const g of groups) {
    const { error } = await supabase.from('community_groups').upsert(g, { onConflict: 'slug' });
    if (error) {
      console.error('Erro em', g.slug, error);
      process.exit(1);
    }
  }
  console.log('Seed de grupos concluído.');
}

main().catch((err) => { console.error(err); process.exit(1); });
