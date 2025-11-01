# Uber Clone Backend

A real-time ride-hailing service backend built with Node.js, Express, Socket.IO, and MongoDB.

## Features

- Real-time ride request and tracking
- Socket-based communication for instant updates
- JWT Authentication
- Google OAuth Integration
- Captain/Driver management
- Ride history and status tracking
- Geolocation support
- OSRM integration for route calculation

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://your-domain/api/auth/google/callback
FRONTEND_URL=http://your-frontend-domain
```

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run server
```

4. For production:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback

### Rides
- `POST /api/rides` - Create new ride request
- `GET /api/rides` - Get all rides
- `GET /api/rides/:id` - Get specific ride

### Users
- `GET /users/profile` - Get user profile
- `PUT /users/profile` - Update user profile

### Captains
- `GET /captain/profile` - Get captain profile
- `PUT /captain/profile` - Update captain profile

## Socket Events

### Client -> Server
- `create_ride` - Create new ride request
- `accept_ride` - Captain accepts a ride
- `reject_ride` - Captain rejects a ride
- `captain_location` - Update captain's location

### Server -> Client
- `ride_request` - New ride available (to captains)
- `ride_accepted` - Ride accepted notification
- `ride_rejected` - Ride rejected notification
- `captain_location` - Captain location updates
- `ride_completed` - Ride completion notification

## Deployment

### Production Setup

1. Set environment variables for production
2. Configure MongoDB Atlas or your production database
3. Set up proper CORS configuration in `server.js`:

```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
```

4. Configure your web server (Nginx/Apache) to proxy requests
5. Use PM2 or similar for process management:

```bash
npm install -g pm2
pm2 start server.js
```

### Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Security Considerations

1. Always use HTTPS in production
2. Set secure cookies and CORS policies
3. Rate limit API endpoints
4. Validate all input data
5. Use environment variables for sensitive data
6. Keep dependencies updated

## Error Handling

The API uses consistent error response format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

## Monitoring

1. Set up logging (Winston/Morgan)
2. Monitor server health
3. Track API performance
4. Watch socket connection status

## Database Indexes

Create these indexes for better performance:

```javascript
db.rides.createIndex({ status: 1, createdAt: -1 });
db.rides.createIndex({ userId: 1 });
db.rides.createIndex({ assignedCaptainId: 1 });
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

[MIT License](LICENSE)