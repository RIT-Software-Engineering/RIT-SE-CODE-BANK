CREATE TABLE IF NOT EXISTS forms_grants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT,
    grant_id INT,
    FOREIGN KEY (form_id) REFERENCES forms(id),
    FOREIGN KEY (grant_id) REFERENCES grants(grant_id)
);