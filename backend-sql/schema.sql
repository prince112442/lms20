-- ============================================================
-- Automated University Library Management System
-- MySQL 8+ schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS lms_db CHARACTER SET utf8mb4;
USE lms_db;

-- ---------- Roles & Users (staff/admin login) ----------
CREATE TABLE roles (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE   -- SUPER_ADMIN, LIBRARIAN, STAFF
);

CREATE TABLE users (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(120) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    role_id         BIGINT NOT NULL,
    avatar_url      VARCHAR(255),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- ---------- Members (Students / Teachers who borrow books) ----------
CREATE TABLE members (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    member_code     VARCHAR(30) NOT NULL UNIQUE,     -- e.g. student/staff ID
    full_name       VARCHAR(120) NOT NULL,
    email           VARCHAR(150) NOT NULL UNIQUE,
    phone           VARCHAR(30),
    member_type     ENUM('STUDENT','TEACHER','STAFF') NOT NULL,
    department      VARCHAR(120),
    photo_url       VARCHAR(255),
    status          ENUM('ACTIVE','SUSPENDED','INACTIVE') DEFAULT 'ACTIVE',
    registered_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Books ----------
CREATE TABLE categories (
    id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    name    VARCHAR(80) NOT NULL UNIQUE          -- Fiction, Programming, Self Help...
);

CREATE TABLE books (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    isbn            VARCHAR(20) UNIQUE,
    title           VARCHAR(255) NOT NULL,
    author          VARCHAR(150) NOT NULL,
    category_id     BIGINT,
    cover_url       VARCHAR(255),
    total_copies    INT NOT NULL DEFAULT 1,
    available_copies INT NOT NULL DEFAULT 1,
    shelf_location  VARCHAR(50),
    added_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- ---------- Issued / Returned Books ----------
CREATE TABLE issued_books (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    book_id         BIGINT NOT NULL,
    member_id       BIGINT NOT NULL,
    issued_by       BIGINT,                       -- staff user who processed it
    issue_date      DATE NOT NULL,
    due_date        DATE NOT NULL,
    return_date     DATE NULL,
    status          ENUM('ISSUED','RETURNED','OVERDUE') DEFAULT 'ISSUED',
    FOREIGN KEY (book_id) REFERENCES books(id),
    FOREIGN KEY (member_id) REFERENCES members(id),
    FOREIGN KEY (issued_by) REFERENCES users(id)
);

-- ---------- Book Requests (hold/reservation queue) ----------
CREATE TABLE book_requests (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    book_id         BIGINT NOT NULL,
    member_id       BIGINT NOT NULL,
    requested_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status          ENUM('PENDING','APPROVED','REJECTED','FULFILLED') DEFAULT 'PENDING',
    FOREIGN KEY (book_id) REFERENCES books(id),
    FOREIGN KEY (member_id) REFERENCES members(id)
);

-- ---------- Fines ----------
CREATE TABLE fines (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    issued_book_id  BIGINT NOT NULL,
    member_id       BIGINT NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,
    reason          VARCHAR(255) DEFAULT 'Overdue return',
    status          ENUM('UNPAID','PAID','WAIVED') DEFAULT 'UNPAID',
    paid_at         TIMESTAMP NULL,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (issued_book_id) REFERENCES issued_books(id),
    FOREIGN KEY (member_id) REFERENCES members(id)
);

-- ---------- Activity log (for the "Recent Activity" feed) ----------
CREATE TABLE activity_log (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_name      VARCHAR(120) NOT NULL,
    action          VARCHAR(255) NOT NULL,        -- e.g. "issued 'The Alchemist'"
    entity_type     VARCHAR(50),                  -- BOOK, MEMBER, FINE
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------- Helpful indexes ----------
CREATE INDEX idx_books_title ON books(title);
CREATE INDEX idx_issued_status ON issued_books(status);
CREATE INDEX idx_members_type ON members(member_type);

-- ---------- Seed roles ----------
INSERT INTO roles (name) VALUES ('SUPER_ADMIN'), ('LIBRARIAN'), ('STAFF');
