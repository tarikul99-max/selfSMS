const express = require('express');
const cors = require('cors');
const axios = require('axios');
const qs = require('qs');

const app = express();
app.use(cors());
app.use(express.json());

// SMSMobileAPI Configuration - আপনার API key
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

// Health check
app.get('/health', (req, res) => {
    res.json({ status: "active", service: "SMSMobileAPI", timestamp: new Date().toISOString() });
});

// Root info
app.get('/', (req, res) => {
    res.json({
        status: "active",
        service: "Mastermind SMS Service",
        endpoints: {
            test: "GET /test-sms",
            send: "POST /send-sms",
            debug: "GET /debug?phone=8801889343480"
        }
    });
});

// Test SMS - আপনার ফোনে টেস্ট মেসেজ যাবে
app.get('/test-sms', async (req, res) => {
    const targetNumber = "8801889343480";
    const testMessage = `🧪 মাস্টারমাইন্ড অ্যাকাডেমি থেকে টেস্ট এসএমএস!

আপনার API সংযোগ সঠিকভাবে কাজ করছে।

সময়: ${new Date().toLocaleString('bn-BD')}`;

    try {
        const formattedPhone = formatPhoneNumber(targetNumber);
        const data = qs.stringify({
            'api_key': SMS_API_KEY,
            'to': formattedPhone,
            'message': testMessage,
            'sender': 'Mastermind'
        });

        const response = await axios.post(SMS_API_URL, data, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        res.json({ success: true, message: "টেস্ট এসএমএস সফল!", response: response.data });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Debug phone
app.get('/debug', (req, res) => {
    const { phone } = req.query;
    if (!phone) {
        return res.json({
            example: "/debug?phone=+8801889343480",
            result: formatPhoneNumber("+8801889343480")
        });
    }
    res.json({
        original: phone,
        formatted: formatPhoneNumber(phone),
        valid: formatPhoneNumber(phone)?.length === 13
    });
});

// Main SMS send endpoint - POST (ফ্রন্টএন্ড থেকে কল হবে)
app.post('/send-sms', async (req, res) => {
    console.log("📨 SMS request:", req.body);
    
    const { phone, message, studentName, className, date } = req.body;
    
    if (!phone) {
        return res.status(400).json({ success: false, error: "Phone required" });
    }
    
    const formattedPhone = formatPhoneNumber(phone);
    
    if (!formattedPhone || formattedPhone.length !== 13) {
        return res.status(400).json({ success: false, error: "Invalid phone number" });
    }
    
    let smsMessage = message;
    if (!smsMessage) {
        const banglaDate = date ? new Date(date).toLocaleDateString('bn-BD') : 'আজ';
        smsMessage = `মাস্টারমাইন্ড অ্যাকাডেমি

প্রিয় অভিভাবক,
${studentName || 'শিক্ষার্থী'} ${banglaDate} তারিখে ${className || ''} ক্লাসে উপস্থিত ছিলেন না।

দয়া করে সন্তানের উপস্থিতি নিশ্চিত করুন।

ধন্যবাদ`;
    }
    
    try {
        const data = qs.stringify({
            'api_key': SMS_API_KEY,
            'to': formattedPhone,
            'message': smsMessage,
            'sender': 'Mastermind'
        });
        
        const response = await axios.post(SMS_API_URL, data, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        console.log("✅ SMS sent to:", formattedPhone);
        res.json({ success: true, message: "SMS sent", to: formattedPhone });
        
    } catch (error) {
        console.error("❌ SMS failed:", error.message);
        res.json({ success: false, error: error.message });
    }
});

// GET method for testing
app.get('/send-sms', async (req, res) => {
    const { phone, message } = req.query;
    if (!phone) {
        return res.json({ success: false, error: "Phone required" });
    }
    
    const formattedPhone = formatPhoneNumber(phone);
    
    try {
        const data = qs.stringify({
            'api_key': SMS_API_KEY,
            'to': formattedPhone,
            'message': message || "Test SMS",
            'sender': 'Mastermind'
        });
        
        const response = await axios.post(SMS_API_URL, data, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        res.json({ success: true, response: response.data });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n✅ SMS Server Running on port ${PORT}`);
    console.log(`📱 Test: https://selfsms.onrender.com/test-sms`);
});
