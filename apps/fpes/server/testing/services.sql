CREATE TABLE service (
    id INT PRIMARY_KEY AUTO_INCREMENT,
    form_id INT FOREIGN_KEY NOT NULL,
    service_type ENUM('internal', 'external') NOT NULL
    title VARCHAR(40) NOT NULL,
    hours_worked INT NOT NULL,
    other_contributions VARCHAR(250) NOT NULL
);

INSERT INTO service (form_id, service_type, title, hours_worked, other_contributions)
VALUES (
    0,
    'internal'
    'Title',
    50,
    ''
)



