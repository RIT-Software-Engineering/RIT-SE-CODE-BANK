// migrate-data.js (CommonJS version)
const { PrismaClient } = require("@prisma/client");
const fs = require("fs");

const prisma = new PrismaClient();

async function migrateData() {
  try {
    // Read JSON data from file
    const jsonData = JSON.parse(fs.readFileSync("./courseData.json", "utf8"));

    console.log("Starting data migration...");

    // 1. Insert courses first
    console.log("Inserting courses...");
    for (const course of jsonData.courses) {
      await prisma.course.upsert({
        where: { id: course.id },
        update: course,
        create: course,
      });
    }
    console.log(`✅ Inserted ${jsonData.courses.length} courses`);

    // 2. Transform and insert events
    console.log("Inserting events...");
    let eventCount = 0;

    for (const [dateString, events] of Object.entries(jsonData.events)) {
      for (const event of events) {
        // Transform the event data to match our schema
        const eventData = {
          id: event.id,
          title: event.title,
          courseId:
            event.course === "all" || event.course === "admin"
              ? null
              : event.course,
          type: event.type,
          time: event.time,
          date: new Date(dateString + "T" + convertTimeToISO(event.time)),
          location: event.location,
          description: event.description || null,
          importance: event.importance,
          preparation: event.preparation || [],
        };

        eventCount++;
      }
    }

    console.log(`✅ Inserted ${eventCount} events`);
    console.log("🎉 Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to convert time string to ISO format
function convertTimeToISO(timeString) {
  // Handle different time formats
  if (timeString.includes("AM") || timeString.includes("PM")) {
    const [time, period] = timeString.split(" ");
    let [hours, minutes] = time.split(":");
    hours = parseInt(hours);

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, "0")}:${minutes || "00"}:00`;
  } else if (timeString.includes(":")) {
    // Handle 24-hour format like "13:00"
    const [hours, minutes] = timeString.split(":");
    return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00`;
  } else {
    // Default fallback
    return "00:00:00";
  }
}

// Run migration
migrateData();
