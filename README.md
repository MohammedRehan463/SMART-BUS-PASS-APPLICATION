# SMART BUS PASS APPLICATION

A web-based application for managing smart bus passes, including user registration, authentication, application processing, and admin/depot management.

## Features
- User registration and login
- OTP-based authentication
- Online application for bus passes
- Admin and depot dashboards
- Payment processing
- Document upload and verification
- Activity tracking

## Project Structure
```
BACKEND/   # Node.js/Express backend API
FRONTEND/  # Static frontend (HTML, CSS, JS)
```

### Backend
- Built with Node.js and Express
- MongoDB for data storage
- RESTful API endpoints
- Controllers, models, routes, and middleware

### Frontend
- HTML, CSS, and JavaScript
- Responsive design for users, admins, and depots

## Getting Started

### Prerequisites
- Node.js and npm
- MongoDB

### Backend Setup
1. Navigate to the `BACKEND` folder:
   ```powershell
   cd BACKEND
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Configure environment variables (e.g., MongoDB URI, JWT secret) in a `.env` file.
4. Start the server:
   ```powershell
   node server.js
   ```

### Frontend Setup
Open `FRONTEND/index.html` in your browser or serve the folder using a static server.

## Folder Structure
- `BACKEND/` - Backend API code
- `FRONTEND/` - Frontend static files

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)
