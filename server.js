// ==================== SMS FUNCTIONS - +8801XXXXXXXXX FORMAT SUPPORT ====================

// আপনার selfSMS সার্ভিস URL
const SELF_SMS_URL = "https://selfsms.onrender.com";

// ফোন নম্বর ফরম্যাট করার ফাংশন - +8801XXXXXXXXX ফরম্যাট সাপোর্ট করে
function formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;
    
    // সব ক্যারেক্টার বাদে শুধু নাম্বার রাখি
    let cleanNumber = phoneNumber.toString().replace(/[^0-9]/g, '');
    
    console.log("📞 Original phone:", phoneNumber);
    console.log("📞 Clean number:", cleanNumber);
    
    // +8801XXXXXXXXX ফরম্যাট চেক করা
    if (cleanNumber.startsWith('8801') && cleanNumber.length === 13) {
        return cleanNumber; // 8801889343480
    }
    else if (cleanNumber.startsWith('01') && cleanNumber.length === 11) {
        return '880' + cleanNumber.substring(1); // 01889343480 → 8801889343480
    }
    else if (cleanNumber.startsWith('1') && cleanNumber.length === 10) {
        return '880' + cleanNumber; // 1889343480 → 8801889343480
    }
    else if (cleanNumber.length === 10) {
        return '8801' + cleanNumber; // 889343480 → 8801889343480
    }
    else if (cleanNumber.length === 13 && cleanNumber.startsWith('8801')) {
        return cleanNumber;
    }
    else {
        // ডিফল্ট: শেষ 10 ডিজিট নিয়ে ফরম্যাট করুন
        let last10 = cleanNumber.slice(-10);
        return '8801' + last10;
    }
}

// SMS সার্ভিস হেলথ চেক
async function checkSMSService() {
    try {
        const response = await fetch(`${SELF_SMS_URL}/health`);
        const result = await response.json();
        console.log("✅ SMS Service Status:", result);
        return result.status === 'active';
    } catch (error) {
        console.error("❌ SMS Service not reachable:", error);
        return false;
    }
}

// GET মেথড ব্যবহার করে SMS সেন্ড (সবচেয়ে সহজ)
async function sendSMS_GET(phoneNumber, message) {
    if (!phoneNumber) {
        return { success: false, error: "Phone number is required" };
    }
    
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone || formattedPhone.length !== 13) {
        return { 
            success: false, 
            error: `Invalid phone number format: ${phoneNumber}\nসঠিক ফরম্যাট: +8801XXXXXXXXX (যেমন: +8801889343480)`
        };
    }
    
    const encodedMessage = encodeURIComponent(message);
    const url = `${SELF_SMS_URL}/send-sms?phone=${formattedPhone}&message=${encodedMessage}`;
    
    console.log("📤 Sending SMS via GET to:", formattedPhone);
    
    try {
        const response = await fetch(url);
        const result = await response.json();
        console.log("📨 SMS Response:", result);
        return result;
    } catch (error) {
        console.error("❌ SMS GET Error:", error);
        return { success: false, error: error.message };
    }
}

// POST মেথড ব্যবহার করে SMS সেন্ড
async function sendSMS_POST(phoneNumber, studentName, className, date, teacherName) {
    if (!phoneNumber) {
        return { success: false, error: "Phone number is required" };
    }
    
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone || formattedPhone.length !== 13) {
        return { 
            success: false, 
            error: `Invalid phone number format: ${phoneNumber}\nসঠিক ফরম্যাট: +8801XXXXXXXXX (যেমন: +8801889343480)`
        };
    }
    
    // বাংলা মেসেজ তৈরি
    const banglaDate = new Date(date).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const message = `📢 মাস্টারমাইন্ড অ্যাকাডেমি\nপ্রিয় অভিভাবক,\n${studentName} ${banglaDate} তারিখে ${className} ক্লাসে উপস্থিত ছিলেন না।\nদয়া করে সন্তানের উপস্থিতি নিশ্চিত করুন।\nধন্যবাদ - ${teacherName || "মাস্টারমাইন্ড"}`;
    
    console.log("📤 Sending SMS via POST to:", formattedPhone);
    console.log("📝 Message:", message.substring(0, 100) + "...");
    
    try {
        const response = await fetch(`${SELF_SMS_URL}/send-sms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phone: formattedPhone,
                message: message,
                studentName: studentName,
                className: className,
                date: date
            })
        });
        
        const result = await response.json();
        console.log("📨 SMS POST Response:", result);
        return result;
    } catch (error) {
        console.error("❌ SMS POST Error:", error);
        return { success: false, error: error.message };
    }
}

// মেইন SMS ফাংশন
async function sendAbsentSMS(phoneNumber, studentName, className, date, teacherName) {
    console.log(`📤 Sending SMS to: ${phoneNumber} for student: ${studentName}`);
    
    // ফোন নম্বর ফরম্যাট চেক
    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log(`📞 Formatted phone: ${formattedPhone}`);
    
    if (!formattedPhone || formattedPhone.length !== 13) {
        console.error(`❌ Invalid phone number: ${phoneNumber}`);
        return { 
            success: false, 
            error: `ফোন নম্বর সঠিক নয়। সঠিক ফরম্যাট: +8801XXXXXXXXX (যেমন: +8801889343480)`
        };
    }
    
    // প্রথমে POST মেথড চেষ্টা
    let result = await sendSMS_POST(phoneNumber, studentName, className, date, teacherName);
    
    // POST fail হলে GET মেথড চেষ্টা
    if (!result.success) {
        console.log("POST failed, trying GET method...");
        const banglaDate = new Date(date).toLocaleDateString('bn-BD');
        const message = `মাস্টারমাইন্ড: ${studentName} ${banglaDate} ${className} এ অনুপস্থিত`;
        result = await sendSMS_GET(phoneNumber, message);
    }
    
    return result;
}

// টেস্ট ফাংশন - +8801XXXXXXXXX ফরম্যাট টেস্ট করার জন্য
window.testPhoneFormat = function(phone = "+8801889343480") {
    const original = phone;
    const formatted = formatPhoneNumber(phone);
    const isValid = formatted && formatted.length === 13 && formatted.startsWith('8801');
    
    console.log("📞 Phone Format Test:");
    console.log(`   Original: ${original}`);
    console.log(`   Formatted: ${formatted}`);
    console.log(`   Valid: ${isValid ? '✅ Yes' : '❌ No'}`);
    
    alert(`Original: ${original}\nFormatted: ${formatted}\nValid: ${isValid ? '✅ Yes' : '❌ No'}\n\nসঠিক ফরম্যাট: +8801XXXXXXXXX`);
    
    return { original, formatted, isValid };
};

// টেস্ট SMS পাঠান
window.testSMS = async function(phoneNumber = "+8801889343480") {
    console.log("🧪 Testing SMS with phone:", phoneNumber);
    
    const formatted = formatPhoneNumber(phoneNumber);
    console.log("📞 Formatted phone:", formatted);
    
    if (!formatted || formatted.length !== 13) {
        alert(`❌ ফোন নম্বর ফরম্যাট সঠিক নয়!\n\nআপনার দেওয়া নম্বর: ${phoneNumber}\nসঠিক ফরম্যাট: +8801XXXXXXXXX\nউদাহরণ: +8801889343480`);
        return { success: false, error: "Invalid format" };
    }
    
    const testMessage = "পরীক্ষামূলক SMS - মাস্টারমাইন্ড অ্যাকাডেমি থেকে পাঠানো হয়েছে";
    
    const result = await sendSMS_GET(phoneNumber, testMessage);
    
    if (result.success) {
        alert(`✅ টেস্ট SMS সফলভাবে পাঠানো হয়েছে!\n\n📱 ফোন নম্বর: ${formatted}\n📝 মেসেজ: ${testMessage}`);
    } else {
        alert(`❌ টেস্ট SMS ব্যর্থ হয়েছে!\n\n📱 ফোন নম্বর: ${formatted}\n⚠️ ত্রুটি: ${result.error}\n\nদয়া করে চেক করুন:\n1. ফোন নম্বর সঠিক কিনা (+8801XXXXXXXXX)\n2. selfSMS সার্ভিস চালু আছে কিনা`);
    }
    
    return result;
};

// ==================== UPDATED SAVE ATTENDANCE FUNCTION ====================

async function saveAttendance() {
    const className = document.getElementById('attendanceClassSelect').value;
    const date = document.getElementById('attendanceDate').value;
    if(!className || !date) {
        alert('❌ ক্লাস এবং তারিখ নির্বাচন করুন');
        return;
    }
    
    const classKey = className.replace(/\s+/g,'_').replace(/\(/g,'').replace(/\)/g,'');
    let attendanceData = {};
    currentStudentsList.forEach(s => { attendanceData[s.id] = s.present === true; });
    
    await db.ref(`attendances/${classKey}/${date}`).set(attendanceData);
    
    // Get absent students with valid guardian phone numbers
    const absentStudents = currentStudentsList.filter(s => s.present !== true && s.guardian_phone && s.guardian_phone.length >= 10);
    const presentCount = currentStudentsList.filter(s => s.present === true).length;
    const absentCount = currentStudentsList.length - presentCount;
    
    let smsSentCount = 0;
    let smsFailedList = [];
    let smsSentList = [];
    
    if(absentStudents.length > 0) {
        // Show loading message
        const loadingMsg = document.createElement('div');
        loadingMsg.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:white; padding:20px; border-radius:10px; z-index:9999; box-shadow:0 0 10px rgba(0,0,0,0.3); text-align:center; min-width:300px;';
        loadingMsg.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${absentStudents.length} জন অভিভাবককে SMS পাঠানো হচ্ছে...<br><br><small style="color:#666;">📱 ফোন ফরম্যাট: +8801XXXXXXXXX</small>`;
        document.body.appendChild(loadingMsg);
        
        // Send SMS to each absent student's guardian
        for(let i = 0; i < absentStudents.length; i++) {
            const student = absentStudents[i];
            const originalPhone = student.guardian_phone;
            const formattedPhone = formatPhoneNumber(originalPhone);
            
            loadingMsg.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${i+1}/${absentStudents.length} - ${student.name} কে SMS পাঠানো হচ্ছে...<br><br><small>📱 ${originalPhone} → ${formattedPhone}</small>`;
            
            const result = await sendAbsentSMS(
                student.guardian_phone, 
                student.name, 
                className, 
                date,
                currentUser.name || (currentUser.role === 'admin' ? 'প্রশাসক' : 'শিক্ষক')
            );
            
            if(result.success) {
                smsSentCount++;
                smsSentList.push(`${student.name} (${formattedPhone})`);
                console.log(`✅ SMS sent to ${student.name} (${formattedPhone})`);
            } else {
                smsFailedList.push(`${student.name} (${originalPhone}) - ${result.error || 'Unknown error'}`);
                console.log(`❌ SMS failed for ${student.name}: ${result.error}`);
            }
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Remove loading message
        loadingMsg.remove();
        
        // Show final result
        let resultMessage = `✅ উপস্থিতি সংরক্ষিত হয়েছে!\n\n`;
        resultMessage += `📊 উপস্থিত: ${presentCount} জন\n`;
        resultMessage += `📋 অনুপস্থিত: ${absentCount} জন\n`;
        resultMessage += `📱 ফোন ফরম্যাট: +8801XXXXXXXXX\n\n`;
        
        if(smsSentCount > 0) {
            resultMessage += `✅ সফলভাবে SMS পেয়েছেন: ${smsSentCount} জন\n`;
            resultMessage += `📨 প্রাপক: ${smsSentList.join(', ')}\n\n`;
        }
        
        if(smsFailedList.length > 0) {
            resultMessage += `❌ ব্যর্থ: ${smsFailedList.length} জন\n`;
            resultMessage += `${smsFailedList.join('\n')}\n\n`;
            resultMessage += `⚠️ দয়া করে ফোন নম্বর +8801XXXXXXXXX ফরম্যাটে আপডেট করুন।`;
        }
        
        if(smsSentCount === 0 && smsFailedList.length > 0) {
            resultMessage += `\n⚠️ কোন SMS পাঠানো যায়নি। দয়া করে ফোন নম্বর +8801XXXXXXXXX ফরম্যাটে আপডেট করুন।`;
        }
        
        alert(resultMessage);
    } else {
        if(absentCount === 0) {
            alert(`✅ উপস্থিতি সংরক্ষিত হয়েছে!\n\n📊 উপস্থিত: ${presentCount} জন\n📋 অনুপস্থিত: ০ জন\nসবাই উপস্থিত।`);
        } else {
            alert(`✅ উপস্থিতি সংরক্ষিত হয়েছে!\n\n📊 উপস্থিত: ${presentCount} জন\n📋 অনুপস্থিত: ${absentCount} জন\n⚠️ অনুপস্থিত ${absentCount} জনের ফোন নম্বর নেই।\n\n📱 ফোন নম্বর ফরম্যাট: +8801XXXXXXXXX`);
        }
    }
    
    await loadClassMonthlyCalendar();
}

// SMS সার্ভিস চেক এবং ফোন ফরম্যাট হেল্পার দেখান
window.showSMSHelp = function() {
    alert(`📱 SMS হেল্প গাইড\n\n✅ সঠিক ফোন নম্বর ফরম্যাট:\n   +8801XXXXXXXXX\n   উদাহরণ: +8801889343480\n\n✅ ভুল ফরম্যাট:\n   01889343480 ✗\n   8801889343480 ✗\n   1889343480 ✗\n\n✅ টেস্ট SMS পাঠান:\n   testSMS("+8801889343480")\n\n✅ ফোন নম্বর ফরম্যাট চেক:\n   testPhoneFormat("+8801889343480")`);
};

// পেজ লোড হলে SMS সার্ভিস চেক করুন
window.addEventListener('load', () => {
    setTimeout(async () => {
        console.log("🔍 Checking SMS Service...");
        const isActive = await checkSMSService();
        if (isActive) {
            console.log("✅ SMS Service is active and ready");
            console.log("📱 Phone format: +8801XXXXXXXXX (e.g., +8801889343480)");
            console.log("💡 টেস্ট করতে: testSMS('+8801889343480')");
        } else {
            console.log("⚠️ SMS Service is not responding. Check your selfSMS service.");
            console.log("🔗 selfSMS URL: https://selfsms.onrender.com/health");
        }
    }, 2000);
});
