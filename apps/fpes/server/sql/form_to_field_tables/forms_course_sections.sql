CREATE TABLE IF NOT EXISTS forms_course_sections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    form_id INT,
    course_section_id INT,
    FOREIGN KEY (form_id) REFERENCES forms(id),
    FOREIGN KEY (course_section_id) REFERENCES course_sections(id)
);