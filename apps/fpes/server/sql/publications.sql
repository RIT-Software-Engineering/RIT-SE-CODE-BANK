DROP TABLE IF EXISTS publications;

CREATE TABLE IF NOT EXISTS publications (
    title VARCHAR(255) PRIMARY KEY NOT NULL,
    form_id INT UNSIGNED NOT NULL,
    status ENUM("In Progress", "In Submission", "Accepted", "Published"),
    venue VARCHAR(255) NOT NULL,
    proof_of_significance VARCHAR(255) NOT NULL,
    date_published DATETIME
);

INSERT INTO publications (
    title,
    form_id,
    status,
    venue,
    proof_of_significance,
    date_published
) VALUES
-- 1
('AI-Driven Traffic Optimization in Smart Cities', 1, 'In Progress', 'IEEE INFOCOM', 'ICORE A-rating', NULL),
-- 2
('Blockchain for Secure Voting Systems', 2, 'In Submission', 'ACM CCS', 'ICORE B-rating', NULL),
-- 3
('Low-Power IoT Protocols for Rural Connectivity', 3, 'Accepted', 'IEEE Globecom', 'ICORE A-rating', NULL),
-- 4
('Quantum-Resistant Encryption Methods', 4, 'In Progress', 'ArXiv', 'Preliminary Study', NULL),
-- 5
('Autonomous Vehicle Coordination Algorithms', 5, 'Published', 'IEEE Transactions on Intelligent Transportation Systems', 'Scopus Q1', '2025-08-22'),
-- 6
('Ethical Implications of AI in Healthcare', 2, 'In Submission', 'AAAI Conference', 'ICORE B-rating', NULL),
-- 7
('Data Compression for Edge Devices', 3, 'In Progress', 'Springer IoT Journal', 'ICORE C-rating', NULL),
-- 8
('Energy Harvesting for Wireless Sensor Networks', 1, 'Published', 'Elsevier Ad Hoc Networks', 'ICORE A-rating', '2025-10-01');
