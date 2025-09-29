DROP TABLE departments;

CREATE TABLE IF NOT EXISTS departments (
    id INT UNSIGNED UNIQUE auto_increment PRIMARY KEY,
    department_name VARCHAR(50),
    college VARCHAR(50)
);

INSERT INTO departments (department_name, college)
VALUES ('Software Engineering', 'GCCIS');
-- //Drop courses table before readding departments table, due to FK dependency