CREATE TABLE IF NOT EXISTS services (
    id INT UNIQUE AUTO_INCREMENT PRIMARY KEY,
    service_type ENUM('internal', 'external') NOT NULL,
    title VARCHAR(255) NOT NULL,
    hours_worked INT NOT NULL,
    other_contributions VARCHAR(255) NOT NULL
);