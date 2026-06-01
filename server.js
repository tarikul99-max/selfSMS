const express = require('express');
const cors = require('cors');
const axios = require('axios');
const qs = require('qs');

const app = express();
app.use(cors());
app.use(express.json());

// MoceanAPI Configuration
const API_TOKEN = process.env.MOAPI_API_TOKEN || "apit-OQIS2YCpY9TzuEiCmVrGM8AGJWAL9LSuq-9q61d";

app.post('/api/send-sms', async (req, res) => {
    console.log("📨 Request received:", req.body);
    
    const { phone, studentName, className, date } = req.body;
    
    if (!phone) {
        return res.status(400).json({ success: false, error: "Phone number required" });
    }
    
    // Format phone number
    let formattedPhone = phone;
    if (!phone.startsWith('880')) {
        formattedPhone = '880' + phone.replace(/^0+/, '');
    }
    
    // Create message
    const message = `${studentName || 'শিক্ষার্থী'} ${className || ''} শ্রেণির শিক্ষার্থী ${date || 'আজ'} তারিখে বিদ্যালয়ে অনুপস্থিত ছিল।`;
    
    try {
        // Using x-www-form-urlencoded format (most compatible)
        const data = qs.stringify({
            'mocean-api-key': API_TOKEN,
            'mocean-to': formattedPhone,
            'mocean-text': message.substring(0, 160),
            'mocean-from': 'Mastermind'
        });
        
        const response = await axios.post('https://rest.moceanapi.com/rest/2/sms', data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        console.log("Mocean Response:", response.data);
        
        if (response.data.status === "0") {
            res.json({ success: true, message: "SMS sent successfully" });
        } else {
            res.json({ success: false, error: response.data.err_msg || "Failed to send SMS" });
        }
        
    } catch (error) {
        console.error("Error details:", error.response?.data || error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: "active", 
        service: "SMS API",
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
