import React from "react";

export const positions = [
  {
    course: {
      name: "Introduction to Software Engineering",
      code: "SWEN-261",
      location: "Golisano College (GCCIS), Building 70, Room 1400",
      description: "An introductory course on fundamental software engineering principles, including requirements, design, implementation, and testing.",
      schedule: [
        { day: "Monday", startTime: "10:00 AM", endTime: "11:50 AM" },
        { day: "Wednesday", startTime: "10:00 AM", endTime: "11:50 AM" },
      ]
    },
  },
  {
    course: {
      name: "Data Structures and Algorithms",
      code: "CSCI-261",
      location: "Online Synchronous",
      description: "Covers the fundamentals of data structures and the algorithms that operate on them. Topics include lists, stacks, queues, trees, and graphs.",
      schedule: [
        { day: "Tuesday", startTime: "1:00 PM", endTime: "2:50 PM" },
        { day: "Thursday", startTime: "1:00 PM", endTime: "2:50 PM" },
      ]
    },
  },
  {
    course: {
      name: "Web and Mobile I",
      code: "ISTE-140",
      location: "Golisano College (GCCIS), Building 70, Room 2400",
      description: "Introduces the client-side technologies used to create highly interactive web and mobile applications. Focus on HTML, CSS, and JavaScript.",
      schedule: [
        { day: "Friday", startTime: "8:00 AM", endTime: "10:50 AM" }
      ]
    },
  },
  {
    course: {
      name: "Foundations of Human-Computer Interaction",
      code: "ISTE-340",
      location: "Frank E. Gannett Hall, Building 7B, Room A170",
      description: "Explore the principles of user-centered design, usability evaluation, and interaction design for creating effective and enjoyable user interfaces.",
      schedule: [
        { day: "Tuesday", startTime: "2:00 PM", endTime: "3:50 PM" },
        { day: "Thursday", startTime: "2:00 PM", endTime: "3:50 PM" },
      ]
    },
  },
  {
    course: {
      name: "Calculus I",
      code: "MATH-181",
      location: "Gosnell College of Science (GOS), Building 8, Room 3325",
      description: "A foundational course in differential calculus. Topics include limits, derivatives, and their applications.",
      schedule: [
        { day: "Monday", startTime: "12:00 PM", endTime: "1:50 PM" },
        { day: "Wednesday", startTime: "12:00 PM", endTime: "1:50 PM" },
        { day: "Friday", startTime: "12:00 PM", endTime: "12:50 PM" },
      ]
    },
  },
];

export default function Positions() {

    return (
        <>
            <div>
                <div className="bg-rit-gray h-auto p-10">
                    <div  className="bg-rit-light-gray h-full rounded-lg p-5  justify-center items-center flex flex-col w-full">
                        <h1 className="text-2xl font-bold mb-5">Positions</h1>
                        {positions.map((position, index) => (
                            <div key={index} className="bg-white p-4 mb-4 rounded shadow w-full">
                                {/* Uses course common name eg. Project Management */}
                                <h2 className="text-xl font-semibold">{position.course.name}</h2>
                                {/* Uses course common code eg. SWEN 261 */}
                                <p className="text-gray-700">{position.course.code}</p>
                                {/*  start and end times */}
                                <div className="mt-2">
                                {position.course.schedule.map((slot, i) => (
                                    <p key={i} className="text-gray-700">
                                    <span className="font-medium">{slot.day}:</span> {slot.startTime} - {slot.endTime}
                                    </p>
                                ))}
                                </div>
                                {/* You can add more details here if needed */}
                                <p className="text-gray-600">Location: {position.course.location}</p>
                                <p className="text-gray-500">{position.course.description}</p>
                                {/* Add a button to apply for the position */}
                                <button className="bg-blue-500 text-white p-2 rounded mt-2 hover:bg-blue-600">Apply Now</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        
        </>
    )
}