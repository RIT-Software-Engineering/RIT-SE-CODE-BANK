// eventActions.js
import dataLoader from './dataLoader';

class EventActions {
  // Add new event
  static addEvent(eventData) {
    try {
      // Validate required fields
      if (!eventData.title || !eventData.course || !eventData.type || !eventData.date) {
        throw new Error('Missing required fields: title, course, type, and date are required');
      }

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(eventData.date)) {
        throw new Error('Invalid date format. Use YYYY-MM-DD');
      }

      // Default values for optional fields
      const newEvent = {
        title: eventData.title,
        course: eventData.course,
        type: eventData.type,
        time: eventData.time || '12:00 PM',
        location: eventData.location || 'TBD',
        description: eventData.description || '',
        importance: eventData.importance || 'Medium',
        preparation: eventData.preparation || []
      };

      const result = dataLoader.addEvent(eventData.date, newEvent);
      
      return {
        success: true,
        data: result,
        message: 'Event added successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to add event'
      };
    }
  }

  // Edit existing event
  static editEvent(eventId, updatedData) {
    try {
      if (!eventId) {
        throw new Error('Event ID is required');
      }

      const success = dataLoader.updateEvent(eventId, updatedData);
      
      if (!success) {
        throw new Error('Event not found');
      }

      return {
        success: true,
        message: 'Event updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to update event'
      };
    }
  }

  // Delete event
  static deleteEvent(eventId) {
    try {
      if (!eventId) {
        throw new Error('Event ID is required');
      }

      const success = dataLoader.deleteEvent(eventId);
      
      if (!success) {
        throw new Error('Event not found');
      }

      return {
        success: true,
        message: 'Event deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to delete event'
      };
    }
  }

  // Validate event data
  static validateEventData(eventData) {
    const errors = [];

    if (!eventData.title?.trim()) {
      errors.push('Title is required');
    }

    if (!eventData.course) {
      errors.push('Course is required');
    }

    if (!eventData.type) {
      errors.push('Event type is required');
    }

    if (!eventData.date) {
      errors.push('Date is required');
    }

    const validTypes = ['lecture', 'exam', 'assignment', 'lab', 'office_hours', 'meeting'];
    if (eventData.type && !validTypes.includes(eventData.type)) {
      errors.push('Invalid event type');
    }

    const validImportance = ['High', 'Medium', 'Low'];
    if (eventData.importance && !validImportance.includes(eventData.importance)) {
      errors.push('Invalid importance level');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Format event for display
  static formatEventForDisplay(event) {
    return {
      ...event,
      formattedDate: new Date(event.date).toLocaleDateString(),
      formattedTime: event.time || 'No time specified',
      typeDisplay: event.type.replace('_', ' ').toUpperCase(),
      importanceColor: event.importance === 'High' ? 'red' : 
                      event.importance === 'Medium' ? 'orange' : 'green'
    };
  }
}

export default EventActions;