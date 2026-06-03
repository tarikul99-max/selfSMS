const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// TextMeBot API Configuration (আপনার API key)
const TEXTMEBOT_API_KEY = "M1mcbWVX9K9A";

// Helper function to format phone number
function formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;
    let cleanNumber = phoneNumber.toString().replace(/[^0-9]/g, '');
    
    // Must return 13 digits starting with 8801
    if (cleanNumber.length === 13 && cleanNumber.startsWith('8801')) {
        return cleanNumber;
    } else if (cleanNumber.length === 11 && cleanNumber.startsWith('01')) {
        return '880' + cleanNumber.substring(1);
    } else if (cleanNumber.length === 10 && cleanNumber.startsWith('1')) {
        return '880' + cleanNumber;
    } else if (cleanNumber.length === 10) {
        return '8801' + cleanNumber;
    } else if (cleanNumber.length === 9) {
        return '8801' + cleanNumber;
    } else {
        let last10 = cleanNumber.slice(-10);
        return '8801' + last10;
    }
}

// Remove 880 for WhatsApp (TextMeBot expects number without country code)
function formatForTextMeBot(phoneNumber) {
    let formatted = formatPhoneNumber(phoneNumber);
    if (formatted && formatted.startsWith('880')) {
        return formatted.substring(3); // Remove 880 -> 1889343480
    }
    return formatted;
}

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: "active", 
        service: "TextMeBot WhatsApp API",
        api_key_configured: true,
        your_phone: "+8801889343480",
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        status: "active",
        service: "Mastermind Academy SMS Service",
        api: "TextMeBot WhatsApp API",
        api_key: TEXTMEBOT_API_KEY ? "Configured ✓" : "Missing ✗",
        phone_format: "+8801XXXXXXXXX (example: +8801889343480)",
        endpoints: {
            health: "GET /health",
            send_sms: "POST /send-sms",
            send_sms_get: "GET /send-sms?phone=8801889343480&message=Hello",
            test: "GET /test-sms"
        }
    });
});

// Send WhatsApp message using TextMeBot API
async function sendWhatsAppMessage(phoneNumber, message) {
    const whatsappNumber = formatForTextMeBot(phoneNumber);
    
    console.log(`📤 Sending WhatsApp to: ${whatsappNumber}`);
    console.log(`📝 Message: ${message.substring(0, 100)}...`);
    
    try {
        // TextMeBot API endpoint
        const url = `https://api.textmebot.com/send.php`;
        const response = await axios.get(url, {
            params: {
                recipient: whatsappNumber,
                text: message,
                apikey: TEXTMEBOT_API_KEY
            },
            timeout: 30000
        });
        
        console.log("✅ TextMeBot Response:", response.data);
        
        if (response.data === 'OK' || response.data?.includes('OK') || response.data?.includes('success')) {
            return { success: true, message: "WhatsApp message sent successfully" };
        } else {
            return { success: false, error: response.data || "Failed to send message" };
        }
        
    } catch (error) {
        console.error("❌ TextMeBot Error:", error.message);
        return { success: false, error: error.message };
    }
}

// POST endpoint for sending SMS/WhatsApp
app.post('/send-sms', async (req, res) => {
    console.log("📨 POST Request received:", req.body);
    
    const { phone, message, studentName, className, date } = req.body;
    
    if (!phone) {
        return res.status(400).json({ 
            success: false, 
            error: "Phone number is required" 
        });
    }
    
    const formattedPhone = formatPhoneNumber(phone);
    console.log(`📞 Original: ${phone} → Formatted: ${formattedPhone}`);
    
    if (!formattedPhone || formattedPhone.length !== 13) {
        return res.status(400).json({
            success: false,
            error: `Invalid phone number: ${phone}`,
            supported_format: "+8801XXXXXXXXX (example: +8801889343480)"
        });
    }
    
    let smsMessage = message;
    if (!smsMessage) {
        const banglaDate = date ? new Date(date).toLocaleDateString('bn-BD') : 'আজ';
        smsMessage = `📢 *মাস্টারমাইন্ড অ্যাকাডেমি*

প্রিয় অভিভাবক,

*${studentName || 'শিক্ষার্থী'}* ${banglaDate} তারিখে *${className || ''}* ক্লাসে উপস্থিত ছিলেন না।

দয়া করে সন্তানের উপস্থিতি নিশ্চিত করুন।

ধন্যবাদ
মাস্টারমাইন্ড অ্যাকাডেমি`;
    }
    
    const result = await sendWhatsAppMessage(formattedPhone, smsMessage);
    res.json(result);
});

// GET endpoint for testing
app.get('/send-sms', async (req, res) => {
    console.log("📨 GET Request received:", req.query);
    
    const { phone, message, studentName, className, date } = req.query;
    
    if (!phone) {
        return res.status(400).json({ 
            success: false, 
            error: "Phone number required",
            example: "/send-sms?phone=8801889343480&message=Hello"
        });
    }
    
    const formattedPhone = formatPhoneNumber(phone);
    
    let smsMessage = message;
    if (!smsMessage) {
        const banglaDate = date ? new Date(date).toLocaleDateString('bn-BD') : 'আজ';
        smsMessage = `মাস্টারমাইন্ড অ্যাকাডেমি: ${studentName || 'শিক্ষার্থী'} ${banglaDate} ${className || ''} এ অনুপস্থিত`;
    }
    
    const result = await sendWhatsAppMessage(formattedPhone, smsMessage);
    res.json(result);
});

// Test endpoint - sends test message to YOUR number (+8801889343480)
app.get('/test-sms', async (req, res) => {
    const testPhone = "8801889343480";
    const testMessage = `🧪 *পরীক্ষামূলক মেসেজ*

আপনার WhatsApp সংযোগ সঠিকভাবে কাজ করছে!

📱 আপনার নম্বর: +8801889343480
🔑 API Key: ${TEXTMEBOT_API_KEY}

- মাস্টারমাইন্ড অ্যাকাডেমি`;
    
    console.log("🧪 Sending test message to your number...");
    
    const result = await sendWhatsAppMessage(testPhone, testMessage);
    
    res.json({ 
        success: result.success,
        message: result.success ? "Test message sent to your WhatsApp! Check your phone." : "Failed to send test message",
        to: testPhone,
        response: result
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "Endpoint not found",
        available_endpoints: ["/", "/health", "/send-sms", "/test-sms"]
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 ========================================`);
    console.log(`✅ TextMeBot WhatsApp Server Running!`);
    console.log(`🚀 ========================================`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🔑 API Key: ${TEXTMEBOT_API_KEY}`);
    console.log(`📱 Your Phone: +8801889343480`);
    console.log(`\n📋 Available Endpoints:`);
    console.log(`   GET  /                - API Info`);
    console.log(`   GET  /health          - Health Check`);
    console.log(`   GET  /test-sms        - Send test message to YOUR WhatsApp`);
    console.log(`   GET  /send-sms        - Send message (GET method)`);
    console.log(`   POST /send-sms        - Send message (POST method)`);
    console.log(`\n💡 Test Commands:`);
    console.log(`   curl https://selfsms.onrender.com/test-sms`);
    console.log(`   curl "https://selfsms.onrender.com/send-sms?phone=8801889343480&message=Hello"`);
    console.log(`========================================\n`);
});
