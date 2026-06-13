const express = require('express');
const cors = require('cors');
const axios = require('axios');
const qs = require('qs');

const app = express();
app.use(cors());
app.use(express.json());

// আপনার API Key
const API_KEY = "b7f7c6a77b2d1f617db0446955729a4d88650c47eea8f173";

// সিম্পল হেলথ চেক
app.get('/health', (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
});

// সিম্পল টেস্ট - শুধু দেখার জন্য
app.get('/', (req, res) => {
    res.json({ 
        message: "SMS Server is running",
        test: "GET /test-sms"
    });
});

// টেস্ট SMS - আপনার ফোনে আসবে
app.get('/test-sms', async (req, res) => {
    console.log("🧪 Test SMS requested");
    
    try {
        const data = qs.stringify({
            'api_key': API_KEY,
            'to': '8801889343480',
            'message': 'টেস্ট মেসেজ - মাস্টারমাইন্ড অ্যাকাডেমি',
            'sender': 'Mastermind'
        });
        
        const response = await axios.post('https://api.smsmobileapi.com/send', data, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        console.log("Response:", response.data);
        res.json({ success: true, response: response.data });
        
    } catch (error) {
        console.log("Error:", error.message);
        res.json({ success: false, error: error.message });
    }
});

// POST এন্ডপয়েন্ট - আপনার ফ্রন্টএন্ড থেকে কল হবে
app.post('/send-sms', async (req, res) => {
    console.log("📨 Request:", req.body);
    
    const { phone } = req.body;
    
    if (!phone) {
        return res.json({ success: false, error: "Phone required" });
    }
    
    // ফোন নম্বর ফরম্যাট করুন
    let cleanPhone = phone.toString().replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('01')) {
        cleanPhone = '880' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('8801') && cleanPhone.length === 13) {
        // already good
    } else if (cleanPhone.length === 10) {
        cleanPhone = '8801' + cleanPhone;
    }
    
    console.log("📞 Formatted phone:", cleanPhone);
    
    try {
        const data = qs.stringify({
            'api_key': API_KEY,
            'to': cleanPhone,
            'message': 'মাস্টারমাইন্ড অ্যাকাডেমি: আপনার সন্তান আজ ক্লাসে উপস্থিত ছিল না।',
            'sender': 'Mastermind'
        });
        
        const response = await axios.post('https://api.smsmobileapi.com/send', data, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        console.log("✅ SMS sent");
        res.json({ success: true, response: response.data });
        
    } catch (error) {
        console.log("❌ Error:", error.message);
        res.json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📱 Test: https://selfsms.onrender.com/test-sms`);
});
