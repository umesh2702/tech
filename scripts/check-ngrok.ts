async function main() {
  console.log("Checking if ngrok is running locally...");
  try {
    const res = await fetch("http://localhost:4040/api/tunnels");
    if (res.ok) {
      const data = await res.json();
      console.log("✅ ngrok is running!");
      console.log("Active tunnels:");
      for (const tunnel of data.tunnels) {
        console.log(`- ${tunnel.name}: ${tunnel.public_url} -> ${tunnel.config.addr}`);
      }
    } else {
      console.log(`❌ ngrok local API responded with status: ${res.status}`);
    }
  } catch (err: any) {
    console.log("❌ ngrok does not seem to be running on http://localhost:4040.");
    console.log("Details:", err.message);
  }
}

main().catch(console.error);
