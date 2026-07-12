async function testGeneralQuestionWithKeyword() {
  try {
    console.log("Testing general question containing transaction keyword 'stake'...");
    // Let's call /api/intent/parse like the frontend does when it detects a keyword.
    // The frontend handleSendMessage will call /api/intent/parse first because of the keyword.
    // If intent.action === "unknown", it will fall back to /api/intent/chat.
    // Let's simulate this logic:
    const parseRes = await fetch("http://localhost:5000/api/intent/parse", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Blockchain": "cardano"
      },
      body: JSON.stringify({
        prompt: "What is staking and why is it useful on Cardano?"
      })
    });
    const parseData = await parseRes.json();
    console.log("Parse Response Action:", parseData.intent?.action);
    
    if (parseData.intent?.action === "unknown") {
      console.log("Action is unknown. Falling back to chat...");
      const chatRes = await fetch("http://localhost:5000/api/intent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Blockchain": "cardano"
        },
        body: JSON.stringify({
          prompt: "What is staking and why is it useful on Cardano?"
        })
      });
      const chatData = await chatRes.json();
      console.log("Conversational Chat Fallback Response:", chatData.text);
    } else {
      console.log("Parsed as valid transaction (no fallback needed).");
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

testGeneralQuestionWithKeyword();
