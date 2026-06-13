const express = require('express');
const cors = require('cors');
const axios = require('axios');
const qs = require('qs');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ আপনার নতুন API Key বসান
const SMS_API_KEY = "b7f7c6a77b2d1f617db0446955729a4d88650c47eea8f173";
const SMS_API_URL = "https://api.smsmobileapi.com/send";

// Phone number formatter
function formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;
    let cleanNumber = phoneNumber.toString().replace(/[^0-9]/g, '');
    
    if (cleanNumber.length === 13 && cleanNumber.startsWith('8801')) return cleanNumber;
    if (cleanNumber.length === 11 && cleanNumber.startsWith('01')) return '880' + cleanNumber.substring(1);
    if (cleanNumber.length === 10 && cleanNumber.startsWith('1')) return '880' + cleanNumber;
    if (cleanNumber.length === 10) return '8801' + cleanNumber;
    
    let last10 = cleanNumber.slice(-10);
    return '8801' + last10;
}

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        status: "active",
        service: "SMSMobileAPI",
        api_key_configured: true,
        message: "Server is running!",
        endpoints: {
            health: "GET /health",
            test: "GET /test-sms",
            send: "POST /send-sms",
            send_get: "GET /send-sms?phone=8801889343480&message=Hello"
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: "active",
        service: "SMSMobileAPI",
        timestamp: new Date().toISOString()
    });
});

// Send SMS function
async function sendSMS(phoneNumber, message) {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    console.log(`📤 Sending SMS to: ${formattedPhone}`);
    console.log(`📝 Message: ${message.substring(0, 100)}...`);
    
    try {
        const data = qs.stringify({
            'api_key': SMS_API_KEY,
            'to': formattedPhone,
            'message': message,
            'sender': 'Mastermind'
        });
        
        const response = await axios.post(SMS_API_URL, data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            timeout: 30000
        });
        
        console.log("✅ Response:", response.data);
        
        if (response.data && (response.data.status === 'success' || response.data.success === true)) {
            return { success: true, message: "SMS sent", data: response.data };
        } else {
            return { success: false, error: response.data?.message || "Failed", data: response.data };
        }
        
    } catch (error) {
        console.error("❌ Error:", error.message);
        return { success: false, error: error.message };
    }
}

// Test SMS - আপনার ফোনে টেস্ট মেসেজ যাবে
app.get('/test-sms', async (req, res) => {
    const testMessage = `🧪 মাস্টারমাইন্ড অ্যাকাডেমি

এটি একটি টেস্ট এসএমএস।

আপনার SMSMobileAPI সংযোগ সঠিকভাবে কাজ করছে!

📱 নম্বর: +8801889343480
⏰ সময়: ${new Date().toLocaleString('bn-BD')}

- মাস্টারমাইন্ড অ্যাকাডেমি`;
    
    const result = await sendSMS("8801889343480", testMessage);
    res.json(result);
});

// POST endpoint for sending SMS
app.post('/send-sms', async (req, res) => {
    console.log("📨 POST Request:", req.body);
    
    const { phone, message, studentName, className, date } = req.body;
    
    if (!phone) {
        return res.status(400).json({ success: false, error: "Phone number required" });
    }
    
    const formattedPhone = formatPhoneNumber(phone);
    
    let smsMessage = message;
    if (!smsMessage) {
        const banglaDate = date ? new Date(date).toLocaleDateString('bn-BD') : 'আজ';
        smsMessage = `মাস্টারমাইন্ড অ্যাকাডেমি

প্রিয় অভিভাবক,
${studentName || 'শিক্ষার্থী'} ${banglaDate} তারিখে ${className || ''} ক্লাসে উপস্থিত ছিলেন না।

দয়া করে সন্তানের উপস্থিতি নিশ্চিত করুন।

ধন্যবাদ`;
    }
    
    const result = await sendSMS(formattedPhone, smsMessage);
    res.json(result);
});

// GET endpoint for testing
app.get('/send-sms', async (req, res) => {
    const { phone, message } = req.query;
    
    if (!phone) {
        return res.status(400).json({ success: false, error: "Phone required" });
    }
    
    const result = await sendSMS(phone, message || "Test SMS from Mastermind Academy");
    res.json(result);
});

// Debug phone number
app.get('/debug', (req, res) => {
    const { phone } = req.query;
    if (!phone) {
        return res.json({
            example: "/debug?phone=8801889343480",
            formats: {
                with_plus: formatPhoneNumber("+8801889343480"),
                with_880: formatPhoneNumber("8801889343480"),
                with_01: formatPhoneNumber("01889343480")
            }
        });
    }
    res.json({
        original: phone,
        formatted: formatPhoneNumber(phone)
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 ========================================`);
    console.log(`✅ SMSMobileAPI Server Running!`);
    console.log(`🚀 ========================================`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🔑 API Key: ${SMS_API_KEY.substring(0, 20)}...`);
    console.log(`\n📋 Test Commands:`);
    console.log(`   GET /health`);
    console.log(`   GET /test-sms`);
    console.log(`   GET /send-sms?phone=8801889343480&message=Hello`);
    console.log(`========================================\n`);
});
