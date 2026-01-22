-- Check Printing System Database Schema

-- Drop tables if exists (for clean setup)
DROP TABLE IF EXISTS print_operations CASCADE;
DROP TABLE IF EXISTS inventory_transactions CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS user_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS branches CASCADE;

-- Branches Table
CREATE TABLE branches (
    id SERIAL PRIMARY KEY,
    branch_name VARCHAR(255) NOT NULL,
    branch_location VARCHAR(255) NOT NULL,
    routing_number VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Permissions Table
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    permission_name VARCHAR(100) NOT NULL UNIQUE,
    permission_code VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default permissions
INSERT INTO permissions (permission_name, permission_code, description) VALUES
('إدارة المستخدمين والفروع', 'MANAGE_USERS_BRANCHES', 'القدرة على إضافة/تعديل المستخدمين والفروع'),
('طباعة', 'PRINTING', 'السماح للمستخدم بتنفيذ عملية طباعة الشيكات'),
('تسليم دفاتر الشيكات', 'HANDOVER', 'السماح للمستخدم بتسجيل أن الدفتر المطبوع قد تم تسليمه للعميل'),
('عرض التقارير', 'REPORTING', 'السماح للمستخدم بالاطلاع على تقارير الطباعة والمخزون'),
('إدارة المخزون', 'INVENTORY_MANAGEMENT', 'السماح للمستخدم بإضافة أرصدة دفاتر الشيكات الخام'),
('إعادة الطباعة', 'REPRINT', 'السماح للمستخدم بإعادة طباعة الشيكات المطبوعة مسبقاً من شاشة السجلات');

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Permissions Junction Table
CREATE TABLE user_permissions (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    permission_id INTEGER REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, permission_id)
);

-- Accounts Table (Local storage of bank accounts)
CREATE TABLE accounts (
    id SERIAL PRIMARY KEY,
    account_number VARCHAR(50) NOT NULL UNIQUE,
    account_holder_name VARCHAR(255) NOT NULL,
    account_type INTEGER NOT NULL CHECK (account_type IN (1, 2)), -- 1: Individual (25 sheets), 2: Corporate (50 sheets)
    last_printed_serial INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Table
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    stock_type INTEGER NOT NULL CHECK (stock_type IN (1, 2)), -- 1: Individual (25 sheets), 2: Corporate (50 sheets)
    quantity INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default inventory records
INSERT INTO inventory (stock_type, quantity) VALUES (1, 0), (2, 0);

-- Inventory Transactions Table (for tracking inventory movements)
CREATE TABLE inventory_transactions (
    id SERIAL PRIMARY KEY,
    stock_type INTEGER NOT NULL CHECK (stock_type IN (1, 2)),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('ADD', 'DEDUCT')),
    quantity INTEGER NOT NULL,
    serial_from VARCHAR(50),
    serial_to VARCHAR(50),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Print Operations Table
CREATE TABLE print_operations (
    id SERIAL PRIMARY KEY,
    account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    routing_number VARCHAR(50) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_type INTEGER NOT NULL,
    serial_from INTEGER NOT NULL,
    serial_to INTEGER NOT NULL,
    sheets_printed INTEGER NOT NULL,
    print_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
    notes TEXT
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_branch_id ON users(branch_id);
CREATE INDEX idx_accounts_account_number ON accounts(account_number);
CREATE INDEX idx_print_operations_account_id ON print_operations(account_id);
CREATE INDEX idx_print_operations_user_id ON print_operations(user_id);
CREATE INDEX idx_print_operations_branch_id ON print_operations(branch_id);
CREATE INDEX idx_print_operations_print_date ON print_operations(print_date);
CREATE INDEX idx_inventory_transactions_stock_type ON inventory_transactions(stock_type);
CREATE INDEX idx_inventory_transactions_created_at ON inventory_transactions(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

