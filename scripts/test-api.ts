async function testApi() {
  console.log('Fetching /api/intelligence...');
  const res = await fetch('http://localhost:3000/api/intelligence?limit=5');
  
  if (!res.ok) {
    console.error(`API Failed with status: ${res.status}`);
    process.exit(1);
  }
  
  const body = await res.json();
  const items = body.data;
  console.log(`✅ API Success. Fetched ${items.length} items.`);
  console.log(`Top item: [${items[0].opportunityScore}/10] ${items[0].title}`);
  
  // Test category filtering
  const resCat = await fetch('http://localhost:3000/api/intelligence?category=AI&limit=2');
  const bodyCat = await resCat.json();
  console.log(`✅ API Filter Success. Fetched ${bodyCat.data.length} AI items.`);
}

testApi().catch(console.error);
