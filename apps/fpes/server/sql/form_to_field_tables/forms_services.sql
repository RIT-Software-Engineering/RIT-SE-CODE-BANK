CREATE TABLE IF NOT EXISTS forms_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT NOT NULL,
    service_id INT NOT NULL,
    FOREIGN KEY (form_id) REFERENCES forms(id),
    FOREIGN KEY (service_id) REFERENCES services(id)
)