import { supabase } from './_client';
import { foods } from './foods-data';

async function main() {
  console.log(`Inserindo ${foods.length} alimentos...`);

  const { data: existing } = await supabase.from('foods').select('name').eq('source', 'taco');
  const existingNames = new Set((existing || []).map((f: any) => f.name));

  const toInsert = foods.filter((f) => !existingNames.has(f.name));
  console.log(`${toInsert.length} novos alimentos para inserir.`);

  if (toInsert.length === 0) {
    console.log('Nada a inserir.');
    return;
  }

  const batchSize = 50;
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    const { error } = await supabase.from('foods').insert(batch.map((f) => ({ ...f, verified: true })));
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
