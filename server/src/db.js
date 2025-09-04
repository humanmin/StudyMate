// C:\Users\minjin\KMJ\server\src\db.js
require('dotenv').config();   // ★ 추가

const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

async function query(sql, params) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

module.exports = { pool, query };
