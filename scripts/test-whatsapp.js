const fs = require('fs');
const path = require('path');

async function testMcp() {
  const tokenData = JSON.parse(fs.readFileSync(path.join(__dirname, 'whatsapp-token.json'), 'utf8'));
  const token = tokenData.access_token;

  console.log('Sending MCP initialize...');
  const initRes = await fetch('https://whatsapp.finereli.com/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'black-todo-reader', version: '1.0.0' }
      }
    })
  });

  const initData = await initRes.json();
  console.log('Initialize response:', JSON.stringify(initData, null, 2));

  console.log('\nListing tools...');
  const toolsRes = await fetch('https://whatsapp.finereli.com/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    })
  });

  const toolsData = await toolsRes.json();
  console.log('Available tools:');
  if (toolsData.result && toolsData.result.tools) {
    for (const tool of toolsData.result.tools) {
      console.log(` - ${tool.name}: ${tool.description}`);
    }
  } else {
    console.log(JSON.stringify(toolsData, null, 2));
  }

  console.log('\nCalling list_chats...');
  const chatsRes = await fetch('https://whatsapp.finereli.com/mcp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'list_chats',
        arguments: { limit: 5 }
      }
    })
  });

  const chatsData = await chatsRes.json();
  console.log('list_chats result preview:');
  console.log(JSON.stringify(chatsData, null, 2).slice(0, 500) + '...');
}

testMcp().catch(err => console.error(err));
