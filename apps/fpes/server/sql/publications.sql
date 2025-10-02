DROP TABLE publications;

CREATE TABLE IF NOT EXISTS publications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY IS NOT NULL,
    form_id INT UNSIGNED IS NOT NULL,
    publication_name VARCHAR(50) IS NOT NULL,
    venue VARCHAR(40) IS NOT NULL,
    proof_of_significance VARCHAR(255)
);