async function test() {
  console.log("Fetching http://localhost:3000/api/inngest...");
  try {
    const res = await fetch("http://localhost:3000/api/inngest");
    console.log(`Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    
    // Check if it's a Next.js error page and try to find the error message
    console.log("=== FULL RESPONSE BODY ===");
    console.log(text);
  } catch (err: any) {
    console.error("Fetch failed:", err);
  }
}

test();
