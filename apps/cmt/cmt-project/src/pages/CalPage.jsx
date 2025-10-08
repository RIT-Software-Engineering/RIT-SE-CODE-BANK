import React, { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Edit,
  Trash2,
  X,
  Bell,
  BookOpen,
  Users,
  FileText,
  Clock,
} from "lucide-react";
import "../styles/calendar.css";

export default function CalPage() {
  console.log("Loaded CalPage.jsx");

  // State management
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [courses, setCourses] = useState([]);
  const [events, setEvents] = useState([]); // Changed from {} to []
  const [selectedDate, setSelectedDate] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: "",
    courseId: "",
    type: "lecture",
    time: "",
    location: "",
    description: "",
    importance: "Medium",
    preparation: [],
  });
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);

  const API_BASE = "http://localhost:5000/api/events";

  const loadCourses = async () => {
    try {
      const response = await fetch(`${API_BASE}/courses`);
      const result = await response.json();
      if (result.success) setCourses(result.data);
    } catch (error) {
      console.error("Error loading courses:", error);
    }
  };

  const loadEvents = async () => {
    try {
      const response = await fetch(API_BASE);
      const result = await response.json();
      if (result.success) {
        // Transform the array of events into date-grouped object for calendar display
        const eventsByDate = {};
        result.data.forEach((event) => {
          const dateKey = new Date(event.date).toISOString().split("T")[0];
          if (!eventsByDate[dateKey]) {
            eventsByDate[dateKey] = [];
          }
          eventsByDate[dateKey].push(event);
        });
        setEvents(eventsByDate);
      }
    } catch (error) {
      console.error("Error loading events:", error);
    }
  };

  useEffect(() => {
    loadCourses();
    loadEvents();
    loadUpcomingDeadlines();
  }, []);

  const loadUpcomingDeadlines = async () => {
    try {
      const response = await fetch(`${API_BASE}/deadlines?days=7`);
      const result = await response.json();
      if (result.success) {
        setUpcomingDeadlines(result.data);
      }
    } catch (error) {
      console.error("Error loading deadlines:", error);
      setUpcomingDeadlines([]);
    }
  };

  // Button handler functions
  const handleAddEvent = (date = null) => {
    setSelectedDate(date);
    setNewEvent({
      title: "",
      courseId: "",
      type: "lecture",
      time: "",
      location: "",
      description: "",
      importance: "Medium",
      preparation: [],
    });
    setShowAddEventModal(true);
  };

  const handleSaveNewEvent = async () => {
    if (!newEvent.title || !newEvent.courseId) {
      alert("Please fill in required fields: Title and Course");
      return;
    }

    try {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newEvent, date: selectedDate }),
      });
      const result = await response.json();

      if (result.success) {
        await loadEvents();
        await loadUpcomingDeadlines();
        setShowAddEventModal(false);
        alert("Event added successfully!");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert("Failed to save event");
    }
  };

  const handleEditEvent = () => {
    if (!selectedEvent) return;
    alert(`Edit functionality would open for: ${selectedEvent.title}`);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent || !window.confirm(`Delete "${selectedEvent.title}"?`))
      return;

    try {
      const response = await fetch(`${API_BASE}/${selectedEvent.id}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        await loadEvents();
        await loadUpcomingDeadlines();
        setShowEventModal(false);
        alert("Event deleted successfully!");
      }
    } catch (error) {
      alert("Failed to delete event");
    }
  };

  const handleCloseModal = () => {
    setShowEventModal(false);
    setSelectedEvent(null);
  };

  const handleCloseAddModal = () => {
    setShowAddEventModal(false);
    setSelectedDate(null);
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const eventTypes = {
    lecture: { icon: BookOpen },
    exam: { icon: FileText },
    assignment: { icon: Clock },
    lab: { icon: Users },
    office_hours: { icon: Bell },
    meeting: { icon: Users },
  };

  // Calendar utilities
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(0);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return weeks;
  };

  const formatDate = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
  };

  const isToday = (day) => {
    if (day === 0) return false;
    const today = new Date();
    return (
      currentDate.getFullYear() === today.getFullYear() &&
      currentDate.getMonth() === today.getMonth() &&
      day === today.getDate()
    );
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const showEventDetails = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const getCourseInfo = (courseId) => {
    // Handle null courseId for admin events
    if (!courseId) {
      return { name: "Administrative", color: "gray" };
    }

    return (
      courses.find((course) => course.id === courseId) || {
        name: "Administrative",
        color: "gray",
      }
    );
  };

  const filterEventsByCourse = (dayEvents) => {
    if (selectedCourse === "all") return dayEvents;
    return dayEvents.filter(
      (event) =>
        event.courseId === selectedCourse ||
        (!event.courseId && selectedCourse === "admin")
    );
  };

  return (
    <div className="calendar-container">
      {/* Header */}
      <div className="calendar-header">
        <div>
          <h1 className="calendar-title">📚 Course Management Calendar</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
            Manage your courses, assignments, and academic schedule
          </p>
        </div>
        <div className="header-buttons">
          <button className="btn btn-primary" onClick={() => handleAddEvent()}>
            <Plus size={16} />
            Add Event
          </button>
        </div>
      </div>

      {/* Dashboard */}
      <div className="dashboard">
        {/* Course Filter */}
        <div className="dashboard-card">
          <h3>Filter by Course</h3>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="course-filter"
          >
            <option value="all">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
            <option value="admin">Administrative</option>
          </select>
        </div>

        {/* Upcoming Deadlines */}
        <div className="dashboard-card">
          <h3>⏰ Upcoming Deadlines</h3>
          <div>
            {upcomingDeadlines.slice(0, 3).map((deadline) => (
              <div key={deadline.id} className="deadline-item">
                <div className="deadline-title">{deadline.title}</div>
                <div className="deadline-date">
                  {new Date(deadline.date).toLocaleDateString()}
                </div>
              </div>
            ))}
            {upcomingDeadlines.length === 0 && (
              <div className="deadline-date">No upcoming deadlines</div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="dashboard-card">
          <h3>Quick Stats</h3>
          <div>
            <div className="stats-item">
              <span className="stats-label">Total Courses:</span>
              <span className="stats-value">{courses.length}</span>
            </div>
            <div className="stats-item">
              <span className="stats-label">Total Students:</span>
              <span className="stats-value">
                {courses.reduce((sum, course) => sum + course.students, 0)}
              </span>
            </div>
            <div className="stats-item">
              <span className="stats-label">This Month's Events:</span>
              <span className="stats-value">
                {Object.values(events).flat().length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="calendar-nav">
        <div className="nav-controls">
          <button onClick={() => navigateMonth(-1)} className="btn btn-outline">
            <ChevronLeft size={16} />
            Previous
          </button>

          <h2 className="month-year">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>

          <button onClick={() => navigateMonth(1)} className="btn btn-outline">
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        <div className="calendar-grid-header">
          {[
            "Sunday",
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
          ].map((day) => (
            <div key={day} className="day-header">
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-weeks">
          {generateCalendarDays().map((week, weekIndex) => (
            <div key={weekIndex} className="calendar-week">
              {week.map((day, dayIndex) => {
                const dateKey =
                  day !== 0
                    ? formatDate(
                        currentDate.getFullYear(),
                        currentDate.getMonth(),
                        day
                      )
                    : null;
                const dayEvents = dateKey ? events[dateKey] || [] : [];
                const filteredEvents = filterEventsByCourse(dayEvents);

                return (
                  <div
                    key={dayIndex}
                    className={`calendar-day ${
                      day === 0 ? "other-month" : ""
                    } ${isToday(day) ? "today" : ""}`}
                  >
                    {day !== 0 && (
                      <>
                        <div className="day-number">
                          <span>{day}</span>
                          <button
                            className="add-event-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddEvent(dateKey);
                            }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <div className="events-container">
                          {filteredEvents.map((event) => {
                            const courseInfo = getCourseInfo(event.courseId);
                            const IconComponent =
                              eventTypes[event.type]?.icon || BookOpen;

                            return (
                              <div
                                key={event.id}
                                onClick={() => showEventDetails(event)}
                                className={`event-item ${event.type} ${
                                  event.importance
                                    ? `importance-${event.importance.toLowerCase()}`
                                    : ""
                                }`}
                              >
                                <div className="event-title">{event.title}</div>
                                <div className="event-time">{event.time}</div>
                                {event.courseId && (
                                  <div className="event-course">
                                    {courseInfo.name}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && selectedEvent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                {React.createElement(
                  eventTypes[selectedEvent.type]?.icon || BookOpen,
                  { size: 20 }
                )}
                {selectedEvent.title}
              </h3>
              <button onClick={handleCloseModal} className="modal-close">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-grid">
                <div className="detail-item">
                  <div className="detail-label">Course</div>
                  <div className="detail-value">
                    {selectedEvent.course
                      ? selectedEvent.course.name
                      : getCourseInfo(selectedEvent.courseId).name}
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Time</div>
                  <div className="detail-value">{selectedEvent.time}</div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Type</div>
                  <span className={`badge ${selectedEvent.type}`}>
                    {selectedEvent.type.replace("_", " ")}
                  </span>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Location</div>
                  <div className="detail-value">{selectedEvent.location}</div>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Description</div>
                <p className="detail-value">{selectedEvent.description}</p>
              </div>

              {selectedEvent.preparation &&
                selectedEvent.preparation.length > 0 && (
                  <div className="detail-item">
                    <div className="detail-label">Preparation Checklist</div>
                    <ul className="preparation-list">
                      {selectedEvent.preparation.map((item, index) => (
                        <li key={index}>
                          <span className="checkmark">✓</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-primary" onClick={handleEditEvent}>
                <Edit size={16} />
                Edit Event
              </button>
              <button
                className="btn"
                style={{ background: "var(--danger)", color: "white" }}
                onClick={handleDeleteEvent}
              >
                <Trash2 size={16} />
                Delete Event
              </button>
              <button onClick={handleCloseModal} className="btn btn-outline">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">
                <Plus size={20} />
                Add New Event
              </h3>
              <button onClick={handleCloseAddModal} className="modal-close">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-grid">
                <div className="detail-item">
                  <div className="detail-label">Event Title</div>
                  <input
                    type="text"
                    className="course-filter"
                    placeholder="Enter event title"
                    value={newEvent.title}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, title: e.target.value })
                    }
                  />
                </div>

                <div className="detail-item">
                  <div className="detail-label">Course</div>
                  <select
                    className="course-filter"
                    value={newEvent.courseId}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, courseId: e.target.value })
                    }
                  >
                    <option value="">Select Course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                    <option value="admin">Administrative</option>
                  </select>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Event Type</div>
                  <select
                    className="course-filter"
                    value={newEvent.type}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, type: e.target.value })
                    }
                  >
                    <option value="lecture">Lecture</option>
                    <option value="exam">Exam</option>
                    <option value="assignment">Assignment</option>
                    <option value="lab">Lab</option>
                    <option value="office_hours">Office Hours</option>
                    <option value="meeting">Meeting</option>
                  </select>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Time</div>
                  <input
                    type="text"
                    className="course-filter"
                    placeholder="e.g., 10:00 AM"
                    value={newEvent.time}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, time: e.target.value })
                    }
                  />
                </div>

                <div className="detail-item">
                  <div className="detail-label">Location</div>
                  <input
                    type="text"
                    className="course-filter"
                    placeholder="e.g., Room 205"
                    value={newEvent.location}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, location: e.target.value })
                    }
                  />
                </div>

                <div className="detail-item">
                  <div className="detail-label">Importance</div>
                  <select
                    className="course-filter"
                    value={newEvent.importance}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, importance: e.target.value })
                    }
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="detail-item">
                <div className="detail-label">Description</div>
                <textarea
                  className="course-filter"
                  rows="3"
                  placeholder="Enter event description"
                  value={newEvent.description}
                  onChange={(e) =>
                    setNewEvent({ ...newEvent, description: e.target.value })
                  }
                  style={{ resize: "vertical", minHeight: "80px" }}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-primary"
                onClick={handleSaveNewEvent}
                disabled={!newEvent.title || !newEvent.courseId}
              >
                <Plus size={16} />
                Add Event
              </button>
              <button onClick={handleCloseAddModal} className="btn btn-outline">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
