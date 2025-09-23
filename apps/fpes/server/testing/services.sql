DROP TABLE service;

CREATE TABLE IF NOT EXISTS service (
    id INT UNSIGNED auto_increment PRIMARY KEY,
    form_id INT NOT NULL,
    service_type ENUM('internal', 'external') NOT NULL,
    title VARCHAR(40) NOT NULL,
    hours_worked INT NOT NULL,
    other_contributions VARCHAR(250) NOT NULL
);

INSERT INTO service (form_id, service_type, title, hours_worked, other_contributions)
VALUES (
    0,
    'internal',
    'Title',
    50,
    ''
);



