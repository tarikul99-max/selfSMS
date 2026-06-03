// ==================== SMS FUNCTIONS - UPDATED FOR ALL PHONE FORMATS ====================

// আপনার selfSMS সার্ভিস URL (Render এ ডিপ্লয় করা)
const SELF_SMS_URL = "https://selfsms.onrender.com";

// ফোন নম্বর ফরম্যাট করার ফাংশন - সব ফরম্যাট সাপোর্ট করে
function formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;
    
    // সব ক্যারেক্টার বাদে শুধু নাম্বার রাখি
    let cleanNumber = phoneNumber.toString().replace(/[^0-9]/g, '');
    
    console.log("Original phone:", phoneNumber);
    console.log("Clean number:", cleanNumber);
    
    // চেক করা শুরু করি
    if (cleanNumber.startsWith('8801') && cleanNumber.length === 13) {
        // Already in +8801XXXXXXXXX format (without +)
        return cleanNumber;
    }
    else if (cleanNumber.startsWith('01') && cleanNumber.length === 11) {
        // 01XXXXXXXXX format - add 880
        return '880' + cleanNumber.substring(1);
    }
    else if (cleanNumber.startsWith('1') && cleanNumber.length === 10) {
        // 1XXXXXXXXX format - add 880
        return '880' + cleanNumber;
    }
    else if (cleanNumber.startsWith('880') && cleanNumber.length === 12) {
        // 8801XXXXXXXXX (missing one digit)
        return '880' + cleanNumber.substring(3);
    }
    else if (cleanNumber.length === 10) {
        // XXXXXXXXXX (10 digits) - assume it's missing 01
        return '8801' + cleanNumber;
    }
    else if (cleanNumber.length === 11 && !cleanNumber.startsWith('01')) {
        // 11 digits but not starting with 01
        return '880' + cleanNumber;
    }
    else {
        // Try to fix any 13 digit number that starts with 8801
        if (cleanNumber.length === 13 && cleanNumber.startsWith('8801')) {
            return cleanNumber;
        }
        // Default: assume it's a valid number starting with 01
        if (cleanNumber.length >= 10) {
            let last10 = cleanNumber.slice(-10);
            return '8801' + last10;
        }
    }
    
    return cleanNumber;
}

// SMS সার্ভিস হেলথ চেক
async function checkSMSService() {
    try {
        const response = await fetch(`${SELF_SMS_URL}/health`);
        const result = await response.json();
        console.log("SMS Service Status:", result);
        return result.status === 'active';
    } catch (error) {
        console.error("SMS Service not reachable:", error);
        return false;
    }
}

// GET মেথড ব্যবহার করে SMS সেন্ড (সহজ)
async function sendSMS_GET(phoneNumber, message) {
    if (!phoneNumber) {
        return { success: false, error: "Phone number is required" };
    }
    
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone || formattedPhone.length < 12) {
        return { success: false, error: `Invalid phone number format: ${phoneNumber}` };
    }
    
    const encodedMessage = encodeURIComponent(message);
    const url = `${SELF_SMS_URL}/send-sms?phone=${formattedPhone}&message=${encodedMessage}`;
    
    console.log("Sending SMS via GET to:", formattedPhone);
    console.log("URL:", url);
    
    try {
        const response = await fetch(url);
        const result = await response.json();
        console.log("SMS GET Response:", result);
        return result;
    } catch (error) {
        console.error("SMS GET Error:", error);
        return { success: false, error: error.message };
    }
}

// POST মেথড ব্যবহার করে SMS সেন্ড
async function sendSMS_POST(phoneNumber, studentName, className, date, teacherName) {
    if (!phoneNumber) {
        return { success: false, error: "Phone number is required" };
    }
    
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone || formattedPhone.length < 12) {
        return { success: false, error: `Invalid phone number format: ${phoneNumber}` };
    }
    
    // বাংলা মেসেজ তৈরি
    const banglaDate = new Date(date).toLocaleDateString('bn-BD', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const message = `📢 মাস্টারমাইন্ড অ্যাকাডেমি\nপ্রিয় অভিভাবক,\n${studentName} ${banglaDate} তারিখে ${className} ক্লাসে উপস্থিত ছিলেন না।\nদয়া করে সন্তানের উপস্থিতি নিশ্চিত করুন।\nধন্যবাদ - ${teacherName || "মাস্টারমাইন্ড"}`;
    
    console.log("Sending SMS via POST to:", formattedPhone);
    console.log("Message:", message);
    
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
        console.log("SMS POST Response:", result);
        return result;
    } catch (error) {
        console.error("SMS POST Error:", error);
        return { success: false, error: error.message };
    }
}

// মেইন SMS ফাংশন - সব ফরম্যাট সাপোর্ট করে
async function sendAbsentSMS(phoneNumber, studentName, className, date, teacherName) {
    console.log(`📤 Sending SMS to: ${phoneNumber} for student: ${studentName}`);
    
    // ফোন নম্বর ফরম্যাট চেক
    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log(`Formatted phone: ${formattedPhone}`);
    
    if (!formattedPhone || formattedPhone.length < 12) {
        console.error(`Invalid phone number: ${phoneNumber}`);
        return { success: false, error: `Invalid phone number: ${phoneNumber}` };
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

// সরাসরি ফোন নম্বর টেস্ট করার ফাংশন (ব্রাউজার কনসোল থেকে চালান)
window.testPhoneFormat = function(phone) {
    const formatted = formatPhoneNumber(phone);
    console.log(`Original: ${phone} -> Formatted: ${formatted}`);
    alert(`Original: ${phone}\nFormatted: ${formatted}`);
    return formatted;
};

// টেস্ট SMS - যেকোনো ফরম্যাটে ফোন নম্বর দিন
window.testSMS = async function(phoneNumber = "+8801889343480") {
    console.log("Testing SMS with phone:", phoneNumber);
    const formatted = formatPhoneNumber(phoneNumber);
    console.log("Formatted phone:", formatted);
    
    const testMessage = "পরীক্ষামূলক SMS - মাস্টারমাইন্ড অ্যাকাডেমি থেকে পাঠানো হয়েছে";
    
    const result = await sendSMS_GET(phoneNumber, testMessage);
    console.log("Test Result:", result);
    alert(`Phone: ${phoneNumber}\nFormatted: ${formatted}\nSuccess: ${result.success}\nMessage: ${result.message || result.error}`);
    return result;
};

// টেস্ট POST মেথড
window.testSMSPost = async function(phoneNumber = "+8801889343480") {
    const result = await sendSMS_POST(phoneNumber, "পরীক্ষা ছাত্র", "Class 6", "2026-06-04", "প্রশাসক");
    console.log("POST Test Result:", result);
    alert(JSON.stringify(result, null, 2));
    return result;
};

// ==================== UPDATED SAVE ATTENDANCE FUNCTION ====================

async function saveAttendance() {
    const className = document.getElementById('attendanceClassSelect').value;
    const date = document.getElementById('attendanceDate').value;
    if(!className || !date) {
        alert('ক্লাস এবং তারিখ নির্বাচন করুন');
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
    let smsSentDetails = [];
    
    if(absentStudents.length > 0) {
        // Show loading message
        const loadingMsg = document.createElement('div');
        loadingMsg.style.cssText = 'position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); background:white; padding:20px; border-radius:10px; z-index:9999; box-shadow:0 0 10px rgba(0,0,0,0.3); text-align:center;';
        loadingMsg.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${absentStudents.length} জন অভিভাবককে SMS পাঠানো হচ্ছে...<br><small style="color:#666;">ফোন নম্বর ফরম্যাট: +8801XXXXXXXXX</small>`;
        document.body.appendChild(loadingMsg);
        
        // Send SMS to each absent student's guardian
        for(let i = 0; i < absentStudents.length; i++) {
            const student = absentStudents[i];
            const originalPhone = student.guardian_phone;
            const formattedPhone = formatPhoneNumber(originalPhone);
            
            loadingMsg.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${i+1}/${absentStudents.length} - ${student.name} কে SMS পাঠানো হচ্ছে...<br><small>ফোন: ${originalPhone} → ${formattedPhone}</small>`;
            
            const result = await sendAbsentSMS(
                student.guardian_phone, 
                student.name, 
                className, 
                date,
                currentUser.name || (currentUser.role === 'admin' ? 'প্রশাসক' : 'শিক্ষক')
            );
            
            if(result.success) {
                smsSentCount++;
                smsSentDetails.push(`${student.name} (${formatPhoneNumber(student.guardian_phone)})`);
                console.log(`✓ SMS sent to ${student.name} (${student.guardian_phone})`);
            } else {
                smsFailedList.push(`${student.name} (${student.guardian_phone}) - ${result.error || 'Unknown error'}`);
                console.log(`✗ SMS failed for ${student.name}: ${result.error}`);
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
            if(smsSentDetails.length > 0) {
                resultMessage += `📨 প্রাপক: ${smsSentDetails.join(', ')}\n`;
            }
        }
        
        if(smsFailedList.length > 0) {
            resultMessage += `\n❌ ব্যর্থ: ${smsFailedList.length} জন\n`;
            resultMessage += `কারণ: ফোন নম্বর সঠিক নাও থাকতে পারে (+8801XXXXXXXXX ফরম্যাটে দিন)`;
        }
        
        if(smsSentCount === 0 && smsFailedList.length > 0) {
            resultMessage += `\n\n⚠️ কোন SMS পাঠানো যায়নি। দয়া করে ফোন নম্বর +8801XXXXXXXXX ফরম্যাটে আপডেট করুন।`;
        }
        
        alert(resultMessage);
    } else {
        if(absentCount === 0) {
            alert(`✅ উপস্থিতি সংরক্ষিত হয়েছে!\n\n📊 উপস্থিত: ${presentCount} জন\n📋 অনুপস্থিত: ০ জন\nসবাই উপস্থিত।`);
        } else {
            alert(`✅ উপস্থিতি সংরক্ষিত হয়েছে!\n\n📊 উপস্থিত: ${presentCount} জন\n📋 অনুপস্থিত: ${absentCount} জন\n⚠️ অনুপস্থিত ${absentCount} জনের ফোন নম্বর নেই।\n\nফোন নম্বর ফরম্যাট: +8801XXXXXXXXX`);
        }
    }
    
    await loadClassMonthlyCalendar();
}

// ফোন নম্বর আপডেট করার জন্য হেল্পার ফাংশন
window.updateStudentPhone = async function(studentId, newPhone) {
    if (!confirm(`ছাত্র ${studentId} এর ফোন নম্বর ${newPhone} এ আপডেট করবেন?`)) return;
    
    const formattedPhone = formatPhoneNumber(newPhone);
    alert(`ফোন নম্বর ফরম্যাট করা হয়েছে: ${newPhone} → ${formattedPhone}`);
    
    // এখানে Firebase এ আপডেট করার কোড যোগ করতে পারেন
    console.log(`Update student ${studentId} phone to ${formattedPhone}`);
};

// পেজ লোড হলে SMS সার্ভিস চেক করুন এবং ফোন ফরম্যাট হেল্পার দেখান
window.addEventListener('load', () => {
    setTimeout(async () => {
        const isActive = await checkSMSService();
        if (isActive) {
            console.log("✅ SMS Service is active and ready");
            console.log("📱 Phone number format: +8801XXXXXXXXX (e.g., +8801889343480)");
        } else {
            console.log("⚠️ SMS Service is not responding. Check your selfSMS service.");
        }
    }, 2000);
});
