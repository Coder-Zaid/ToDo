#!/usr/bin/env node
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const TOKEN_FILE = path.join(__dirname, 'whatsapp-token.json');

function getToken() {
  if (!fs.existsSync(TOKEN_FILE)) {
    throw new Error('whatsapp-token.json not found');
  }
  const data = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
  return data.access_token;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', async (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;

  try {
    const msg = JSON.parse(trimmed);
    const token = getToken();

    const res = await fetch('https://whatsapp.finereli.com/mcp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Authorization': `Bearer ${token}`
      },
      body: trimmed
    });

    const resData = await res.json();
    process.stdout.write(JSON.stringify(resData) + '\n');
  } catch (err) {
    if (trimmed.includes('"id"')) {
      try {
        const parsed = JSON.parse(trimmed);
        process.stdout.write(JSON.stringify({
          jsonrpc: '2.0',
          id: parsed.id,
          error: {
            code: -32603,
            message: err.message || 'Internal proxy error'
          }
        }) + '\n');
      } catch (_) {}
    }
  }
});
