const bcrypt = require('bcryptjs');

const hashPassword = (raw) => bcrypt.hash(raw, 10);
const comparePassword = (raw, hash) => bcrypt.compare(raw, hash);

module.exports = { hashPassword, comparePassword };
