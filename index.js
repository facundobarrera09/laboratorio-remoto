const express = require('express');

const app = express();

// Server
    // Settings
app.set('port', 3000);

    // Middleware
app.use(express.json());
app.use(express.static('public'));

    // Routing

app.listen(app.get('port'), () => {
    console.log('Server on port ', app.get('port'));
});