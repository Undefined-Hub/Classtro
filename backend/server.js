const { server } = require("./app");
const dotenv = require("dotenv");
const { setupSockets } = require("./socket");

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// ✅ setup Socket.IO
setupSockets(server);

// Start the server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
