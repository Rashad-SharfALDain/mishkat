// Phase 2.2 Parent Portal & Relationship Security Automated Test Suite
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

async function runPhase2_2Tests() {
  console.log('👨‍👩‍👧‍👦 Starting Phase 2.2 — Parent Portal & Authorization Test Suite...\n');

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
    throw new Error('Admin authentication failed: ' + JSON.stringify(loginRes.body));
  }
  adminToken = loginRes.body.token;
  console.log('  ✓ Admin authenticated successfully.');

  // 2. Ensure at least two distinct enrolled students exist for multi-child & IDOR isolation testing
  console.log('2. Verifying existing enrolled students for relationship testing...');
  let studentsRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/admin/students', method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  let students = studentsRes.body.students || [];

  if (students.length < 2) {
    console.log('  -> Creating enrolled students from applicants to ensure at least 2 distinct students exist...');
    const appRes = await request({
      hostname: 'localhost', port: 5000, path: '/api/admin/applicants', method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const applicants = appRes.body.applicants || [];

    for (const app of applicants) {
      if (students.length >= 2) break;
      // If not already a student, accept and enroll
      if (app.status !== 'مقبول' && app.status !== 'مكتمل') {
        await request({
          hostname: 'localhost', port: 5000, path: `/api/admin/applicants/${app.id}`, method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }
        }, { status: 'مقبول' });
      }
      const enrollRes = await request({
        hostname: 'localhost', port: 5000, path: `/api/admin/students/from-applicant/${app.id}`, method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      if (enrollRes.status === 201) {
        students.push(enrollRes.body.student);
      }
    }
  }

  // Refetch students to have full objects
  studentsRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/admin/students', method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  students = studentsRes.body.students || [];
  if (students.length < 2) {
    throw new Error('Could not find or create at least 2 students for IDOR testing. Total students: ' + students.length);
  }

  const studentA = students[0];
  const studentB = students[1];
  console.log(`  ✓ Student A: ${studentA.student_name} (${studentA.student_number})`);
  console.log(`  ✓ Student B: ${studentB.student_name} (${studentB.student_number})`);

  // 3. Admin creates Parent A (linked to Student A)
  console.log('3. Admin creating Parent A linked to Student A...');
  const phoneA = '055' + Math.floor(1000000 + Math.random() * 9000000);
  const emailA = `parent.a.${Date.now()}@mishkat.test`;
  const createParentARes = await request({
    hostname: 'localhost', port: 5000, path: '/api/admin/parents', method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }
  }, {
    full_name: 'عبدالرحمن بن محمد القحطاني',
    phone: phoneA,
    email: emailA,
    relationship: 'أب',
    address: 'الرياض - حي النخيل',
    student_id: studentA.id,
  });

  if (createParentARes.status !== 201 || !createParentARes.body.credentials) {
    throw new Error('Failed to create Parent A: ' + JSON.stringify(createParentARes.body));
  }
  const parentAId = createParentARes.body.parent.id;
  const parentATempPassword = createParentARes.body.credentials.temporary_password;
  console.log(`  ✓ Parent A created successfully. ID: ${parentAId}, Phone: ${phoneA}`);
  console.log('  ✓ Temporary credentials generated securely with mandatory change flag: true');

  // 4. Admin creates Parent B (linked to Student B)
  console.log('4. Admin creating Parent B linked to Student B...');
  const phoneB = '056' + Math.floor(1000000 + Math.random() * 9000000);
  const emailB = `parent.b.${Date.now()}@mishkat.test`;
  const createParentBRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/admin/parents', method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }
  }, {
    full_name: 'سعود بن فهد الدوسري',
    phone: phoneB,
    email: emailB,
    relationship: 'أب',
    address: 'الرياض - حي الياسمين',
    student_id: studentB.id,
  });

  if (createParentBRes.status !== 201) {
    throw new Error('Failed to create Parent B: ' + JSON.stringify(createParentBRes.body));
  }
  const parentBId = createParentBRes.body.parent.id;
  console.log(`  ✓ Parent B created successfully. ID: ${parentBId}, Phone: ${phoneB}`);

  // 5. Test Parent Authentication (Success, Wrong Password, Invalid Token)
  console.log('5. Testing Parent Authentication...');
  // 5.1 Wrong password rejection
  const wrongPassRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { identifier: phoneA, password: 'WrongPassword#123' });
  if (wrongPassRes.status === 401) {
    console.log('  ✓ Wrong password correctly rejected with HTTP 401.');
  } else {
    throw new Error(`Expected 401 for wrong password, got: ${wrongPassRes.status}`);
  }

  // 5.2 Correct login with temporary password
  const parentALoginRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { identifier: phoneA, password: parentATempPassword });
  if (parentALoginRes.status !== 200 || parentALoginRes.body.user.role !== 'parent') {
    throw new Error('Parent A login failed: ' + JSON.stringify(parentALoginRes.body));
  }
  let parentAToken = parentALoginRes.body.token;
  if (!parentALoginRes.body.user.must_change_password) {
    throw new Error('Expected must_change_password to be true on first login');
  }
  console.log('  ✓ Parent A logged in successfully. Role: parent, must_change_password: true');

  // 5.3 Invalid token rejection
  const invalidTokenRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/parent/dashboard', method: 'GET',
    headers: { Authorization: 'Bearer INVALID_EXPIRED_OR_TAMPERED_TOKEN' }
  });
  if (invalidTokenRes.status === 401) {
    console.log('  ✓ Invalid / tampered token correctly rejected with HTTP 401.');
  } else {
    throw new Error(`Expected 401 for invalid token, got: ${invalidTokenRes.status}`);
  }

  // 6. Test Parent First-Login Mandatory Password Change
  console.log('6. Testing Parent Mandatory Password Change Flow...');
  const newParentPassword = 'ParentSecurePass#2026';
  const changePassRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/change-password', method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${parentAToken}` }
  }, { current_password: parentATempPassword, new_password: newParentPassword });

  if (changePassRes.status !== 200) {
    throw new Error('Parent password change failed: ' + JSON.stringify(changePassRes.body));
  }
  console.log('  ✓ Password changed successfully.');

  // Verify login with new password
  const newLoginRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { identifier: phoneA, password: newParentPassword });
  if (newLoginRes.status !== 200 || newLoginRes.body.user.must_change_password) {
    throw new Error('Login with updated password failed or must_change_password not cleared');
  }
  parentAToken = newLoginRes.body.token;
  console.log('  ✓ Parent logged in with updated password. must_change_password is now false.');

  // Verify old password is now rejected
  const oldLoginRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { identifier: phoneA, password: parentATempPassword });
  if (oldLoginRes.status === 401) {
    console.log('  ✓ Old temporary password correctly rejected (HTTP 401).');
  } else {
    throw new Error('Old password was not rejected!');
  }

  // 7. Test Parent Dashboard & Authorized Child Data
  console.log('7. Testing Parent Dashboard (GET /api/parent/dashboard)...');
  const dashRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/parent/dashboard', method: 'GET',
    headers: { Authorization: `Bearer ${parentAToken}` }
  });
  if (dashRes.status !== 200) {
    throw new Error('Failed to load parent dashboard: ' + JSON.stringify(dashRes.body));
  }
  const dashData = dashRes.body;
  if (!dashData.children || dashData.children.length !== 1) {
    throw new Error(`Expected exactly 1 child for Parent A, found: ${dashData.children?.length}`);
  }
  if (dashData.children[0].id !== studentA.id) {
    throw new Error(`Expected Student A (${studentA.id}), got: ${dashData.children[0].id}`);
  }
  console.log(`  ✓ Dashboard loaded: Parent=${dashData.parent.full_name}, Linked Student=${dashData.children[0].student_name}`);
  console.log(`  ✓ Attendance status banner: "${dashData.stats.attendance_status}"`);

  // Verify no administrative internal notes exposed in dashboard
  if (JSON.stringify(dashData).includes('internal_notes')) {
    throw new Error('SECURITY VIOLATION: Internal notes exposed in parent dashboard!');
  }
  console.log('  ✓ Verified: Confidential administrative internal notes are NEVER exposed.');

  // 8. Test Authorized Child Profile (GET /api/parent/students/:id)
  console.log('8. Testing Child Profile Access for Authorized Child (Student A)...');
  const childARes = await request({
    hostname: 'localhost', port: 5000, path: `/api/parent/students/${studentA.id}`, method: 'GET',
    headers: { Authorization: `Bearer ${parentAToken}` }
  });
  if (childARes.status !== 200 || !childARes.body.student) {
    throw new Error('Failed to get Student A profile: ' + JSON.stringify(childARes.body));
  }
  console.log(`  ✓ Profile loaded for Student A: ${childARes.body.student.student_name} (${childARes.body.student.student_number})`);

  // 9. SECURITY AUDIT: IDOR Protection (Parent A attempts to access Student B)
  console.log('9. SECURITY AUDIT: Verifying IDOR Protection (Parent A accessing unlinked Student B)...');
  
  // 9.1 Profile IDOR attempt
  const idorProfileRes = await request({
    hostname: 'localhost', port: 5000, path: `/api/parent/students/${studentB.id}`, method: 'GET',
    headers: { Authorization: `Bearer ${parentAToken}` }
  });
  if (idorProfileRes.status === 403) {
    console.log('  ✓ IDOR attempt on /api/parent/students/:id correctly BLOCKED (HTTP 403 Forbidden).');
  } else {
    throw new Error(`CRITICAL: IDOR vulnerability detected! Expected 403, got: ${idorProfileRes.status}`);
  }

  // 9.2 Attendance IDOR attempt
  const idorAttendanceRes = await request({
    hostname: 'localhost', port: 5000, path: `/api/parent/students/${studentB.id}/attendance`, method: 'GET',
    headers: { Authorization: `Bearer ${parentAToken}` }
  });
  if (idorAttendanceRes.status === 403) {
    console.log('  ✓ IDOR attempt on /api/parent/students/:id/attendance correctly BLOCKED (HTTP 403 Forbidden).');
  } else {
    throw new Error(`CRITICAL: IDOR attendance vulnerability! Expected 403, got: ${idorAttendanceRes.status}`);
  }

  // 9.3 Progress IDOR attempt
  const idorProgressRes = await request({
    hostname: 'localhost', port: 5000, path: `/api/parent/students/${studentB.id}/progress`, method: 'GET',
    headers: { Authorization: `Bearer ${parentAToken}` }
  });
  if (idorProgressRes.status === 403) {
    console.log('  ✓ IDOR attempt on /api/parent/students/:id/progress correctly BLOCKED (HTTP 403 Forbidden).');
  } else {
    throw new Error(`CRITICAL: IDOR progress vulnerability! Expected 403, got: ${idorProgressRes.status}`);
  }

  // 9.4 Activities IDOR attempt
  const idorActivitiesRes = await request({
    hostname: 'localhost', port: 5000, path: `/api/parent/students/${studentB.id}/activities`, method: 'GET',
    headers: { Authorization: `Bearer ${parentAToken}` }
  });
  if (idorActivitiesRes.status === 403) {
    console.log('  ✓ IDOR attempt on /api/parent/students/:id/activities correctly BLOCKED (HTTP 403 Forbidden).');
  } else {
    throw new Error(`CRITICAL: IDOR activities vulnerability! Expected 403, got: ${idorActivitiesRes.status}`);
  }

  // 10. SECURITY AUDIT: RBAC Enforcement (Parent cannot access Admin or Student APIs)
  console.log('10. SECURITY AUDIT: Strict RBAC Isolation (Parent Token blocked from Admin & Student APIs)...');
  
  // 10.1 Parent blocked from GET /api/admin/applicants
  const adminAppRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/admin/applicants', method: 'GET',
    headers: { Authorization: `Bearer ${parentAToken}` }
  });
  if (adminAppRes.status === 403) {
    console.log('  ✓ Parent blocked from GET /api/admin/applicants (HTTP 403 Forbidden).');
  } else {
    throw new Error(`Expected 403 for Parent calling Admin API, got: ${adminAppRes.status}`);
  }

  // 10.2 Parent blocked from GET /api/admin/students
  const adminStuRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/admin/students', method: 'GET',
    headers: { Authorization: `Bearer ${parentAToken}` }
  });
  if (adminStuRes.status === 403) {
    console.log('  ✓ Parent blocked from GET /api/admin/students (HTTP 403 Forbidden).');
  } else {
    throw new Error(`Expected 403 for Parent calling Admin Students API, got: ${adminStuRes.status}`);
  }

  // 10.3 Parent blocked from GET /api/admin/parents
  const adminParentRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/admin/parents', method: 'GET',
    headers: { Authorization: `Bearer ${parentAToken}` }
  });
  if (adminParentRes.status === 403) {
    console.log('  ✓ Parent blocked from GET /api/admin/parents (HTTP 403 Forbidden).');
  } else {
    throw new Error(`Expected 403 for Parent calling Admin Parents API, got: ${adminParentRes.status}`);
  }

  // 10.4 Parent blocked from Student portal APIs (e.g. GET /api/student/dashboard)
  const studentDashRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/student/dashboard', method: 'GET',
    headers: { Authorization: `Bearer ${parentAToken}` }
  });
  if (studentDashRes.status === 403) {
    console.log('  ✓ Parent blocked from Student Portal API /api/student/dashboard (HTTP 403 Forbidden).');
  } else {
    throw new Error(`Expected 403 for Parent calling Student API, got: ${studentDashRes.status}`);
  }

  // 10.5 Parent cannot modify student academic status or tamper with relationship via profile
  const tamperRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/parent/profile', method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${parentAToken}` }
  }, { status: 'غير نشط', relationship: 'عم', role: 'admin' });
  if (tamperRes.status === 403) {
    console.log('  ✓ Parent tampering attempt on immutable fields blocked (HTTP 403 Forbidden).');
  } else {
    throw new Error(`Expected 403 for illegal field modification, got: ${tamperRes.status}`);
  }

  // 11. Multi-Child Support: Link Second Student to Parent A
  console.log('11. Testing Multi-Child Relationship Support (Linking Student B to Parent A)...');
  const linkRes = await request({
    hostname: 'localhost', port: 5000, path: `/api/admin/parents/${parentAId}/link-student`, method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }
  }, { student_id: studentB.id, relationship: 'أب', is_primary: false });

  if (linkRes.status !== 200) {
    throw new Error('Failed to link Student B to Parent A: ' + JSON.stringify(linkRes.body));
  }
  console.log('  ✓ Admin successfully linked second child (Student B) to Parent A.');

  // Verify Parent A now has access to BOTH children
  const multiChildDashRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/parent/dashboard', method: 'GET',
    headers: { Authorization: `Bearer ${parentAToken}` }
  });
  if (multiChildDashRes.body.children.length !== 2) {
    throw new Error(`Expected 2 linked children for Parent A, got: ${multiChildDashRes.body.children.length}`);
  }
  console.log('  ✓ Parent A dashboard now reflects multiple children:');
  multiChildDashRes.body.children.forEach((c) => {
    console.log(`    - ${c.student_name} (${c.student_number}) [${c.educational_track}]`);
  });

  // Verify Parent A can now access Student B profile
  const childBAllowedRes = await request({
    hostname: 'localhost', port: 5000, path: `/api/parent/students/${studentB.id}`, method: 'GET',
    headers: { Authorization: `Bearer ${parentAToken}` }
  });
  if (childBAllowedRes.status === 200) {
    console.log('  ✓ Parent A now successfully accesses newly linked Student B profile (HTTP 200).');
  } else {
    throw new Error(`Expected 200 for newly linked student, got: ${childBAllowedRes.status}`);
  }

  // 12. Relationship Revocation: Unlink Student B from Parent A
  console.log('12. Testing Relationship Revocation & Access Removal...');
  const unlinkRes = await request({
    hostname: 'localhost', port: 5000, path: `/api/admin/parents/${parentAId}/link-student/${studentB.id}`, method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  if (unlinkRes.status !== 200) {
    throw new Error('Failed to unlink student: ' + JSON.stringify(unlinkRes.body));
  }
  console.log('  ✓ Admin unlinked Student B from Parent A.');

  // Verify Parent A access to Student B is immediately revoked
  const revokedAccessRes = await request({
    hostname: 'localhost', port: 5000, path: `/api/parent/students/${studentB.id}`, method: 'GET',
    headers: { Authorization: `Bearer ${parentAToken}` }
  });
  if (revokedAccessRes.status === 403) {
    console.log('  ✓ Revoked access immediately blocks Parent A from Student B (HTTP 403 Forbidden).');
  } else {
    throw new Error(`Expected 403 after unlinking, got: ${revokedAccessRes.status}`);
  }

  // Verify Parent A retains authorized access to Student A
  const retainedAccessRes = await request({
    hostname: 'localhost', port: 5000, path: `/api/parent/students/${studentA.id}`, method: 'GET',
    headers: { Authorization: `Bearer ${parentAToken}` }
  });
  if (retainedAccessRes.status === 200) {
    console.log('  ✓ Parent A retains access to Student A without disturbance (HTTP 200).');
  } else {
    throw new Error('Parent A lost access to Student A unexpectedly!');
  }

  // 13. Parent Contact Info Update
  console.log('13. Testing Parent Profile Update (Permitted Contact Fields Only)...');
  const updateContactRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/parent/profile', method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${parentAToken}` }
  }, { address: 'الرياض - حي حطين النموذجي' });
  if (updateContactRes.status === 200) {
    console.log('  ✓ Contact address updated successfully.');
  } else {
    throw new Error('Failed to update parent profile: ' + JSON.stringify(updateContactRes.body));
  }

  // 14. Admin Parent Management APIs (Search, Detail, Reset Access)
  console.log('14. Testing Admin Parent Management APIs...');
  // 14.1 Search parents
  const searchParentRes = await request({
    hostname: 'localhost', port: 5000, path: `/api/admin/parents?search=${encodeURIComponent('القحطاني')}`, method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  if (searchParentRes.status === 200 && searchParentRes.body.parents.length > 0) {
    console.log(`  ✓ Admin search found parent: ${searchParentRes.body.parents[0].full_name}`);
  } else {
    throw new Error('Admin parent search failed');
  }

  // 14.2 Admin Reset Parent Access
  const adminResetRes = await request({
    hostname: 'localhost', port: 5000, path: `/api/admin/parents/${parentAId}/reset-access`, method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  if (adminResetRes.status === 200 && adminResetRes.body.temporary_password) {
    console.log('  ✓ Admin reset parent access securely. Temporary password generated.');
  } else {
    throw new Error('Admin reset parent access failed');
  }

  console.log('\n🌟 ALL PHASE 2.2 PARENT PORTAL & AUTHORIZATION TESTS PASSED WITH 100% SUCCESS!');
}

runPhase2_2Tests().catch((err) => {
  console.error('\n❌ Phase 2.2 Test Suite Failed:', err);
  process.exit(1);
});
