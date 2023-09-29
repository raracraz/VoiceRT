const express = require('express');
const indexRouter = require('./routes/index');
const http = require('http');
const { setupWebSocket } = require('./websocket');

const app = express();
const server = http.createServer(app);

// Setup WebSocket
setupWebSocket(server);

app.use('/', indexRouter);

// Start the server
const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
