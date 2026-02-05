INSERT INTO `Comment` (`author`, `foreignTableName`, `foreignKey`, `status`, `comment`, `timestamp`) VALUES

-- App ID 1: Charlie Coder for SWEN-344-1 (Status: APPLIED)
('Charlie Coder', 'JobPositionApplicationHistory', '1', 'APPLIED', 'Initial application submitted by candidate.', '2025-07-10T14:30:00Z'),

-- App ID 2: Charlie Coder for SWEN-261-1 (Status: INTERVIEW)
('Charlie Coder', 'JobPositionApplicationHistory', '2', 'APPLIED', 'Initial application submitted by candidate.', '2025-07-14T09:00:00Z'),
('Dr. John Doe', 'JobPositionApplicationHistory', '2', 'INTERVIEW', 'Strong resume and previous TA experience for this course is a major plus. Moving to interview stage.', '2025-07-15T10:00:00Z'),

-- App ID 3: Charlie Coder for SWEN-261-2 (Status: HIRED)
('Charlie Coder','JobPositionApplicationHistory', '3', 'APPLIED', 'Initial application submitted by candidate.', '2025-07-19T18:00:00Z'),
('Dr. Jane Doe', 'JobPositionApplicationHistory', '3', 'INTERVIEW', 'Candidate has prior experience and a great academic record. Scheduling an interview.', '2025-07-20T11:30:00Z'),
('Dr. Jane Doe', 'JobPositionApplicationHistory', '3', 'PENDING_OFFER', 'Interview went exceptionally well. Very knowledgeable and articulate. Extending an offer.', '2025-07-25T14:00:00Z'),
('Charlie Coder', 'JobPositionApplicationHistory', '3', 'ACCEPTED_OFFER', 'Candidate has accepted the offer for the position.', '2025-07-26T09:00:00Z'),
('Alice Admin', 'JobPositionApplicationHistory', '3', 'HIRED', 'Candidate has accepted the offer for the position.', '2025-08-01T09:15:00Z'),

-- App ID 4: Charlie Coder for SWEN-344-3 (Status: ONHOLD)
('Charlie Coder', 'JobPositionApplicationHistory', '4', 'APPLIED', 'Initial application submitted by candidate.', '2025-07-28T11:00:00Z'),
('Dr. John Doe', 'JobPositionApplicationHistory', '4', 'ONHOLD', 'Excellent candidate, but we have already hired for another position. Placing this application on hold in case a spot opens up.', '2025-08-02T16:00:00Z'),

-- App ID 5: Denise Designer for MATH-123-1 (Status: HIRED)
('Denise Designer', 'JobPositionApplicationHistory', '5', 'APPLIED', 'Initial application submitted by candidate.', '2025-07-11T10:00:00Z'),
('Dr. Bob Doe', 'JobPositionApplicationHistory', '5', 'INTERVIEW', 'Perfect academic record for this course. Moving to interview.', '2025-07-12T15:00:00Z'),
('Dr. Bob Doe', 'JobPositionApplicationHistory', '5', 'PENDING_OFFER', 'Great interview. Clear choice for the role. Sending offer.', '2025-07-16T11:00:00Z'),
('Denise Designer', 'JobPositionApplicationHistory', '5', 'ACCEPTED_OFFER', 'Offer accepted.', '2025-07-17T12:00:00Z'),
('Alice Admin', 'JobPositionApplicationHistory', '5', 'HIRED', 'Offer accepted.', '2025-07-20T10:20:00Z'),

-- App ID 6: Denise Designer for SWEN-561-1 (Status: REJECTED)
('Denise Designer', 'JobPositionApplicationHistory', '6', 'APPLIED', 'Initial application submitted by candidate.', '2025-07-16T21:00:00Z'),
('Dr. Jane Doe', 'JobPositionApplicationHistory', '6', 'INTERVIEW', 'Candidate has prior experience and a great academic record. Scheduling an interview.', '2025-07-17T12:00:00Z'),
('Dr. Jane Doe', 'JobPositionApplicationHistory', '6', 'REJECTED', 'Candidate has a strong background in Mathematics, but we are looking for someone with more direct software development experience for this role.', '2025-07-18T17:05:00Z'),

-- App ID 7: Evan Engineer for SWEN-344-1 (Status: ACCEPTED_OFFER)
('Evan Engineer', 'JobPositionApplicationHistory', '7', 'APPLIED', 'Initial application submitted by candidate.', '2025-07-19T18:00:00Z'),
('Dr. John Doe', 'JobPositionApplicationHistory', '7', 'INTERVIEW', 'Candidate has prior experience and a great academic record. Scheduling an interview.', '2025-07-20T11:30:00Z'),
('Dr. John Doe', 'JobPositionApplicationHistory', '7', 'PENDING_OFFER', 'Interview went exceptionally well. Very knowledgeable and articulate. Extending an offer.', '2025-07-25T14:00:00Z'),
('Evan Engineer', 'JobPositionApplicationHistory', '7', 'ACCEPTED_OFFER', 'Candidate has accepted the offer for the position.', '2025-07-26T09:00:00Z'),

-- App ID 8: Tyler Tester for SWEN-561-2 (Status: APPLIED)
('Tyler Tester', 'JobPositionApplicationHistory', '8', 'APPLIED', 'Initial application submitted by candidate.', '2025-08-01T13:00:00Z'),

-- App ID 9: Tyler Tester for 2237-SWEN-344-1 (Status: INACTIVE)
('Tyler Tester', 'JobPositionApplicationHistory', '9', 'APPLIED', 'Initial application submitted by candidate.', '2025-07-05T16:45:00Z'),
('Dr. John Doe', 'JobPositionApplicationHistory', '9', 'INTERVIEW', 'Candidate has prior experience and a great academic record. Scheduling an interview.', '2025-07-06T09:00:00Z'),
('Dr. John Doe', 'JobPositionApplicationHistory', '9', 'PENDING_OFFER', 'Interview went exceptionally well. Very knowledgeable and articulate. Extending an offer.', '2025-07-07T10:00:00Z'),
('Tyler Tester', 'JobPositionApplicationHistory', '9', 'ACCEPTED_OFFER', 'Candidate has accepted the offer for the position.', '2025-07-08T11:00:00Z'),
('Alice Admin', 'JobPositionApplicationHistory', '9', 'HIRED', 'Candidate has accepted the offer for the position.', '2025-07-09T12:00:00Z'),
('Alice Admin', 'JobPositionApplicationHistory', '9', 'INACTIVE', 'Position for this course and semester is no longer available. Application moved to inactive.', '2025-07-10T11:00:00Z'),

-- App ID 10: Sally Student for SWEN-344-1 (Status: REJECTED)
('Sally Student', 'JobPositionApplicationHistory', '10', 'APPLIED', 'Initial application submitted by candidate.', '2025-07-20T12:00:00Z'),
('Dr. John Doe', 'JobPositionApplicationHistory', '10', 'REJECTED', 'While the candidate has a good grade, we have decided to move forward with other candidates who have more relevant prior TA experience.', '2025-07-21T13:45:00Z'),

-- App ID 11: Sally Student for SWEN-261-1 (Status: APPLIED)
('Sally Student', 'JobPositionApplicationHistory', '11', 'APPLIED', 'Initial application submitted by candidate.', '2025-08-05T09:30:00Z');