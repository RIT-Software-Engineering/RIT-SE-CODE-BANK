const fs = require("fs").promises;
const path = require("path");

class DataHandler {
  constructor() {
    this.dataPath = path.join(__dirname, "../../data/courseData.json");
  }

  // Read data from JSON file
  async loadData() {
    try {
      const data = await fs.readFile(this.dataPath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error loading data:", error);
      throw new Error("Failed to load course data");
    }
  }

  // Write data to JSON file
  async saveData(data) {
    try {
      await fs.writeFile(this.dataPath, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      console.error("Error saving data:", error);
      throw new Error("Failed to save course data");
    }
  }

  // Get all courses
  async getCourses() {
    const data = await this.loadData();
    return data.courses;
  }

  // Get all events
  async getEvents() {
    const data = await this.loadData();
    return data.events;
  }

  // Get events for a specific date
  async getEventsForDate(dateString) {
    const data = await this.loadData();
    return data.events[dateString] || [];
  }

  // Add new event
  async addEvent(dateString, eventData) {
    const data = await this.loadData();

    // Initialize date array if it doesn't exist
    if (!data.events[dateString]) {
      data.events[dateString] = [];
    }

    // Generate new ID
    const allEvents = Object.values(data.events).flat();
    const maxId =
      allEvents.length > 0 ? Math.max(...allEvents.map((e) => e.id)) : 0;

    // Create new event with ID
    const newEvent = {
      id: maxId + 1,
      ...eventData,
    };

    // Add to data
    data.events[dateString].push(newEvent);

    // Save to file
    await this.saveData(data);

    return newEvent;
  }

  // Update existing event
  async updateEvent(eventId, updatedData) {
    const data = await this.loadData();
    let eventFound = false;

    // Find and update the event
    for (const [date, events] of Object.entries(data.events)) {
      const eventIndex = events.findIndex((e) => e.id === eventId);
      if (eventIndex !== -1) {
        data.events[date][eventIndex] = {
          ...data.events[date][eventIndex],
          ...updatedData,
        };
        eventFound = true;
        break;
      }
    }

    if (!eventFound) {
      throw new Error("Event not found");
    }

    // Save to file
    await this.saveData(data);

    return data.events;
  }

  // Delete event
  async deleteEvent(eventId) {
    const data = await this.loadData();
    let eventFound = false;

    // Find and delete the event
    for (const [date, events] of Object.entries(data.events)) {
      const eventIndex = events.findIndex((e) => e.id === eventId);
      if (eventIndex !== -1) {
        data.events[date].splice(eventIndex, 1);

        // Remove date key if no events left
        if (data.events[date].length === 0) {
          delete data.events[date];
        }

        eventFound = true;
        break;
      }
    }

    if (!eventFound) {
      throw new Error("Event not found");
    }

    // Save to file
    await this.saveData(data);

    return true;
  }

  // Get course by ID
  async getCourseById(courseId) {
    const data = await this.loadData();
    return data.courses.find((course) => course.id === courseId) || null;
  }

  // Get upcoming deadlines
  async getUpcomingDeadlines(daysAhead = 7) {
    const data = await this.loadData();
    const today = new Date();
    const futureDate = new Date(
      today.getTime() + daysAhead * 24 * 60 * 60 * 1000
    );
    const deadlines = [];

    Object.entries(data.events).forEach(([date, events]) => {
      const eventDate = new Date(date);
      if (eventDate >= today && eventDate <= futureDate) {
        events.forEach((event) => {
          if (event.type === "exam" || event.type === "assignment") {
            deadlines.push({ ...event, date });
          }
        });
      }
    });

    return deadlines.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  // Get statistics
  async getStats() {
    const data = await this.loadData();
    const totalStudents = data.courses.reduce(
      (sum, course) => sum + course.students,
      0
    );
    const totalEvents = Object.values(data.events).flat().length;

    return {
      totalCourses: data.courses.length,
      totalStudents,
      totalEvents,
    };
  }
}

module.exports = new DataHandler();
