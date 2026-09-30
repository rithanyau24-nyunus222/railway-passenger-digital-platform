// Comprehensive End-to-End Functional Test Suite for Railway Passenger Digital Platform
const assert = require('assert');

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Railway Passenger Platform End-to-End Test Suite...\n');
  let passengerToken = '';
  let adminToken = '';
  let testBookingId = null;
  let testTrainId = null;
  let initialSeats = 0;

  // 1. Health Check
  console.log('1. Testing Health Endpoint: GET /api/health');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  assert.strictEqual(healthRes.status, 200);
  assert.strictEqual(healthData.status, 'ok');
  console.log('   ✅ Health endpoint OK:', healthData.service);

  // 2. Passenger Authentication
  console.log('\n2. Testing Passenger Login: POST /api/auth/login');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'passenger@example.com', password: 'DemoPassword123' })
  });
  const loginData = await loginRes.json();
  assert.strictEqual(loginRes.status, 200);
  assert.ok(loginData.token, 'Token must be present');
  assert.strictEqual(loginData.user.role, 'PASSENGER');
  passengerToken = loginData.token;
  console.log('   ✅ Passenger logged in successfully as:', loginData.user.name);

  // 3. Admin Authentication
  console.log('\n3. Testing Admin Login: POST /api/auth/login');
  const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'AdminPassword123' })
  });
  const adminData = await adminLoginRes.json();
  assert.strictEqual(adminLoginRes.status, 200);
  assert.strictEqual(adminData.user.role, 'ADMIN');
  adminToken = adminData.token;
  console.log('   ✅ Admin logged in successfully as:', adminData.user.name);

  // 4. Role Authorization: Passenger trying to access Admin API
  console.log('\n4. Testing Role Guard: Passenger accessing Admin API');
  const unauthorizedRes = await fetch(`${BASE_URL}/admin/stats`, {
    headers: { 'Authorization': `Bearer ${passengerToken}` }
  });
  assert.strictEqual(unauthorizedRes.status, 403);
  console.log('   ✅ 403 Forbidden correctly returned for unauthorized role.');

  // 5. Train Search
  console.log('\n5. Testing Train Search: GET /api/trains/search?source=New Delhi&destination=Mumbai Central');
  const searchRes = await fetch(`${BASE_URL}/trains/search?source=New%20Delhi&destination=Mumbai%20Central`, {
    headers: { 'Authorization': `Bearer ${passengerToken}` }
  });
  const trains = await searchRes.json();
  assert.strictEqual(searchRes.status, 200);
  assert.ok(Array.isArray(trains));
  assert.ok(trains.length >= 1, 'Should find authentic corridor trains');
  testTrainId = trains[0].trainId;
  initialSeats = trains[0].availableSeats;
  console.log(`   ✅ Search successful. Found ${trains.length} trains. Selected ${trains[0].trainName} (${initialSeats} seats available)`);

  // 6. Ticket Booking (Reserve 2 seats)
  console.log('\n6. Testing Ticket Booking: POST /api/bookings');
  const bookSeats = 2;
  const bookRes = await fetch(`${BASE_URL}/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${passengerToken}`
    },
    body: JSON.stringify({
      trainId: testTrainId,
      journeyDate: trains[0].journeyDate,
      passengerName: 'Priyadharshini M',
      passengerAge: 25,
      passengerGender: 'Female',
      travelClass: '3A',
      fare: 950,
      seatCount: bookSeats
    })
  });
  const bookData = await bookRes.json();
  assert.strictEqual(bookRes.status, 201);
  assert.ok(bookData.booking.bookingReference.startsWith('PNR-'));
  assert.strictEqual(bookData.booking.seatCount, 2);
  testBookingId = bookData.booking.id;
  console.log(`   ✅ Ticket Booked! PNR: ${bookData.booking.bookingReference}, Total Fare: ₹${bookData.booking.fare}`);

  // 7. Verify Seat Decrement
  console.log('\n7. Verifying Seat Availability Decrement');
  const trainCheckRes = await fetch(`${BASE_URL}/trains/${testTrainId}`, {
    headers: { 'Authorization': `Bearer ${passengerToken}` }
  });
  const updatedTrain = await trainCheckRes.json();
  assert.strictEqual(updatedTrain.availableSeats, initialSeats - bookSeats);
  console.log(`   ✅ Seat count verified: decremented from ${initialSeats} to ${updatedTrain.availableSeats}`);

  // 8. Verify Journey Notification Creation
  console.log('\n8. Testing Notifications: GET /api/notifications');
  const notifRes = await fetch(`${BASE_URL}/notifications`, {
    headers: { 'Authorization': `Bearer ${passengerToken}` }
  });
  const notifData = await notifRes.json();
  assert.strictEqual(notifRes.status, 200);
  const bookingNotif = notifData.notifications.find(n => n.type === 'BOOKING_CONFIRMED');
  assert.ok(bookingNotif, 'Booking confirmation notification should be present');
  console.log(`   ✅ Notification found: "${bookingNotif.title}"`);

  // 9. Live Train Status
  console.log('\n9. Testing Live Train Status: GET /api/trains/:id/status');
  const statusRes = await fetch(`${BASE_URL}/trains/${testTrainId}/status`, {
    headers: { 'Authorization': `Bearer ${passengerToken}` }
  });
  const statusData = await statusRes.json();
  assert.strictEqual(statusRes.status, 200);
  assert.ok(statusData.routeStations.length >= 3, 'Must have intermediate stations');
  console.log(`   ✅ Live Status: ${statusData.trainName} is '${statusData.status}', Current Position: ${statusData.currentStation}`);

  // 10. Ticket Cancellation & Seat Restoration
  console.log(`\n10. Testing Ticket Cancellation: POST /api/bookings/${testBookingId}/cancel`);
  const cancelRes = await fetch(`${BASE_URL}/bookings/${testBookingId}/cancel`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${passengerToken}` }
  });
  const cancelData = await cancelRes.json();
  assert.strictEqual(cancelRes.status, 200);
  assert.strictEqual(cancelData.booking.status, 'CANCELLED');
  console.log('   ✅ Booking Cancelled. Status updated to CANCELLED.');

  // Verify seat restoration
  const trainRestoredRes = await fetch(`${BASE_URL}/trains/${testTrainId}`, {
    headers: { 'Authorization': `Bearer ${passengerToken}` }
  });
  const restoredTrain = await trainRestoredRes.json();
  assert.strictEqual(restoredTrain.availableSeats, initialSeats);
  console.log(`   ✅ Seats successfully restored back to ${restoredTrain.availableSeats}!`);

  // 11. Admin Operations: Update Train Status & Broadcast Notification
  console.log('\n11. Testing Admin Status Update: PUT /api/admin/trains/:id/status');
  const adminUpdateRes = await fetch(`${BASE_URL}/admin/trains/${testTrainId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      status: 'On Time',
      currentStation: 'Midway Junction',
      delayMinutes: 0
    })
  });
  const adminUpdateData = await adminUpdateRes.json();
  assert.strictEqual(adminUpdateRes.status, 200);
  console.log('   ✅ Train status updated by Administrator:', adminUpdateData.message);

  // 12. Admin Metrics
  console.log('\n12. Testing Admin Stats: GET /api/admin/stats');
  const statsRes = await fetch(`${BASE_URL}/admin/stats`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const statsData = await statsRes.json();
  assert.strictEqual(statsRes.status, 200);
  assert.ok(statsData.totalTrains >= 10);
  assert.ok(statsData.totalBookings >= 1);
  assert.ok(statsData.cancelledBookings >= 1);
  console.log(`   ✅ Admin Stats Verified: ${statsData.totalTrains} Trains, ${statsData.totalBookings} Total Bookings, ${statsData.cancelledBookings} Cancelled Bookings`);

  console.log('\n=======================================================');
  console.log('🎉 ALL 12 END-TO-END SPECIFICATION TESTS PASSED (100%)!');
  console.log('=======================================================\n');
}

runTests().catch(err => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
