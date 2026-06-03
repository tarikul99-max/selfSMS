const express = require('express');
const cors = require('cors');
const axios = require('axios');
const qs = require('qs');

const app = express();
app.use(cors());
app.use(express.json());

// SMSMobileAPI Configuration
const SMS_API_KEY = "ab6d6a99958d716ce82bed158e8ff344aca4039db52a63e9";
const SMS_API_URL = "https://api.smsmobileapi.com/send";

// Helper function to format phone number for Bangladesh
function formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;
    let cleanNumber = phoneNumber.toString().replace(/[^0-9]/g, '');
    
    console.log(`📞 Original: ${phoneNumber} → Clean: ${cleanNumber}`);
    
    // Format for SMSMobileAPI (needs 8801XXXXXXXXX format)
    if (cleanNumber.length === 14 && cleanNumber.startsWith('+8801')) {
        return cleanNumber;
    } else if (cleanNumber.length === 11 && cleanNumber.startsWith('01')) {
        return '+880' + cleanNumber.substring(1);
    } else if (cleanNumber.length === 10 && cleanNumber.startsWith('1')) {
        return '+880' + cleanNumber;
    } else if (cleanNumber.length === 10) {
        return '+8801' + cleanNumber;
    } else if (cleanNumber.length === 9) {
        return '+8801' + cleanNumber;
    } else {
        let last10 = cleanNumber.slice(-10);
        return '+8801' + last10;
    }
}

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        status: "active",
        service: "Mastermind Academy SMS Service",
        api: "SMSMobileAPI",
        api_key_configured: true,
        phone_format: "+8801XXXXXXXXX (example: +8801889343480)",
        endpoints: {
            health: "GET /health",
            send_sms: "POST /send-sms",
            send_sms_get: "GET /send-sms?phone=+8801889343480&message=Hello",
            test: "GET /test-sms"
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: "active",
        service: "SMSMobileAPI",
        timestamp: new Date().toISOString(),
        api_key_configured: !!SMS_API_KEY
    });
});

// Send SMS using SMSMobileAPI
async function sendSMS(phoneNumber, message) {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    console.log(`📤 ========================================`);
    console.log(`📤 Sending SMS via SMSMobileAPI`);
    console.log(`📤 To: ${formattedPhone}`);
    console.log(`📤 Message: ${message.substring(0, 100)}...`);
    console.log(`📤 ========================================`);
    
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
            return { success: true, message: "SMS sent successfully", data: response.data };
        } else {
            return { success: false, error: response.data?.message || "Failed to send SMS", data: response.data };
        }
        
    } catch (error) {
        console.error("❌ Error:", error.message);
        if (error.response) {
            console.error("❌ Response:", error.response.data);
        }
        return { success: false, error: error.message };
    }
}

// Test SMS endpoint - sends to your number
app.get('/test-sms', async (req, res) => {
    const yourNumber = "+8801889343480";
    const testMessage = `🧪 মাস্টারমাইন্ড অ্যাকাডেমি

এটি একটি টেস্ট এসএমএস।

আপনার SMSMobileAPI সংযোগ সঠিকভাবে কাজ করছে!

📱 নম্বর: +8801889343480
⏰ সময়: ${new Date().toLocaleString('bn-BD')}

- মাস্টারমাইন্ড অ্যাকাডেমি`;
    
    console.log("🧪 Sending test SMS to your number...");
    
    const result = await sendSMS(yourNumber, testMessage);
    
    res.json({
        success: result.success,
        message: result.success ? "Test SMS sent! Check your phone." : "Failed to send test SMS",
        to: yourNumber,
        api_response: result.data,
        error: result.error
    });
});

// GET endpoint for sending SMS
app.get('/send-sms', async (req, res) => {
    console.log("📨 GET Request received:", req.query);
    
    let { phone, message, studentName, className, date } = req.query;
    
    if (!phone) {
        return res.status(400).json({
            success: false,
            error: "Phone number required",
            example: "/send-sms?phone=+8801889343480&message=Hello"
        });
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

// POST endpoint for sending SMS
app.post('/send-sms', async (req, res) => {
    console.log("📨 POST Request received:", req.body);
    
    const { phone, message, studentName, className, date } = req.body;
    
    if (!phone) {
        return res.status(400).json({
            success: false,
            error: "Phone number required"
        });
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

// Bulk SMS endpoint
app.post('/bulk-sms', async (req, res) => {
    const { recipients } = req.body;
    
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({
            success: false,
            error: "Recipients array required"
        });
    }
    
    console.log(`📨 Sending bulk SMS to ${recipients.length} recipients`);
    
    const results = [];
    for (let i = 0; i < recipients.length; i++) {
        const { phone, studentName, className, date } = recipients[i];
        const formattedPhone = formatPhoneNumber(phone);
        const banglaDate = date ? new Date(date).toLocaleDateString('bn-BD') : 'আজ';
        const message = `মাস্টারমাইন্ড অ্যাকাডেমি

প্রিয় অভিভাবক,
${studentName || 'শিক্ষার্থী'} ${banglaDate} তারিখে ${className || ''} ক্লাসে উপস্থিত ছিলেন না।

দয়া করে সন্তানের উপস্থিতি নিশ্চিত করুন।

ধন্যবাদ`;
        
        const result = await sendSMS(formattedPhone, message);
        results.push({
            phone: formattedPhone,
            studentName,
            success: result.success,
            error: result.error
        });
        
        // Delay between messages (1 second)
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const successCount = results.filter(r => r.success).length;
    res.json({
        success: successCount > 0,
        total: recipients.length,
        sent: successCount,
        failed: recipients.length - successCount,
        details: results
    });
});

// Debug phone formatting
app.get('/debug-phone', (req, res) => {
    const { phone } = req.query;
    
    if (!phone) {
        return res.json({
            error: "Provide phone number",
            example: "/debug-phone?phone=+8801889343480",
            formats: {
                with_plus: formatPhoneNumber("+8801889343480"),
                with_880: formatPhoneNumber("8801889343480"),
                with_01: formatPhoneNumber("01889343480"),
                with_1: formatPhoneNumber("1889343480")
            }
        });
    }
    
    res.json({
        original: phone,
        cleaned: phone.toString().replace(/[^0-9]/g, ''),
        formatted: formatPhoneNumber(phone),
        isValid: formatPhoneNumber(phone)?.length === 13
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "Endpoint not found",
        available: ["/", "/health", "/test-sms", "/send-sms", "/bulk-sms", "/debug-phone"]
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 ========================================`);
    console.log(`✅ SMSMobileAPI Server Running!`);
    console.log(`🚀 ========================================`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🔑 API Key: ${SMS_API_KEY.substring(0, 20)}...`);
    console.log(`📱 Your Phone: +8801889343480`);
    console.log(`\n📋 Available Endpoints:`);
    console.log(`   GET  /                - API Info`);
    console.log(`   GET  /health          - Health Check`);
    console.log(`   GET  /test-sms        - Send test SMS to YOUR phone`);
    console.log(`   GET  /send-sms        - Send SMS (GET method)`);
    console.log(`   POST /send-sms        - Send SMS (POST method)`);
    console.log(`   POST /bulk-sms        - Send bulk SMS`);
    console.log(`   GET  /debug-phone     - Check phone format`);
    console.log(`\n💡 Test Commands:`);
    console.log(`   curl https://selfsms.onrender.com/test-sms`);
    console.log(`   curl "https://selfsms.onrender.com/send-sms?phone=8801889343480&message=Hello"`);
    console.log(`========================================\n`);
});
