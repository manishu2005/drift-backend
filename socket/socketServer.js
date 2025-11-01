// socketServer.js
import { Server } from "socket.io";
import Ride from "../models/rideModel.js";
import socketAuth from "../utils/socketAuth.js";

// expose connected captains map at module scope for debugging
const connectedCaptains = new Map();
const rideExpiryTimers = new Map();
const RIDE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export function getConnectedCaptains() {
  return Array.from(connectedCaptains.entries()).map(([userId, socketId]) => ({ userId, socketId }));
}

export default function initSocketHandlers(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173", // frontend origin
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // ✅ Socket-level Authentication Middleware
  io.use(socketAuth);

  io.on("connection", (socket) => {
    console.log(" Socket connected:", socket.id);//, socket.user?.id, socket.user?.role

    // 🧩 Join rooms by role
    if (socket.user?.role === "captain") {
      socket.join("captains");
      socket.join(`captain:${socket.user.id}`);
      // track captain socket
      try {
        connectedCaptains.set(socket.user.id.toString(), socket.id);
      } catch (e) {
        console.error('Error tracking connected captain', e);
      }
      console.log(` Captain ${socket.user.id} joined 'captains' room`);
    }

    if (socket.user?.role === "user") {
      socket.join(`user:${socket.user.id}`);
      console.log(` User ${socket.user.id} joined personal room`);
    }

    // 🧭 Create Ride (by user)
    socket.on("create_ride", async (payload, ack) => {
      try {
        if (!payload.pickup || !payload.destination) {
          return ack?.({ success: false, error: "Pickup and destination required" });
        }

        const ride = new Ride({
          userId: socket.user?.id,
          userName: socket.user?.name,
          pickup: payload.pickup,
          destination: payload.destination,
          status: "requested",
        });

        await ride.save();

        // schedule expiration
        try {
          const timer = setTimeout(async () => {
            try {
              const current = await Ride.findById(ride._id);
              if (current && current.status === 'requested') {
                current.status = 'expired';
                await current.save();
                // notify captains to remove this ride
                io.to('captains').emit('ride_removed', { rideId: current._id });
                // notify user that ride expired
                io.to(`user:${current.userId}`).emit('ride_expired', { rideId: current._id });
                rideExpiryTimers.delete(current._id.toString());
                console.log(` Ride ${current._id} expired after ${RIDE_EXPIRY_MS}ms`);
              }
            } catch (e) {
              console.error('Error expiring ride:', e);
            }
          }, RIDE_EXPIRY_MS);
          rideExpiryTimers.set(ride._id.toString(), timer);
        } catch (e) {
          console.error('Could not schedule ride expiry:', e);
        }

        // Notify all captains (prefer direct emit to tracked captain sockets)
        try {
          const count = connectedCaptains.size;
          console.log(` Broadcasting ride_request to ${count} connected captains`);
          if (count > 0) {
            for (const [userId, sockId] of connectedCaptains.entries()) {
              try {
                io.to(sockId).emit('ride_request', ride);
              } catch (e) {
                console.error('Error emitting ride_request to', sockId, e);
              }
            }
          } else {
            // fallback to room broadcast
            io.to("captains").emit("ride_request", ride);

          // Also broadcast to 'captains' room as an extra fallback (ensures UI listening to room receives requests)
          try {
            io.to('captains').emit('ride_request', ride);
            console.log(' Broadcasted ride_request to room: captains');
          } catch(e) {
            console.error('Error broadcasting ride_request to captains room', e);
          }
          }
        } catch (e) {
          console.error('Error broadcasting ride_request', e);
          io.to("captains").emit("ride_request", ride);
        }

        ack?.({ success: true, ride });
        console.log(" Ride request broadcasted to all captains");
      } catch (err) {
        console.error(" create_ride error:", err);
        ack?.({ success: false, error: err.message });
      }
    });

    // 🚗 Captain Accept Ride
    socket.on("accept_ride", async (payload, ack) => {
      try {
        if (socket.user?.role !== "captain") {
          return ack?.({ success: false, error: "Only captains can accept rides" });
        }

        const ride = await Ride.findById(payload.rideId);
        if (!ride) return ack?.({ success: false, error: "Ride not found" });
        if (ride.status !== "requested")
          return ack?.({ success: false, error: "Ride already taken" });

        ride.status = "accepted";
        ride.assignedCaptainId = socket.user.id;
        await ride.save();

        // clear expiry timer
        try {
          const t = rideExpiryTimers.get(ride._id.toString());
          if (t) {
            clearTimeout(t);
            rideExpiryTimers.delete(ride._id.toString());
          }
        } catch (e) {
          console.error('Error clearing expiry timer for ride', ride._id, e);
        }

    io.to(sockId).emit("ride_request", {
  _id: ride._id,
  userId: ride.userId,
  pickup: ride.pickup,
  destination: ride.destination,
  status: ride.status,
});


        // Notify other captains so they stop seeing this ride
        io.to("captains").emit("ride_taken", { rideId: ride._id });

        ack?.({ success: true, ride });
        console.log(`Ride ${ride._id} accepted by Captain ${socket.user.id}`);
      } catch (err) {
        console.error(" accept_ride error:", err);
        ack?.({ success: false, error: err.message });
      }
    });

    //  Captain Reject Ride
    socket.on("reject_ride", async (payload, ack) => {
      try {
        const { rideId, userId, removeAll } = payload || {};
        if (!rideId || !userId) return ack?.({ success: false, error: 'rideId and userId required' });

        // notify the requesting user that this captain declined
        io.to(`user:${userId}`).emit("ride_rejected", {
          rideId,
          captainId: socket.user?.id,
        });

        // If requested, mark ride as rejected/removed for everyone
        if (removeAll) {
          const ride = await Ride.findById(rideId);
          if (ride && ride.status === 'requested') {
            ride.status = 'rejected';
            await ride.save();
            // tell all captains to remove it
            io.to('captains').emit('ride_removed', { rideId });
            // tell the user the ride was removed
            io.to(`user:${ride.userId}`).emit('ride_removed', { rideId });
          }
        }

        ack?.({ success: true });
      } catch (err) {
        console.error(' reject_ride error:', err);
        ack?.({ success: false, error: err.message });
      }
    });

    //  Captain sends live location updates for an accepted ride
    socket.on("captain_location", async (payload) => {
      try {
        const { rideId, lat, lon } = payload || {};
        if (!rideId || typeof lat === "undefined" || typeof lon === "undefined") return;

        const ride = await Ride.findById(rideId);
        if (!ride) return;

        // Only forward location updates to the user assigned to this ride
        if (ride.assignedCaptainId && ride.assignedCaptainId.toString() === socket.user.id.toString()) {
          io.to(`user:${ride.userId}`).emit("captain_location", {
            rideId,
            captainId: socket.user.id,
            lat,
            lon,
          });
        }
      } catch (err) {
        console.error(" captain_location error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected:", socket.id);
      try {
        if (socket.user?.role === 'captain' && socket.user?.id) {
          const key = socket.user.id.toString();
          if (connectedCaptains.get(key) === socket.id) connectedCaptains.delete(key);
        }
      } catch (e) {
        
      }
    });
  });

  console.log(" Socket.IO server initialized successfully");
}
