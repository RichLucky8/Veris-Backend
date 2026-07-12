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
// --- СЕЙФ В ОПЕРАТИВНОЙ ПАМЯТИ ---
const verifiedUsers = new Set();

// Маршрут для сохранения успешного KYC
app.post('/api/save-kyc-status', express.json(), (req, res) => {
    const { telegramId } = req.body;
    if (telegramId) {
        verifiedUsers.add(String(telegramId)); // Записываем ID в память
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, error: 'Нет Telegram ID' });
    }
});

// Маршрут для проверки, проходил ли человек KYC
app.get('/api/check-status', (req, res) => {
    const telegramId = req.query.telegramId;
    const isVerified = verifiedUsers.has(String(telegramId)); // Ищем ID в памяти
    res.json({ verified: isVerified });
});
// ---------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Veris Backend запущен на порту ${PORT}`);
});
