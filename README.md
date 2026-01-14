# 💬 Real-Time Messaging App

A modern, full-stack chat application built with the "PERN" stack (PostgreSQL, Express, React, Node.js). This project features instant message delivery, secure user authentication, and a responsive design tailored for a seamless user experience.

![App Screenshot](https://messageapp-av9z.vercel.app/photo2.jpg)

## 🚀 Live Demo
* **Frontend:** [https://messageapp-av9z.vercel.app/](https://messageapp-av9z.vercel.app/)


## ✨ Features
* **Real-Time Communication:** Instant message updates across all clients using **Socket.io**.
* **Full-Stack Authentication:** Secure Signup and Login using **JWT (JSON Web Tokens)** and **Bcrypt** password hashing.
* **Persistent Data:** All users and chat history are stored in a **PostgreSQL** database.
* **Responsive UI:** A custom-styled interface featuring a dynamic background and mobile-first design.
* **State Management:** Robust handling of user sessions and global state within React.

## 🛠️ Tech Stack

### Frontend
* **React.js** (Vite)
* **CSS3** (Custom properties & Flexbox/Grid)
* **Axios** (API Requests)
* **Socket.io-client** (Real-time events)

### Backend
* **Node.js & Express**
* **Prisma ORM** (Database management)
* **PostgreSQL** (Relational Database)
* **Socket.io** (WebSocket server)



## ⚙️ Local Development

### 1. Clone the Project
```bash
git clone <your-repo-url>
cd <your-repo-name>
2. Backend Setup
Bash

cd backend
npm install
Create a .env file:

Code snippet

DATABASE_URL="your_postgresql_url"
JWT_SECRET="your_secret_key"
CLIENT_URL="http://localhost:5173"
Run npx prisma db push

Run npm run dev

3. Frontend Setup
Bash

cd frontend/vite-project
npm install
Create a .env file:

Code snippet

VITE_API_URL="http://localhost:8080/api"
Run npm run dev

🧠 Challenges Overcome
Case-Sensitivity in Deployment: Handled discrepancies between Windows and Linux file systems that caused Vercel build failures.

CORS Configuration: Successfully configured Cross-Origin Resource Sharing to allow secure communication between separate frontend (Vercel) and backend (Railway) domains.

Client-Side Routing: Implemented custom Vercel rewrites to ensure React Router paths function correctly on page refresh.

📄 License
This project is open-source and available under the MIT License.


---

### Pro-Tips for your README:
* **The Screenshot:** In the `![App Screenshot]` section, I used your background image as a placeholder. It would be even better if you took a screenshot of the **actual chat screen** with messages, uploaded it to GitHub, and changed that link!
* **The Badges:** If you want those cool colored badges we talked about, you can add them at the very top.

**Would you like me to help you write a specific "How to Use" section if you have any
