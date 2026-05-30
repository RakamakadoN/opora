const https = require('https');
https.get('https://openrouter.ai/api/v1/models', (resp) => {
  let data = '';
  resp.on('data', (chunk) => { data += chunk; });
  resp.on('end', () => {
    const models = JSON.parse(data).data;
    const freeGeminis = models.filter(m => m.id.includes('gemini') && m.id.includes('free')).map(m => m.id);
    console.log(freeGeminis);
  });
});