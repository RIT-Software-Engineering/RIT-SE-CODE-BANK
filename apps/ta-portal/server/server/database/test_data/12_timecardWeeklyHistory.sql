INSERT INTO `TimecardWeeklyHistory` (`id`, `jobPositionHistoryId`, `weekStartDate`, `isCurrentWeek`) VALUES
-- For Charlie Coder (JobPositionHistoryId: 1)
(1, 1, '2025-07-04T00:00:00.000Z', FALSE),  -- Past week
(2, 1, '2025-07-11T00:00:00.000Z', FALSE),  -- Another past week
(4, 1, '2025-07-18T00:00:00.000Z', TRUE),  -- The new CURRENT week

-- For Denise Designer (JobPositionHistoryId: 2)
(3, 2, '2025-07-11T00:00:00.000Z', TRUE);