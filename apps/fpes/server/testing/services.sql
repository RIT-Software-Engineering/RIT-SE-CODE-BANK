CREATE TABLE service (
    id INT PRIMARY_KEY AUTO_INCREMENT,
    form_id INT FOREIGN_KEY,
    service_type ENUM('internal', 'external')
    title VARCHAR(40),
    hours_worked INT,
    other_contributions VARCHAR(250)
);



