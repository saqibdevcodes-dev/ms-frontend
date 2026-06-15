-- Create report_templates table
CREATE TABLE IF NOT EXISTS report_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id VARCHAR(255) NOT NULL,
  template_name VARCHAR(255) NOT NULL,
  branch_code VARCHAR(255),
  colors JSON,
  content JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255),
  INDEX idx_client_id (client_id),
  INDEX idx_template_name (template_name),
  INDEX idx_branch_code (branch_code)
); 