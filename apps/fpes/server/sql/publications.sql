DROP TABLE IF EXISTS publications;

CREATE TABLE IF NOT EXISTS publications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY NOT NULL,
    form_id INT UNSIGNED NOT NULL,
    publication_name VARCHAR(50) NOT NULL,
    venue VARCHAR(40) NOT NULL,
    proof_of_significance VARCHAR(255) NOT NULL
);