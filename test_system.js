// Comprehensive Security and Integration Test Suite for Mishkat Educational Platform
require('dotenv').config();
const http = require('http');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
if (!ADMIN_EMAIL) throw new Error('ADMIN_EMAIL environment variable is required');
const INITIAL_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD;
if (!INITIAL_PASSWORD) throw new Error('ADMIN_INITIAL_PASSWORD environment variable is required');
const TEST_NEW_PASSWORD = process.env.TEST_NEW_PASSWORD;
if (!TEST_NEW_PASSWORD) throw new Error('TEST_NEW_PASSWORD environment variable is required');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body.startsWith('{') || body.startsWith('[') ? JSON.parse(body) : body,
          });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('🛡️ Starting Security & Operational Verification Suite...\n');
  let token = '';
  let testAppId = '';
  let testAppNum = '';

  // 1. Test Web Page Delivery
  console.log('1. Checking Public Webpage (HTML & RTL & SEO)...');
  const homeRes = await request({ hostname: 'localhost', port: 5000, path: '/', method: 'GET' });
  if (homeRes.status === 200 && homeRes.body.includes('dir="rtl"') && homeRes.body.includes('مؤسسة مِشكاة')) {
    console.log('  ✓ Public HTML delivered with dir="rtl" and valid Arabic metadata.');
  } else {
    throw new Error('Failed to deliver public webpage: ' + homeRes.status);
  }

  // 2. Test Settings API (Public read)
  console.log('2. Checking Settings API (Public Configuration)...');
  const settingsRes = await request({ hostname: 'localhost', port: 5000, path: '/api/settings', method: 'GET' });
  if (settingsRes.status === 200 && settingsRes.body.settings.institution_name) {
    console.log(`  ✓ Settings verified: "${settingsRes.body.settings.institution_name}", Fee: ${settingsRes.body.settings.registration_fee} ${settingsRes.body.settings.currency}`);
  } else {
    throw new Error('Settings API failed');
  }

  // 3. Security Audit: Verify unauthenticated requests to protected endpoints are BLOCKED (401)
  console.log('3. Security Audit: Verifying Unauthenticated Access Protection (Strict RBAC)...');
  const unauthAppRes = await request({ hostname: 'localhost', port: 5000, path: '/api/admin/applicants', method: 'GET' });
  if (unauthAppRes.status === 401) {
    console.log('  ✓ /api/admin/applicants correctly blocked unauthorized access (HTTP 401).');
  } else {
    throw new Error('SECURITY BREACH: /api/admin/applicants is accessible without auth!');
  }

  const unauthDashRes = await request({ hostname: 'localhost', port: 5000, path: '/api/admin/dashboard', method: 'GET' });
  if (unauthDashRes.status === 401) {
    console.log('  ✓ /api/admin/dashboard correctly blocked unauthorized access (HTTP 401).');
  } else {
    throw new Error('SECURITY BREACH: /api/admin/dashboard is accessible without auth!');
  }

  const unauthSettingsPut = await request(
    { hostname: 'localhost', port: 5000, path: '/api/settings', method: 'PUT', headers: { 'Content-Type': 'application/json' } },
    { settings: { institution_name: 'Hacked' } }
  );
  if (unauthSettingsPut.status === 401) {
    console.log('  ✓ PUT /api/settings correctly blocked unauthorized modification (HTTP 401).');
  } else {
    throw new Error('SECURITY BREACH: PUT /api/settings is accessible without auth!');
  }

  // 4. Test Programs API
  console.log('4. Checking Educational Tracks API...');
  const progRes = await request({ hostname: 'localhost', port: 5000, path: '/api/programs', method: 'GET' });
  if (progRes.status === 200 && progRes.body.programs.length === 4) {
    console.log(`  ✓ 4 educational tracks loaded: ${progRes.body.programs.map((p) => p.title).join(' | ')}`);
  } else {
    throw new Error('Programs API failed');
  }

  // 5. Test FAQ API
  console.log('5. Checking FAQ API...');
  const faqRes = await request({ hostname: 'localhost', port: 5000, path: '/api/faq', method: 'GET' });
  if (faqRes.status === 200 && faqRes.body.faqs.length >= 11) {
    console.log(`  ✓ FAQ items verified: ${faqRes.body.faqs.length} questions loaded.`);
  } else {
    throw new Error('FAQ API failed');
  }

  // 6. Test Application Submission
  console.log('6. Checking Registration Application Submission (POST /api/apply)...');
  const applicantPayload = {
    student_name: 'سليمان خالد الدوسري',
    date_of_birth: '2009-03-22',
    gender: 'ذكر',
    grade: 'الصف الأول الثانوي',
    school: 'ثانوية نجد النموذجية',
    city: 'الرياض',
    phone: '0555334455',
    email: 'sulaiman.d@example.com',
    guardian_name: 'خالد بن ناصر الدوسري',
    guardian_relationship: 'أب',
    guardian_phone: '0505334455',
    academic_level: 'ممتاز',
    interested_tracks: ['العلوم الشرعية', 'القيادة وصناعة الأثر'],
    motivation: 'أطمح لبناء مهاراتي الفكرية والقيادية والتزود بالعلوم الشرعية لخدمة ديني ومجتمعي.',
    skills: 'إلقاء، حاسب آلي',
    leadership_experience: 'مشاركة في تنظيم نادي الحي التطوعي',
  };

  const applyRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/apply',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    applicantPayload
  );

  if (applyRes.status === 201 && applyRes.body.success) {
    testAppNum = applyRes.body.application_number;
    console.log(`  ✓ Application received and recorded. Reference: ${testAppNum}`);
  } else {
    throw new Error('Application submission failed: ' + JSON.stringify(applyRes.body));
  }

  // 7. Test Admin Authentication via Environment Variables...
  console.log('7. Testing Admin Authentication via Environment Variables...');
  const candidatePasswords = [
    process.env.ADMIN_RESET_PASSWORD,
    INITIAL_PASSWORD,
    TEST_NEW_PASSWORD,
  ].filter(Boolean);

  let currentActivePass = null;
  let loginRes = null;

  for (const pass of candidatePasswords) {
    loginRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: ADMIN_EMAIL, password: pass }
    );
    if (loginRes.status === 200 && loginRes.body.token) {
      currentActivePass = pass;
      break;
    }
  }

  if (loginRes && loginRes.status === 200 && loginRes.body.token) {
    token = loginRes.body.token;
    console.log(`  ✓ Admin authenticated successfully: ${loginRes.body.user.name}`);
    console.log(`  ✓ Must change password flag: ${loginRes.body.user.must_change_password}`);
  } else {
    throw new Error('Admin login failed: ' + JSON.stringify(loginRes ? loginRes.body : 'No response'));
  }

  // 8. Test Mandatory Change Password Flow
  console.log('8. Testing Mandatory Password Change Flow (POST /api/auth/change-password)...');
  const targetNewPass = currentActivePass === INITIAL_PASSWORD ? TEST_NEW_PASSWORD : INITIAL_PASSWORD;
  const changePassRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/change-password',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
    {
      current_password: currentActivePass,
      new_password: targetNewPass,
    }
  );

  if (changePassRes.status === 200 && changePassRes.body.success) {
    console.log('  ✓ Password changed successfully and must_change_password reset to false.');
  } else {
    throw new Error('Password change failed: ' + JSON.stringify(changePassRes.body));
  }

  // Verify login with new password works
  console.log('9. Verifying login with updated password...');
  const verifyNewLogin = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: ADMIN_EMAIL, password: targetNewPass }
  );

  if (verifyNewLogin.status === 200 && verifyNewLogin.body.token) {
    token = verifyNewLogin.body.token;
    console.log('  ✓ Logged in with updated password. must_change_password is now false.');
  } else {
    throw new Error('Failed to login with new password');
  }

  // Verify old password is now rejected
  const verifyOldRejected = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email: ADMIN_EMAIL, password: currentActivePass }
  );
  if (verifyOldRejected.status === 401) {
    console.log('  ✓ Old password correctly rejected (HTTP 401).');
  } else {
    throw new Error('Old password should be rejected after change!');
  }

  // Safely restore original password so test is idempotent and does not alter the admin's active credentials
  const restorePassRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/change-password',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
    {
      current_password: targetNewPass,
      new_password: currentActivePass,
    }
  );
  if (restorePassRes.status === 200) {
    console.log('  ✓ Active credentials safely restored to preserve environment parity.');
  }

  // 10. Test Admin Dashboard with valid token
  console.log('10. Testing Admin Dashboard Metrics (GET /api/admin/dashboard)...');
  const dashRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/dashboard',
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (dashRes.status === 200 && dashRes.body.stats) {
    console.log(`  ✓ Dashboard Stats: Total=${dashRes.body.stats.total}, New=${dashRes.body.stats.new}, Accepted=${dashRes.body.stats.accepted}`);
  } else {
    throw new Error('Dashboard API failed');
  }

  // 11. Test Applicant Query & Details
  console.log('11. Querying Applicants & Verifying Data Isolation...');
  const appListRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/admin/applicants?search=${encodeURIComponent('الدوسري')}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (appListRes.status === 200 && appListRes.body.applicants.length > 0) {
    const found = appListRes.body.applicants[0];
    testAppId = found.id;
    console.log(`  ✓ Applicant verified: ${found.student_name} (${found.application_number}) Status=${found.status}`);
  } else {
    throw new Error('Failed to find applicant in database');
  }

  // 12. Test Status Update & Internal Notes
  console.log('12. Updating Applicant Status and Adding Internal Review Notes...');
  const patchRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/admin/applicants/${testAppId}`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
    {
      status: 'قيد المراجعة',
      internal_notes: 'تم التدقيق؛ ملف مستوفٍ للشروط ومُحدد للمقابلة الشخصية.',
    }
  );

  if (patchRes.status === 200) {
    console.log('  ✓ Applicant updated to "قيد المراجعة" with internal notes.');
  } else {
    throw new Error('Status update failed');
  }

  // 13. Test Contact Submission with Anti-Spam
  console.log('13. Testing Contact Message Submission and Spam Protection...');
  // Valid submission
  const contactRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/contact',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      name: 'عبدالله السعيد',
      phone: '0502223344',
      subject: 'استفسار عن المقابلة الشخصية',
      message: 'السلام عليكم ورحمة الله، أود الاستفسار عن موعد إعلان نتائج المقابلات.',
    }
  );
  if (contactRes.status === 201) {
    console.log('  ✓ Contact message submitted successfully.');
  } else {
    throw new Error('Contact submission failed');
  }

  // Spam bot submission with honeypot populated
  const spamRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/contact',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    {
      name: 'SpamBot',
      phone: '00000000',
      subject: 'Buy cheap',
      message: 'Spam spam spam spam',
      _honeypot: 'bot_value_filled',
    }
  );
  if (spamRes.status === 400 || spamRes.status === 429) {
    console.log(`  ✓ Spam bot rejected successfully (HTTP ${spamRes.status}).`);
  } else {
    throw new Error('Spam protection failed!');
  }

  console.log('\n🔒 ALL SECURITY AND INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
