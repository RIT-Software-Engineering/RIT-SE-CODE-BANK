-- For Charlie Coder (JobPositionHistoryId: 1)
INSERT INTO `TimecardWeeklyHistory` (`id`, `jobPositionHistoryId`, `weekStartDate`, `isCurrentWeek`) VALUES
(1, 1, '2025-07-04', 0),  -- Past week
(2, 1, '2025-07-11', 0),  -- Another past week
(4, 1, '2025-07-18', 1),  -- The new CURRENT week

-- For Denise Designer (JobPositionHistoryId: 2)
(3, 2, '2025-07-11', 1);