import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db.js';

dotenv.config();
const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

function databaseFailure(error) {
  if (error.code === '28P01') {
    return {
      status: 503,
      message: 'PostgreSQL login failed. Set the correct DB_USER and DB_PASSWORD in backend/.env, then restart the backend.'
    };
  }
  if (error.code === '3D000') {
    return {
      status: 503,
      message: 'The configured PostgreSQL database does not exist. Create smart_campus_db or correct DB_NAME in backend/.env.'
    };
  }
  if (error.code === '42P01') {
    return {
      status: 503,
      message: 'A required database table is missing. Run database/schema.sql in the smart_campus_db database.'
    };
  }
  return {
    status: 500,
    message: 'Database request failed. Check the backend terminal and PostgreSQL connection.'
  };
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', message: 'Smart Campus API is running' });
  } catch (error) {
    console.error('Database health check failed:', error);
    const failure = databaseFailure(error);
    res.status(failure.status).json({ status: 'error', message: failure.message });
  }
});

function respondToCreateError(res, error, messages) {
  console.error('Database create operation failed:', error);
  if (error.code === '23505') {
    return res.status(409).json({ message: messages.duplicate });
  }
  if (error.code === '23503') {
    return res.status(400).json({ message: messages.reference });
  }
  if (['28P01', '3D000', '42P01'].includes(error.code)) {
    const failure = databaseFailure(error);
    return res.status(failure.status).json({ message: failure.message });
  }
  return res.status(500).json({ message: messages.generic });
}

app.get('/api/dashboard', async (_req, res) => {
  try {
    const [students, faculty, complaints, notices] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count FROM students'),
      pool.query('SELECT COUNT(*)::int AS count FROM faculty'),
      pool.query("SELECT COUNT(*)::int AS count FROM complaints WHERE status <> 'Resolved'"),
      pool.query('SELECT COUNT(*)::int AS count FROM notices')
    ]);
    res.json({
      students: students.rows[0].count,
      faculty: faculty.rows[0].count,
      openComplaints: complaints.rows[0].count,
      notices: notices.rows[0].count
    });
  } catch (error) {
    console.error('Dashboard database query failed:', error);
    const failure = databaseFailure(error);
    res.status(failure.status).json({ message: failure.message });
  }
});

const modules = [
  { path: 'students', table: 'students', columns: 'id, full_name, email, department, year_of_study, status, created_at' },
  { path: 'faculty', table: 'faculty', columns: 'id, full_name, email, department, designation, status' },
  { path: 'attendance', table: 'attendance', columns: 'id, student_id, attendance_date, status' },
  { path: 'complaints', table: 'complaints', columns: 'id, student_name, category, description, status, created_at' },
  { path: 'notices', table: 'notices', columns: 'id, title, body, audience, published_at' }
];

for (const module of modules) {
  app.get(`/api/${module.path}`, async (_req, res) => {
    try {
      const result = await pool.query(`SELECT ${module.columns} FROM ${module.table} ORDER BY id DESC LIMIT 100`);
      res.json(result.rows);
    } catch (error) {
      console.error(`Unable to load ${module.path}:`, error);
      const failure = databaseFailure(error);
      res.status(failure.status).json({ message: failure.message });
    }
  });
}

app.post('/api/students', async (req, res) => {
  const { full_name, email, department, year_of_study } = req.body;
  if (!full_name?.trim() || !email?.trim() || !department?.trim() || !year_of_study) {
    return res.status(400).json({ message: 'full_name, email, department and year_of_study are required' });
  }
  if (!Number.isInteger(Number(year_of_study)) || Number(year_of_study) < 1 || Number(year_of_study) > 6) {
    return res.status(400).json({ message: 'year_of_study must be a whole number between 1 and 6' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO students (full_name,email,department,year_of_study) VALUES ($1,$2,$3,$4) RETURNING *',
      [full_name.trim(), email.trim(), department.trim(), Number(year_of_study)]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    respondToCreateError(res, error, {
      duplicate: 'This email address is already registered. Use a different email.',
      reference: 'The selected student could not be found.',
      generic: 'Could not create the student. Check the backend log and database connection.'
    });
  }
});

app.post('/api/faculty', async (req, res) => {
  const { full_name, email, department, designation, status = 'Active' } = req.body;
  if (!full_name?.trim() || !email?.trim() || !department?.trim() || !designation?.trim()) {
    return res.status(400).json({ message: 'full_name, email, department and designation are required' });
  }
  if (!['Active', 'Inactive'].includes(status)) {
    return res.status(400).json({ message: 'status must be Active or Inactive' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO faculty (full_name, email, department, designation, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [full_name.trim(), email.trim(), department.trim(), designation.trim(), status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    respondToCreateError(res, error, {
      duplicate: 'This email address is already registered. Use a different email.',
      reference: 'A related record could not be found.',
      generic: 'Could not create the faculty member. Check the backend log and database connection.'
    });
  }
});

app.post('/api/attendance', async (req, res) => {
  const { student_id, attendance_date, status } = req.body;
  if (!Number.isInteger(Number(student_id)) || Number(student_id) < 1 || !attendance_date || !['Present', 'Absent', 'Late'].includes(status)) {
    return res.status(400).json({ message: 'A valid student, date, and attendance status are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO attendance (student_id, attendance_date, status) VALUES ($1, $2, $3) RETURNING *',
      [Number(student_id), attendance_date, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    respondToCreateError(res, error, {
      duplicate: 'Attendance has already been recorded for this student on this date.',
      reference: 'The selected student could not be found.',
      generic: 'Could not save attendance. Check the backend log and database connection.'
    });
  }
});

app.post('/api/complaints', async (req, res) => {
  const { student_name, category, description, status = 'Open' } = req.body;
  if (!student_name?.trim() || !category?.trim() || !description?.trim()) {
    return res.status(400).json({ message: 'student_name, category and description are required' });
  }
  if (!['Open', 'In Progress', 'Resolved'].includes(status)) {
    return res.status(400).json({ message: 'status must be Open, In Progress, or Resolved' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO complaints (student_name, category, description, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [student_name.trim(), category.trim(), description.trim(), status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    respondToCreateError(res, error, {
      duplicate: 'A matching complaint already exists.',
      reference: 'A related record could not be found.',
      generic: 'Could not create the complaint. Check the backend log and database connection.'
    });
  }
});

app.post('/api/notices', async (req, res) => {
  const { title, body, audience = 'All Students' } = req.body;
  if (!title?.trim() || !body?.trim() || !audience?.trim()) {
    return res.status(400).json({ message: 'title, body and audience are required' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO notices (title, body, audience) VALUES ($1, $2, $3) RETURNING *',
      [title.trim(), body.trim(), audience.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    respondToCreateError(res, error, {
      duplicate: 'A matching notice already exists.',
      reference: 'A related record could not be found.',
      generic: 'Could not publish the notice. Check the backend log and database connection.'
    });
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error' });
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Smart Campus API running at http://localhost:${port}`));
