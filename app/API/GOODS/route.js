const SUPABASE_URL = 'https://khovpgqqrltmiclwzec.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtob3ZwZ3FxcmlsdG1pY2x3emVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzMyNDQsImV4cCI6MjA5OTM0OTI0NH0.H1BAyz93efH4FRC6TzBgR9RF8Qnhmps8WCdltvc-W9k';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sku = searchParams.get('sku');
  
  if (!sku) return Response.json({ error: 'sku不能为空' }, { status: 400 });

  try {
    const url = `${SUPABASE_URL}/rest/v1/goods?sku=eq.${sku}&select=*`;
    const res = await fetch(url, {
      headers: {
        'apikey': KEY,
        'Authorization': `Bearer ${KEY}`
      },
      cache: 'no-store'
    });
    const data = await res.json();
    return Response.json(data);
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  const body = await request.json();

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/flow`, {
      method: 'POST',
      headers: {
        'apikey': KEY,
        'Authorization': `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('插入失败');
    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
