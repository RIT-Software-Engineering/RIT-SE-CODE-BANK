// dataLoader.js
import courseData from '../data/courseData.json';

class DataLoader {
  constructor() {
    this.data = courseData;
  }


  getCourses() {
    return this.data.courses;
  }

  getEvents() {
    return this.data.events;
  }

  getCourseById(courseId) {
    return this.data.courses.find(course => course.id === courseId) || null;
  }

  getEventsForDate(dateString) {
    return this.data.events[dateString] || [];
  }


  getEventsForCourse(courseId) {
    const allEvents = [];
    Object.entries(this.data.events).forEach(([date, events]) => {
      events.forEach(event => {
        if (event.course === courseId || event.course === 'all') {
          allEvents.push({ ...event, date });
        }
      });
    });
    return allEvents;
  }


  getUpcomingDeadlines(daysAhead = 7) {
    const today = new Date();
    const futureDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);
    const deadlines = [];
    
    Object.entries(this.data.events).forEach(([date, events]) => {
      const eventDate = new Date(date);
      if (eventDate >= today && eventDate <= futureDate) {
        events.forEach(event => {
          if (event.type === 'exam' || event.type === 'assignment') {
            deadlines.push({ ...event, date });
          }
        });
      }
    });
    
    return deadlines.sort((a, b) => new Date(a.date) - new Date(b.date));
  }


  getEventById(eventId) {
    let foundEvent = null;
    Object.entries(this.data.events).forEach(([date, events]) => {
      const event = events.find(e => e.id === eventId);
      if (event) {
        foundEvent = { ...event, date };
      }
    });
    return foundEvent;
  }

  
  addEvent(date, eventData) {
    if (!this.data.events[date]) {
      this.data.events[date] = [];
    }
    
   
    const allEvents = Object.values(this.data.events).flat();
    const maxId = Math.max(...allEvents.map(e => e.id), 0);
    const newEvent = { ...eventData, id: maxId + 1 };
    
    this.data.events[date].push(newEvent);
    return newEvent;
  }

  updateEvent(eventId, updatedData) {
    Object.entries(this.data.events).forEach(([date, events]) => {
      const eventIndex = events.findIndex(e => e.id === eventId);
      if (eventIndex !== -1) {
        this.data.events[date][eventIndex] = { ...this.data.events[date][eventIndex], ...updatedData };
        return true;
      }
    });
    return false;
  }

 
  deleteEvent(eventId) {
    Object.entries(this.data.events).forEach(([date, events]) => {
      const eventIndex = events.findIndex(e => e.id === eventId);
      if (eventIndex !== -1) {
        this.data.events[date].splice(eventIndex, 1);
        if (this.data.events[date].length === 0) {
          delete this.data.events[date];
        }
        return true;
      }
    });
    return false;
  }

 
  getTotalStudents() {
    return this.data.courses.reduce((sum, course) => sum + course.students, 0);
  }

  
  getTotalEvents() {
    return Object.values(this.data.events).flat().length;
  }

 
  getEventCountByType() {
    const counts = {};
    Object.values(this.data.events).flat().forEach(event => {
      counts[event.type] = (counts[event.type] || 0) + 1;
    });
    return counts;
  }

  
  filterEventsByCourse(courseId, events) {
    if (courseId === 'all') return events;
    return events.filter(event => 
      event.course === courseId || 
      event.course === 'all' || 
      event.course === 'admin'
    );
  }
}

// Export a singleton instance
const dataLoader = new DataLoader();
export default dataLoader;