-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    template_id INTEGER NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    report_title VARCHAR(255) NOT NULL,
    report_month VARCHAR(50),
    visit_date DATE NOT NULL,
    visit_time TIME NOT NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'draft',
    overall_score DECIMAL(5,2),
    overall_percentage DECIMAL(5,2),
    overall_rating VARCHAR(50)
);

-- Create report_sections table to store section data
CREATE TABLE IF NOT EXISTS report_sections (
    id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    section_name VARCHAR(255) NOT NULL,
    section_order INTEGER NOT NULL,
    applicable_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    achieved_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    performance_percentage DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create report_questions table to store question data
CREATE TABLE IF NOT EXISTS report_questions (
    id SERIAL PRIMARY KEY,
    report_id INTEGER NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    section_id INTEGER NOT NULL REFERENCES report_sections(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_order INTEGER NOT NULL,
    response_type VARCHAR(50),
    response_value VARCHAR(255),
    applicable_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    achieved_score DECIMAL(5,2) NOT NULL DEFAULT 0,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create an index on client_id for faster lookups
CREATE INDEX reports_client_id_idx ON reports(client_id);
CREATE INDEX reports_branch_id_idx ON reports(branch_id);
CREATE INDEX reports_template_id_idx ON reports(template_id);
CREATE INDEX report_sections_report_id_idx ON report_sections(report_id);
CREATE INDEX report_questions_report_id_idx ON report_questions(report_id);
CREATE INDEX report_questions_section_id_idx ON report_questions(section_id); 