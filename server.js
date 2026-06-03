const express = require('express');
const cors = require('cors');
const axios = require('axios');
const qs = require('qs');

const app = express();
app.use(cors());
app.use(express.json());

// MoceanAPI Configuration
const API_TOKEN = "apit-OQIS2YCpY9TzuEiCmVrGM8AGJWAL9LSuq-9q61d";

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        status: "active",
        service: "SelfSMS API",
        message: "API is running!",
        endpoints: {
            send_sms: "POST /send-sms",
            send_sms_get: "GET /send-sms?phone=8801XXXXXXXXX&message=Hello",
            health: "GET /health"
        }
    });
});

// GET method SMS endpoint (সহজ টেস্ট করার জন্য)
app.get('/send-sms', async (req, res) => {
    console.log("📨 GET Request received:", req.query);
    
    let { phone, message, studentName, className, date } = req.query;
    
    if (!phone) {
        return res.status(400).json({ success: false, error: "Phone number required" });
    }
    
    // Format phone number
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('01')) {
        formattedPhone = '880' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('88')) {
        formattedPhone = '880' + formattedPhone.substring(2);
    } else if (!formattedPhone.startsWith('880')) {
        formattedPhone = '880' + formattedPhone;
    }
    
    // Create message if not provided
    if (!message) {
        message = `${studentName || 'শিক্ষার্থী'} ${className || ''} শ্রেণির শিক্ষার্থী ${date || 'আজ'} তারিখে বিদ্যালয়ে অনুপস্থিত ছিল। - মাস্টারমাইন্ড`;
    }
    
    try {
        const data = qs.stringify({
            'mocean-api-key': API_TOKEN,
            'mocean-to': formattedPhone,
            'mocean-text': message.substring(0, 160),
            'mocean-from': 'Mastermind'
        });
        
        const response = await axios.post('https://rest.moceanapi.com/rest/2/sms', data, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        console.log("Mocean Response:", response.data);
        
        if (response.data.status === "0") {
            res.json({ 
                success: true, 
                message: "SMS sent successfully", 
                data: response.data,
                to: formattedPhone
            });
        } else {
            res.json({ 
                success: false, 
                error: response.data.err_msg || "Failed to send SMS",
                response: response.data
            });
        }
        
    } catch (error) {
        console.error("Error:", error.response?.data || error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST method SMS endpoint
app.post('/send-sms', async (req, res) => {
    console.log("📨 POST Request received:", req.body);
    
    const { phone, message, studentName, className, date } = req.body;
    
    if (!phone) {
        return res.status(400).json({ success: false, error: "Phone number required" });
    }
    
    // Format phone number
    let formattedPhone = phone.replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('01')) {
        formattedPhone = '880' + formattedPhone.substring(1);
    } else if (formattedPhone.startsWith('88')) {
        formattedPhone = '880' + formattedPhone.substring(2);
    } else if (!formattedPhone.startsWith('880')) {
        formattedPhone = '880' + formattedPhone;
    }
    
    // Create message if not provided
    let smsMessage = message;
    if (!smsMessage) {
        smsMessage = `${studentName || 'শিক্ষার্থী'} ${className || ''} শ্রেণির শিক্ষার্থী ${date || 'আজ'} তারিখে বিদ্যালয়ে অনুপস্থিত ছিল। - মাস্টারমাইন্ড`;
    }
    
    try {
        const data = qs.stringify({
            'mocean-api-key': API_TOKEN,
            'mocean-to': formattedPhone,
            'mocean-text': smsMessage.substring(0, 160),
            'mocean-from': 'Mastermind'
        });
        
        const response = await axios.post('https://rest.moceanapi.com/rest/2/sms', data, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        console.log("Mocean Response:", response.data);
        
        if (response.data.status === "0") {
            res.json({ 
                success: true, 
                message: "SMS sent successfully", 
                data: response.data,
                to: formattedPhone
            });
        } else {
            res.json({ 
                success: false, 
                error: response.data.err_msg || "Failed to send SMS",
                response: response.data
            });
        }
        
    } catch (error) {
        console.error("Error:", error.response?.data || error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: "active", 
        service: "SMS API",
        timestamp: new Date().toISOString(),
        api_token_configured: !!API_TOKEN
    });
});

// Test SMS endpoint (সহজ টেস্ট)
app.get('/test-sms', async (req, res) => {
    const testPhone = "8801889343480";
    const testMessage = "পরীক্ষামূলক SMS - মাস্টারমাইন্ড অ্যাকাডেমি";
    
    try {
        const data = qs.stringify({
            'mocean-api-key': API_TOKEN,
            'mocean-to': testPhone,
            'mocean-text': testMessage,
            'mocean-from': 'Mastermind'
        });
        
        const response = await axios.post('https://rest.moceanapi.com/rest/2/sms', data, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        res.json({ 
            success: true, 
            message: "Test SMS sent", 
            response: response.data 
        });
    } catch (error) {
        res.json({ 
            success: false, 
            error: error.message 
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "Endpoint not found",
        available_endpoints: ["/", "/health", "/test-sms", "/send-sms (GET/POST)"]
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`📍 Health: http://localhost:${PORT}/health`);
    console.log(`📍 Test SMS: http://localhost:${PORT}/test-sms`);
    console.log(`📍 Send SMS: POST http://localhost:${PORT}/send-sms`);
});
