# Real-Time Collaborative Kanban Board

A feature-rich, real-time collaborative Kanban board application built with Django and React. This platform allows multiple users to manage tasks across a board concurrently, with live updates, presence indicators, and a professional, modern user interface.

**Live Application URL:** [https://sanskriti-kanban.onrender.com](https://sanskriti-kanban.onrender.com)

## Key Features

* **Real-Time Collaboration:** Changes made by one user (creating, updating, or moving cards) are instantly broadcast to all other connected clients using Django Channels and WebSockets.
* **Drag & Drop Interface:** Smooth, intuitive drag-and-drop functionality for moving cards between columns, built with `react-beautiful-dnd`.
* **Presence Indicators:** See who is currently online and viewing the board with real-time avatar indicators.
* **Rich UI Components:** A modern, professional UI built with the Mantine component library, featuring modals for creating/editing cards and columns, notifications, and an editable board title.
* **Full CRUD Functionality:** Users can create, read, update, and delete boards, columns, and cards.
* **Optimistic UI Updates:** The interface updates instantly after a user action (like moving a card) and gracefully reverts if the server returns an error.
* **Full Deployment:** The application is containerized using Docker and deployed on Render.com, configured for a production environment.

## Tech Stack

| Category      | Technology                                                                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------------- |
| **Frontend** | React, Vite, Mantine (UI), `react-beautiful-dnd` (Drag & Drop), `axios`                                       |
| **Backend** | Django, Django Rest Framework, Django Channels (WebSockets)                                                 |
| **Database** | Supabase (PostgreSQL)                                                                                       |
| **Real-Time** | WebSockets, Redis (via Upstash for message queuing & presence)                                              |
| **Deployment**| Docker, Render.com                                                                                          |

## Setup and Run Locally

To run this project on your local machine, follow these steps:

### Prerequisites

* Python 3.10+
* Node.js 20.x+
* Docker Desktop (Optional, for building the image locally)
* Access to Supabase (PostgreSQL) and Upstash (Redis) instances.

### Backend Setup

1.  Navigate to the `backend` directory: `cd backend`
2.  Create and activate a virtual environment: `python -m venv venv` and `source venv/bin/activate` (or `venv\Scripts\activate` on Windows).
3.  Install dependencies: `pip install -r requirements.txt`
4.  Create a `.env` file in the `backend/core` directory and add your secret keys (DATABASE_URL, REDIS_URL, SECRET_KEY).
5.  Run database migrations: `python manage.py migrate`
6.  Start the server: `python manage.py runserver`

### Frontend Setup

1.  Navigate to the `frontend` directory: `cd frontend`
2.  Install dependencies: `npm install`
3.  Start the development server: `npm run dev`