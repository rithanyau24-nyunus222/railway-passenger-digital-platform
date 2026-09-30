const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// GET /api/trains/stations - get distinct station list for convenience
router.get('/stations', requireAuth, (req, res) => {
  try {
    const sources = db.prepare('SELECT DISTINCT source as station FROM trains').all();
    const destinations = db.prepare('SELECT DISTINCT destination as station FROM trains').all();
    const stationSet = new Set([...sources.map(s => s.station), ...destinations.map(d => d.station)]);
    res.json({ stations: Array.from(stationSet).sort() });
  } catch (err) {
    console.error('Error fetching stations:', err);
    res.status(500).json({ message: 'Failed to retrieve stations.' });
  }
});

// GET /api/trains/search - Search matching trains
router.get('/search', requireAuth, (req, res) => {
  try {
    const { source, destination, journeyDate } = req.query;

    if (!source || !source.trim()) {
      return res.status(400).json({ message: 'Source station is required.' });
    }

    if (!destination || !destination.trim()) {
      return res.status(400).json({ message: 'Destination station is required.' });
    }

    if (source.trim().toLowerCase() === destination.trim().toLowerCase()) {
      return res.status(400).json({ message: 'Source and destination stations cannot be the same.' });
    }

    let query = `
      SELECT 
        id as trainId,
        train_number as trainNumber,
        train_name as trainName,
        source,
        destination,
        departure_time as departureTime,
        arrival_time as arrivalTime,
        journey_date as journeyDate,
        total_seats as totalSeats,
        available_seats as availableSeats,
        fare,
        status,
        current_station as currentStation,
        delay_minutes as delayMinutes
      FROM trains
      WHERE LOWER(source) LIKE LOWER(?)
        AND LOWER(destination) LIKE LOWER(?)
    `;

    const params = [`%${source.trim()}%`, `%${destination.trim()}%`];

    // If journeyDate is specified, match or allow flexible demonstration match
    if (journeyDate && journeyDate.trim()) {
      query += ` AND (journey_date = ? OR journey_date >= ?)`;
      params.push(journeyDate.trim(), journeyDate.trim());
    }

    query += ` ORDER BY departure_time ASC`;

    const trains = db.prepare(query).all(...params);

    return res.json(trains);
  } catch (err) {
    console.error('Train search error:', err);
    return res.status(500).json({ message: 'Server error while searching trains.' });
  }
});

// GET /api/trains - list all trains (for exploration / status directory)
router.get('/', requireAuth, (req, res) => {
  try {
    const trains = db.prepare(`
      SELECT 
        id as trainId,
        train_number as trainNumber,
        train_name as trainName,
        source,
        destination,
        departure_time as departureTime,
        arrival_time as arrivalTime,
        journey_date as journeyDate,
        total_seats as totalSeats,
        available_seats as availableSeats,
        fare,
        status,
        current_station as currentStation,
        delay_minutes as delayMinutes
      FROM trains
      ORDER BY id ASC
    `).all();

    res.json(trains);
  } catch (err) {
    console.error('Error fetching trains:', err);
    res.status(500).json({ message: 'Failed to retrieve trains.' });
  }
});

// GET /api/trains/:id - single train details
router.get('/:id', requireAuth, (req, res) => {
  try {
    const trainId = req.params.id;
    const train = db.prepare(`
      SELECT 
        id as trainId,
        train_number as trainNumber,
        train_name as trainName,
        source,
        destination,
        departure_time as departureTime,
        arrival_time as arrivalTime,
        journey_date as journeyDate,
        total_seats as totalSeats,
        available_seats as availableSeats,
        fare,
        status,
        current_station as currentStation,
        delay_minutes as delayMinutes
      FROM trains
      WHERE id = ?
    `).get(trainId);

    if (!train) {
      return res.status(404).json({ message: 'Train not found.' });
    }

    return res.json(train);
  } catch (err) {
    console.error('Error fetching train by id:', err);
    return res.status(500).json({ message: 'Server error retrieving train details.' });
  }
});

// GET /api/trains/:id/status - Live train status
router.get('/:id/status', requireAuth, (req, res) => {
  try {
    const trainId = req.params.id;
    const train = db.prepare(`
      SELECT 
        id as trainId,
        train_number as trainNumber,
        train_name as trainName,
        source,
        destination,
        departure_time as departureTime,
        arrival_time as arrivalTime,
        journey_date as journeyDate,
        status,
        current_station as currentStation,
        delay_minutes as delayMinutes,
        available_seats as availableSeats
      FROM trains
      WHERE id = ? OR train_number = ?
    `).get(trainId, trainId);

    if (!train) {
      return res.status(404).json({ message: 'Train not found.' });
    }

    // Build timeline milestones based on source, current station, and destination
    const intermediateStations = {
      'TR1001': ['Station A', 'Midway Halt', 'Valley Junction', 'Station B'],
      'TR1002': ['Station A', 'Pine Bridge', 'Riverbank', 'Station B'],
      'TR1003': ['New Delhi', 'Mathura', 'Kota Junction', 'Vadodara', 'Mumbai Central'],
      'TR1004': ['New Delhi', 'Aligarh', 'Kanpur Central', 'Prayagraj', 'Varanasi'],
      'TR1005': ['Bangalore', 'Bangarapet', 'Jolarpettai', 'Katpadi', 'Chennai Central'],
      'TR1006': ['Mumbai Central', 'Panvel', 'Roha', 'Ratnagiri', 'Kankavli', 'Goa Madgaon'],
      'TR1007': ['Howrah', 'Bardhaman', 'Malda Town', 'Kishanganj', 'New Jalpaiguri'],
      'TR1008': ['Pune', 'Lonavala', 'Kalyan', 'Dadar', 'Mumbai Central'],
      'TR1009': ['Howrah', 'Kharagpur', 'Bhubaneswar', 'Visakhapatnam', 'Vijayawada', 'Chennai Central'],
      'TR1010': ['Bangalore', 'Anantapur', 'Secunderabad', 'Nagpur', 'Bhopal', 'Gwalior', 'New Delhi']
    };

    const routeStations = intermediateStations[train.trainNumber] || [
      train.source,
      'Midway Point',
      train.destination
    ];

    return res.json({
      trainId: train.trainId,
      trainNumber: train.trainNumber,
      trainName: train.trainName,
      source: train.source,
      destination: train.destination,
      departureTime: train.departureTime,
      arrivalTime: train.arrivalTime,
      journeyDate: train.journeyDate,
      status: train.status,
      currentStation: train.currentStation || train.source,
      delayMinutes: train.delayMinutes || 0,
      routeStations,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error fetching live train status:', err);
    return res.status(500).json({ message: 'Server error retrieving train status.' });
  }
});

module.exports = router;
