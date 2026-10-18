CREATE DATABASE smart_campus_db;
-- Run the remaining statements after connecting to smart_campus_db in pgAdmin.

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  department VARCHAR(100) NOT NULL,
  year_of_study SMALLINT NOT NULL CHECK (year_of_study BETWEEN 1 AND 6),
  status VARCHAR(20) NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS faculty (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  department VARCHAR(100) NOT NULL,
  designation VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('Present', 'Absent', 'Late')),
  UNIQUE(student_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS complaints (
  id SERIAL PRIMARY KEY,
  student_name VARCHAR(120) NOT NULL,
  category VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notices (
  id SERIAL PRIMARY KEY,
  title VARCHAR(180) NOT NULL,
  body TEXT NOT NULL,
  audience VARCHAR(80) NOT NULL DEFAULT 'All Students',
  published_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO students (full_name,email,department,year_of_study,status) VALUES
('Aarav Sharma','aarav.sharma@campus.edu','Computer Engineering',3,'Active'),
('Priya Patil','priya.patil@campus.edu','Information Technology',2,'Active'),
('Rahul Deshmukh','rahul.deshmukh@campus.edu','Mechanical Engineering',4,'Active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO faculty (full_name,email,department,designation,status) VALUES
('Dr. Meera Joshi','meera.joshi@campus.edu','Computer Engineering','HOD','Active'),
('Prof. Amit Kulkarni','amit.kulkarni@campus.edu','Information Technology','Assistant Professor','Active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO attendance (student_id,attendance_date,status)
SELECT id, CURRENT_DATE, 'Present' FROM students
ON CONFLICT (student_id,attendance_date) DO NOTHING;

INSERT INTO complaints (student_name,category,description,status) VALUES
('Priya Patil','Infrastructure','Projector in Room 204 is not working.','Open'),
('Aarav Sharma','Cleanliness','Please arrange an additional cleaning round.','In Progress');

INSERT INTO notices (title,body,audience) VALUES
('Welcome to Smart Campus','Check this portal for campus updates and announcements.','All Students'),
('Project Review Schedule','Department project reviews begin next Monday.','Final Year Students');
