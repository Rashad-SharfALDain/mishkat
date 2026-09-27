import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query, queryOne, run, saveDb, getDb } from './database';
import { CONFIG } from '../config';

export async function seedDatabase() {
  await getDb(); // Ensure tables are initialized

  // Ensure migration: check if columns exist in users and audit_logs
  try {
    const cols = await query('PRAGMA table_info(users)');
    if (!cols.some((c: any) => c.name === 'must_change_password')) {
      await run('ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 1');
    }
    if (!cols.some((c: any) => c.name === 'status')) {
      await run("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active'");
    }
    if (!cols.some((c: any) => c.name === 'last_login_at')) {
      await run('ALTER TABLE users ADD COLUMN last_login_at DATETIME');
    }

    // Ensure audit_logs has ip_address
    const auditCols = await query('PRAGMA table_info(audit_logs)');
    if (auditCols && auditCols.length > 0 && !auditCols.some((c: any) => c.name === 'ip_address')) {
      await run('ALTER TABLE audit_logs ADD COLUMN ip_address TEXT');
    }

    // Ensure password_resets table exists
    await run(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        email TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at DATETIME NOT NULL,
        used INTEGER DEFAULT 0,
        used_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    await run('CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token)');
    await run('CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id)');

    saveDb();
  } catch (err) {
    console.error('Column migration check warning:', err);
  }

  // Check if admin already exists
  const existingAdmin = await queryOne("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  
  if (!existingAdmin) {
    console.log('Seeding initial database data...');

    // 1. Admin User with initial password loaded from secure CONFIG
    const adminPasswordHash = bcrypt.hashSync(CONFIG.ADMIN_INITIAL_PASSWORD, 10);
    await run(`
      INSERT INTO users (id, name, email, phone, password_hash, role, must_change_password)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `, [
      uuidv4(),
      'إدارة مؤسسة مِشكاة التربوية',
      CONFIG.ADMIN_EMAIL,
      '+966500000000',
      adminPasswordHash,
      'admin'
    ]);

    // 2. Institution Settings (with clear DEMO/PLACEHOLDER labels until officially provided)
    const defaultSettings: [string, string, string][] = [
      ['institution_name', 'مؤسسة مِشكاة التربوية والتعليمية', 'اسم المؤسسة التعليمية'],
      ['tagline', 'نبني العلم... ونَصنع الشخصية... ونَصنع أثرًا', 'شعار المؤسسة الرئيسي'],
      ['sub_tagline', 'برنامج تربوي وتعليمي يهدف إلى بناء جيل يجمع بين العلم والقيم والوعي والقيادة، ليكون أكثر قدرة على خدمة مجتمعه وصناعة أثر إيجابي فيه.', 'الوصف التعريفي للرسالة'],
      ['registration_status', 'open', 'حالة التسجيل (open / closed)'],
      ['registration_fee', '500', 'مساهمة مالية رمزية تقديرية (ريال سعودي) - قابلة للتعديل والإعفاء'],
      ['registration_fee_max', '1000', 'الحد الأقصى للمساهمة المعتمدة'],
      ['currency', 'SAR', 'العملة الرسمية'],
      ['eligible_grades', 'طلاب الصف الأول الثانوي وما بعده', 'الصفوف الدراسية المؤهلة'],
      ['application_deadline', '2026-10-30', 'الموعد النهائي لاستقبال طلبات التسجيل'],
      ['contact_phone', '+966 11 000 0000 (هاتف تجريبي مؤقت)', 'رقم الهاتف الرسمي المؤقت'],
      ['contact_whatsapp', '+966 50 000 0000 (واتساب تجريبي مؤقت)', 'رقم الواتساب للتواصل المؤقت'],
      ['contact_email', 'info@mishkat.edu.sa', 'البريد الإلكتروني الرسمي للمؤسسة'],
      ['address', 'المملكة العربية السعودية - الرياض (مقر تجريبي)', 'العنوان والمقر الرئيسي المؤقت'],
      ['working_hours', 'الأحد إلى الخميس: ٨:٠٠ ص - ٥:٠٠ م', 'أوقات العمل الرسمية'],
      ['donation_account_name', 'مؤسسة مِشكاة التعليمية (حساب تجريبي قيد الاعتماد)', 'اسم الحساب البنكي التجريبي'],
      ['donation_iban', 'SA0380000000000000000000 (آيبان تجريبي توضيحي)', 'رقم الآيبان البنكي التجريبي التوضيحي']
    ];

    for (const [key, value, desc] of defaultSettings) {
      await run('INSERT OR REPLACE INTO settings (key, value, description) VALUES (?, ?, ?)', [key, value, desc]);
    }

    // 3. Educational Tracks (Programs)
    const programsData = [
      {
        id: 'track-sharia',
        title: 'العلوم الشرعية',
        description: 'تأصيل شرعي رصين يركز على الفهم الواعي والتطبيق العملي ومقاصد الشريعة السمحة.',
        category: 'sharia',
        icon: 'BookOpen',
        topics: JSON.stringify([
          'القرآن الكريم والتأمل والتدبر',
          'التفسير ومقاصد الآيات',
          'الحديث النبوي الشريف وشرحه',
          'الفقه الميسر وأصوله',
          'السيرة النبوية العطرة واستلهام الدروس',
          'العقيدة الإسلامية الصافية',
          'الأخلاق والآداب الإسلامية',
          'مقاصد الشريعة وحكمة التشريع'
        ]),
        sort_order: 1
      },
      {
        id: 'track-knowledge',
        title: 'العلوم والمعارف المعاصرة',
        description: 'توسيع المدارك، تنمية التفكير النقدي، والتمكين من أدوات المعرفة والوعي الرقمي.',
        category: 'knowledge',
        icon: 'Compass',
        topics: JSON.stringify([
          'الثقافة العامة وتاريخ الحضارات',
          'التفكير النقدي والتحليلي',
          'مهارات القراءة السريعة والمستوعبة',
          'البحث العلمي والتعلم الذاتي المستمر',
          'المعرفة العلمية والمنهج التجريبي',
          'التقنية والوعي الرقمي والأمان السيبراني',
          'مهارات حل المشكلات المعقدة',
          'التواصل الفعّال والإقناع'
        ]),
        sort_order: 2
      },
      {
        id: 'track-character',
        title: 'بناء الشخصية والقيم',
        description: 'ترسيخ الثقة بالنفس، الانضباط الذاتي، وتحمل المسؤولية الأخلاقية والاجتماعية.',
        category: 'character',
        icon: 'ShieldCheck',
        topics: JSON.stringify([
          'الثقة بالنفس وتقدير الذات الإيجابي',
          'الانضباط الشخصي والالتزام',
          'إدارة الوقت والأولويات بفاعلية',
          'تحمل المسؤولية الفردية والمجتمعية',
          'الذكاء الاجتماعي والعاطفي',
          'فنون الحوار البنّاء وتقبل الرأي الآخر',
          'مهارات اتخاذ القرار الرشيد',
          'العمل الجماعي وروح الفريق'
        ]),
        sort_order: 3
      },
      {
        id: 'track-leadership',
        title: 'القيادة وصناعة الأثر',
        description: 'إعداد قادة الغد بالممارسة الميدانية، إدارة المبادرات، وخدمة المجتمع.',
        category: 'leadership',
        icon: 'Target',
        topics: JSON.stringify([
          'القيادة الشخصية والقيادة بالقدوة',
          'المبادرة والابتكار الاجتماعي',
          'إدارة الفرق وقيادة المجموعات',
          'التخطيط الاستراتيجي والتنفيذي',
          'إدارة المشاريع والمبادرات الشبابية',
          'التحدث أمام الجمهور وفن الخطابة',
          'حل النزاعات وإدارة الأزمات',
          'المسؤولية الميدانية وخدمة المجتمع'
        ]),
        sort_order: 4
      }
    ];

    for (const prog of programsData) {
      await run(`
        INSERT OR REPLACE INTO programs (id, title, description, category, icon, topics, sort_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [prog.id, prog.title, prog.description, prog.category, prog.icon, prog.topics, prog.sort_order]);
    }

    // 4. FAQ Items
    const faqs = [
      {
        id: 'faq-1',
        question: 'من يستطيع التسجيل في البرنامج؟',
        answer: 'يستهدف البرنامج في مرحلته الحالية طلاب الصف الأول الثانوي فما بعده، من المتميزين الراغبين في صقل معارفهم وبناء شخصياتهم القيادية، مع استعدادهم للالتزام بأنشطة البرنامج.',
        category: 'شروط القبول',
        sort_order: 1
      },
      {
        id: 'faq-2',
        question: 'متى يبدأ التسجيل وما مواعيده؟',
        answer: 'يُفتح باب التسجيل في بداية كل فصل دراسي، ووفق التقويم المعتمد المعلن على موقع المؤسسة. يتم استقبال الطلبات ومراجعتها دورياً من قِبل لجنة القبول والتسجيل.',
        category: 'مواعيد التسجيل',
        sort_order: 2
      },
      {
        id: 'faq-3',
        question: 'ما الصفوف والمراحل الدراسية المستهدفة؟',
        answer: 'التركيز الأساسي على المرحلة الثانوية (من الأول الثانوي وحتى الثالث الثانوي وما بعده). كما يُهيأ النظام لإمكانية التوسع واستيعاب مراحل إضافية مستقبلاً.',
        category: 'شروط القبول',
        sort_order: 3
      },
      {
        id: 'faq-4',
        question: 'هل توجد رسوم أو مساهمة مالية للتسجيل؟',
        answer: 'تعتمد المؤسسة نظام المساهمة المالية الرمزية لدعم الأنشطة التعليمية وتأمين الموارد، بحد أقصى لا يتجاوز 1000 ريال سعودي. هذه المساهمة قابلة للإعفاء الكامل للمستحقين.',
        category: 'الرسوم والمساهمات',
        sort_order: 4
      },
      {
        id: 'faq-5',
        question: 'هل الرسوم أو المساهمة المالية شرط للقبول في البرنامج؟',
        answer: 'إطلاقاً، المساهمة المالية ليست شرطاً ولا معياراً للقبول، كما أن دفعها لا يضمن القبول التلقائي. المعيار الأساسي للقبول هو رغبة الطالب، استعداده، واجتيازه لمعايير المراجعة والمقابلة الشخصية.',
        category: 'الرسوم والمساهمات',
        sort_order: 5
      },
      {
        id: 'faq-6',
        question: 'ما البرامج والمسارات التي يقدمها الدار؟',
        answer: 'يقدم الدار أربعة مسارات متكاملة ومتزامنة: مسار العلوم الشرعية التأصيلية، مسار العلوم والمعارف المعاصرة، مسار بناء الشخصية والقيم، ومسار الممارسة القيادية والمبادرات المجتمعية.',
        category: 'البرامج التعليمية',
        sort_order: 6
      },
      {
        id: 'faq-7',
        question: 'هل توجد منح دراسية أو إعفاءات مالية؟',
        answer: 'نعم، يوفر الدار صندوقاً للمنح والكفالات التعليمية المدعوم من المحسنين والواقفين، بحيث يحصل أي طالب مستحق على إعفاء كامل دون أي حرج وبسرية تامة.',
        category: 'الرسوم والمساهمات',
        sort_order: 7
      },
      {
        id: 'faq-8',
        question: 'كيف يتم فرز واختيار الطلاب المتقدمين؟',
        answer: 'تتم مراجعة الطلبات بدقة من خلال: تدقيق البيانات والمعلومات المقدمة، بيان الرغبة والدافعية، ثم دعوة الطالب المرشح لمقابلة شخصية ودية مع المشرفين التربويين لتقييم المواءمة مع البرنامج.',
        category: 'إجراءات القبول',
        sort_order: 8
      },
      {
        id: 'faq-9',
        question: 'كيف يمكن للأفراد والجهات دعم رسالة الدار؟',
        answer: 'يمكن للمحسنين والداعمين مساندة المؤسسة من خلال رعاية المقاعد التعليمية، دعم المبادرات والأنشطة الشبابية، رعاية البرامج القيادية، أو الإسهام في الأوقاف التعليمية العامة.',
        category: 'الدعم والمساهمة',
        sort_order: 9
      },
      {
        id: 'faq-10',
        question: 'هل يمكن للطلاب الاستمرار في مجتمع الدار بعد التخرج؟',
        answer: 'نعم، التخرج ليس نهاية المسيرة بل هو بداية الانضمام إلى "شبكة خريجي مِشكاة"، حيث يستمر الخريجون كمرشدين للأجيال اللاحقة، وقادة للمبادرات المجتمعية، وأعضاء فاعلين في لجان الدار.',
        category: 'الخريجون',
        sort_order: 10
      },
      {
        id: 'faq-11',
        question: 'كيف أتواصل مع إدارة الدار للاستفسارات المباشرة؟',
        answer: 'يمكنك التواصل معنا عبر صفحة "تواصل معنا"، أو مراسلتنا عبر البريد الإلكتروني الرسمي info@mishkat.edu.sa، أو عبر رقم الواتساب المعتمد خلال ساعات العمل الرسمية.',
        category: 'التواصل',
        sort_order: 11
      }
    ];

    for (const faq of faqs) {
      await run(`
        INSERT OR REPLACE INTO faq (id, question, answer, category, sort_order)
        VALUES (?, ?, ?, ?, ?)
      `, [faq.id, faq.question, faq.answer, faq.category, faq.sort_order]);
    }

    // 5. Realistic Demo Applicants (Explicitly marked for admin testing and preview)
    const demoApplicants = [
      {
        id: 'app-demo-1',
        app_num: 'APP-2026-00101',
        name: 'عبدالرحمن محمد السعيد (نموذج تجريبي)',
        dob: '2009-04-15',
        gender: 'ذكر',
        grade: 'الصف الأول الثانوي',
        school: 'ثانوية اليمامة الأهلية',
        city: 'الرياض',
        phone: '0551234567',
        email: 'abdulrahman.demo@example.com',
        guardian_name: 'محمد عبدالله السعيد',
        guardian_rel: 'أب',
        guardian_phone: '0501234567',
        guardian_email: 'guardian.saeed@example.com',
        level: 'ممتاز',
        tracks: JSON.stringify(['العلوم الشرعية', 'القيادة']),
        motivation: 'أرغب بشدة في تطوير مهاراتي القيادية والتزود بالعلوم الشرعية بأسلوب معاصر يساعدني على تقديم النفع لزملائي ومجتمعي.',
        skills: 'إلقاء، كتابة مقالات، تنظيم الفعاليات المدرسية',
        leadership_exp: 'نعم - قائد النادي الثقافي في المرحلة المتوسطة',
        status: 'جديد',
        notes: 'طالب متميز بناءً على بياناته الأولية. يحتاج جدولة مقابلة شخصية.'
      },
      {
        id: 'app-demo-2',
        app_num: 'APP-2026-00102',
        name: 'فيصل عمر باوزير (نموذج تجريبي)',
        dob: '2008-11-20',
        gender: 'ذكر',
        grade: 'الصف الثاني الثانوي',
        school: 'ثانوية الإمام الذهبي',
        city: 'جدة',
        phone: '0547654321',
        email: 'faisal.demo@example.com',
        guardian_name: 'عمر خالد باوزير',
        guardian_rel: 'أب',
        guardian_phone: '0507654321',
        guardian_email: 'omar.bawazir@example.com',
        level: 'جيد جدًا',
        tracks: JSON.stringify(['العلوم والمعارف', 'بناء الشخصية']),
        motivation: 'البحث عن بيئة تربوية محفزة تساعد على استثمار الوقت وإتقان مهارات التفكير الناقد والتحدث أمام الجمهور.',
        skills: 'برمجة مبسطة، قراءة، شطرنج',
        leadership_exp: 'نعم - مشاركة في مبادرة تطوعية بيئية في الحي',
        status: 'قيد المراجعة',
        notes: 'تم التواصل مع ولي أمره وأبدى حرصه الكامل على المتابعة والالتزام.'
      },
      {
        id: 'app-demo-3',
        app_num: 'APP-2026-00103',
        name: 'سعود عبدالعزيز الشمري (نموذج تجريبي)',
        dob: '2008-01-10',
        gender: 'ذكر',
        grade: 'الصف الثاني الثانوي',
        school: 'ثانوية الملك فهد',
        city: 'الدمام',
        phone: '0569876543',
        email: 'saud.demo@example.com',
        guardian_name: 'عبدالعزيز راشد الشمري',
        guardian_rel: 'أب',
        guardian_phone: '0509876543',
        guardian_email: 'abdulaziz.shammary@example.com',
        level: 'ممتاز',
        tracks: JSON.stringify(['العلوم الشرعية', 'العلوم والمعارف', 'القيادة']),
        motivation: 'بناء رؤية واضحة للمستقبل واستكمال مسار التميز الأكاديمي مع التحلي بالأخلاق الإسلامية والمسؤولية المجتمعية.',
        skills: 'حفظ القرآن الكريم كاملاً، مهارات إقناع وتفاوض',
        leadership_exp: 'نعم - المركز الأول في مسابقة الإلقاء والخطابة',
        status: 'مقبول',
        notes: 'تم إجراء المقابلة الشخصية واجتازها بتفوق وتم قبوله وتحديد مشرفه المباشر.'
      }
    ];

    for (const app of demoApplicants) {
      await run(`
        INSERT OR REPLACE INTO applicants (
          id, application_number, student_name, date_of_birth, gender,
          grade, school, city, phone, email, guardian_name,
          guardian_relationship, guardian_phone, guardian_email, academic_level,
          interested_tracks, motivation, skills, leadership_experience,
          status, internal_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        app.id, app.app_num, app.name, app.dob, app.gender,
        app.grade, app.school, app.city, app.phone, app.email, app.guardian_name,
        app.guardian_rel, app.guardian_phone, app.guardian_email, app.level,
        app.tracks, app.motivation, app.skills, app.leadership_exp,
        app.status, app.notes
      ]);
    }

    saveDb();
    console.log('✓ Database seeding complete. Admin configured securely via environment variables.');
  } else {
    console.log('Database already initialized.');
  }

  // Seed default announcements if empty
  const announcementCount = await queryOne('SELECT COUNT(*) as count FROM announcements');
  if (!announcementCount || announcementCount.count === 0) {
    const defaultAnnouncements = [
      {
        id: uuidv4(),
        title: 'اللقاء التعريفي السنوي للعام الدراسي 2026-2027',
        content: 'ترحب مؤسسة مِشكاة التربوية بجميع طلابها المقبولين، ويسرنا دعوتكم لحضور اللقاء التعريفي الأول للتعرف على خطة البرامج والمشرفين التربويين.',
        audience: 'all_students',
        status: 'published',
        publish_date: '2026-10-01'
      },
      {
        id: uuidv4(),
        title: 'تدشين مسار القراءة الموجهة وبناء القيم',
        content: 'ضمن مسار بناء المعرفة والفكر، تم الإعلان عن كتاب الشهر بعنوان "معالم في بناء الشخصية المتوازنة"، نرجو من جميع الطلاب الاطلاع على أسئلة النقاش في بوابة الأنشطة.',
        audience: 'all_students',
        status: 'published',
        publish_date: '2026-10-05'
      },
      {
        id: uuidv4(),
        title: 'ورشة مهارات الإلقاء والتأثير القيادي',
        content: 'تعلن وحدة القيادة عن عقد ورشة تفاعلية بعنوان "فنون التحدث أمام الجمهور" يوم الأربعاء القادم في القاعة الكبرى.',
        audience: 'all_students',
        status: 'published',
        publish_date: '2026-10-10'
      }
    ];

    for (const ann of defaultAnnouncements) {
      await run(`
        INSERT INTO announcements (id, title, content, audience, status, publish_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [ann.id, ann.title, ann.content, ann.audience, ann.status, ann.publish_date]);
    }
    console.log('✓ Seeded initial announcements.');
  }

  // Seed default foundational activities if empty
  const activityCount = await queryOne('SELECT COUNT(*) as count FROM activities');
  if (!activityCount || activityCount.count === 0) {
    const defaultActivities = [
      {
        id: uuidv4(),
        title: 'تلخيص كتاب الشهر: معالم في طريق بناء الشخصية',
        description: 'قراءة الفصول المحددة من الكتاب وتقديم ملخص تحليلي يبرز ثلاث فوائد تطبيقية في الحياة اليومية ومشاركتها في حلقة النقاش التربوية.',
        activity_type: 'قراءة موجهة',
        due_date: '2026-10-25',
        status: 'active'
      },
      {
        id: uuidv4(),
        title: 'مبادرة الإحسان في المحيط المدرسي والأسري',
        description: 'تصميم وتنفيذ مبادرة إيجابية صغيرة تعزز قيمة الإحسان والتعاون في البيئة المدرسية أو الأسرية وتوثيق الأثر المتحقق في تقرير موجز.',
        activity_type: 'مبادرة مجتمعية',
        due_date: '2026-11-05',
        status: 'active'
      },
      {
        id: uuidv4(),
        title: 'دراسة حالة: التفكير الناقد وحل المعضلات القيمية',
        description: 'تحليل الموقف العملي المطروح ومناقشة الحلول الممكنة وفق معايير العدالة والأمانة والمسؤولية المجتمعية.',
        activity_type: 'واجب',
        due_date: '2026-11-15',
        status: 'active'
      }
    ];

    for (const act of defaultActivities) {
      await run(`
        INSERT INTO activities (id, title, description, activity_type, due_date, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [act.id, act.title, act.description, act.activity_type, act.due_date, act.status]);
    }
    console.log('✓ Seeded initial foundational activities.');
  }

  // Phase 2.3: Seed Evaluation Periods
  const periodCount = await queryOne('SELECT COUNT(*) as count FROM evaluation_periods');
  if (!periodCount || periodCount.count === 0) {
    await run(`
      INSERT INTO evaluation_periods (id, academic_year, period_name, start_date, end_date, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'period-2026-term1',
      '2026-2027',
      'الفصل الدراسي الأول 1448هـ / 2026-2027م',
      '2026-09-01',
      '2027-01-15',
      'active'
    ]);
    console.log('✓ Seeded Phase 2.3 default evaluation period.');
  }

  // Phase 2.3: Seed Evaluation Dimensions (The 5 Approved Dimensions in Hybrid Mode)
  const dimensionCount = await queryOne('SELECT COUNT(*) as count FROM evaluation_dimensions');
  if (!dimensionCount || dimensionCount.count === 0) {
    const scale = JSON.stringify(['ممتاز', 'جيد جدًا', 'جيد', 'يحتاج متابعة']);
    const defaultDimensions = [
      { id: 'dim-sharia', name: 'العلوم الشرعية', order: 1 },
      { id: 'dim-knowledge', name: 'العلوم والمعارف المعاصرة', order: 2 },
      { id: 'dim-character', name: 'بناء الشخصية والقيم', order: 3 },
      { id: 'dim-leadership', name: 'القيادة وصناعة الأثر', order: 4 },
      { id: 'dim-activities', name: 'الأنشطة والمبادرات', order: 5 },
    ];

    for (const dim of defaultDimensions) {
      await run(`
        INSERT INTO evaluation_dimensions (id, dimension_name, evaluation_mode, weight, max_score, qualitative_scale, status, sort_order)
        VALUES (?, ?, 'hybrid', 20.0, 100.0, ?, 'active', ?)
      `, [dim.id, dim.name, scale, dim.order]);
    }
    console.log('✓ Seeded Phase 2.3 default 5 evaluation dimensions (Hybrid mode, 20% weight each).');
  }

  // Phase 2.3: Approved institutional settings for attendance & excuses & warnings
  const phase2_3Settings: [string, string, string][] = [
    ['attendance_excuse_window_hours', '48', 'المهلة النظامية لتقديم عذر الغياب بالساعات'],
    ['absence_warning_threshold', '3', 'سقف الغياب المستوجب لإصدار إنذار أول رسمي'],
    ['attendance_statuses', JSON.stringify(['حاضر', 'غائب', 'متأخر', 'مستأذن', 'غياب بعذر']), 'حالات الحضور المعتمدة في النظام'],
  ];

  for (const [key, value, desc] of phase2_3Settings) {
    const existing = await queryOne('SELECT key FROM settings WHERE key = ?', [key]);
    if (!existing) {
      await run('INSERT INTO settings (key, value, description) VALUES (?, ?, ?)', [key, value, desc]);
    }
  }

  saveDb();
}

