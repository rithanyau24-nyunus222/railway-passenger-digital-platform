const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { requireAdmin } = require('../middleware/auth');

// Protect all admin endpoints
router.use(requireAdmin);

// GET /api/admin/stats - Operational metrics
router.get('/stats', (req, res) => {
  try {
    const totalTrains = db.prepare('SELECT COUNT(*) as count FROM trains').get().count;
    const totalBookings = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;
    const activeBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'CONFIRMED'").get().count;
    const cancelledBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'CANCELLED'").get().count;
    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'PASSENGER'").get().count;

    return res.json({
      totalTrains,
      totalBookings,
      activeBookings,
      cancelledBookings,
      totalUsers
    });
  } catch (err) {
    console.error('Error fetching admin stats:', err);
    return res.status(500).json({ message: 'Server error retrieving statistics.' });
  }
});

// GET /api/admin/trains - List all trains
router.get('/trains', (req, res) => {
  try {
    const trains = db.prepare(`
      SELECT 
        id,
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
        delay_minutes as delayMinutes,
        created_at as createdAt
      FROM trains
      ORDER BY id DESC
    `).all();

    return res.json(trains);
  } catch (err) {
    console.error('Admin get trains error:', err);
    return res.status(500).json({ message: 'Server error retrieving trains.' });
  }
});

// POST /api/admin/trains - Create new train
router.post('/trains', (req, res) => {
  try {
    const {
      trainNumber,
      trainName,
      source,
      destination,
      departureTime,
      arrivalTime,
      journeyDate,
      totalSeats,
      availableSeats,
      fare,
      status = 'Scheduled',
      currentStation,
      delayMinutes = 0
    } = req.body;

    // Validations
    if (!trainNumber || !trainNumber.trim()) {
      return res.status(400).json({ message: 'Train number is required.' });
    }
    if (!trainName || !trainName.trim()) {
      return res.status(400).json({ message: 'Train name is required.' });
    }
    if (!source || !source.trim()) {
      return res.status(400).json({ message: 'Source station is required.' });
    }
    if (!destination || !destination.trim()) {
      return res.status(400).json({ message: 'Destination station is required.' });
    }
    if (source.trim().toLowerCase() === destination.trim().toLowerCase()) {
      return res.status(400).json({ message: 'Source and destination cannot be identical.' });
    }
    if (!departureTime || !departureTime.trim()) {
      return res.status(400).json({ message: 'Departure time is required.' });
    }
    if (!arrivalTime || !arrivalTime.trim()) {
      return res.status(400).json({ message: 'Arrival time is required.' });
    }
    if (!journeyDate || !journeyDate.trim()) {
      return res.status(400).json({ message: 'Journey date is required.' });
    }

    const tSeats = parseInt(totalSeats, 10);
    if (isNaN(tSeats) || tSeats <= 0) {
      return res.status(400).json({ message: 'Total seats must be greater than 0.' });
    }

    let aSeats = availableSeats !== undefined ? parseInt(availableSeats, 10) : tSeats;
    if (isNaN(aSeats) || aSeats < 0 || aSeats > tSeats) {
      return res.status(400).json({ message: 'Available seats must be between 0 and total seats.' });
    }

    const fareVal = parseFloat(fare);
    if (isNaN(fareVal) || fareVal < 0) {
      return res.status(400).json({ message: 'Fare must be greater than or equal to 0.' });
    }

    // Check duplicate train number
    const existing = db.prepare('SELECT id FROM trains WHERE UPPER(train_number) = UPPER(?)').get(trainNumber.trim());
    if (existing) {
      return res.status(409).json({ message: `Train number '${trainNumber.trim().toUpperCase()}' already exists.` });
    }

    const insertStmt = db.prepare(`
      INSERT INTO trains (
        train_number, train_name, source, destination,
        departure_time, arrival_time, journey_date,
        total_seats, available_seats, fare, status,
        current_station, delay_minutes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `);

    const result = insertStmt.run(
      trainNumber.trim().toUpperCase(),
      trainName.trim(),
      source.trim(),
      destination.trim(),
      departureTime.trim(),
      arrivalTime.trim(),
      journeyDate.trim(),
      tSeats,
      aSeats,
      fareVal,
      status,
      currentStation ? currentStation.trim() : source.trim(),
      parseInt(delayMinutes, 10) || 0
    );

    const newTrainId = Number(result.lastInsertRowid);
    const newTrain = db.prepare('SELECT * FROM trains WHERE id = ?').get(newTrainId);

    return res.status(201).json({
      message: 'Train created successfully.',
      train: newTrain
    });
  } catch (err) {
    console.error('Error creating train:', err);
    return res.status(500).json({ message: 'Server error creating train.' });
  }
});

// PUT /api/admin/trains/:id - Update train details
router.put('/trains/:id', (req, res) => {
  try {
    const trainId = req.params.id;
    const existing = db.prepare('SELECT * FROM trains WHERE id = ?').get(trainId);
    if (!existing) {
      return res.status(404).json({ message: 'Train not found.' });
    }

    const {
      trainNumber,
      trainName,
      source,
      destination,
      departureTime,
      arrivalTime,
      journeyDate,
      totalSeats,
      availableSeats,
      fare,
      status,
      currentStation,
      delayMinutes
    } = req.body;

    const tSeats = totalSeats !== undefined ? parseInt(totalSeats, 10) : existing.total_seats;
    const aSeats = availableSeats !== undefined ? parseInt(availableSeats, 10) : existing.available_seats;
    const fareVal = fare !== undefined ? parseFloat(fare) : existing.fare;

    if (tSeats <= 0) {
      return res.status(400).json({ message: 'Total seats must be greater than 0.' });
    }
    if (aSeats < 0 || aSeats > tSeats) {
      return res.status(400).json({ message: 'Available seats must be between 0 and total seats.' });
    }
    if (fareVal < 0) {
      return res.status(400).json({ message: 'Fare cannot be negative.' });
    }

    // Check duplicate train number if changed
    if (trainNumber && trainNumber.trim().toUpperCase() !== existing.train_number) {
      const dup = db.prepare('SELECT id FROM trains WHERE UPPER(train_number) = UPPER(?) AND id != ?').get(trainNumber.trim(), trainId);
      if (dup) {
        return res.status(409).json({ message: 'Train number already in use by another train.' });
      }
    }

    const updateStmt = db.prepare(`
      UPDATE trains SET
        train_number = ?,
        train_name = ?,
        source = ?,
        destination = ?,
        departure_time = ?,
        arrival_time = ?,
        journey_date = ?,
        total_seats = ?,
        available_seats = ?,
        fare = ?,
        status = ?,
        current_station = ?,
        delay_minutes = ?
      WHERE id = ?
    `);

    updateStmt.run(
      trainNumber ? trainNumber.trim().toUpperCase() : existing.train_number,
      trainName ? trainName.trim() : existing.train_name,
      source ? source.trim() : existing.source,
      destination ? destination.trim() : existing.destination,
      departureTime ? departureTime.trim() : existing.departure_time,
      arrivalTime ? arrivalTime.trim() : existing.arrival_time,
      journeyDate ? journeyDate.trim() : existing.journey_date,
      tSeats,
      aSeats,
      fareVal,
      status || existing.status,
      currentStation !== undefined ? currentStation.trim() : existing.current_station,
      delayMinutes !== undefined ? parseInt(delayMinutes, 10) : existing.delay_minutes,
      trainId
    );

    const updated = db.prepare('SELECT * FROM trains WHERE id = ?').get(trainId);
    return res.json({ message: 'Train updated successfully.', train: updated });
  } catch (err) {
    console.error('Error updating train:', err);
    return res.status(500).json({ message: 'Server error updating train.' });
  }
});

// PUT /api/admin/trains/:id/status - Update live status and notify booked passengers
router.put('/trains/:id/status', (req, res) => {
  try {
    const trainId = req.params.id;
    const { status, currentStation, delayMinutes = 0 } = req.body;

    const train = db.prepare('SELECT * FROM trains WHERE id = ?').get(trainId);
    if (!train) {
      return res.status(404).json({ message: 'Train not found.' });
    }

    if (!status) {
      return res.status(400).json({ message: 'Status is required.' });
    }

    const delay = parseInt(delayMinutes, 10) || 0;
    const station = currentStation ? currentStation.trim() : (train.current_station || train.source);

    db.prepare(`
      UPDATE trains 
      SET status = ?, current_station = ?, delay_minutes = ?
      WHERE id = ?
    `).run(status, station, delay, trainId);

    // Notify all passengers with CONFIRMED bookings for this train
    const activeBookings = db.prepare(`
      SELECT DISTINCT user_id, booking_reference 
      FROM bookings 
      WHERE train_id = ? AND status = 'CONFIRMED'
    `).all(trainId);

    const insertNotif = db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
      VALUES (?, ?, ?, 'TRAIN_STATUS', 0, datetime('now'))
    `);

    let statusMsg = `Train ${train.train_number} (${train.train_name}) status updated to '${status}'.`;
    if (delay > 0) {
      statusMsg += ` Currently delayed by ${delay} mins near ${station}.`;
    } else if (station) {
      statusMsg += ` Currently near/at ${station}.`;
    }

    for (const b of activeBookings) {
      insertNotif.run(
        b.user_id,
        `Live Status: ${train.train_number}`,
        `${statusMsg} (Booking Ref: ${b.booking_reference})`
      );
    }

    return res.json({
      message: `Train status updated and ${activeBookings.length} passenger(s) notified.`,
      status,
      currentStation: station,
      delayMinutes: delay
    });
  } catch (err) {
    console.error('Error updating train status:', err);
    return res.status(500).json({ message: 'Server error updating train status.' });
  }
});

// DELETE /api/admin/trains/:id - Delete train
router.delete('/trains/:id', (req, res) => {
  try {
    const trainId = req.params.id;
    const train = db.prepare('SELECT * FROM trains WHERE id = ?').get(trainId);
    if (!train) {
      return res.status(404).json({ message: 'Train not found.' });
    }

    // Check if there are active bookings
    const activeBookingCount = db.prepare(`
      SELECT COUNT(*) as count FROM bookings 
      WHERE train_id = ? AND status = 'CONFIRMED'
    `).get(trainId).count;

    if (activeBookingCount > 0) {
      return res.status(409).json({
        message: `Cannot delete train: There are ${activeBookingCount} active confirmed booking(s) on this train. Please cancel them or mark train cancelled first.`
      });
    }

    db.prepare('DELETE FROM trains WHERE id = ?').run(trainId);
    return res.json({ message: 'Train record deleted successfully.' });
  } catch (err) {
    console.error('Error deleting train:', err);
    return res.status(500).json({ message: 'Server error deleting train.' });
  }
});

// GET /api/admin/bookings - View all bookings across system
router.get('/bookings', (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT 
        b.id,
        b.booking_reference as bookingReference,
        b.user_id as userId,
        u.name as userName,
        u.email as userEmail,
        b.train_id as trainId,
        t.train_number as trainNumber,
        t.train_name as trainName,
        t.source,
        t.destination,
        b.journey_date as journeyDate,
        b.passenger_name as passengerName,
        b.passenger_age as passengerAge,
        b.passenger_gender as passengerGender,
        b.travel_class as travelClass,
        b.seat_count as seatCount,
        b.fare,
        b.status,
        b.created_at as createdAt,
        b.cancelled_at as cancelledAt
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN trains t ON b.train_id = t.id
      ORDER BY b.id DESC
    `).all();

    return res.json(bookings);
  } catch (err) {
    console.error('Error getting admin bookings:', err);
    return res.status(500).json({ message: 'Server error retrieving bookings.' });
  }
});

module.exports = router;
