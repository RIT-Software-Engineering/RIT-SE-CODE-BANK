DROP TABLE department;

CREATE TABLE IF NOT EXISTS department (
    id INT UNSIGNED UNIQUE auto_increment PRIMARY KEY,
    department_name VARCHAR(50),
    college VARCHAR(50)
);