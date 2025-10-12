#!/usr/bin/env node
/**
 * Test script to verify Productivity Monkey server connectivity
 *
 * Usage:
 *   node test-server-connection.js https://prodmon.haielab.org [api-key]
 */

const https = require('https');
const http = require('http');

const serverUrl = process.argv[2] || 'https://prodmon.haielab.org';
const apiKey = process.argv[3] || '';

console.log('🔍 Testing Productivity Monkey Server Connection');
console.log('================================================\n');
console.log(`Server URL: ${serverUrl}`);
console.log(`API Key: ${apiKey ? '****' + apiKey.slice(-4) : '(not provided)'}\n`);

// Test 1: Health Check (no auth required)
async function testHealthCheck() {
  console.log('Test 1: Health Check Endpoint...');

  return new Promise((resolve) => {
    const url = new URL(serverUrl + '/health');
    const client = url.protocol === 'https:' ? https : http;

    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            if (json.status === 'ok') {
              console.log('✅ Health check passed');
              console.log(`   Response: ${data}\n`);
              resolve(true);
            } else {
              console.log('❌ Health check failed: Invalid response');
              console.log(`   Response: ${data}\n`);
              resolve(false);
            }
          } catch (e) {
            console.log('❌ Health check failed: Invalid JSON');
            console.log(`   Response: ${data}\n`);
            resolve(false);
          }
        } else {
          console.log(`❌ Health check failed: HTTP ${res.statusCode}`);
          console.log(`   Response: ${data}\n`);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.log(`❌ Health check failed: ${e.message}\n`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log('❌ Health check failed: Timeout\n');
      resolve(false);
    });
  });
}

// Test 2: Get Users (requires auth)
async function testGetUsers() {
  if (!apiKey) {
    console.log('Test 2: Get Users Endpoint... SKIPPED (no API key provided)\n');
    return null;
  }

  console.log('Test 2: Get Users Endpoint...');

  return new Promise((resolve) => {
    const url = new URL(serverUrl + '/api/users');
    const client = url.protocol === 'https:' ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const json = JSON.parse(data);
            console.log('✅ Get users passed');
            console.log(`   Found ${json.users?.length || 0} users\n`);
            resolve(true);
          } catch (e) {
            console.log('❌ Get users failed: Invalid JSON');
            console.log(`   Response: ${data}\n`);
            resolve(false);
          }
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          console.log(`❌ Get users failed: Authentication error (${res.statusCode})`);
          console.log('   Check your API key\n');
          resolve(false);
        } else {
          console.log(`❌ Get users failed: HTTP ${res.statusCode}`);
          console.log(`   Response: ${data}\n`);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.log(`❌ Get users failed: ${e.message}\n`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log('❌ Get users failed: Timeout\n');
      resolve(false);
    });

    req.end();
  });
}

// Test 3: Create Test Activity (requires auth)
async function testCreateActivity() {
  if (!apiKey) {
    console.log('Test 3: Create Activity Endpoint... SKIPPED (no API key provided)\n');
    return null;
  }

  console.log('Test 3: Create Activity Endpoint...');

  return new Promise((resolve) => {
    const url = new URL(serverUrl + '/api/activity');
    const client = url.protocol === 'https:' ? https : http;

    const testActivity = {
      id: 'test-' + Date.now(),
      userId: 'test-user',
      timestamp: Date.now(),
      appName: 'Test App',
      windowTitle: 'Test Window',
      category: 'admin',
      keystrokesCount: 10,
      mouseMovements: 5,
      isIdle: false
    };

    const postData = JSON.stringify(testActivity);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ Create activity passed');
          console.log(`   Response: ${data}\n`);
          resolve(true);
        } else if (res.statusCode === 401 || res.statusCode === 403) {
          console.log(`❌ Create activity failed: Authentication error (${res.statusCode})`);
          console.log('   Check your API key\n');
          resolve(false);
        } else {
          console.log(`❌ Create activity failed: HTTP ${res.statusCode}`);
          console.log(`   Response: ${data}\n`);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.log(`❌ Create activity failed: ${e.message}\n`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.log('❌ Create activity failed: Timeout\n');
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

// Run all tests
(async () => {
  const healthOk = await testHealthCheck();

  if (!healthOk) {
    console.log('⚠️  Server health check failed. Make sure the server is running.');
    console.log('   Check server logs for errors.\n');
    process.exit(1);
  }

  const usersOk = await testGetUsers();
  const activityOk = await testCreateActivity();

  console.log('================================================');
  console.log('Summary:');
  console.log(`  Health Check: ${healthOk ? '✅' : '❌'}`);
  if (apiKey) {
    console.log(`  Get Users:    ${usersOk ? '✅' : '❌'}`);
    console.log(`  Create Activity: ${activityOk ? '✅' : '❌'}`);
  } else {
    console.log(`  Get Users:    ⏭️  (skipped - no API key)`);
    console.log(`  Create Activity: ⏭️  (skipped - no API key)`);
  }
  console.log('================================================\n');

  if (healthOk && (usersOk === null || usersOk) && (activityOk === null || activityOk)) {
    console.log('🎉 All tests passed! Server is ready to use.\n');
    console.log('Next steps:');
    console.log('1. Open the Productivity Monkey app');
    console.log('2. Go to Settings (tray menu > Settings)');
    console.log('3. Enter server URL: ' + serverUrl);
    console.log('4. Enter API key: ' + (apiKey || '(get from server admin)'));
    console.log('5. Click "Test Connection"');
    console.log('6. Click "Save Settings"');
    console.log('7. Restart the app\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please check server configuration.\n');
    process.exit(1);
  }
})();
