const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// TextMeBot API Configuration
const TEXTMEBOT_API_KEY = "M1mcbWVX9K9A";
const YOUR_PHONE = "8801889343480";

// Simple phone formatter
function formatPhone(phone) {
    let clean = phone.toString().replace(/[^0-9]/g, '');
    if (clean.startsWith('8801') && clean.length === 13) return clean;
    if (clean.startsWith('01') && clean.length === 11) return '880' + clean.substring(1);
    if (clean.length === 10) return '8801' + clean;
    if (clean.length === 9) return '8801' + clean;
    return clean;
}

// Root
app.get('/', (req, res) => {
    res.json({
        status: "active",
        service: "Mastermind SMS",
        your_number: "+8801889343480",
        api_key: TEXTMEBOT_API_KEY,
        test: "GET /test"
    });
});

// Health
app.get('/health', (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Simple test - sends to YOUR number
app.get('/test', async (req, res) => {
    const message = "টেস্ট মেসেজ - মাস্টারমাইন্ড অ্যাকাডেমি";
    const url = `https://api.textmebot.com/send.php?recipient=1889343480&text=${encodeURIComponent(message)}&apikey=${TEXTMEBOT_API_KEY}`;
    
    console.log("📤 Sending test to: 1889343480");
    console.log("🔗 URL:", url);
    
    try {
        const response = await axios.get(url);
        console.log("✅ Response:", response.data);
        
        res.json({
            success: response.data === 'OK',
            response: response.data,
            message: response.data === 'OK' ? "Test message sent! Check WhatsApp." : "Failed"
        });
    } catch (error) {
        console.error("❌ Error:", error.message);
        res.json({ success: false, error: error.message });
    }
});

// Send SMS - GET method
app.get('/send', async (req, res) => {
    let { phone, message, student, class: className, date } = req.query;
    
    if (!phone) {
        return res.json({ success: false, error: "Phone number required" });
    }
    
    // Format phone for TextMeBot (remove 880, keep last 10 digits)
    let cleanPhone = phone.toString().replace(/[^0-9]/g, '');
    let recipient = cleanPhone.slice(-10);
    
    // Create message
    let text = message;
    if (!text) {
        const today = date ? new Date(date).toLocaleDateString('bn-BD') : 'আজ';
        text = `📢 মাস্টারমাইন্ড অ্যাকাডেমি

প্রিয় অভিভাবক,
${student || 'শিক্ষার্থী'} ${today} তারিখে ${className || ''} ক্লাসে উপস্থিত ছিলেন না।

দয়া করে সন্তানের উপস্থিতি নিশ্চিত করুন।

ধন্যবাদ`;
    }
    
    const url = `https://api.textmebot.com/send.php?recipient=${recipient}&text=${encodeURIComponent(text)}&apikey=${TEXTMEBOT_API_KEY}`;
    
    console.log(`📤 Sending to: ${recipient} (original: ${phone})`);
    
    try {
        const response = await axios.get(url);
        console.log("✅ Response:", response.data);
        
        res.json({
            success: response.data === 'OK',
            response: response.data,
            to: recipient,
            original_phone: phone
        });
    } catch (error) {
        console.error("❌ Error:", error.message);
        res.json({ success: false, error: error.message });
    }
});

// Send SMS - POST method
app.post('/send', async (req, res) => {
    let { phone, message, studentName, className, date } = req.body;
    
    if (!phone) {
        return res.status(400).json({ success: false, error: "Phone required" });
    }
    
    // Format phone for TextMeBot
    let cleanPhone = phone.toString().replace(/[^0-9]/g, '');
    let recipient = cleanPhone.slice(-10);
    
    // Create message
    let text = message;
    if (!text) {
        const today = date ? new Date(date).toLocaleDateString('bn-BD') : 'আজ';
        text = `📢 মাস্টারমাইন্ড অ্যাকাডেমি

প্রিয় অভিভাবক,
${studentName || 'শিক্ষার্থী'} ${today} তারিখে ${className || ''} ক্লাসে উপস্থিত ছিলেন না।

দয়া করে সন্তানের উপস্থিতি নিশ্চিত করুন।

ধন্যবাদ`;
    }
    
    const url = `https://api.textmebot.com/send.php?recipient=${recipient}&text=${encodeURIComponent(text)}&apikey=${TEXTMEBOT_API_KEY}`;
    
    console.log(`📤 POST Sending to: ${recipient}`);
    
    try {
        const response = await axios.get(url);
        console.log("✅ Response:", response.data);
        
        res.json({
            success: response.data === 'OK',
            response: response.data,
            to: recipient
        });
    } catch (error) {
        console.error("❌ Error:", error.message);
        res.json({ success: false, error: error.message });
    }
});

// Debug phone formatting
app.get('/debug', (req, res) => {
    const { phone } = req.query;
    if (!phone) {
        return res.json({
            example: "/debug?phone=8801889343480",
            your_phone: { original: YOUR_PHONE, textmebot: YOUR_PHONE.slice(-10) }
        });
    }
    let clean = phone.toString().replace(/[^0-9]/g, '');
    res.json({
        original: phone,
        clean: clean,
        textmebot_format: clean.slice(-10)
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 ========================================`);
    console.log(`✅ Mastermind SMS Server Running!`);
    console.log(`🚀 ========================================`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`📱 Your Phone: ${YOUR_PHONE}`);
    console.log(`📱 TextMeBot Format: ${YOUR_PHONE.slice(-10)}`);
    console.log(`🔑 API Key: ${TEXTMEBOT_API_KEY}`);
    console.log(`\n📋 Test Commands:`);
    console.log(`   GET /test - Send test to YOUR WhatsApp`);
    console.log(`   GET /send?phone=8801889343480&message=Hello`);
    console.log(`   GET /debug?phone=8801889343480`);
    console.log(`========================================\n`);
});
