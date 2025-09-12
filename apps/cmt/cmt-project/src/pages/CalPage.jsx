import React, { useState } from 'react';
import { Calendar, Plus, ChevronLeft, ChevronRight, ExternalLink, Edit, Trash2, X, Bell, BookOpen, Users, FileText, Clock } from 'lucide-react';
import '../styles/calendar.css';
export default function CalPage() {
  console.log("Loaded CalPage.jsx");
  
  // Current date state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('all');

  // Sample course data
  const courses = [
    { id: 'cs101', name: 'CS 101 - Intro to Programming', color: 'blue', students: 45 },
    { id: 'cs201', name: 'CS 201 - Data Structures', color: 'green', students: 38 },
    { id: 'cs301', name: 'CS 301 - Algorithms', color: 'purple', students: 32 },
    { id: 'cs401', name: 'CS 401 - Senior Capstone', color: 'orange', students: 28 }
  ];

  // Sample events data
  const events = {
    '2025-09-15': [
      {
        id: 1,
        title: 'Midterm Exam',
        course: 'cs201',
        type: 'exam',
        time: '10:00 AM',
        location: 'Room 205',
        description: 'Data Structures midterm covering arrays, linked lists, and stacks',
        importance: 'High',
        preparation: ['Review lecture notes 1-8', 'Practice problems assigned', 'Office hours available']
      },
      {
        id: 2,
        title: 'Project 2 Due',
        course: 'cs301',
        type: 'assignment',
        time: '11:59 PM',
        location: 'Online Submission',
        description: 'Algorithm analysis project focusing on sorting algorithms',
        importance: 'High',
        preparation: ['Check rubric', 'Test all edge cases', 'Submit before deadline']
      }
    ],
    '2025-09-16': [
      {
        id: 3,
        title: 'Lecture: Advanced Sorting',
        course: 'cs301',
        type: 'lecture',
        time: '2:00 PM',
        location: 'Room 301',
        description: 'Introduction to quicksort and mergesort algorithms',
        importance: 'Medium',
        preparation: ['Prepare slides', 'Demo code examples', 'Interactive exercises']
      }
    ],
    '2025-09-18': [
      {
        id: 4,
        title: 'Office Hours',
        course: 'all',
        type: 'office_hours',
        time: '1:00 PM - 3:00 PM',
        location: 'Office 415',
        description: 'Open office hours for all courses',
        importance: 'Low',
        preparation: ['Review common questions', 'Prepare example problems']
      },
      {
        id: 5,
        title: 'Faculty Meeting',
        course: 'admin',
        type: 'meeting',
        time: '4:00 PM',
        location: 'Conference Room A',
        description: 'Monthly department faculty meeting',
        importance: 'Medium',
        preparation: ['Review agenda', 'Prepare course updates']
      }
    ],
    '2025-09-20': [
      {
        id: 6,
        title: 'Lab: Database Design',
        course: 'cs201',
        type: 'lab',
        time: '9:00 AM',
        location: 'Computer Lab 2',
        description: 'Hands-on database design and normalization',
        importance: 'Medium',
        preparation: ['Set up lab environment', 'Prepare dataset', 'Test all examples']
      }
    ]
  };

  // Month names
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Event type configurations
  const eventTypes = {
    lecture: { icon: BookOpen },
    exam: { icon: FileText },
    assignment: { icon: Clock },
    lab: { icon: Users },
    office_hours: { icon: Bell },
    meeting: { icon: Users }
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
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(0);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    // Group into weeks
    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    
    return weeks;
  };

  const formatDate = (year, month, day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
    return courses.find(course => course.id === courseId) || { name: 'Administrative', color: 'gray' };
  };

  const filterEventsByCourse = (dayEvents) => {
    if (selectedCourse === 'all') return dayEvents;
    return dayEvents.filter(event => event.course === selectedCourse || event.course === 'all' || event.course === 'admin');
  };

  const getUpcomingDeadlines = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const deadlines = [];
    
    Object.entries(events).forEach(([date, dayEvents]) => {
      const eventDate = new Date(date);
      if (eventDate >= today && eventDate <= nextWeek) {
        dayEvents.forEach(event => {
          if (event.type === 'exam' || event.type === 'assignment') {
            deadlines.push({ ...event, date });
          }
        });
      }
    });
    
    return deadlines.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  return (
    <div className="calendar-container">
      {/* Header */}
      <div className="calendar-header">
        <div>
          <h1 className="calendar-title">
            📚 Course Management Calendar
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Manage your courses, assignments, and academic schedule
          </p>
        </div>
        <div className="header-buttons">
          <button className="btn btn-primary">
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
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.name}</option>
            ))}
          </select>
        </div>

        {/* Upcoming Deadlines */}
        <div className="dashboard-card">
          <h3>⏰ Upcoming Deadlines</h3>
          <div>
            {getUpcomingDeadlines().slice(0, 3).map(deadline => (
              <div key={deadline.id} className="deadline-item">
                <div className="deadline-title">{deadline.title}</div>
                <div className="deadline-date">{new Date(deadline.date).toLocaleDateString()}</div>
              </div>
            ))}
            {getUpcomingDeadlines().length === 0 && (
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
              <span className="stats-value">{courses.reduce((sum, course) => sum + course.students, 0)}</span>
            </div>
            <div className="stats-item">
              <span className="stats-label">This Month's Events:</span>
              <span className="stats-value">{Object.values(events).flat().length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="calendar-nav">
        <div className="nav-controls">
          <button 
            onClick={() => navigateMonth(-1)}
            className="btn btn-outline"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          
          <h2 className="month-year">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          
          <button 
            onClick={() => navigateMonth(1)}
            className="btn btn-outline"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {/* Calendar Header */}
        <div className="calendar-grid-header">
          {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
            <div key={day} className="day-header">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Body */}
        <div className="calendar-weeks">
          {generateCalendarDays().map((week, weekIndex) => (
            <div key={weekIndex} className="calendar-week">
              {week.map((day, dayIndex) => {
                const dateKey = day !== 0 ? formatDate(currentDate.getFullYear(), currentDate.getMonth(), day) : null;
                const dayEvents = dateKey ? events[dateKey] || [] : [];
                const filteredEvents = filterEventsByCourse(dayEvents);
                
                return (
                  <div 
                    key={dayIndex} 
                    className={`calendar-day ${day === 0 ? 'other-month' : ''} ${isToday(day) ? 'today' : ''}`}
                  >
                    {day !== 0 && (
                      <>
                        {/* Day Number */}
                        <div className="day-number">
                          <span>{day}</span>
                          <button className="add-event-btn">
                            <Plus size={12} />
                          </button>
                        </div>
                        
                        {/* Events */}
                        <div className="events-container">
                          {filteredEvents.map((event) => {
                            const courseInfo = getCourseInfo(event.course);
                            const IconComponent = eventTypes[event.type]?.icon || BookOpen;
                            
                            return (
                              <div
                                key={event.id}
                                onClick={() => showEventDetails(event)}
                                className={`event-item ${event.type} ${event.importance ? `importance-${event.importance.toLowerCase()}` : ''}`}
                              >
                                <div className="event-title">{event.title}</div>
                                <div className="event-time">{event.time}</div>
                                {event.course !== 'all' && event.course !== 'admin' && (
                                  <div className="event-course">{courseInfo.name}</div>
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
                {React.createElement(eventTypes[selectedEvent.type]?.icon || BookOpen, { size: 20 })}
                {selectedEvent.title}
              </h3>
              <button 
                onClick={() => setShowEventModal(false)}
                className="modal-close"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              <div className="modal-grid">
                <div className="detail-item">
                  <div className="detail-label">Course</div>
                  <div className="detail-value">{getCourseInfo(selectedEvent.course).name}</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">Time</div>
                  <div className="detail-value">{selectedEvent.time}</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">Type</div>
                  <span className={`badge ${selectedEvent.type}`}>
                    {selectedEvent.type.replace('_', ' ')}
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

              {selectedEvent.preparation && (
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
              <button className="btn btn-primary">
                <Edit size={16} />
                Edit Event
              </button>
              <button className="btn" style={{ background: 'var(--danger)', color: 'white' }}>
                <Trash2 size={16} />
                Delete Event
              </button>
              <button 
                onClick={() => setShowEventModal(false)}
                className="btn btn-outline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}