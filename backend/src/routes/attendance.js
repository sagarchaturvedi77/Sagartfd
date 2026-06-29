const express = require('express');
const router = express.Router();
const { haversineDistance } = require('../utils/haversine');

// Expect environment variables set on Render:
// OFFICE_LAT, OFFICE_LON, OFFICE_RADIUS_METERS (defaults to 50)

const OFFICE_LAT = parseFloat(process.env.OFFICE_LAT || '23.1985917');
const OFFICE_LON = parseFloat(process.env.OFFICE_LON || '77.08808');
const OFFICE_RADIUS_METERS = parseFloat(process.env.OFFICE_RADIUS_METERS || '50');

// Assumptions: you have an `auth` middleware that sets req.user = { id, role, ... }
// and a `db` module for DB access. Adapt the DB calls to match your stack (knex/sequelize/etc.).

router.post('/punch', async (req, res) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { type, lat, lon, timestamp } = req.body;
    if (!type || (type !== 'in' && type !== 'out')) return res.status(400).json({ error: 'Invalid type' });
    if (typeof lat !== 'number' || typeof lon !== 'number') return res.status(400).json({ error: 'Missing coordinates' });

    const dist = haversineDistance(lat, lon, OFFICE_LAT, OFFICE_LON);
    if (dist > OFFICE_RADIUS_METERS) {
      return res.status(400).json({ error: 'Outside allowed radius', distance_meters: Math.round(dist) });
    }

    const ts = timestamp ? new Date(timestamp) : new Date();

    // Example DB logic (replace with your DB layer):
    const db = require('../db'); // ensure you have a db module

    if (type === 'in') {
      // Create an attendance row with punch_in
      const insert = await db('attendance').insert({ user_id: user.id, punch_in_time: ts, punch_in_lat: lat, punch_in_lon: lon }).returning('*');
      return res.json({ ok: true, attendance: insert[0] });
    } else {
      // Punch out: find today's open attendance
      const todayStart = new Date();
      todayStart.setHours(0,0,0,0);
      const open = await db('attendance').where('user_id', user.id).andWhere('punch_in_time', '>=', todayStart).andWhere('punch_out_time', null).first();
      if (!open) return res.status(400).json({ error: 'No open punch-in found for today' });
      const update = await db('attendance').where('id', open.id).update({ punch_out_time: ts, punch_out_lat: lat, punch_out_lon: lon }).returning('*');
      return res.json({ ok: true, attendance: update[0] });
    }

  } catch (err) {
    console.error('Punch error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
