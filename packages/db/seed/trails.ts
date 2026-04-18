import { supabase } from './_client';
import { trails } from './trails-data';

async function main() {
  console.log(`Inserindo ${trails.length} trilhas...`);

  for (const trail of trails) {
    const { error } = await supabase.from('trails').upsert(trail, { onConflict: 'slug' });
    if (error) {
      console.error('Erro em', trail.slug, error);
      process.exit(1);
    }
    console.log('OK:', trail.slug);
  }

  console.log('Seed de trilhas concluído.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
