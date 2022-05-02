const express = require('express');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/auth', require('./routes/auth.router.js'));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('Server is running on port 3001');
});
