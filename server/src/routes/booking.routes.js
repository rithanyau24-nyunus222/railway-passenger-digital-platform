const express = require('express');
const router = express.Router();
const { db } = require('../database/db');
const { requireAuth } = require('../middleware/auth');

// POST /api/bookings - Create new ticket booking
router.post('/', requireAuth, (req, res) => {
  try {
    const {
      trainId,
      journeyDate,
      passengerName,
      passengerAge,
      passengerGender,
      travelClass = 'SL',
      seatCount = 1,
      fare
    } = req.body;

    // Field validation
    if (!trainId) {
      return res.status(400).json({ message: 'Train selection is required.' });
    }

    if (!journeyDate || !journeyDate.trim()) {
      return res.status(400).json({ message: 'Journey date is required.' });
    }

    if (!passengerName || !passengerName.trim()) {
      return res.status(400).json({ message: 'Passenger name is required.' });
    }

    const age = parseInt(passengerAge, 10);
    if (isNaN(age) || age < 1 || age > 120) {
      return res.status(400).json({ message: 'Please enter a valid passenger age between 1 and 120.' });
    }

    if (!passengerGender || !passengerGender.trim()) {
      return res.status(400).json({ message: 'Passenger gender is required.' });
    }

    const count = parseInt(seatCount, 10);
    if (isNaN(count) || count < 1) {
      return res.status(400).json({ message: 'Seat count must be at least 1.' });
    }

    // Check train existence
    const train = db.prepare('SELECT * FROM trains WHERE id = ?').get(trainId);
    if (!train) {
      return res.status(404).json({ message: 'Selected train not found.' });
    }

    // Verify seat availability
    if (train.available_seats < count) {
      return res.status(409).json({
        message: `The requested number of seats is not available. Only ${train.available_seats} seat(s) remaining.`
      });
    }

    const unitFare = (fare && Number(fare) > 0) ? Number(fare) : Number(train.fare);
    const totalFare = Number((unitFare * count).toFixed(2));

    // Generate unique PNR reference
    let bookingReference = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      attempts++;
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      bookingReference = `PNR-${randomNum}`;
      const existing = db.prepare('SELECT id FROM bookings WHERE booking_reference = ?').get(bookingReference);
      if (!existing) {
        isUnique = true;
      }
    }

    // Begin database transaction using exec/statements
    db.exec('BEGIN TRANSACTION;');

    try {
      const insertBooking = db.prepare(`
        INSERT INTO bookings (
          booking_reference, user_id, train_id, journey_date,
          passenger_name, passenger_age, passenger_gender, travel_class,
          seat_count, fare, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', datetime('now'))
      `);

      const bookingResult = insertBooking.run(
        bookingReference,
        req.user.id,
        train.id,
        journeyDate.trim(),
        passengerName.trim(),
        age,
        passengerGender.trim(),
        travelClass.trim(),
        count,
        totalFare
      );

      const bookingId = Number(bookingResult.lastInsertRowid);

      // Decrement available seats
      const updateSeats = db.prepare(`
        UPDATE trains 
        SET available_seats = available_seats - ? 
        WHERE id = ? AND available_seats >= ?
      `);
      const seatUpdateRes = updateSeats.run(count, train.id, count);

      if (seatUpdateRes.changes === 0) {
        db.exec('ROLLBACK;');
        return res.status(409).json({ message: 'Seat conflict. Seats were booked by another request. Please try again.' });
      }

      // Create booking notification
      const insertNotification = db.prepare(`
        INSERT INTO notifications (
          user_id, booking_id, title, message, type, is_read, created_at
        ) VALUES (?, ?, ?, ?, 'BOOKING_CONFIRMED', 0, datetime('now'))
      `);

      insertNotification.run(
        req.user.id,
        bookingId,
        `Ticket Confirmed: ${bookingReference}`,
        `Your journey on ${train.train_name} (${train.train_number}) from ${train.source} to ${train.destination} for ${count} passenger(s) in Class ${travelClass} on ${journeyDate} is confirmed. Total Fare: ₹${totalFare}.`
      );

      db.exec('COMMIT;');

      // Fetch newly created booking with details
      const newBooking = db.prepare(`
        SELECT 
          b.id,
          b.booking_reference as bookingReference,
          b.user_id as userId,
          b.train_id as trainId,
          b.journey_date as journeyDate,
          b.passenger_name as passengerName,
          b.passenger_age as passengerAge,
          b.passenger_gender as passengerGender,
          b.travel_class as travelClass,
          b.seat_count as seatCount,
          b.fare,
          b.status,
          b.created_at as createdAt,
          t.train_number as trainNumber,
          t.train_name as trainName,
          t.source,
          t.destination,
          t.departure_time as departureTime,
          t.arrival_time as arrivalTime,
          t.status as trainStatus
        FROM bookings b
        JOIN trains t ON b.train_id = t.id
        WHERE b.id = ?
      `).get(bookingId);

      return res.status(201).json({
        message: 'Ticket booked successfully!',
        booking: newBooking
      });
    } catch (txErr) {
      db.exec('ROLLBACK;');
      throw txErr;
    }
  } catch (err) {
    console.error('Booking error:', err);
    return res.status(500).json({ message: 'Internal server error while processing booking.' });
  }
});

// GET /api/bookings - Get user's bookings
router.get('/', requireAuth, (req, res) => {
  try {
    const bookings = db.prepare(`
      SELECT 
        b.id,
        b.booking_reference as bookingReference,
        b.user_id as userId,
        b.train_id as trainId,
        b.journey_date as journeyDate,
        b.passenger_name as passengerName,
        b.passenger_age as passengerAge,
        b.passenger_gender as passengerGender,
        b.travel_class as travelClass,
        b.seat_count as seatCount,
        b.fare,
        b.status,
        b.created_at as createdAt,
        b.cancelled_at as cancelledAt,
        t.train_number as trainNumber,
        t.train_name as trainName,
        t.source,
        t.destination,
        t.departure_time as departureTime,
        t.arrival_time as arrivalTime,
        t.status as trainStatus,
        t.current_station as currentStation,
        t.delay_minutes as delayMinutes
      FROM bookings b
      JOIN trains t ON b.train_id = t.id
      WHERE b.user_id = ?
      ORDER BY b.id DESC
    `).all(req.user.id);

    return res.json(bookings);
  } catch (err) {
    console.error('Error fetching bookings:', err);
    return res.status(500).json({ message: 'Server error retrieving bookings.' });
  }
});

// GET /api/bookings/:id - Single booking details
router.get('/:id', requireAuth, (req, res) => {
  try {
    const booking = db.prepare(`
      SELECT 
        b.id,
        b.booking_reference as bookingReference,
        b.user_id as userId,
        b.train_id as trainId,
        b.journey_date as journeyDate,
        b.passenger_name as passengerName,
        b.passenger_age as passengerAge,
        b.passenger_gender as passengerGender,
        b.travel_class as travelClass,
        b.seat_count as seatCount,
        b.fare,
        b.status,
        b.created_at as createdAt,
        b.cancelled_at as cancelledAt,
        t.train_number as trainNumber,
        t.train_name as trainName,
        t.source,
        t.destination,
        t.departure_time as departureTime,
        t.arrival_time as arrivalTime,
        t.status as trainStatus,
        t.current_station as currentStation,
        t.delay_minutes as delayMinutes
      FROM bookings b
      JOIN trains t ON b.train_id = t.id
      WHERE b.id = ?
    `).get(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Check authorization: must be owner or admin
    if (booking.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'You do not have permission to view this booking.' });
    }

    return res.json(booking);
  } catch (err) {
    console.error('Error fetching booking by id:', err);
    return res.status(500).json({ message: 'Server error retrieving booking details.' });
  }
});

// POST /api/bookings/:id/cancel - Cancel booking
router.post('/:id/cancel', requireAuth, (req, res) => {
  try {
    const bookingId = req.params.id;

    const booking = db.prepare(`
      SELECT b.*, t.train_name, t.train_number, t.source, t.destination, t.total_seats
      FROM bookings b
      JOIN trains t ON b.train_id = t.id
      WHERE b.id = ?
    `).get(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' });
    }

    // Ownership check
    if (booking.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'You do not have permission to cancel this booking.' });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(409).json({ message: 'This booking is already cancelled.' });
    }

    // Transaction for atomic seat restoration and status update
    db.exec('BEGIN TRANSACTION;');

    try {
      // Update booking status
      const updateBooking = db.prepare(`
        UPDATE bookings 
        SET status = 'CANCELLED', cancelled_at = datetime('now')
        WHERE id = ?
      `);
      updateBooking.run(bookingId);

      // Restore seats (cannot exceed total_seats)
      const restoreSeats = db.prepare(`
        UPDATE trains 
        SET available_seats = MIN(total_seats, available_seats + ?)
        WHERE id = ?
      `);
      restoreSeats.run(booking.seat_count, booking.train_id);

      // Create cancellation notification
      const insertNotification = db.prepare(`
        INSERT INTO notifications (
          user_id, booking_id, title, message, type, is_read, created_at
        ) VALUES (?, ?, ?, ?, 'BOOKING_CANCELLED', 0, datetime('now'))
      `);

      insertNotification.run(
        booking.user_id,
        booking.id,
        `Booking Cancelled: ${booking.booking_reference}`,
        `Your booking ${booking.booking_reference} for ${booking.train_name} (${booking.train_number}) has been cancelled successfully. ${booking.seat_count} seat(s) released.`
      );

      db.exec('COMMIT;');

      const updated = db.prepare(`
        SELECT 
          b.id,
          b.booking_reference as bookingReference,
          b.user_id as userId,
          b.train_id as trainId,
          b.journey_date as journeyDate,
          b.passenger_name as passengerName,
          b.passenger_age as passengerAge,
          b.passenger_gender as passengerGender,
          b.seat_count as seatCount,
          b.fare,
          b.status,
          b.created_at as createdAt,
          b.cancelled_at as cancelledAt,
          t.train_number as trainNumber,
          t.train_name as trainName,
          t.source,
          t.destination
        FROM bookings b
        JOIN trains t ON b.train_id = t.id
        WHERE b.id = ?
      `).get(bookingId);

      return res.json({
        message: 'Booking cancelled successfully. Seats restored.',
        booking: updated
      });
    } catch (txErr) {
      db.exec('ROLLBACK;');
      throw txErr;
    }
  } catch (err) {
    console.error('Cancellation error:', err);
    return res.status(500).json({ message: 'Server error while cancelling booking.' });
  }
});

module.exports = router;
