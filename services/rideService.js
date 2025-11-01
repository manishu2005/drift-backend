import https from "https";
import rideModel from "../models/rideModel.js";
import { generatePrime } from "crypto";

/**
 * Parse coordinate input into [lat, lon].
 * Accepts: {lat, lon}, {latitude, longitude}, [lat, lon], or {0:lat,1:lon}
 */
function _parseCoord(coord){
    if(!coord) throw new Error('Invalid coordinate');
    if(Array.isArray(coord)) return [Number(coord[0]), Number(coord[1])];
    if(typeof coord === 'object'){
        if(('lat' in coord) && ('lon' in coord)) return [Number(coord.lat), Number(coord.lon)];
        if(('latitude' in coord) && ('longitude' in coord)) return [Number(coord.latitude), Number(coord.longitude)];
        // fallback to keyed numeric indexes
        if((0 in coord) && (1 in coord)) return [Number(coord[0]), Number(coord[1])];
    }
    throw new Error('Unsupported coordinate format');
}

/**
 * Query the public OSRM API for driving route distance and duration between two points.
 * origin and destination may be objects ({lat,lon} or {latitude,longitude}) or arrays [lat,lon].
 * Returns: { distance: <meters>, duration: <seconds> }
 */
export async function getDistance(origin, destination){
    const [lat1, lon1] = _parseCoord(origin);
    const [lat2, lon2] = _parseCoord(destination);

    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false&alternatives=false&steps=false`;

    return new Promise((resolve, reject)=>{
        https.get(url, (res)=>{
            let raw = '';
            res.on('data', chunk => raw += chunk);
            res.on('end', ()=>{
                try{
                    const json = JSON.parse(raw);
                    if(json && Array.isArray(json.routes) && json.routes.length){
                        const r = json.routes[0];
                        resolve({distance: r.distance, duration: r.duration});
                    } else {
                        reject(new Error('No route returned from OSRM'));
                    }
                }catch(err){
                    reject(err);
                }
            });
        }).on('error', err => reject(err));
    });
}

 async function getFare(pickup, destination, vehicle = 'car'){
        if(!pickup || !destination) 
            throw new Error("Pickup and destination are required to calculate fare.");

        const baseFare = {
            auto:30,
            car:50,
            motorCycle:20
        };
        const perKmRate={
            auto:10,
            car:15,
            motorCycle:8
        };
        const perMinuteRate = {
            auto:2, 
            car:3,
            motorCycle:1.5
        };

        // Use OSRM to get distance and duration (meters, seconds)
        const {distance, duration} = await getDistance(pickup, destination);

        const km = Number(distance) / 1000;
        const minutes = Number(duration) / 60;

        const fareAmount = (baseFare[vehicle] || baseFare.car) + (perKmRate[vehicle] || perKmRate.car) * km + (perMinuteRate[vehicle] || perMinuteRate.car) * minutes;

        const fare = {
            vehicle,
            distanceMeters: distance,
            durationSeconds: duration,
            amount: Number(fareAmount.toFixed(2))
        };

        return fare;
    }

    function getOtp(num){
        function generateOtp(num){
        const otp = crypto.randomInt(Math.pow(10, num -1), Math.pow(10, num)).toString();
        return otp;
    }
    return generateOtp(num);
}

export const createRide = async({user, pickup, destination, vehicleType})=>{
    if (!user || !pickup || !destination || !vehicleType) {
        throw new Error("All fields are required to create ride.");
    }

    const fare = await getFare(pickup, destination);

    const ride = rideModel.create({
        user,
        pickup,
        destination,
        otp: getOtp(6),
        fare: fare[vehicleType]
    })
    return ride;
}
export default {
    getDistance,
    createRide
};