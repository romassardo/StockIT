/**
 * 🔍 TEST SIMPLE LOGIN - VER RESPUESTA EXACTA
 */

const http = require('http');

const loginData = {
    email: 'admin@stockit.com',
    password: 'Admin123'
};

const postData = JSON.stringify(loginData);

const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log('🔐 Probando login directo...');
console.log('📧 Email:', loginData.email);
console.log('🔑 Password:', loginData.password);
console.log('\n📋 RESPUESTA COMPLETA:');

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('\nRaw Response Body:', data);
        
        try {
            const parsedData = JSON.parse(data);
            console.log('\nParsed Response:');
            console.log(JSON.stringify(parsedData, null, 2));
            
            if (parsedData.token) {
                console.log('\n✅ TOKEN ENCONTRADO:', parsedData.token.substring(0, 50) + '...');
            } else {
                console.log('\n❌ NO HAY TOKEN EN LA RESPUESTA');
            }
        } catch (e) {
            console.log('\n❌ Error parseando JSON:', e.message);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Error: ${e.message}`);
});

req.write(postData);
req.end(); 