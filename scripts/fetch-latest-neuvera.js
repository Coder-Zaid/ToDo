const fs = require('fs');
const path = require('path');

async function getLatestNeuvera() {
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

  console.log('Syncing latest WhatsApp messages...');
  const syncRes = await callMcp('sync_now', {});
  console.log('Sync result:', syncRes[0]?.text);

  console.log('Fetching last 30 messages from Neuvera Core Team...');
  const msgs = await callMcp('get_messages', {
    chat: '120363431124000020@g.us',
    limit: 30
  });

  console.log('--- MESSAGES ---');
  console.log(msgs[0]?.text);
}

getLatestNeuvera().catch(console.error);
