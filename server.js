const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const app = express();

// Разрешаем запросы с твоего сайта Vercel
app.use(cors()); 

app.get('/api/get-kyc-token', (req, res) => {
    try {
        const rawClientKey = uuidv4(); 
        const password = process.env.NEUROVISION_SECRET_KEY;
        const scenario = process.env.NEUROVISION_SCENARIO_ID;
        
        if (!password || !scenario) {
            return res.status(500).json({ success: false, error: "Ключи не настроены на сервере" });
        }

        // Шифрование по стандарту NeuroVision
        const key = crypto.createHash('sha256').update(password).digest('hex').substring(0, 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        
        const clientKeyEncrypted = Buffer.concat([
            iv, 
            cipher.update(rawClientKey, 'utf8'), 
            cipher.final()
        ]).toString('base64');

        // Отдаем ключи на фронтенд
        res.json({
            success: true,
            encryptedKey: clientKeyEncrypted,
            scenarioId: scenario
        });

    } catch (error) {
        console.error("Ошибка:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Veris Backend запущен на порту ${PORT}`);
});
