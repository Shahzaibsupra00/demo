import express from "express";
import path from "path";

// Initialize Express app
const app = express();
const PORT = 3000;

// Middleware for parsing JSON and urlencoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(process.cwd(), "public")));

// TS Interfaces for Students
interface Address {
  address: string;
  city: string;
}

interface UserAPIResponse {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  university?: string;
  address?: Address;
  image?: string;
}

interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  university: string;
  address: string;
  image: string;
  department: string;
  enrollmentDate: string;
  status: "Active" | "Suspended" | "Graduated";
}

// In-memory database of students
let studentsDb: Student[] = [];

// Realistic departments to assign randomly or modularly
const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Electrical & Electronic Engineering",
  "Mechanical & Aerospace Engineering",
  "Business Administration & Technology",
  "Civil & Environmental Engineering",
  "Biomedical Engineering & Biotech",
  "Data Science & Analytics",
  "Cybersecurity & Digital Forensics"
];

// Local realistic fallback student data if DummyJSON is offline
const FALLBACK_STUDENTS: Student[] = [
  {
    id: "1",
    studentId: "STU-2026-601",
    firstName: "Alexander",
    lastName: "Wright",
    fullName: "Alexander Wright",
    email: "alexander.wright@university.edu",
    phone: "+1 (555) 382-9012",
    age: 21,
    gender: "male",
    university: "State Institute of Technology",
    address: "742 Evergreen Terrace, Springfield",
    image: "https://dummyjson.com/api/web/assets/img/stubdb/1.png", // fallback or placeholder handled inside dashboard.js
    department: "Computer Science & Engineering",
    enrollmentDate: "2024-09-01",
    status: "Active"
  },
  {
    id: "2",
    studentId: "STU-2026-602",
    firstName: "Elena",
    lastName: "Rostova",
    fullName: "Elena Rostova",
    email: "e.rostova@university.edu",
    phone: "+1 (555) 723-4112",
    age: 19,
    gender: "female",
    university: "State Institute of Technology",
    address: "12 Pine Street, Metroville",
    image: "https://dummyjson.com/api/web/assets/img/stubdb/2.png",
    department: "Data Science & Analytics",
    enrollmentDate: "2025-02-15",
    status: "Active"
  },
  {
    id: "3",
    studentId: "STU-2026-603",
    firstName: "Marcus",
    lastName: "Vance",
    fullName: "Marcus Vance",
    email: "m.vance@university.edu",
    phone: "+1 (555) 812-3490",
    age: 22,
    gender: "male",
    university: "Academy of Creative Engineering",
    address: "404 Main Road, Silicon Valley",
    image: "https://dummyjson.com/api/web/assets/img/stubdb/3.png",
    department: "Electrical & Electronic Engineering",
    enrollmentDate: "2023-09-01",
    status: "Active"
  }
];

// Helper to generate a unique ID
function generateId(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Fetch initial students from DummyJSON API
async function initializeDatabase() {
  try {
    console.log("Fetching student data from DummyJSON...");
    const response = await fetch("https://dummyjson.com/users?limit=40");
    if (!response.ok) {
      throw new Error(`DummyJSON lookup returned status ${response.status}`);
    }
    const data = (await response.json()) as { users: UserAPIResponse[] };
    
    if (data.users && data.users.length > 0) {
      studentsDb = data.users.map((user: UserAPIResponse, index: number) => {
        const idStr = user.id.toString();
        const deptIndex = index % DEPARTMENTS.length;
        const yearsAgo = index % 3;
        const enrollDate = `202${4 - yearsAgo}-09-0${(index % 9) + 1}`;
        const finalStatus: "Active" | "Suspended" | "Graduated" = 
          index % 12 === 0 ? "Suspended" : index % 15 === 0 ? "Graduated" : "Active";

        return {
          id: idStr,
          studentId: `STU-220${10 + user.id}`,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: `${user.firstName} ${user.lastName}`,
          email: user.email,
          phone: user.phone || `+1 (555) ${100 + user.id}-${2000 + user.id}`,
          age: user.age,
          gender: user.gender,
          university: user.university || "Global Engineering University",
          address: user.address 
            ? `${user.address.address}, ${user.address.city}`
            : "University Dormitory Complex, Campus Drive",
          image: user.image || `https://robohash.org/${user.firstName}?set=set5`,
          department: DEPARTMENTS[deptIndex],
          enrollmentDate: enrollDate,
          status: finalStatus
        };
      });
      console.log(`Database seeded successfully with ${studentsDb.length} students from DummyJSON.`);
    } else {
      studentsDb = [...FALLBACK_STUDENTS];
      console.log("Fitted fallback students (empty users array retrieved).");
    }
  } catch (error) {
    console.error("Failed to seed initial students database, applying detailed fallbacks:", error);
    studentsDb = [...FALLBACK_STUDENTS];
  }
}

// Trigger initial fetch
initializeDatabase();

/* 
=========================================================
HTML VIEW ROUTING
=========================================================
*/
const viewPath = (file: string) => path.join(process.cwd(), "views", file);

app.get("/", (req, res) => {
  res.sendFile(viewPath("index.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(viewPath("dashboard.html"));
});

app.get("/add-student", (req, res) => {
  res.sendFile(viewPath("add_student.html"));
});

app.get("/student-details", (req, res) => {
  res.sendFile(viewPath("details.html"));
});

app.get("/about", (req, res) => {
  res.sendFile(viewPath("about.html"));
});

app.get("/contact", (req, res) => {
  res.sendFile(viewPath("contact.html"));
});

/* 
=========================================================
API ROUTES (CRUD)
=========================================================
*/

// GET all students
app.get("/api/students", (req, res) => {
  res.json(studentsDb);
});

// GET single student
app.get("/api/students/:id", (req, res) => {
  const student = studentsDb.find((s) => s.id === req.params.id);
  if (!student) {
    return res.status(404).json({ error: "Student not found" });
  }
  res.json(student);
});

// POST add new student (with backend validation)
app.post("/api/students", (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    age,
    gender,
    university,
    address,
    department,
    enrollmentDate,
    status
  } = req.body;

  // Simple backend fields checklist
  if (!firstName || !lastName || !email || !phone || !age || !gender || !university || !department) {
    return res.status(400).json({ error: "Please complete all required fields." });
  }

  // Backend email validator
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }

  const newId = generateId();
  const rawAge = parseInt(age, 10);

  const newStudent: Student = {
    id: newId,
    studentId: `STU-220${studentsDb.length + 101}`,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    fullName: `${firstName.trim()} ${lastName.trim()}`,
    email: email.trim(),
    phone: phone.trim(),
    age: isNaN(rawAge) ? 20 : rawAge,
    gender: gender,
    university: university.trim(),
    address: address ? address.trim() : "Campus Drive, Main Wing",
    image: `https://robohash.org/${firstName.trim()}?set=set5`, // User silhouettes
    department: department,
    enrollmentDate: enrollmentDate || new Date().toISOString().split("T")[0],
    status: status || "Active"
  };

  studentsDb.unshift(newStudent); // add to top of list
  res.status(201).json({ success: true, student: newStudent });
});

// PUT update existing student
app.put("/api/students/:id", (req, res) => {
  const index = studentsDb.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Student record not found" });
  }

  const student = studentsDb[index];
  const {
    firstName,
    lastName,
    email,
    phone,
    age,
    gender,
    university,
    address,
    department,
    status
  } = req.body;

  // Merge updates
  const updatedStudent: Student = {
    ...student,
    firstName: firstName ? firstName.trim() : student.firstName,
    lastName: lastName ? lastName.trim() : student.lastName,
    fullName: (firstName || lastName) ? `${(firstName || student.firstName).trim()} ${(lastName || student.lastName).trim()}` : student.fullName,
    email: email ? email.trim() : student.email,
    phone: phone ? phone.trim() : student.phone,
    age: age ? parseInt(age, 10) : student.age,
    gender: gender || student.gender,
    university: university ? university.trim() : student.university,
    address: address ? address.trim() : student.address,
    department: department || student.department,
    status: status || student.status
  };

  studentsDb[index] = updatedStudent;
  res.json({ success: true, student: updatedStudent });
});

// DELETE student record
app.delete("/api/students/:id", (req, res) => {
  const index = studentsDb.findIndex((s) => s.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Student record not found" });
  }

  const deletedStudent = studentsDb.splice(index, 1);
  res.json({ success: true, message: "Record successfully destroyed.", student: deletedStudent[0] });
});

// Error handling middleware
app.use((req, res, next) => {
  res.status(404).send(`
    <div style="font-family: sans-serif; text-align: center; padding: 50px;">
      <h2>404 - Page/Resource Not Found</h2>
      <p>The requested route could not be discovered on this portal.</p>
      <a href="/">Return Home</a>
    </div>
  `);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Express custom server running directly on port ${PORT}`);
});
