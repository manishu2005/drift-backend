import Ride from '../models/rideModel.js';

export const createRide = async (req, res) => {
    try {
        // Use the Ride model (capitalized) to construct a new document
        const ride = new Ride(req.body);
        await ride.save();
        return res.json({ success: true, message: 'Ride created successfully', ride });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: err.message });
    }
};
