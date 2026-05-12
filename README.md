# Hermoso Descanso Hotel Management System

A full-stack hotel management system built with Node.js, Express, React, and MongoDB.

## Features

- User authentication with role-based access (Admin, Frontdesk, Kitchen, Housekeeping)
- Room management and booking system
- Inventory and stock management
- Point of Sale (POS) system with receipt generation
- Attendance and clock-in/out tracking
- Inter-department messaging system
- Sales reporting and analytics
- Email notifications for bookings

## Local Development

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```env
   MONGODB_URI=mongodb://localhost:27017/hotel-db
   JWT_SECRET=your-super-secret-jwt-key-here
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-email-password
   PORT=5000
   ```

4. Start MongoDB locally or use MongoDB Atlas

5. Start the server:
   ```bash
   npm start
   ```

6. Open http://localhost:5000

## Production Deployment

### 1. Set up MongoDB Atlas (Free)

1. Sign up at https://www.mongodb.com/atlas
2. Create a free cluster
3. Create a database user and copy the connection string
4. **Important**: URL-encode special characters in your password (like `:` becomes `%3A`)
5. Add your database name to the end of the URI: `/hotel-db`
6. Update `MONGODB_URI` in your `.env` file

**Example URI format:**
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hotel-db
```

**If your password contains special characters:**
- `:` becomes `%3A`
- `@` becomes `%40`
- `/` becomes `%2F`
- etc.

**Example with encoded password:**
```env
MONGODB_URI=mongodb+srv://user:pass%3Aword@cluster.mongodb.net/hotel-db
```

### 2. Choose a Hosting Platform

**Recommended: Render (Free tier available)**

1. Sign up at https://render.com
2. Connect your GitHub repository
3. Create a new Web Service
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add environment variables in Render dashboard

**Alternative: Railway**

1. Sign up at https://railway.app
2. Connect GitHub repo
3. Add MongoDB plugin or use Atlas
4. Deploy

### 3. Environment Variables for Production

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hotel-db
JWT_SECRET=your-very-secure-random-jwt-secret
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
PORT=5000
```

### 4. Deploy

1. Push your code to GitHub
2. Connect to your hosting platform
3. Set environment variables
4. Deploy!

## Default Users

- **Admin**: 123admin / password765
- **Frontdesk**: 123frontdesk / password123
- **Kitchen**: 123kitchen / password456
- **Housekeeping**: 123housekeeping / password098

## API Endpoints

### Authentication
- `POST /api/login`
- `POST /api/logout`

### Admin
- `GET /api/admin/dashboard`
- `GET /api/login-logs`
- `GET /api/attendance/logs`

### Bookings
- `GET /api/bookings`
- `POST /api/bookings`
- `POST /api/bookings/:id/checkout`

### Rooms
- `GET /api/rooms`
- `PUT /api/rooms/:id`

### Inventory
- `GET /api/inventory`
- `PUT /api/inventory/:id`
- `PATCH /api/inventory/:id/adjust`

### POS System
- `GET /api/dishes`
- `POST /api/dishes`
- `GET /api/pos/orders`
- `POST /api/pos/orders`
- `PUT /api/pos/orders/:id/status`
- `GET /api/pos/orders/:id/receipt`

### Messaging
- `GET /api/messages`
- `POST /api/messages`
- `PUT /api/messages/:id/read`

### And more...

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Frontend**: React (vanilla, no build tools)
- **Authentication**: JWT
- **Email**: Nodemailer
- **Styling**: Custom CSS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## License

This project is for educational purposes.
