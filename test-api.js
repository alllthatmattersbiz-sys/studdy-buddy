const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;

if (!apiKey) {
  console.error("❌ API Key not found!");
  process.exit(1);
}

console.log("✅ API Key found!");
console.log("First 10 chars:", apiKey.substring(0, 10) + "...");