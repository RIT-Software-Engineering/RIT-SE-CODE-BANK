CREATE TABLE IF NOT EXISTS publications (
    title VARCHAR(255) PRIMARY KEY NOT NULL,
    form_id INT UNSIGNED NOT NULL,
    status ENUM("In Progress", "In Submission", "Accepted", "Published"),
    venue VARCHAR(255) NOT NULL,
    proof_of_significance VARCHAR(255) NOT NULL,
    date_published DATE
);