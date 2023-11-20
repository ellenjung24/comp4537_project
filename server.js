const http = require("http");
let usersData = [{ username: "john", password: "123", role: "user" }]; // To store regular user data in memory
let adminData = { username: "admin", password: "111" }; // Admin credentials

const server = http.createServer((req, res) => {
  console.log("Request origin:", req.headers.origin);
  res.setHeader("Access-Control-Allow-Origin", "https://brave-ground-056b09a1e.4.azurestaticapps.net");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
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
        const { username, password, role } = JSON.parse(body);
        if (role === "admin") {
          res.writeHead(403);
          res.end(JSON.stringify({ message: "Cannot register as admin" }));
        } else {
          usersData.push({ username, password, role });
          res.writeHead(200, {
            "Content-Type": "application/json",
          });
          res.end(JSON.stringify({ message: "Registration successful" }));
        }
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
        const { username, password } = JSON.parse(body);
        if (
          username === adminData.username &&
          password === adminData.password
        ) {
          res.writeHead(200, {
            "Content-Type": "application/json",
          });
          res.end(
            JSON.stringify({ message: "Admin login successful", role: "admin" })
          );
        } else {
          const user = usersData.find(
            (user) => user.username === username && user.password === password
          );
          if (user) {
            res.writeHead(200, {
              "Content-Type": "application/json",
            });
            res.end(
              JSON.stringify({ message: "Login successful", role: "user" })
            );
          } else {
            res.writeHead(401, {
              "Content-Type": "application/json",
            });
            res.end(JSON.stringify({ message: "Invalid credentials" }));
          }
        }
      } catch (e) {
        res.writeHead(400, {
          "Content-Type": "application/json",
        });
        res.end(JSON.stringify({ message: "Invalid request" }));
      }
    });
  }

  // if (req.url === '/something' && req.method === 'GET') {
  //   res.writeHead(200, {
  //     'Content-Type': 'application/json',
  //   });
  //   res.end(JSON.stringify({ message: 'Here is something' }));
  // }

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
        const user = usersData.find((user) => user.username === username);
        if (user) {
          const newPassword = generatePassword();
          user.password = newPassword;
          res.writeHead(200, {
            "Content-Type": "application/json",
          });
          res.end(
            JSON.stringify({
              message: "Password reset successful",
              newPassword: newPassword, // Ensure the newPassword field is being added correctly
            })
          );
        } else {
          res.writeHead(400, {
            "Content-Type": "application/json",
          });
          res.end(JSON.stringify({ message: "User not found" }));
        }
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
