

💬 Real-Time Messaging App

A modern, full-stack chat application built with the PERN stack (PostgreSQL, Express, React, Node.js). This project features instant message delivery, secure user authentication, and a responsive design for a seamless user experience.

🚀 Live Demo

![App Screenshot](https://messageapp-av9z.vercel.app/screenshot.png)

## 🚀 Live Demo
* **Frontend:** [https://messageapp-ccvm.vercel.app/login](https://messageapp-ccvm.vercel.app/login)


✨ Features

Real-Time Communication: Instant message updates across all clients using Socket.io.

Full-Stack Authentication: Secure signup and login using JWT (JSON Web Tokens) and Bcrypt password hashing.

Persistent Data: Users and chat history stored in a PostgreSQL database.

Responsive UI: Mobile-first design with a dynamic background and custom styling.

State Management: Robust handling of user sessions and global state within React.

🛠️ Tech Stack
Frontend

React.js (Vite)

CSS3 (Flexbox & Grid, custom properties)

Axios (API Requests)

Socket.io-client (Real-time events)

Backend

Node.js & Express

Prisma ORM (Database management)

PostgreSQL (Relational Database)

Socket.io (WebSocket server)

⚙️ Local Development
1. Clone the Project
git clone <your-repo-url>
cd <your-repo-name>

2. Backend Setup
cd backend
npm install


Create a .env file:

DATABASE_URL="your_postgresql_url"
JWT_SECRET="your_secret_key"
CLIENT_URL="http://localhost:5173"


Run Prisma to push the schema:

npx prisma db push


Start the backend server:

npm run dev

3. Frontend Setup
cd frontend/vite-project
npm install


Create a .env file:

VITE_API_URL="http://localhost:8080/api"


Start the frontend server:

npm run dev

📝 How to Use

Sign Up / Login

Open the app and create a new account or login with existing credentials.

Start Chatting

Click on a friend or contact from the list to open a chat.

Type your message in the input box and hit Enter to send.

Messages appear instantly thanks to Socket.io.

Logout

Use the logout button to safely end your session.

Optional

Add more users in the database to test multiple chat sessions.

🧠 Challenges Overcome

Case-Sensitivity in Deployment: Handled discrepancies between Windows and Linux file systems that caused Vercel build failures.

CORS Configuration: Configured Cross-Origin Resource Sharing to allow secure communication between frontend (Vercel) and backend (Railway).

Client-Side Routing: Implemented custom Vercel rewrites to ensure React Router paths work correctly on page refresh.
