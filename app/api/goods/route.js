export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sku = searchParams.get('sku');
  
  const res = await fetch(`https://khovpgqqrltmiclwzec.supabase.co/rest/v1/goods?sku=eq.${sku}&select=*`, {
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtob3ZwZ3FxcmlsdG1pY2x3emVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzMyNDQsImV4cCI6MjA5OTM0OTI0NH0.H1BAyz93efH4FRC6TzBgR9RF8Qnhmps8WCdltvc-W9k',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtob3ZwZ3FxcmlsdG1pY2x3emVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzMyNDQsImV4cCI6MjA5OTM0OTI0NH0.H1BAyz93efH4FRC6TzBgR9RF8Qnhmps8WCdltvc-W9k'
    }
  });
  const data = await res.json();
  return Response.json(data);
}

export async function POST(request) {
  const body = await request.json();
  await fetch('https://khovpgqqrltmiclwzec.supabase.co/rest/v1/flow', {
    method: 'POST',
    headers: {
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtob3ZwZ3FxcmlsdG1pY2x3emVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzMyNDQsImV4cCI6MjA5OTM0OTI0NH0.H1BAyz93efH4FRC6TzBgR9RF8Qnhmps8WCdltvc-W9k',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtob3ZwZ3FxcmlsdG1pY2x3emVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzMyNDQsImV4cCI6MjA5OTM0OTI0NH0.H1BAyz93efH4FRC6TzBgR9RF8Qnhmps8WCdltvc-W9k',
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(body)
  });
  return Response.json({ success: true });
}
