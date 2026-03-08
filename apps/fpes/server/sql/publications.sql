-- Previous table, unsure if it is needed if info is being parsed
-- CREATE TABLE IF NOT EXISTS publications (
--     id INT UNIQUE AUTO_INCREMENT PRIMARY KEY,
--     title VARCHAR(255) NOT NULL,
--     status ENUM("In Progress", "In Submission", "Accepted", "Published"),
--     venue VARCHAR(255) NOT NULL,
--     proof_of_significance VARCHAR(255) NOT NULL,
--     date_published DATE
-- );

CREATE TABLE IF NOT EXISTS publications(
    id INT UNIQUE AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    authors JSON NOT NULL
);