import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sku = searchParams.get('sku');
  const { data, error } = await supabase.from('goods').select('*').eq('sku', sku);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function POST(request) {
  const body = await request.json();
  const { data, error } = await supabase.from('inventory_logs').insert([body]);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true, data });
}
