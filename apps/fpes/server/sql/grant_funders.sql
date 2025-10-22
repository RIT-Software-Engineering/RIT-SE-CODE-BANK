/*CREATE TABLE grant_funders (
  grant_id INT,
  funder_id INT,
  PRIMARY KEY (grant_id, funder_id),
  FOREIGN KEY (grant_id) REFERENCES grants(id) ON DELETE CASCADE,
  FOREIGN KEY (funder_id) REFERENCES funders(id) ON DELETE CASCADE
);*/