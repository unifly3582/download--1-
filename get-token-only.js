const https = require('https');
const FIREBASE_API_KEY = 'AIzaSyBVX5nnclU8xrgIXtaoSr95bYFyRe3X_dE';
const postData = JSON.stringify({ email: 'uniflyinsect@gmail.com', password: '12345678', returnSecureToken: true });
const options = {
  hostname: 'identitytoolkit.googleapis.com',
  path: `/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.idToken) {
        console.log(json.idToken);
      } else {
        console.error('Failed to get token:', JSON.stringify(json, null, 2));
        process.exit(1);
      }
    } catch (e) {
      console.error('Parse error:', e.message);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
  process.exit(1);
});

req.write(postData);
req.end();
