// services/notification-service/src/test-email.js
import nodemailer from "nodemailer";
import Handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const run = async () => {
  // Create an Ethereal test account for previewing messages
  const testAccount = await nodemailer.createTestAccount();

  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  // Register template partials (header, footer, etc.)
  const partialsDir = path.join(__dirname, "./templates/partials");
  if (fs.existsSync(partialsDir)) {
    for (const file of fs.readdirSync(partialsDir)) {
      const name = path.basename(file, ".hbs");
      const content = fs.readFileSync(path.join(partialsDir, file), "utf8");
      Handlebars.registerPartial(name, content);
    }
  }

  // Load main template (candidate_email.hbs for example) - try app-scoped
  const templatePath = path.join(
    __dirname,
    "./templates/ta-portal/application_status_changed/candidate_email.hbs"
  );
  const source = fs.readFileSync(templatePath, "utf8");
  const template = Handlebars.compile(source);

  // Provide realistic sample data
  const context = {
    recipient: { name: "Ben Griffin" },
    job_title: "TA for SWEN-352",
    new_status: "Interview",
    app_link: "https://ta.se.rit.edu/applications/102",
    year: new Date().getFullYear(),
  };

  // Render and send
  const html = template(context);
  const info = await transporter.sendMail({
    from: '"SE Notifications" <no-reply@se.rit.edu>',
    to: "bgg6007@rit.edu",
    subject: "Template Preview – Application Status Changed",
    html,
  });

  console.log("✅ Message sent:", info.messageId);
  console.log("🌐 Preview URL:", nodemailer.getTestMessageUrl(info));
};

run().catch(console.error);
