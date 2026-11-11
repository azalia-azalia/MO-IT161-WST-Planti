# Planti: The Plant Tracker Management System

Planti is a browser-based plant tracking management system designed to help beginner plant owners and gardening enthusiasts organize, manage, and monitor their plants.

The application allows users to create accounts, manage plant records, track basic plant care information, and keep their garden organized through a simple interface.

## Features

### User Management
- User registration and login.
- Basic account management.

### Plant Management
- Add new plant records.
- View plant information and care requirements.
- Edit plant details.
- Delete plant records.
- Search and filter plants by name, type, and health status.

### Plant Care Tracking
- Update plant health status.
- Record the last watering date.
- Update plant care notes.
- Maintain plant health history.

### Data Management
- Express.js REST API for handling application requests.
- JSON file-based data storage.
- Backend validation and error handling.
- Persistent plant and user records.

## Technology Stack

**Frontend**
- HTML5
- CSS3
- JavaScript

**Backend**
- Node.js
- Express.js

**Data Storage**
- JSON files
- Node.js File System (fs) module

## Installation and Setup

### Prerequisites
- Node.js installed on your computer.
- npm (included with Node.js).

### Steps

1. Clone or download this repository.
2. Open the project folder in your terminal.
3. Install the required dependencies:

   ```bash
   npm install
   ```

4. Start the Express server:

   ```bash
   node server.js
   ```

5. Open your browser and visit:

   ```text
   http://localhost:3000
   ```

## Backend API Routes

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/signup` | Register a new user |
| POST | `/api/login` | Authenticate a user |
| GET | `/api/plants` | Retrieve and filter plants |
| POST | `/api/plants` | Add a new plant |
| PUT | `/api/plants/:id` | Update plant information |
| DELETE | `/api/plants/:id` | Delete a plant |

## Data Storage

Planti uses JSON files to store plant and user records. The Express.js backend reads and writes these files to maintain application data between requests.

## Project Members

- Manset, Shayne Aliyah M.

## Course

MO-IT161: Web Systems and Technologies



