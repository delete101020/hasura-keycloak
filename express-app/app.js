const express = require('express');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', require('./routes/auth.router.js'));

// TODO: move `3001` to env variable
app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
