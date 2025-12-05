CREATE TABLE IF NOT EXISTS forms_publications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT,
    publication_id INT,
    FOREIGN KEY (form_id) REFERENCES forms(id),
    FOREIGN KEY (publication_id) REFERENCES publications(id)
);