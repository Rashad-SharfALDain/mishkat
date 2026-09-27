// Phase 2.1 Student Portal & Educational Platform Automated Test Suite
require('dotenv').config();
const http = require('http');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
if (!ADMIN_EMAIL) throw new Error('ADMIN_EMAIL environment variable is required');
const INITIAL_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD;
if (!INITIAL_PASSWORD) throw new Error('ADMIN_INITIAL_PASSWORD environment variable is required');
const TEST_NEW_PASSWORD = process.env.TEST_NEW_PASSWORD;
if (!TEST_NEW_PASSWORD) throw new Error('TEST_NEW_PASSWORD environment variable is required');
const TEST_STUDENT_PASSWORD = process.env.TEST_STUDENT_PASSWORD;
if (!TEST_STUDENT_PASSWORD) throw new Error('TEST_STUDENT_PASSWORD environment variable is required');

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

async function runPhase2Tests() {
  console.log('🎓 Starting Phase 2.1 — Student Portal & Authorization Test Suite...\n');

  // 1. Admin Authentication
  console.log('1. Authenticating Admin...');
  let adminToken = '';
  let loginRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: ADMIN_EMAIL, password: INITIAL_PASSWORD }
  );
  if (loginRes.status !== 200) {
    loginRes = await request(
      { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: ADMIN_EMAIL, password: TEST_NEW_PASSWORD }
    );
  }
  if (loginRes.status !== 200 || !loginRes.body.token) {
    throw new Error('Admin login failed: ' + JSON.stringify(loginRes.body));
  }
  adminToken = loginRes.body.token;
  console.log('  ✓ Admin authenticated successfully.');

  // 2. Test Rule: Reject student creation for non-accepted applicant
  console.log('2. Verifying Business Rule: Student account creation rejected for non-accepted applicant...');
  // Find a 'جديد' or 'قيد المراجعة' applicant
  const applicantsRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/admin/applicants', method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const unacceptedApp = applicantsRes.body.applicants.find((a) => a.status !== 'مقبول' && a.status !== 'مكتمل');
  if (unacceptedApp) {
    const rejectCreationRes = await request({
      hostname: 'localhost', port: 5000, path: `/api/admin/students/from-applicant/${unacceptedApp.id}`, method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (rejectCreationRes.status === 400) {
      console.log(`  ✓ Correctly rejected student creation for applicant with status "${unacceptedApp.status}" (HTTP 400).`);
    } else {
      throw new Error(`Expected HTTP 400 for non-accepted applicant, got: ${rejectCreationRes.status}`);
    }
  }

  // 3. Accept an applicant and create a student
  console.log('3. Accepting applicant and generating student account (Workflow: Applicant -> Accepted -> Student)...');
  // Look for demo accepted applicant or accept one
  let acceptedApplicant = applicantsRes.body.applicants.find((a) => a.status === 'مقبول');
  if (!acceptedApplicant) {
    // Pick first available and set status to 'مقبول'
    const target = applicantsRes.body.applicants[0];
    await request({
      hostname: 'localhost', port: 5000, path: `/api/admin/applicants/${target.id}`, method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }
    }, { status: 'مقبول' });
    acceptedApplicant = target;
  }

  let studentNumber = '';
  let studentTempPass = '';
  let studentCreatedId = '';

  const createStudentRes = await request({
    hostname: 'localhost', port: 5000, path: `/api/admin/students/from-applicant/${acceptedApplicant.id}`, method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  if (createStudentRes.status === 201 && createStudentRes.body.student) {
    studentNumber = createStudentRes.body.student.student_number;
    studentTempPass = createStudentRes.body.credentials.temporary_password;
    studentCreatedId = createStudentRes.body.student.id;
    console.log(`  ✓ Student created successfully! Number: ${studentNumber}, Track: ${createStudentRes.body.student.educational_track}`);
    console.log(`  ✓ Temporary setup password generated securely.`);
  } else if (createStudentRes.status === 400 && createStudentRes.body.student_number) {
    // If already created from previous run
    studentNumber = createStudentRes.body.student_number;
    // Reset password to get a fresh temp password
    const studentListRes = await request({
      hostname: 'localhost', port: 5000, path: `/api/admin/students?search=${studentNumber}`, method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    studentCreatedId = studentListRes.body.students[0].id;
    const resetRes = await request({
      hostname: 'localhost', port: 5000, path: `/api/admin/students/${studentCreatedId}/reset-access`, method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    studentTempPass = resetRes.body.temporary_password;
    console.log(`  ✓ Student already existed, access reset securely. Number: ${studentNumber}`);
  } else {
    throw new Error('Student creation failed: ' + JSON.stringify(createStudentRes.body));
  }

  // 4. Test Student Number Format
  console.log('4. Verifying Student Number formatting & persistence...');
  if (/^STU-\d{4}-\d{5}$/.test(studentNumber)) {
    console.log(`  ✓ Student number matches standard format: ${studentNumber}`);
  } else {
    throw new Error(`Invalid student number format: ${studentNumber}`);
  }

  // 5. Test Student Login (with Student Number identifier)
  console.log('5. Testing Student Login with Student Number identifier & initial credentials...');
  const studentLoginRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { identifier: studentNumber, password: studentTempPass });

  if (studentLoginRes.status === 200 && studentLoginRes.body.token) {
    console.log(`  ✓ Student logged in successfully. Role: ${studentLoginRes.body.user.role}`);
    console.log(`  ✓ Mandatory password change flag: ${studentLoginRes.body.user.must_change_password}`);
  } else {
    throw new Error('Student login failed: ' + JSON.stringify(studentLoginRes.body));
  }

  let studentToken = studentLoginRes.body.token;

  // 6. Test First-Login Mandatory Password Change
  console.log('6. Testing Student First-Login Password Change...');
  const newStudentPass = TEST_STUDENT_PASSWORD;
  const changePassRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/change-password', method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` }
  }, { current_password: studentTempPass, new_password: newStudentPass });

  if (changePassRes.status === 200) {
    console.log('  ✓ Student changed password successfully.');
  } else {
    throw new Error('Student password change failed: ' + JSON.stringify(changePassRes.body));
  }

  // Verify login with new student password
  const newStudentLoginRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { identifier: studentNumber, password: newStudentPass });
  if (newStudentLoginRes.status === 200 && newStudentLoginRes.body.user.must_change_password === false) {
    studentToken = newStudentLoginRes.body.token;
    console.log('  ✓ Student logged in with new password. must_change_password is now false.');
  } else {
    throw new Error('Failed to login with new student password');
  }

  // 7. Test Student Dashboard API
  console.log('7. Testing Student Dashboard (GET /api/student/dashboard)...');
  const dashRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/student/dashboard', method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` }
  });

  if (dashRes.status === 200 && dashRes.body.student.student_number === studentNumber) {
    console.log(`  ✓ Dashboard loaded: Student=${dashRes.body.student.student_name}, Track=${dashRes.body.student.educational_track}`);
    console.log(`  ✓ Activities: Total=${dashRes.body.stats.activities_total}, Completed=${dashRes.body.stats.activities_completed}`);
    console.log(`  ✓ Announcements count: ${dashRes.body.announcements.length}`);
  } else {
    throw new Error('Student dashboard failed: ' + JSON.stringify(dashRes.body));
  }

  // 8. Test Student Profile API & Data Isolation
  console.log('8. Testing Student Profile & Isolation (GET /api/student/profile)...');
  const profileRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/student/profile', method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` }
  });

  if (profileRes.status === 200 && profileRes.body.profile.student_number === studentNumber) {
    console.log(`  ✓ Profile loaded for ${profileRes.body.profile.student_name} (${profileRes.body.profile.school})`);
    if (profileRes.body.profile.internal_notes !== undefined) {
      throw new Error('SECURITY VIOLATION: Internal admin notes exposed to student profile!');
    }
    console.log('  ✓ Verified: Internal notes are NEVER exposed to student.');
  } else {
    throw new Error('Student profile failed');
  }

  // 9. Security Audit: IDOR & Protected Field Tampering
  console.log('9. Security Audit: Verifying Student cannot tamper with academic records (PATCH /api/student/profile)...');
  const tamperRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/student/profile', method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` }
  }, { academic_status: 'متخرج' });

  if (tamperRes.status === 403) {
    console.log('  ✓ Student tampering attempt blocked (HTTP 403 Forbidden).');
  } else {
    throw new Error('SECURITY BREACH: Student was able to modify academic_status!');
  }

  // 10. Security Audit: Student CANNOT access Admin APIs
  console.log('10. Security Audit: Verifying Student token CANNOT access Admin APIs (Strict RBAC)...');
  const studentAdminAttempt = await request({
    hostname: 'localhost', port: 5000, path: '/api/admin/applicants', method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  if (studentAdminAttempt.status === 403) {
    console.log('  ✓ Student blocked from GET /api/admin/applicants (HTTP 403 Forbidden).');
  } else {
    throw new Error('SECURITY BREACH: Student accessed /api/admin/applicants!');
  }

  const studentAdminDashAttempt = await request({
    hostname: 'localhost', port: 5000, path: '/api/admin/dashboard', method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  if (studentAdminDashAttempt.status === 403) {
    console.log('  ✓ Student blocked from GET /api/admin/dashboard (HTTP 403 Forbidden).');
  } else {
    throw new Error('SECURITY BREACH: Student accessed /api/admin/dashboard!');
  }

  const studentAdminStudentsAttempt = await request({
    hostname: 'localhost', port: 5000, path: '/api/admin/students', method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  if (studentAdminStudentsAttempt.status === 403) {
    console.log('  ✓ Student blocked from GET /api/admin/students (HTTP 403 Forbidden).');
  } else {
    throw new Error('SECURITY BREACH: Student accessed /api/admin/students!');
  }

  // 11. Test Student Activities & Submission
  console.log('11. Testing Student Activities & Activity Submission (POST /api/student/activities/:id/submit)...');
  const activitiesRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/student/activities', method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` }
  });

  if (activitiesRes.status === 200 && activitiesRes.body.activities.length > 0) {
    const targetActivity = activitiesRes.body.activities[0];
    console.log(`  ✓ Loaded ${activitiesRes.body.activities.length} activities. Submitting: "${targetActivity.title}"...`);

    const submitRes = await request({
      hostname: 'localhost', port: 5000, path: `/api/student/activities/${targetActivity.student_activity_id}/submit`, method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` }
    }, { submission_content: 'تم إتمام قراءة الفصول وتلخيص أبرز ثلاث نقاط عملية تطبيقية في دفتر التأملات القيمية.' });

    if (submitRes.status === 200 && submitRes.body.success) {
      console.log('  ✓ Activity submitted successfully!');
    } else {
      throw new Error('Activity submission failed: ' + JSON.stringify(submitRes.body));
    }
  }

  // 12. Test Admin Student Management
  console.log('12. Testing Admin Student Management (GET, FILTER, PATCH)...');
  const adminStudentList = await request({
    hostname: 'localhost', port: 5000, path: `/api/admin/students?search=${studentNumber}`, method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  if (adminStudentList.status === 200 && adminStudentList.body.students.length > 0) {
    console.log(`  ✓ Admin queried students. Found student: ${adminStudentList.body.students[0].student_name} (${studentNumber})`);
  } else {
    throw new Error('Admin failed to query students');
  }

  // Update academic status
  const updateStatusRes = await request({
    hostname: 'localhost', port: 5000, path: `/api/admin/students/${studentCreatedId}`, method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }
  }, { academic_status: 'نشط' });

  if (updateStatusRes.status === 200) {
    console.log('  ✓ Admin updated student academic status successfully.');
  } else {
    throw new Error('Admin status update failed: ' + JSON.stringify(updateStatusRes.body));
  }

  console.log('\n🌟 ALL PHASE 2.1 STUDENT PORTAL TESTS PASSED WITH 100% SUCCESS!');
}

runPhase2Tests().catch((err) => {
  console.error('❌ Phase 2.1 Test failed:', err);
  process.exit(1);
});
