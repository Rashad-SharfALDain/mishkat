// Comprehensive UAT Fixes & User Management Test Suite for Mishkat Platform
require('dotenv').config();
const http = require('http');
const fs = require('fs');
const initSqlJs = require('./node_modules/sql.js');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@mishkat.edu.sa';
const ADMIN_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD;
const TEST_NEW_PASSWORD = process.env.TEST_NEW_PASSWORD;

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

async function getSqliteDb() {
  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync('data/institution.sqlite');
  return new SQL.Database(fileBuffer);
}

async function runUATTests() {
  console.log('🛡️ Starting UAT Improvements & User Management Automated Test Suite...\n');
  let adminToken = '';

  // 1. Admin Login & Identification
  console.log('1. Testing Admin Login and Active Status...');
  let loginRes = await request(
    { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: ADMIN_EMAIL, password: ADMIN_PASSWORD }
  );
  if (loginRes.status !== 200) {
    loginRes = await request(
      { hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
      { email: ADMIN_EMAIL, password: TEST_NEW_PASSWORD }
    );
  }

  if (loginRes.status === 200 && loginRes.body.token) {
    adminToken = loginRes.body.token;
    console.log(`  ✓ Admin logged in successfully: ${loginRes.body.user.name} (${loginRes.body.user.email})`);
    console.log(`  ✓ Account status: ${loginRes.body.user.status}`);
  } else {
    throw new Error('Admin login failed: ' + JSON.stringify(loginRes.body));
  }

  // 2. User Management: Query Users & Metrics
  console.log('2. Testing User Management API (GET /api/admin/users)...');
  const usersRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/admin/users', method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  if (usersRes.status === 200 && usersRes.body.users && usersRes.body.metrics) {
    console.log(`  ✓ Users loaded: Total=${usersRes.body.metrics.total}, Active=${usersRes.body.metrics.active}`);
    console.log(`  ✓ Role counts: Admin=${usersRes.body.metrics.roles.admin}, Supervisor=${usersRes.body.metrics.roles.supervisor}, Student=${usersRes.body.metrics.roles.student}, Parent=${usersRes.body.metrics.roles.parent}`);
  } else {
    throw new Error('Failed to fetch users: ' + JSON.stringify(usersRes.body));
  }

  // 3. User Management: Create New User (Supervisor)
  console.log('3. Testing New User Creation with Uniqueness & Password Hashing...');
  const testEmail = `supervisor.test.${Date.now()}@mishkat.edu.sa`;
  const createUserRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/admin/users', method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }
  }, {
    name: 'أ. تركي محمد السبيعي',
    email: testEmail,
    phone: '0551122334',
    role: 'supervisor',
    password: 'Password@12345',
    must_change_password: true,
  });

  if (createUserRes.status === 201 && createUserRes.body.user) {
    const createdUserId = createUserRes.body.user.id;
    console.log(`  ✓ Supervisor created: ${createUserRes.body.user.name} (${createUserRes.body.user.email})`);

    // Verify duplicate email is rejected
    const duplicateRes = await request({
      hostname: 'localhost', port: 5000, path: '/api/admin/users', method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }
    }, {
      name: 'مستخدم مكرر',
      email: testEmail,
      role: 'supervisor',
      password: 'Password@12345',
    });
    if (duplicateRes.status === 400) {
      console.log('  ✓ Duplicate email creation correctly rejected (HTTP 400).');
    } else {
      throw new Error('Failed to reject duplicate email: ' + duplicateRes.status);
    }

    // 4. Update User
    console.log('4. Testing User Update (PUT /api/admin/users/:id)...');
    const updateRes = await request({
      hostname: 'localhost', port: 5000, path: `/api/admin/users/${createdUserId}`, method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }
    }, {
      name: 'أ. تركي بن محمد السبيعي (مشرف أول)',
      phone: '0559988776',
    });
    if (updateRes.status === 200) {
      console.log('  ✓ User updated successfully.');
    } else {
      throw new Error('Failed to update user: ' + JSON.stringify(updateRes.body));
    }

    // 5. User Deactivation & Inactive Account Login Block
    console.log('5. Testing Account Deactivation & Login Block for Inactive Users...');
    const deactRes = await request({
      hostname: 'localhost', port: 5000, path: `/api/admin/users/${createdUserId}/status`, method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }
    }, { status: 'inactive' });

    if (deactRes.status === 200 && deactRes.body.status === 'inactive') {
      console.log('  ✓ Account deactivated.');
    } else {
      throw new Error('Failed to deactivate account: ' + JSON.stringify(deactRes.body));
    }

    // Attempt login with deactivated account -> Must be rejected with HTTP 403
    const blockedLoginRes = await request({
      hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: testEmail, password: 'Password@12345' });

    if (blockedLoginRes.status === 403) {
      console.log('  ✓ Inactive account login blocked successfully (HTTP 403 Forbidden).');
    } else {
      throw new Error(`Expected HTTP 403 for inactive login, got: ${blockedLoginRes.status}`);
    }

    // Reactivate account
    await request({
      hostname: 'localhost', port: 5000, path: `/api/admin/users/${createdUserId}/status`, method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }
    }, { status: 'active' });
    console.log('  ✓ Account reactivated.');

    // 6. Security Protection: Primary Admin Cannot Be Deactivated or Demoted
    console.log('6. Security Audit: Verifying Primary Admin Protection...');
    const adminUserRecord = usersRes.body.users.find((u) => u.email === 'admin@mishkat.edu.sa');
    if (adminUserRecord) {
      const deactAdminAttempt = await request({
        hostname: 'localhost', port: 5000, path: `/api/admin/users/${adminUserRecord.id}/status`, method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }
      }, { status: 'inactive' });
      if (deactAdminAttempt.status === 403) {
        console.log('  ✓ Primary Admin deactivation correctly BLOCKED (HTTP 403 Forbidden).');
      } else {
        throw new Error('Primary admin deactivation was not blocked!');
      }

      const demoteAdminAttempt = await request({
        hostname: 'localhost', port: 5000, path: `/api/admin/users/${adminUserRecord.id}`, method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }
      }, { role: 'supervisor' });
      if (demoteAdminAttempt.status === 403) {
        console.log('  ✓ Primary Admin role change correctly BLOCKED (HTTP 403 Forbidden).');
      } else {
        throw new Error('Primary admin demotion was not blocked!');
      }
    }
  } else {
    throw new Error('Failed to create supervisor user: ' + JSON.stringify(createUserRes.body));
  }

  // 7. Test Student Login Resolution
  console.log('7. Testing Student Login Resolution (Student Number & Email)...');
  const studentUser = usersRes.body.users.find((u) => u.role === 'student' && u.student_info);
  if (studentUser) {
    // Admin resets student password
    const resetStudentRes = await request({
      hostname: 'localhost', port: 5000, path: `/api/admin/users/${studentUser.id}/reset-password`, method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }
    }, { new_password: 'Student#Test2026!' });

    if (resetStudentRes.status === 200) {
      console.log(`  ✓ Student password reset securely by Admin for: ${studentUser.student_info.student_number}`);

      // Login using Student Number
      const loginByNumber = await request({
        hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { identifier: studentUser.student_info.student_number, password: 'Student#Test2026!' });

      if (loginByNumber.status === 200 && loginByNumber.body.user.role === 'student') {
        console.log(`  ✓ Student logged in successfully using Academic Number: ${studentUser.student_info.student_number}`);
      } else {
        throw new Error('Failed student login by number: ' + JSON.stringify(loginByNumber.body));
      }

      // Login using Student Email
      const loginByEmail = await request({
        hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { identifier: studentUser.email, password: 'Student#Test2026!' });

      if (loginByEmail.status === 200 && loginByEmail.body.user.role === 'student') {
        console.log(`  ✓ Student logged in successfully using Email: ${studentUser.email}`);
      } else {
        throw new Error('Failed student login by email: ' + JSON.stringify(loginByEmail.body));
      }
    }
  }

  // 8. Test Parent Login Resolution
  console.log('8. Testing Parent Login Resolution...');
  const parentUser = usersRes.body.users.find((u) => u.role === 'parent');
  if (parentUser) {
    // Admin resets parent password
    await request({
      hostname: 'localhost', port: 5000, path: `/api/admin/users/${parentUser.id}/reset-password`, method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` }
    }, { new_password: 'Parent#Test2026!' });

    const parentLogin = await request({
      hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { identifier: parentUser.email, password: 'Parent#Test2026!' });

    if (parentLogin.status === 200 && parentLogin.body.user.role === 'parent') {
      console.log(`  ✓ Parent logged in successfully: ${parentUser.name}`);
    } else {
      throw new Error('Parent login failed: ' + JSON.stringify(parentLogin.body));
    }
  }

  // 9. Testing Forgot Password Flow (Anti-Enumeration & Token Generation)
  console.log('9. Testing Forgot Password Flow & Anti-Enumeration...');
  const forgotRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/forgot-password', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-test-suite': 'mishkat-automated-test' }
  }, { identifier: ADMIN_EMAIL });

  if (forgotRes.status === 200 && forgotRes.body.success) {
    console.log('  ✓ Forgot password request processed.');
    console.log(`  ✓ Anti-enumeration message: "${forgotRes.body.message}"`);
  } else {
    throw new Error('Forgot password request failed: ' + JSON.stringify(forgotRes.body));
  }

  // Also test non-existent user returns the EXACT same generic success message
  const nonExistentForgot = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/forgot-password', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { identifier: 'nobody_unknown_9988@doesnotexist.com' });

  if (nonExistentForgot.status === 200 && nonExistentForgot.body.message === forgotRes.body.message) {
    console.log('  ✓ Anti-enumeration verified: identical message for non-existent account.');
  } else {
    throw new Error('Security Breach: Non-existent account returned different response!');
  }

  // 10. Test Reset Token Verification, Single-Use & Expiry
  console.log('10. Testing Password Reset Token Verification & Single-Use Enforcement...');
  const resetToken = forgotRes.body.dev_token;

  if (!resetToken) {
    throw new Error('Reset dev_token was not returned in dev/test environment!');
  }

  // Verify valid token
  const verifyRes = await request({
    hostname: 'localhost', port: 5000, path: `/api/auth/verify-reset-token?token=${resetToken}`, method: 'GET'
  });
  if (verifyRes.status === 200 && verifyRes.body.valid) {
    console.log(`  ✓ Token verified successfully. Masked Email: ${verifyRes.body.email}`);
  } else {
    throw new Error('Token verification failed: ' + JSON.stringify(verifyRes.body));
  }

  // Consume token and change password
  console.log('11. Testing Password Reset Execution & Single-Use Enforcement...');
  const resetExecRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/reset-password', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { token: resetToken, new_password: 'NewAdmin#Pass2026!' });

  if (resetExecRes.status === 200 && resetExecRes.body.success) {
    console.log('  ✓ Password reset executed successfully via single-use token.');
  } else {
    throw new Error('Reset password execution failed: ' + JSON.stringify(resetExecRes.body));
  }

  // Try reusing the token a second time -> Must fail!
  const reuseRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/reset-password', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { token: resetToken, new_password: 'AnotherPass#999!' });

  if (reuseRes.status === 400) {
    console.log('  ✓ Token reuse BLOCKED successfully (single-use enforced).');
  } else {
    throw new Error('Security Breach: Reset token was reused!');
  }

  // Restore Admin password back to ADMIN_PASSWORD for test suite idempotency
  await request({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: ADMIN_EMAIL, password: 'NewAdmin#Pass2026!' }).then(async (res) => {
    if (res.status === 200 && res.body.token) {
      await request({
        hostname: 'localhost', port: 5000, path: '/api/auth/change-password', method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${res.body.token}` }
      }, { current_password: 'NewAdmin#Pass2026!', new_password: ADMIN_PASSWORD });
      console.log('  ✓ Admin credentials safely restored to initial environment state.');
    }
  });

  // 12. Permissions Matrix API
  console.log('12. Testing Permissions Matrix API (GET /api/admin/permissions)...');
  const permsRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/admin/permissions', method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  if (permsRes.status === 200 && permsRes.body.permissions_matrix) {
    const roles = Object.keys(permsRes.body.permissions_matrix);
    console.log(`  ✓ Permissions matrix verified for roles: ${roles.join(', ')}`);
  } else {
    throw new Error('Permissions API failed: ' + permsRes.status);
  }

  // 13. Audit Logs Verification
  console.log('13. Testing Audit Trail API (GET /api/admin/audit-logs)...');
  const auditRes = await request({
    hostname: 'localhost', port: 5000, path: '/api/admin/audit-logs', method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  if (auditRes.status === 200 && Array.isArray(auditRes.body.logs) && auditRes.body.logs.length > 0) {
    const loggedActions = auditRes.body.logs.map((l) => l.action);
    console.log(`  ✓ Audit logs recorded successfully (${auditRes.body.logs.length} entries). Sample actions: ${[...new Set(loggedActions)].slice(0, 4).join(', ')}`);
  } else {
    throw new Error('Audit logs API failed: ' + auditRes.status);
  }

  console.log('\n🎉 ALL UAT FIXES & USER MANAGEMENT TESTS PASSED WITH 100% SUCCESS!\n');
}

runUATTests().catch((err) => {
  console.error('❌ UAT Test Suite Failed:', err);
  process.exit(1);
});
