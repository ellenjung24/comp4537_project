require("dotenv").config();
const http = require("http");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const express = require("express");
// const cors = require("cors");
const jwt = require("jsonwebtoken");
// const app = express();

// Create database sql
// CREATE TABLE new_users (
//   userid INT NOT NULL AUTO_INCREMENT,
//   username VARCHAR(255) NOT NULL,
//   password VARCHAR(255) NOT NULL,
//   role VARCHAR(255) NOT NULL,
//   email VARCHAR(255) NOT NULL,
//   token VARCHAR(255) NOT NULL,
//   api_calls INT NOT NULL DEFAULT 0,
//   PRIMARY KEY (userid)
// );

// app.use(cors());

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to database");
});

// function checkApiCalls(req, res, next) {
//   const authHeader = req.headers.authorization;
//   if (authHeader) {
//     const token = authHeader.split(" ")[1];
//     jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//       if (err) {
//         return res.sendStatus(403);
//       }

//       let query = `SELECT api_calls FROM users WHERE username = ?`;
//       db.query(query, [user.username], (err, results) => {
//         if (err) throw err;
//         if (results[0].api_calls >= 20 && user.role !== "admin") {
//           res.writeHead(429, {
//             "Content-Type": "application/json",
//           });
//           res.end(JSON.stringify({ message: "API usage limit reached" }));
//         } else {
//           next();
//         }
//       });
//     });
//   } else {
//     next();
//   }
// }

const server = http.createServer((req, res) => {
  console.log("Request origin:", req.headers.origin);
  res.setHeader("Access-Control-Allow-Origin", "http://127.0.0.1:5500");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/register" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const { username, password, role, email } = JSON.parse(body);

        // Generate hash
        bcrypt.hash(password, 10, (err, hash) => {
          if (err) throw err;

          // Save into database
          let query = `INSERT INTO users (username, password, role, email) VALUES (?, ?, ?, ?)`;
          db.query(query, [username, hash, role, email], (err, result) => {
            if (err) throw err;
            res.writeHead(200, {
              "Content-Type": "application/json",
            });
            res.end(JSON.stringify({ message: "Registration successful" }));
          });
        });
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ message: "Invalid request" }));
      }
    });
  }

  if (req.url === "/login" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const { username, password } = JSON.parse(body); // Change usernameOrEmail to username

        let query = `SELECT * FROM users WHERE username = ? OR email = ?`;
        db.query(query, [username, username], (err, results) => {
          // Here we are checking if the username or email matches the user input
          if (err) throw err;
          if (results.length > 0) {
            // Compare password with hash
            bcrypt.compare(password, results[0].password, (err, isMatch) => {
              if (err) throw err;
              if (isMatch) {
                const userRole = results[0].role; // Extract the role of the user
                // Generate JWT
                let token = jwt.sign(
                  { username, role: userRole }, // Payload
                  process.env.JWT_SECRET, // Secret key
                  {
                    expiresIn: "1h",
                  }
                );
                res.writeHead(200, {
                  "Content-Type": "application/json",
                });
                res.end(
                  JSON.stringify({
                    message: `Login successful, role: ${userRole}`,
                    username,
                    role: userRole,
                    token,
                  })
                );
              } else {
                res.writeHead(401, {
                  "Content-Type": "application/json",
                });
                res.end(JSON.stringify({ message: "Invalid credentials" }));
              }
            });
          } else {
            res.writeHead(401, {
              "Content-Type": "application/json",
            });
            res.end(JSON.stringify({ message: "Invalid credentials" }));
          }
        });
      } catch (e) {
        res.writeHead(400, {
          "Content-Type": "application/json",
        });
        res.end(JSON.stringify({ message: "Invalid request" }));
      }
    });
  }

  if (req.url === "/api/admin/stats" && req.method === "GET") {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
          res.writeHead(403, {
            "Content-Type": "application/json",
          });
          res.end(JSON.stringify({ message: "Unauthorized" }));
          return;
        }
        if (user.role !== "admin") {
          res.writeHead(403, {
            "Content-Type": "application/json",
          });
          res.end(JSON.stringify({ message: "Forbidden" }));
          return;
        }
        let query = `SELECT userid, COUNT(*) as count FROM api_calls GROUP BY userid`;
        db.query(query, (err, results) => {
          if (err) throw err;
          res.writeHead(200, {
            "Content-Type": "application/json",
          });
          res.end(JSON.stringify(results));
        });
      });
    } else {
      res.writeHead(403, {
        "Content-Type": "application/json",
      });
      res.end(JSON.stringify({ message: "Unauthorized" }));
    }
  }

  function generatePassword() {
    const length = 8;
    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let retVal = "";
    for (let i = 0; i < length; i++) {
      retVal += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return retVal;
  }

  if (req.url === "/reset" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        const { username } = JSON.parse(body);
        const newPassword = generatePassword();
        // Hash the new password
        bcrypt.hash(newPassword, 10, (err, hash) => {
          if (err) throw err;
          // Update password hash in database
          let query = `UPDATE users SET token = ? WHERE username = ? OR email = ?`;
          db.query(query, [hash, username], (err, results) => {
            if (err) throw err;
            if (results.affectedRows > 0) {
              res.writeHead(200, {
                "Content-Type": "application/json",
              });
              res.end(
                JSON.stringify({
                  message: "Password reset successful",
                  newPassword: newPassword,
                })
              );
            } else {
              res.writeHead(400, {
                "Content-Type": "application/json",
              });
              res.end(JSON.stringify({ message: "User not found" }));
            }
          });
        });
      } catch (e) {
        res.writeHead(400, {
          "Content-Type": "application/json",
        });
        res.end(JSON.stringify({ message: "Invalid request" }));
      }
    });
  }
});

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
