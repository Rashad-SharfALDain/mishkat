// Phase 2.3 Attendance, Discipline, and Educational Evaluation Automated Test Suite
require('dotenv').config();
const http = require('http');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
if (!ADMIN_EMAIL) throw new Error('ADMIN_EMAIL is required');
const INITIAL_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD;
if (!INITIAL_PASSWORD) throw new Error('ADMIN_INITIAL_PASSWORD is required');
const TEST_NEW_PASSWORD = process.env.TEST_NEW_PASSWORD;
if (!TEST_NEW_PASSWORD) throw new Error('TEST_NEW_PASSWORD is required');

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

async function runPhase2_3Tests() {
  console.log('📋 Starting Phase 2.3 — Attendance, Excuses & Educational Evaluation Test Suite...\n');

  // 1. Authenticate Admin
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

  // 2. Fetch target student and ensure a verified linked parent exists
  console.log('2. Fetching existing student and preparing linked parent...');
  const studentsRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/admin/students', method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  if (studentsRes.status !== 200 || !studentsRes.body.students || studentsRes.body.students.length === 0) {
    throw new Error('No students found for testing Phase 2.3');
  }
  const student = studentsRes.body.students[0];
  console.log(`  ✓ Target Student: ${student.student_name} (${student.student_number}), ID: ${student.id}`);

  // Create a dedicated parent linked to this student
  const parentPhone = '057' + Math.floor(1000000 + Math.random() * 9000000);
  const parentEmail = `parent.p23.${Date.now()}@mishkat.test`;
  const createParentRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/admin/parents', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` } },
    {
      full_name: 'عبدالله بن سعد الشمري',
      phone: parentPhone,
      email: parentEmail,
      relationship: 'أب',
      address: 'الرياض - حي الملز',
      student_id: student.id,
    }
  );
  if (createParentRes.status !== 201 || !createParentRes.body.parent) {
    throw new Error('Failed to create test parent: ' + JSON.stringify(createParentRes.body));
  }
  const linkedParent = createParentRes.body.parent;
  const tempParentPassword = createParentRes.body.credentials?.temporary_password || createParentRes.body.initial_password;
  console.log(`  ✓ Linked Parent created: ${linkedParent.full_name}, Phone: ${parentPhone}`);


  // Authenticate Student
  console.log('3. Authenticating Target Student...');
  let studentToken = '';
  let stuLoginRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { identifier: student.student_number, password: TEST_NEW_PASSWORD }
  );
  if (stuLoginRes.status !== 200 || !stuLoginRes.body.token) {
    // If not updated, reset access
    const resetRes = await request({
      hostname: 'localhost', port: 5000, path: `/api/admin/students/${student.id}/reset-access`, method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const tempPass = resetRes.body.temporary_password;
    const tempLogin = await request(
      { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { identifier: student.student_number, password: tempPass }
    );
    await request(
      { hostname: 'localhost', port: 5000, path: '/api/auth/change-password', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tempLogin.body.token}` } },
      { current_password: tempPass, new_password: TEST_NEW_PASSWORD }
    );
    stuLoginRes = await request(
      { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { identifier: student.student_number, password: TEST_NEW_PASSWORD }
    );
  }
  studentToken = stuLoginRes.body.token;
  console.log('  ✓ Student authenticated successfully.');

  // Authenticate Parent and change password to TEST_NEW_PASSWORD
  console.log('4. Authenticating Linked Parent & Initializing Password...');
  let parentToken = '';
  const parentLoginRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { identifier: parentPhone, password: tempParentPassword }
  );
  if (parentLoginRes.status !== 200 || !parentLoginRes.body.token) {
    throw new Error('Parent initial login failed: ' + JSON.stringify(parentLoginRes.body));
  }
  parentToken = parentLoginRes.body.token;

  // Change password if required
  if (parentLoginRes.body.user?.must_change_password) {
    const changePwRes = await request(
      { hostname: 'localhost', port: 5000, path: '/api/auth/change-password', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${parentToken}` } },
      { current_password: tempParentPassword, new_password: TEST_NEW_PASSWORD }
    );
    if (changePwRes.status !== 200) {
      throw new Error('Parent change password failed: ' + JSON.stringify(changePwRes.body));
    }
    // Re-login with new password
    const reLogin = await request(
      { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { identifier: parentPhone, password: TEST_NEW_PASSWORD }
    );
    parentToken = reLogin.body.token;
  }
  console.log('  ✓ Parent authenticated and password initialized successfully.');



  // 5. Test Evaluation Dimensions API (Hybrid Mode Verification)
  console.log('5. Testing Evaluation Dimensions API (Hybrid Mode & 5 Dimensions)...');
  const dimsRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/evaluations/dimensions', method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  if (dimsRes.status !== 200 || !Array.isArray(dimsRes.body.dimensions) || dimsRes.body.dimensions.length < 5) {
    throw new Error('Failed to fetch the 5 evaluation dimensions: ' + JSON.stringify(dimsRes.body));
  }
  const dims = dimsRes.body.dimensions;
  console.log(`  ✓ Loaded ${dims.length} evaluation dimensions:`);
  dims.forEach((d) => console.log(`    - ${d.dimension_name} (Mode: ${d.evaluation_mode}, Weight: ${d.weight}%)`));
  const shariaDim = dims.find((d) => d.dimension_name.includes('الشرعية')) || dims[0];

  // 6. Test Evaluation Periods API
  console.log('6. Testing Evaluation Periods API...');
  const periodsRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/evaluations/periods', method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  if (periodsRes.status !== 200 || !periodsRes.body.periods || periodsRes.body.periods.length === 0) {
    throw new Error('No evaluation periods found: ' + JSON.stringify(periodsRes.body));
  }
  const activePeriod = periodsRes.body.periods[0];
  console.log(`  ✓ Active Evaluation Period: ${activePeriod.period_name} (${activePeriod.academic_year})`);

  // 7. Scheduling Educational Sessions
  console.log('7. Scheduling Educational Sessions for Attendance Testing...');
  const today = new Date().toISOString().split('T')[0];
  const session1Res = await request(
    { hostname: 'localhost', port: 5000, path: '/api/attendance/sessions', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` } },
    {
      title: 'اللقاء التربوي الأسبوعي - فقه العبادات',
      session_date: today,
      start_time: '16:00',
      end_time: '18:00',
      location: 'قاعة الإمام مالك',
    }
  );
  if (session1Res.status !== 201 || !session1Res.body.session) {
    throw new Error('Failed to create session 1: ' + JSON.stringify(session1Res.body));
  }
  const session1 = session1Res.body.session;
  console.log(`  ✓ Session 1 created: "${session1.title}" (ID: ${session1.id})`);

  // 8. Recording Attendance & Automated Notification Verification
  console.log('8. Recording Attendance (Absent) & Verifying Automated In-App Notifications...');
  const recordRes = await request(
    { hostname: 'localhost', port: 5000, path: `/api/attendance/sessions/${session1.id}/records`, method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` } },
    {
      records: [
        { student_id: student.id, status: 'غائب', notes: 'غياب بدون إشعار مسبق' },
      ],
    }
  );
  if (recordRes.status !== 200 || !recordRes.body.success) {
    throw new Error('Failed to record attendance: ' + JSON.stringify(recordRes.body));
  }
  console.log('  ✓ Attendance recorded: Student marked "غائب".');

  // Verify Student received in-app notification
  const stuNotifRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/notifications', method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  if (stuNotifRes.status !== 200 || stuNotifRes.body.unread_count === 0) {
    throw new Error('Student did NOT receive absence notification: ' + JSON.stringify(stuNotifRes.body));
  }
  console.log(`  ✓ Student notification received: "${stuNotifRes.body.notifications[0].title}"`);

  // Verify Parent received in-app notification
  const parentNotifRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/notifications', method: 'GET',
    headers: { Authorization: `Bearer ${parentToken}` }
  });
  if (parentNotifRes.status !== 200 || parentNotifRes.body.unread_count === 0) {
    throw new Error('Parent did NOT receive absence notification: ' + JSON.stringify(parentNotifRes.body));
  }
  console.log(`  ✓ Parent notification received: "${parentNotifRes.body.notifications[0].title}"`);

  // 9. Testing Cumulative Absence Threshold & First Warning (3 unexcused absences)
  console.log('9. Testing Cumulative Absence Warning Trigger (Threshold: 3 unexcused absences)...');
  // Schedule and record 2 more absences
  for (let i = 2; i <= 3; i++) {
    const sRes = await request(
      { hostname: 'localhost', port: 5000, path: '/api/attendance/sessions', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` } },
      { title: `لقاء تأصيلي إضافي #${i}`, session_date: today, location: 'القاعة التعليمية' }
    );
    await request(
      { hostname: 'localhost', port: 5000, path: `/api/attendance/sessions/${sRes.body.session.id}/records`, method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` } },
      { records: [{ student_id: student.id, status: 'غائب' }] }
    );
  }
  console.log('  ✓ Recorded 3 total unexcused absences for student.');

  // Verify official warning notification received
  const warningCheck = await request({
    hostname: 'localhost', port: 5000, path: '/api/notifications', method: 'GET',
    headers: { Authorization: `Bearer ${parentToken}` }
  });
  const hasWarning = warningCheck.body.notifications.some((n) => n.notification_type === 'warning');
  if (!hasWarning) {
    throw new Error('Official warning notification was NOT triggered after 3 unexcused absences!');
  }
  console.log('  ✓ Cumulative absence threshold reached: Official 1st warning issued to parent & student.');

  // 10. Checking Student Attendance Profile & Discipline Metrics
  console.log('10. Testing Student Attendance Metrics & History API (GET /api/attendance/student/:id)...');
  const attHistoryRes = await request({
    hostname: 'localhost', port: 5000, path: `/api/attendance/student/${student.id}`, method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  if (attHistoryRes.status !== 200 || !attHistoryRes.body.summary) {
    throw new Error('Failed to get student attendance history: ' + JSON.stringify(attHistoryRes.body));
  }
  const summary = attHistoryRes.body.summary;
  console.log(`  ✓ Attendance metrics: Total=${summary.total_sessions}, Absent=${summary.absent}, Discipline Rate=${summary.discipline_rate}%`);
  if (summary.absent < 3 || summary.warning_triggered !== true) {
    throw new Error('Summary does not reflect 3 absences and warning flag: ' + JSON.stringify(summary));
  }

  // 11. Testing Official Excuse Submission (Within 48h window)
  console.log('11. Testing Excuse Submission (Within 48h Window)...');
  const excuseSubRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/attendance/excuses', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${parentToken}` } },
    {
      student_id: student.id,
      session_id: session1.id,
      excuse_date: today,
      excuse_type: 'صحي',
      reason: 'مراجعة طبية طارئة ومرفق التقرير الطبي المعتمد',
    }
  );
  if (excuseSubRes.status !== 201 || !excuseSubRes.body.excuse_id) {
    throw new Error('Excuse submission failed: ' + JSON.stringify(excuseSubRes.body));
  }
  const excuseId = excuseSubRes.body.excuse_id;
  console.log(`  ✓ Excuse submitted successfully (ID: ${excuseId}, Status: pending).`);

  // 12. Testing 48-Hour Deadline Enforcement
  console.log('12. Testing 48-Hour Deadline Enforcement (Rejection of Stale Excuses)...');
  const oldDate = '2026-08-01'; // Far past date (> 48 hours)
  const staleExcuseRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/attendance/excuses', method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${parentToken}` } },
    {
      student_id: student.id,
      excuse_date: oldDate,
      excuse_type: 'طارئ أسري',
      reason: 'عذر قديم جدًا متأخر عن المهلة',
    }
  );
  if (staleExcuseRes.status === 400 && staleExcuseRes.body.error.includes('48 ساعة')) {
    console.log('  ✓ Stale excuse correctly rejected (HTTP 400: انقضت المهلة النظامية 48 ساعة).');
  } else {
    throw new Error('48-hour deadline violation not enforced! Got: ' + JSON.stringify(staleExcuseRes.body));
  }

  // 13. Testing Excuse Review & Attendance Auto-Update (Approval Flow)
  console.log('13. Testing Excuse Review & Auto-Update to "غياب بعذر"...');
  const reviewApproveRes = await request(
    { hostname: 'localhost', port: 5000, path: `/api/attendance/excuses/${excuseId}/review`, method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` } },
    { review_status: 'approved', reviewer_notes: 'تم الاطلاع على التقرير الطبي واعتماده' }
  );
  if (reviewApproveRes.status !== 200) {
    throw new Error('Excuse review approval failed: ' + JSON.stringify(reviewApproveRes.body));
  }
  console.log('  ✓ Excuse approved by Admin.');

  // Verify attendance record automatically updated to 'غياب بعذر'
  const postApproveHistory = await request({
    hostname: 'localhost', port: 5000, path: `/api/attendance/student/${student.id}`, method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  const updatedSum = postApproveHistory.body.summary;
  if (updatedSum.excused < 1) {
    throw new Error('Attendance status was NOT updated to "غياب بعذر": ' + JSON.stringify(updatedSum));
  }
  console.log(`  ✓ Attendance record converted to "غياب بعذر": Excused=${updatedSum.excused}, Remaining Absent=${updatedSum.absent}`);

  // 14. Testing Hybrid Educational Evaluation (Draft State)
  console.log('14. Recording Educational Evaluation (Hybrid: Numerical 94 + Qualitative "ممتاز" + Notes)...');
  const evalSaveRes = await request(
    { hostname: 'localhost', port: 5000, path: `/api/evaluations/student/${student.id}`, method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` } },
    {
      period_id: activePeriod.id,
      dimension_id: shariaDim.id,
      numerical_score: 94,
      qualitative_rating: 'ممتاز',
      supervisor_notes: 'مشاركة نوعية رائدة واستيعاب متميز للمقاصد الشرعية.',
      evaluation_status: 'draft',
    }
  );
  if (evalSaveRes.status !== 201 && evalSaveRes.status !== 200) {
    throw new Error('Saving evaluation failed: ' + JSON.stringify(evalSaveRes.body));
  }
  console.log('  ✓ Hybrid evaluation recorded as "draft".');

  // 15. SECURITY & PRIVACY AUDIT: Evaluation Draft Confidentiality
  console.log('15. SECURITY AUDIT: Verifying Draft Evaluation Confidentiality (Student & Parent Isolation)...');
  const stuEvalDraft = await request({
    hostname: 'localhost', port: 5000, path: `/api/evaluations/student/${student.id}`, method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  if (stuEvalDraft.body.evaluations && stuEvalDraft.body.evaluations.length > 0) {
    throw new Error('SECURITY VIOLATION: Student can see unpublished draft evaluations!');
  }
  console.log('  ✓ Student CANNOT view draft evaluation (Confidentiality maintained: 0 evaluations exposed).');

  const parentEvalDraft = await request({
    hostname: 'localhost', port: 5000, path: `/api/evaluations/student/${student.id}`, method: 'GET',
    headers: { Authorization: `Bearer ${parentToken}` }
  });
  if (parentEvalDraft.body.evaluations && parentEvalDraft.body.evaluations.length > 0) {
    throw new Error('SECURITY VIOLATION: Parent can see unpublished draft evaluations!');
  }
  console.log('  ✓ Parent CANNOT view draft evaluation (Confidentiality maintained: 0 evaluations exposed).');

  // 16. Admin Publishing Evaluations & Notification Delivery
  console.log('16. Officially Publishing Period Evaluations (Admin Action)...');
  const publishRes = await request(
    { hostname: 'localhost', port: 5000, path: `/api/evaluations/periods/${activePeriod.id}/publish`, method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` } },
    {}
  );
  if (publishRes.status !== 200) {
    throw new Error('Publishing evaluations failed: ' + JSON.stringify(publishRes.body));
  }
  console.log('  ✓ Period evaluations published officially.');

  // Verify Student now sees the published evaluation with score and rating
  const stuEvalPub = await request({
    hostname: 'localhost', port: 5000, path: `/api/evaluations/student/${student.id}`, method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  if (!stuEvalPub.body.evaluations || stuEvalPub.body.evaluations.length === 0) {
    throw new Error('Student CANNOT view published evaluation after official release!');
  }
  const publishedItem = stuEvalPub.body.evaluations[0];
  console.log(`  ✓ Student viewed published evaluation: Score=${publishedItem.numerical_score}, Rating="${publishedItem.qualitative_rating}", Notes="${publishedItem.supervisor_notes}"`);

  // 17. Parent Portal Progress Integration Check
  console.log('17. Verifying Parent Portal Progress Integration (GET /api/parent/students/:id/progress)...');
  const parentProgRes = await request({
    hostname: 'localhost', port: 5000, path: `/api/parent/students/${student.id}/progress`, method: 'GET',
    headers: { Authorization: `Bearer ${parentToken}` }
  });
  if (parentProgRes.status !== 200 || !parentProgRes.body.scores || parentProgRes.body.scores.length === 0) {
    throw new Error('Parent portal progress did not reflect published evaluation: ' + JSON.stringify(parentProgRes.body));
  }
  console.log(`  ✓ Parent portal reflected child progress: Status="${parentProgRes.body.status_message}", Score Count=${parentProgRes.body.scores.length}`);

  // 18. SECURITY AUDIT: Strict Anti-IDOR Protections
  console.log('18. SECURITY AUDIT: Verifying Anti-IDOR Restrictions on Attendance & Evaluations...');
  // Find a second student if available
  const studentB = studentsRes.body.students.find((s) => s.id !== student.id);
  if (studentB) {
    // Student A tries to read Student B's attendance
    const idorStuAtt = await request({
      hostname: 'localhost', port: 5000, path: `/api/attendance/student/${studentB.id}`, method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (idorStuAtt.status === 403) {
      console.log('  ✓ Anti-IDOR: Student A blocked from viewing Student B attendance (HTTP 403 Forbidden).');
    } else {
      throw new Error(`IDOR vulnerability! Student A accessed Student B attendance. Status: ${idorStuAtt.status}`);
    }

    // Student A tries to read Student B's evaluations
    const idorStuEval = await request({
      hostname: 'localhost', port: 5000, path: `/api/evaluations/student/${studentB.id}`, method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (idorStuEval.status === 403) {
      console.log('  ✓ Anti-IDOR: Student A blocked from viewing Student B evaluations (HTTP 403 Forbidden).');
    } else {
      throw new Error(`IDOR vulnerability! Student A accessed Student B evaluations. Status: ${idorStuEval.status}`);
    }
  }

  // 19. SECURITY AUDIT: Strict RBAC Protections
  console.log('19. SECURITY AUDIT: Verifying Strict RBAC Restrictions (Student & Parent forbidden from Admin actions)...');
  // Student attempts to record attendance
  const rbacAtt = await request(
    { hostname: 'localhost', port: 5000, path: `/api/attendance/sessions/${session1.id}/records`, method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` } },
    { records: [{ student_id: student.id, status: 'حاضر' }] }
  );
  if (rbacAtt.status === 403) {
    console.log('  ✓ RBAC: Student blocked from recording attendance (HTTP 403 Forbidden).');
  } else {
    throw new Error('RBAC violation! Student recorded attendance. Status: ' + rbacAtt.status);
  }

  // Student attempts to publish evaluations
  const rbacPub = await request(
    { hostname: 'localhost', port: 5000, path: `/api/evaluations/periods/${activePeriod.id}/publish`, method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` } },
    {}
  );
  if (rbacPub.status === 403) {
    console.log('  ✓ RBAC: Student blocked from publishing evaluations (HTTP 403 Forbidden).');
  } else {
    throw new Error('RBAC violation! Student published evaluations. Status: ' + rbacPub.status);
  }

  // Parent attempts to review excuses
  const rbacRev = await request(
    { hostname: 'localhost', port: 5000, path: `/api/attendance/excuses/${excuseId}/review`, method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${parentToken}` } },
    { review_status: 'approved' }
  );
  if (rbacRev.status === 403) {
    console.log('  ✓ RBAC: Parent blocked from reviewing excuses (HTTP 403 Forbidden).');
  } else {
    throw new Error('RBAC violation! Parent reviewed excuse. Status: ' + rbacRev.status);
  }

  // 20. Notifications Management (Read, Mark-All-Read)
  console.log('20. Testing Notifications Operations (Read / Mark-All-Read)...');
  const preMarkNotif = await request({
    hostname: 'localhost', port: 5000, path: '/api/notifications', method: 'GET',
    headers: { Authorization: `Bearer ${studentToken}` }
  });
  if (preMarkNotif.body.notifications.length > 0) {
    const targetNotifId = preMarkNotif.body.notifications[0].id;
    const markSingleRes = await request(
      { hostname: 'localhost', port: 5000, path: `/api/notifications/${targetNotifId}/read`, method: 'PATCH', headers: { Authorization: `Bearer ${studentToken}` } }
    );
    if (markSingleRes.status === 200) {
      console.log('  ✓ Single notification marked as read successfully.');
    }
  }

  const markAllRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/notifications/mark-all-read', method: 'POST', headers: { Authorization: `Bearer ${studentToken}` } }
  );
  if (markAllRes.status === 200) {
    const postMarkNotif = await request({
      hostname: 'localhost', port: 5000, path: '/api/notifications', method: 'GET',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    if (postMarkNotif.body.unread_count === 0) {
      console.log('  ✓ All notifications marked as read (unread_count: 0).');
    }
  }

  console.log('\n🌟 ALL PHASE 2.3 ATTENDANCE & EDUCATIONAL EVALUATION TESTS PASSED WITH 100% SUCCESS!');
}

runPhase2_3Tests().catch((err) => {
  console.error('\n❌ Phase 2.3 Test Suite Failed:', err);
  process.exit(1);
});
