# CampusX

CampusX is a university mobile app that connects undergraduate students, graduate students, faculty and recruiters in one platform. Students find academic resources and apply for internships, jobs, RA and TA positions. Faculty share resources and post research opportunities. Companies post jobs after admin approval.

Built end to end by one developer: mobile app, REST API and database.

## Features

**Five role-based panels**

| Panel | What it does |
| --- | --- |
| Undergraduate | Register and log in, manage a profile, upload a resume, get an AI resume review, browse and apply for internships and jobs, track applications, access notes, slides and lab manuals |
| Graduate | Research-focused profile, resume and publication uploads, AI resume review, apply for RA, TA, internship and job openings, track applications |
| Faculty | Upload notes, slides and lab manuals, publish announcements, post RA, TA and research opportunities, review student applications |
| Company / Recruiter | Register a company profile, post jobs and internships with skills and deadlines, review applicants, download resumes, shortlist, accept or reject |
| Admin | Manage students, faculty and recruiters, approve company registrations before they can post, manage opportunities and resources, publish announcements |

**Also included**

- Secure sign-up and login with JSON Web Tokens and hashed passwords
- Resume upload (PDF and Word) with cloud file storage
- AI resume review using the OpenAI API
- Application status tracking from submission to decision

## Roadmap

- GitHub portfolio integration
- Skill match ranking and personalized recommendations
- Career readiness score and learning paths
- Project collaboration workspace and planner
- Email notifications and password reset

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Mobile app | React Native, Expo, TypeScript, React Navigation, Axios, Expo Secure Store |
| Backend | Node.js, Express.js |
| Database | MySQL |
| Authentication | JSON Web Tokens (JWT), bcrypt |
| File handling | Multer, Cloudinary, pdf-parse, mammoth |
| AI | OpenAI API |

## Project Structure

```
CampusX/
├── Backend/     # Express.js REST API
└── Frontend/    # React Native (Expo) mobile app
```

## Getting Started

### Prerequisites

- Node.js 18 or newer
- MySQL 8 or newer
- Expo Go on an Android phone, or an Android emulator

### 1. Database

Create an empty MySQL database:

```sql
CREATE DATABASE campusx;
```

Any MySQL host works, local or cloud. Only the values in `.env` change.

### 2. Backend

```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend` folder:

```env
PORT=5000

DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=campusx

JWT_SECRET=use_a_long_random_string
OPENAI_API_KEY=your_openai_api_key
```

Start the server:

```bash
npm run dev     # development, restarts on changes
npm start       # production
```

The API runs at `http://localhost:5000`.

### 3. Mobile App

```bash
cd Frontend
npm install
npm run android
```

Set the backend address in the frontend's API configuration. On a physical phone, use your computer's local network address (for example `http://192.168.x.x:5000`) instead of `localhost`.

## Author

**Md. Mahir Ettesaf**
B.Sc. in Computer Science and Engineering, Southeast University
[GitHub](https://github.com/Mahir-ettesaf) | [LinkedIn](https://www.linkedin.com/in/mahir-ettesaf/)
