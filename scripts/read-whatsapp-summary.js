const fs = require('fs');
const path = require('path');

async function checkRecentMessages() {
  const tokenData = JSON.parse(fs.readFileSync(path.join(process.env.USERPROFILE, '.whatsapp-mcp', 'whatsapp-token.json'), 'utf8'));
  const token = tokenData.access_token;

  async function callMcp(name, args = {}) {
    const res = await fetch('https://whatsapp.finereli.com/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/call',
        params: { name, arguments: args }
      })
    });
    const data = await res.json();
    return data.result ? data.result.content : data;
  }

  console.log('--- RECENT CHATS ---');
  const chats = await callMcp('list_chats', { limit: 5 });
  console.log(chats[0]?.text);

  console.log('\n--- UNANSWERED CHATS (WAITING FOR YOUR REPLY) ---');
  const unanswered = await callMcp('unanswered_chats', { limit: 5 });
  console.log(unanswered[0]?.text || 'None');
}

checkRecentMessages().catch(console.error);
