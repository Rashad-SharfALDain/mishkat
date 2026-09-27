import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import readline from 'readline';
import { getDb, queryOne, run } from '../server/src/db/database';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function resetPassword() {
  await getDb();

  const adminEmail = (process.env.ADMIN_EMAIL || '20rashad21@gmail.com').trim().toLowerCase();

  const admin = await queryOne('SELECT id, name, email FROM users WHERE LOWER(email) = ?', [adminEmail]);
  if (!admin) {
    console.error(`❌ لم يتم العثور على حساب مدير بالبريد: ${adminEmail}`);
    process.exit(1);
  }

  // 1. Check if a password was passed as command line argument (e.g. npm run reset:admin -- "MyPassword")
  const rawArgs = process.argv.slice(2).filter((a) => !a.startsWith('-') && a.trim().length > 0);
  const argPassword = rawArgs.length > 0 ? rawArgs[0] : null;

  if (argPassword && argPassword.trim()) {
    if (argPassword.trim().length < 6) {
      console.error('❌ كلمة المرور يجب أن تكون 6 خانات على الأقل.');
      process.exit(1);
    }
    await applyPassword(admin.id, adminEmail, argPassword.trim());
    return;
  }

  // 2. If interactive terminal (TTY), prompt the administrator interactively
  if (process.stdin.isTTY) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('🔐 أدخل كلمة المرور الجديدة لحساب المدير: ', async (enteredPassword) => {
      rl.close();
      const cleaned = (enteredPassword || '').trim();
      if (!cleaned || cleaned.length < 6) {
        console.error('❌ كلمة المرور يجب أن تكون 6 خانات على الأقل.');
        process.exit(1);
      }
      await applyPassword(admin.id, adminEmail, cleaned);
    });
    return;
  }

  // 3. Fallback to environment variables when running in non-interactive/automated mode
  const envPassword = process.env.ADMIN_RESET_PASSWORD || process.env.ADMIN_INITIAL_PASSWORD;
  if (envPassword && envPassword.trim()) {
    await applyPassword(admin.id, adminEmail, envPassword.trim());
    return;
  }

  console.error('❌ لم يتم تزويد كلمة مرور. يرجى تمريرها كوسيط: npm run reset:admin -- "كلمتك_الجديدة"');
  process.exit(1);
}

async function applyPassword(adminId: string, email: string, newPlainPassword: string) {
  const hash = bcrypt.hashSync(newPlainPassword, 10);
  await run(
    'UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [hash, adminId]
  );
  console.log(`\n=======================================================`);
  console.log(`✅ تم تحديث كلمة مرور المدير بنجاح وبشكل آمن!`);
  console.log(`📧 معرّف الدخول (البريد الإلكتروني): ${email}`);
  console.log(`🔒 تم إلغاء فرض تغيير كلمة المرور لتسهيل تسجيل الدخول المباشر.`);
  console.log(`=======================================================\n`);
}

resetPassword().catch((err) => {
  console.error('حدث خطأ أثناء إعادة تعيين كلمة المرور:', err.message);
  process.exit(1);
});
