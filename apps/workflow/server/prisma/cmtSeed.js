const { PrismaClient } = require("@prisma/client");
const { createWorkflow } = require("./seedUtils");
const prisma = new PrismaClient();

/**
 * Delete all the data in the workflows database
 */

async function deleteWorkflows() {
    await prisma.action.deleteMany({});
    await prisma.actionState.deleteMany({});
    await prisma.workflowState.deleteMany({});
    await prisma.metadata.deleteMany({});
    await prisma.permission.deleteMany({});
    await prisma.tag.deleteMany({});
    await prisma.workflowStateParticipant.deleteMany({});
    await prisma.workflowAttributes.deleteMany({});
}

/**
 * Main function
 */
async function main() {
  

  if (process.env.NODE_ENV === "production") {
    throw Error(
      "This action should only be used in development for populating the database with test data."
    );
  }
    await deleteWorkflows();

  ///////////
  // Users //
  ///////////

  const users = Array.from({ length: 10 }, (_, i) => ({
    id: `user${(i + 1).toString()}`,
  }));

  ///////////////
  // Workflows //
  ///////////////

  const workflowData = [
    {
    name: 'Create Course',
    description: 'These steps will help guide you when creating your course!',
    tags: ["WorkflonyFirstTheRestNowhere_CMT_Template"],
    userId: users[0].id,
    metadata: {code: "Course Creation Workflow"},
    actions: [
        {
            name: 'Course Details',
            description: 'Add relevant details to the course!',
            actionType: 'workflow',
            userId: users[0].id,
            actions: [
                {
                    name: 'Upload syllabus',
                    description: 'Upload a syllabus file!',
                    actionType: 'simple',
                    metadata: {
                        code: 'COURSE_SYLLABUS',
                        outputs: [
                            {
                                name: 'Syllabus',
                                key: 'syllabusName',
                                type: 'file',
                                isRequired: true,
                                validation: {
                                    allowedTypes: ["html", "pdf", "docx"] 
                                }
                            },
                        ],
                    },
                },
                {
                    name: 'Course Section',
                    description: 'Enter the section for your course!',
                    actionType: 'simple',
                    metadata: {
                        code: 'COURSE_SECTION',
                        outputs: [
                            {
                                name: 'Course Section',
                                key: 'section',
                                type: 'text',
                                isRequired: true,
                                placeholder: '01',
                                validation: {
                                    maxLength: 30,
                                },
                            },
                        ],
                    },
                },
                {
                    name: 'Section Semester',
                    description: 'Enter the semester the section will take place in',
                    actionType: 'simple',
                    metadata: {
                        code: 'COURSE_SEMESTER',
                        outputs: [
                            {
                                name: 'Year',
                                key: 'year',
                                type: 'select',
                                isRequired: true,
                                validation: {
                                    options: [0,1,2,3].map(i => {return new Date().getFullYear()+i}),
                                },
                            },
                            {
                                name: 'Season',
                                key: 'season',
                                type: 'select',
                                isRequired: true,
                                validation: {
                                    options: ['Fall', 'Spring', 'Summer 1', 'Summer 2', 'Summer 3'],
                                },
                            },
                        ],
                    },
                },
                {
                    name: 'Course Days',
                    description: 'Select on which days that your course will take place!',
                    actionType: 'simple',
                    metadata: {
                        code: 'COURSE_DAYS',
                        outputs: [
                            {
                                name: 'Course Days',
                                key: 'days',
                                type: 'multiselect',
                                isRequired: true,
                                validation: {
                                    options: ['Mo', 'Tu', 'We', 'Tr', 'Fr'],
                                },
                            },
                        ],
                    },
                },
                {
                    name: 'Start Date',
                    description: 'Select the date for when the course starts! Session dates will be autopopulated using this and course days!',
                    actionType: 'simple',
                    metadata: {
                        code: 'COURSE_START_DATE',
                        outputs: [
                            {
                                name: 'Start Date',
                                key: 'startDate',
                                type: 'date',
                                isRequired: true,
                            },
                        ],
                    },
                },  
            ],
        },
        {
            name: 'Add Material to Your Sessions',
            description: 'Create material for the sessions within your course!',
            actionType: 'workflow',
            userId: users[0].id,
            actions: Array.from({ length: 28 }, (_, index) => {
                return {
                    name: `Session ${index+1}`,
                    description:
                        'Add some material to your session! The material here will populate your course site when you generate it. The columns are dynamic depending on the type of course material you add!',
                    actionType: 'simple',
                    metadata: {
                        code: `SESSION_${index}`,
                        outputs: [{
                          isRequired: true,
                          validation: {
                            sessionNum: index+1
                          },
                        }]
                    },
                }
            }),
        },
        {
            name: 'Download Course Website',
            description: 'Navigate to the course generation page and download your website!',
            actionType: 'workflow',
            userId: users[0].id,
            actions: [
                // {
                //     name: 'Set Column Visibilities',
                //     description: 'Hide columns that you may not want students seeing yet',
                //     actionType: 'simple',
                //     metadata: {
                //         code: 'CHECKMARK_COLUMN_VISIBILITIES',
                //     },
                // },
                {
                    name: 'Download Course Website',
                    description: "When it looks how you like it, download your site and upload it to the SE Servers!",
                    actionType: 'simple',
                    metadata: {
                        code: 'CHECKMARK_PUBLISH_SITE',
                    },
                }
            ],
        },
    ]
  }];

  // Create all workflows from workflowData
  await Promise.all(
    workflowData.map(async (w) => {
      // Create the workflow
      await createWorkflow(w);
    })
  );

  console.log("🌱 Seed data created successfully!");
}

/**
 * Call main function
 */
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


