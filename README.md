🌐 IoT Blockchain Middleware (Node.js Server)
ระบบ Middleware สำหรับเชื่อมต่อระหว่าง อุปกรณ์ IoT (KidBright/ESP32) และ Blockchain (Hyperledger Fabric) โดยทำหน้าที่รับค่าผ่าน MQTT, บันทึกลง Blockchain และเปิด API ให้ Frontend ดึงประวัติข้อมูล (Log) ไปแสดงผล

📋 1. Prerequisites (สิ่งที่ต้องมีก่อน)
Ubuntu Server (AWS EC2 หรือ Localhost)

Node.js (v14 หรือ v16)

Hyperledger Fabric Test Network (ที่รันและ Deploy Chaincode ชื่อ basic แล้ว)

MQTT Broker (Mosquitto)

🛠️ 2. Installation (การติดตั้ง)
สร้างโฟลเดอร์โปรเจกต์และเข้าไปข้างใน

## mkdir backend-blockchain
## cd backend-blockchain

ติดตั้ง Dependencies ที่จำเป็น
## npm init -y
## npm install express mqtt cors fabric-network fabric-ca-client

💻 3. Server Code (server.js)
สร้างไฟล์ server.js และใส่โค้ด 

🚀 4. How to Run (การสั่งรัน)
รันคำสั่งนี้เพื่อเริ่มระบบ:

## node server.js

Troubleshooting: หากขึ้น Error ว่า Port 3000 ถูกใช้งานอยู่ ให้ใช้คำสั่งเคลียร์ Port: 
## sudo fuser -k 3000/tcp

📡 5. API Documentation
🔹 Get All History Logs (ดึงประวัติ)
ดึงข้อมูล Transaction ทั้งหมดที่ถูกบันทึกลงใน Blockchain

URL: [/api/history](http://13.212.111.239:3000/api/history)
http://13.212.111.239:3000/api/history

Method: GET




