#!/usr/bin/env node
/**
 * Test script for native messaging host
 * Simulates what the browser extension does
 */

const { spawn } = require('child_process');
const path = require('path');

// Start the native host
const hostPath = path.join(__dirname, 'native-host-runner.js');
const host = spawn('node', [hostPath]);

let responseBuffer = Buffer.alloc(0);

host.stdout.on('data', (data) => {
  responseBuffer = Buffer.concat([responseBuffer, data]);

  // Try to read messages
  while (responseBuffer.length >= 4) {
    const messageLength = responseBuffer.readUInt32LE(0);

    if (responseBuffer.length >= 4 + messageLength) {
      const messageBytes = responseBuffer.slice(4, 4 + messageLength);
      const message = JSON.parse(messageBytes.toString('utf8'));

      console.log('Received from host:', JSON.stringify(message, null, 2));

      responseBuffer = responseBuffer.slice(4 + messageLength);
    } else {
      break;
    }
  }
});

host.stderr.on('data', (data) => {
  console.log('Host stderr:', data.toString());
});

host.on('close', (code) => {
  console.log('Host exited with code:', code);
  process.exit(code || 0);
});

// Send a ping message
function sendMessage(message) {
  const messageStr = JSON.stringify(message);
  const messageBuffer = Buffer.from(messageStr, 'utf8');
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32LE(messageBuffer.length, 0);

  console.log('Sending message:', messageStr);
  host.stdin.write(lengthBuffer);
  host.stdin.write(messageBuffer);
}

// Wait a bit for host to start
setTimeout(() => {
  console.log('\n--- Testing ping ---');
  sendMessage({ type: 'ping' });

  setTimeout(() => {
    console.log('\n--- Testing get_config ---');
    sendMessage({ type: 'get_config' });

    setTimeout(() => {
      console.log('\n--- Testing browser_activity ---');
      sendMessage({
        type: 'browser_activity',
        data: {
          userId: 'test-user',
          timestamp: Date.now(),
          url: 'https://github.com',
          title: 'GitHub',
          domain: 'github.com',
          category: 'deep',
          sessionDuration: 5000,
          keystrokeCount: 10,
          scrollCount: 5,
          clickCount: 3,
          isIdle: false,
          mediaPlaying: false,
          mediaSource: null,
          favIconUrl: null
        }
      });

      setTimeout(() => {
        console.log('\n--- Closing host ---');
        host.stdin.end();
      }, 1000);
    }, 1000);
  }, 1000);
}, 500);
