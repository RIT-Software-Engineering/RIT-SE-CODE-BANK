const { PrismaClient } = require("@prisma/client");
const { createWorkflow } = require("./seedUtils");
const prisma = new PrismaClient();

async function main() {

  if (process.env.NODE_ENV === "production") {
    throw Error(
      "This action should only be used in development for populating the database with test data."
    );
  }

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
      name: "Onboarding Workflow",
      description: "The set of actions Scooployees go through during onboarding",
      userId: users[2].id,
      actions: [
        {
          name: "Drop Classes",
          description: "Drop all classes you are currently enrolled in",
          metadata: {
            key: "value",
          },
        },
        {
          name: "Report Co-op",
          description: "Report Scoop as a Co-op in career connect",
          metadata: {
            key1: "value1",
            key2: "value2",
            number: 1,
          },
        },
        {
          name: "Warmup",
          description: "Complete the Scoop warmup",
        },
        {
          name: "Join Slack",
          description: "Join the Scoop slack channels",
        },
        {
          name: "Complete Scoop Promise",
          description: "Scooployees complete their Scoop promise and send it to the Scoodinator",
        },
        {
          name: "Team Skills Grid",
          description: "Team will navigate the repository and find any necessary skills and rate their expertise and knowledge from 0-5",
        },
        {
          name: "Make Individual Domain Models",
          description: "After being briefed on the basics of their project each Scooployee will complete an individual domain model to level set their Mental Model.",
        },
        {
          name: "Accept SCOOP Offer",
          description: "Students confirm their acceptance of the SCOOP placement via Slack.",
        },
        {
          name: "Team contract",
          description: "Teams draft a contract outlining norms, communication expectations, and responsibilities.",
        },
        {
          name: "Make Team domain model",
          description: "After all team members complete their individual domain models they will meet as a group to consolidate their work into one final team domain model.",        
        },
        {
          name: "Join dev team",
          description: "Each Scooployee will accept the Github invite once they recieve it from the Scoopdinator.",
        },
        {
          name: "Confirm are able to write to repo by doing creating bogus branch and submitting URL",
          description: "After being granted access to the repo, one Scooployee will attempt to create a branch to ensure they have write access, then submit the URL of the branch to the SCOOPervisor",
        },
        {
          name: "Get the project running locally",
          description: "Each Scooployee will clone the latest version of their projects dev branch and attempt to get the project running locally.",
        },
        {
          name: "Create User Stories",
          description: "Each SCOOP team will create the user stories that they plan to work on for the term.",
        },
      ],
    },
    {
      name: "SCOOP Workflow",
      description: "The set of actions Scooployees go through during onboarding",
      userId: users[2].id,
      actions: [
        {
        name: "Midterm Presentation",
        description: "Each SCOOP team will give a presentation near the halfway point of the term to reflect on and share their progress",
        },
        {
        name: "Final Presentation",
        description: "Each SCOOP team will give a presentation at the end of the term to share what they were able to accomplish over the course of the semester.",
        },
        {
        name: "Scooployee Work Report",
        description: "At the end of SCOOP each Scooployee will submit a Work Report detailing what they did over the course of their SCOOp session.",
        },
      ],
    },
    
  ];

  // Create all workflows from workflowData
  await Promise.all(
    workflowData.map(async (w) => {
      // Create the workflow
      await createWorkflow(w);
    })
  );


  console.log("🌱 Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
