const mqtt = require('mqtt');
const express = require('express');
const cors = require('cors');
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors()); // อนุญาตให้ Frontend (Cross-Origin) เรียกใช้งานได้

// --- ⚙️ Config Paths (ปรับให้ตรงกับเครื่อง Server) ---
const ccpPath = path.resolve('/home/ubuntu/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json');
const walletPath = path.join(process.cwd(), 'wallet');
const mspOrg1Path = '/home/ubuntu/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/User1@org1.example.com/msp';

let latestData = { temp: 0, timestamp: null, blockchainStatus: 'Waiting...' };

// --- 🔐 Setup Wallet (Authentication) ---
async function setupWallet() {
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const identity = await wallet.get('appUser');
    if (!identity) {
        console.log('creating new wallet identity...');
        const certPath = path.join(mspOrg1Path, 'signcerts/User1@org1.example.com-cert.pem');
        const certificate = fs.readFileSync(certPath).toString();
        
        // หาไฟล์ Private Key (ชื่อไฟล์จะสุ่ม ต้องอ่านจากโฟลเดอร์ keystore)
        const keyDir = path.join(mspOrg1Path, 'keystore');
        const keyFiles = fs.readdirSync(keyDir);
        const keyPath = path.join(keyDir, keyFiles[0]);
        const privateKey = fs.readFileSync(keyPath).toString();
        
        await wallet.put('appUser', {
            credentials: { certificate, privateKey },
            mspId: 'Org1MSP',
            type: 'X.509',
        });
    }
    return wallet;
}

// --- ⛓️ Function: Save to Blockchain ---
async function recordOnBlockchain(tempValue) {
    try {
        const wallet = await setupWallet();
        const gateway = new Gateway();
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });
        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('basic');
        
        const assetID = `asset-${Date.now()}`; // สร้าง ID จากเวลาปัจจุบัน
        console.log(`⚡ Sending Temp: ${tempValue} (ID: ${assetID})`);
        
        // บันทึกลง Ledger
        await contract.submitTransaction('CreateAsset', assetID, 'Red', '5', 'KidBright_Sensor', tempValue.toString());
        
        console.log('✅ Saved to Blockchain!');
        gateway.disconnect();
    } catch (error) {
        console.error(`❌ Blockchain Error: ${error}`);
    }
}

// --- 📜 Function: Get History (Query Ledger) ---
async function getHistory() {
    try {
        const wallet = await setupWallet();
        const gateway = new Gateway();
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });
        const network = await gateway.getNetwork('mychannel');
        const contract = network.getContract('basic');

        console.log('🔍 Querying History...');
        // ดึงข้อมูล Asset ทั้งหมดที่มีในระบบ
        const result = await contract.evaluateTransaction('GetAllAssets');
        gateway.disconnect();
        
        return JSON.parse(result.toString());
    } catch (error) {
        console.error(`❌ Query Error: ${error}`);
        return [];
    }
}

// --- 📡 MQTT Listener (รับค่าจาก IoT) ---
const mqttClient = mqtt.connect('mqtt://localhost');
mqttClient.on('connect', () => {
    console.log('✅ MQTT Connected');
    mqttClient.subscribe('kidbright/temp');
});
mqttClient.on('message', (topic, message) => {
    try {
        const data = JSON.parse(message.toString());
        console.log(`📩 Recv: ${data.temp}°C`);
        latestData.temp = data.temp;
        recordOnBlockchain(data.temp); // บันทึกลง Blockchain ทันที
    } catch (e) { console.error(e); }
});

// --- 🌐 API Endpoints ---

// 1. ดึงค่าล่าสุด (Real-time)
app.get('/api/temp', (req, res) => res.json(latestData));

// 2. ดึงประวัติทั้งหมดจาก Blockchain (Log)
app.get('/api/history', async (req, res) => {
    const history = await getHistory();
    // เรียงข้อมูลจาก ใหม่ -> เก่า
    history.sort((a, b) => (a.ID < b.ID) ? 1 : -1);
    res.json(history);
});

// Start Server
app.listen(3000, () => console.log('🌐 Server running on port 3000'));
