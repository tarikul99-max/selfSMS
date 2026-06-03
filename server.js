const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// TextMeBot API Configuration
const TEXTMEBOT_API_KEY = "M1mcbWVX9K9A";
const YOUR_PHONE = "8801889343480"; // আপনার ফোন নম্বর (যেটা কানেক্ট করেছেন)

// Helper function to format phone number
function formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;
    let cleanNumber = phoneNumber.toString().replace(/[^0-9]/g, '');
    
    if (cleanNumber.startsWith('8801') && cleanNumber.length === 13) {
        return cleanNumber;
    } else if (cleanNumber.startsWith('01') && cleanNumber.length === 11) {
        return '880' + cleanNumber.substring(1);
    } else if (cleanNumber.startsWith('1') && cleanNumber.length === 10) {
        return '880' + cleanNumber;
    } else if (cleanNumber.length === 10) {
        return '8801' + cleanNumber;
    } else {
        let last10 = cleanNumber.slice(-10);
        return '8801' + last10;
    }
}

// Remove country code for WhatsApp (TextMeBot expects number without 880)
function formatForWhatsApp(phoneNumber) {
    let formatted = formatPhoneNumber(phoneNumber);
    if (formatted && formatted.startsWith('880')) {
        return formatted.substring(3); // Remove 880
    }
    return formatted;
}

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: "active", 
        service: "WhatsApp SMS API",
        api_type: "TextMeBot",
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        status: "active",
        service: "Mastermind Academy SMS Service",
        api: "TextMeBot WhatsApp API",
        endpoints: {
            health: "GET /health",
            send_sms: "POST /send-sms",
            send_whatsapp: "POST /send-whatsapp",
            test: "GET /test-sms"
        },
        phone_format: "+8801XXXXXXXXX"
    });
});

// Send WhatsApp message using TextMeBot API
async function sendWhatsAppMessage(phoneNumber, message) {
    const whatsappNumber = formatForWhatsApp(phoneNumber);
    
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
            }
        });
        
        console.log("TextMeBot Response:", response.data);
        return response.data;
        
    } catch (error) {
        console.error("TextMeBot Error:", error.message);
        throw error;
    }
}

// POST endpoint for sending SMS/WhatsApp
app.post('/send-sms', async (req, res) => {
    console.log("📨 Request received:", req.body);
    
    const { phone, message, studentName, className, date } = req.body;
    
    if (!phone) {
        return res.status(400).json({ 
            success: false, 
            error: "Phone number is required" 
        });
    }
    
    const formattedPhone = formatPhoneNumber(phone);
    console.log(`📞 Formatted phone: ${formattedPhone}`);
    
    // Create Bengali message
    let smsMessage = message;
    if (!smsMessage) {
        const banglaDate = date ? new Date(date).toLocaleDateString('bn-BD', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'আজ';
        
        smsMessage = `📢 *মাস্টারমাইন্ড অ্যাকাডেমি*\n\nপ্রিয় অভিভাবক,\n*${studentName || 'শিক্ষার্থী'}* ${banglaDate} তারিখে *${className || ''}* ক্লাসে উপস্থিত ছিলেন না।\n\nদয়া করে সন্তানের উপস্থিতি নিশ্চিত করুন।\n\nধন্যবাদ\nমাস্টারমাইন্ড অ্যাকাডেমি`;
    }
    
    try {
        const result = await sendWhatsAppMessage(formattedPhone, smsMessage);
        
        if (result && (result.includes('OK') || result.includes('success') || result === 'OK')) {
            res.json({ 
                success: true, 
                message: "WhatsApp message sent successfully",
                to: formattedPhone,
                response: result
            });
        } else {
            res.json({ 
                success: false, 
                error: result || "Failed to send message",
                to: formattedPhone
            });
        }
        
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// GET endpoint for testing (easy to test from browser)
app.get('/send-sms', async (req, res) => {
    const { phone, message, studentName, className, date } = req.query;
    
    if (!phone) {
        return res.status(400).json({ 
            success: false, 
            error: "Phone number is required",
            example: "/send-sms?phone=8801889343480&message=Hello"
        });
    }
    
    const formattedPhone = formatPhoneNumber(phone);
    
    let smsMessage = message;
    if (!smsMessage) {
        const banglaDate = date ? new Date(date).toLocaleDateString('bn-BD') : 'আজ';
        smsMessage = `📢 মাস্টারমাইন্ড অ্যাকাডেমি\n\nপ্রিয় অভিভাবক,\n${studentName || 'শিক্ষার্থী'} ${banglaDate} তারিখে ${className || ''} ক্লাসে উপস্থিত ছিলেন না।\n\nদয়া করে সন্তানের উপস্থিতি নিশ্চিত করুন।\n\nধন্যবাদ - মাস্টারমাইন্ড`;
    }
    
    try {
        const result = await sendWhatsAppMessage(formattedPhone, smsMessage);
        
        if (result && result.includes('OK')) {
            res.json({ 
                success: true, 
                message: "WhatsApp message sent",
                to: formattedPhone
            });
        } else {
            res.json({ 
                success: false, 
                error: result,
                to: formattedPhone
            });
        }
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Simple test endpoint
app.get('/test-sms', async (req, res) => {
    const testPhone = "8801889343480";
    const testMessage = "🧪 *পরীক্ষামূলক মেসেজ*\n\nআপনার WhatsApp সংযোগ সঠিকভাবে কাজ করছে!\n\n- মাস্টারমাইন্ড অ্যাকাডেমি";
    
    console.log("🧪 Sending test message...");
    
    try {
        const result = await sendWhatsAppMessage(testPhone, testMessage);
        
        res.json({ 
            success: true, 
            message: "Test message sent to your WhatsApp",
            to: testPhone,
            response: result
        });
    } catch (error) {
        res.json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Send to multiple recipients (bulk)
app.post('/bulk-sms', async (req, res) => {
    const { recipients } = req.body; // [{ phone, studentName, className, date }]
    
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
        return res.status(400).json({ 
            success: false, 
            error: "Recipients array is required" 
        });
    }
    
    console.log(`📨 Sending bulk messages to ${recipients.length} recipients`);
    
    const results = [];
    for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        const { phone, studentName, className, date } = recipient;
        
        const formattedPhone = formatPhoneNumber(phone);
        const banglaDate = date ? new Date(date).toLocaleDateString('bn-BD') : 'আজ';
        const message = `📢 মাস্টারমাইন্ড অ্যাকাডেমি\n\nপ্রিয় অভিভাবক,\n${studentName || 'শিক্ষার্থী'} ${banglaDate} তারিখে ${className || ''} ক্লাসে উপস্থিত ছিলেন না।\n\nদয়া করে সন্তানের উপস্থিতি নিশ্চিত করুন।\n\nধন্যবাদ - মাস্টারমাইন্ড`;
        
        try {
            const result = await sendWhatsAppMessage(formattedPhone, message);
            results.push({
                phone: formattedPhone,
                studentName,
                success: result && result.includes('OK'),
                response: result
            });
        } catch (error) {
            results.push({
                phone: formattedPhone,
                studentName,
                success: false,
                error: error.message
            });
        }
        
        // Delay between messages (5 seconds as recommended)
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;
    
    res.json({
        success: successCount > 0,
        total: recipients.length,
        sent: successCount,
        failed: failCount,
        details: results
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: "Endpoint not found",
        available_endpoints: ["/", "/health", "/send-sms", "/test-sms", "/bulk-sms"]
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 ========================================`);
    console.log(`✅ WhatsApp SMS Server is running!`);
    console.log(`🚀 ========================================`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🔑 API Key: ${TEXTMEBOT_API_KEY}`);
    console.log(`📱 Your Phone: ${YOUR_PHONE}`);
    console.log(`📱 Phone format: +8801XXXXXXXXX`);
    console.log(`\n📋 Available Endpoints:`);
    console.log(`   GET  /                - API Info`);
    console.log(`   GET  /health          - Health Check`);
    console.log(`   GET  /test-sms        - Send test message to YOUR phone`);
    console.log(`   GET  /send-sms        - Send message (GET method)`);
    console.log(`   POST /send-sms        - Send message (POST method)`);
    console.log(`   POST /bulk-sms        - Send bulk messages`);
    console.log(`\n💡 Test Commands:`);
    console.log(`   curl ${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}/test-sms`);
    console.log(`   curl "${process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`}/send-sms?phone=8801889343480&message=Hello"`);
    console.log(`========================================\n`);
});
