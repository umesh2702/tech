

const PHONE = "+918121693113";
const BASE_URL = "http://localhost:3000";

async function testEndpoint(endpointName: string, path: string) {
  console.log(`\n========================================`);
  console.log(`TESTING ENDPOINT: ${endpointName} (${path})`);
  console.log(`========================================`);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ phone: PHONE })
    });

    const status = res.status;
    const body = await res.json();

    console.log(`HTTP Status: ${status}`);
    if (res.ok) {
      console.log(`✅ SUCCESS!`);
      console.log(`Delivery Log ID:`, body.deliveryLogId);
      console.log(`Message ID:`, body.messageId);
      console.log(`Items Sent Count/Title:`, body.itemsSentCount || body.itemSentTitle);
      console.log(`\n--- CONTENT SENT ---`);
      console.log(body.contentSent);
      console.log(`--------------------\n`);
      console.log(`Meta response details:`, JSON.stringify(body.metaDetails, null, 2));
    } else {
      console.error(`❌ FAILED!`);
      console.error(body);
    }
  } catch (error: any) {
    console.error(`❌ Request error:`, error.message);
  }
}

async function run() {
  // Test Top 5
  await testEndpoint("Top 5 Curated Digest", "/api/test-whatsapp/top5");

  // Test Daily Rollup
  await testEndpoint("Daily Digest", "/api/test-whatsapp/daily");

  // Test Instant Alert
  await testEndpoint("Instant Alert", "/api/test-whatsapp/instant");
}

run().catch(console.error);
