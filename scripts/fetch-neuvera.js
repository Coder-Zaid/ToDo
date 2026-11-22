const fs = require('fs');
const path = require('path');

async function getNeuveraMessages() {
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

  // First sync now to ensure we have the absolute latest messages
  console.log('Syncing latest messages...');
  await callMcp('sync_now', {});

  console.log('Fetching messages from Neuvera Core Team...');
  const res = await callMcp('get_messages', {
    chat: '120363431124000020@g.us',
    limit: 100
  });

  if (res && res[0] && res[0].text) {
    fs.writeFileSync(path.join(__dirname, 'neuvera-messages.txt'), res[0].text);
    console.log(`Saved ${res[0].text.length} bytes to neuvera-messages.txt`);
  } else {
    console.log('Response:', JSON.stringify(res, null, 2));
  }
}

getNeuveraMessages().catch(console.error);
