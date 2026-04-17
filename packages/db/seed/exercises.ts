import { supabase } from './_client';
import { exercises } from './exercises-data';

async function main() {
  console.log(`Inserindo ${exercises.length} exercícios...`);

  const { data: existing } = await supabase.from('exercises').select('slug');
  const existingSlugs = new Set((existing || []).map((e: any) => e.slug));

  const toInsert = exercises.filter((e) => !existingSlugs.has(e.slug));
  console.log(`${toInsert.length} novos exercícios para inserir.`);

  if (toInsert.length === 0) {
    console.log('Nada a inserir.');
    return;
  }

  const batchSize = 50;
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    const { error } = await supabase.from('exercises').insert(batch.map((e) => ({ ...e, verified: true })));
    if (error) {
      console.error('Erro no batch:', error);
      process.exit(1);
    }
    console.log(`Inseridos ${Math.min(i + batchSize, toInsert.length)}/${toInsert.length}`);
  }

  console.log('OK.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
