import bcrypt from 'bcrypt';

const hash = '$10$zR9jD7ON6Z/e4kJCeFfQYuUZMkA.4k9OcU.cuOAnmdN7qz2tMyXvO'; // Stored hash
const plaintextPassword = 'admin123'; // Suspected plaintext password

bcrypt.compare(plaintextPassword, hash, (err, result) => {
    if (err) {
        console.error('Error comparing password:', err);
    } else {
        console.log('Password match:', result); // true if passwords match
    }
});
bcrypt.hash(plaintextPassword, 10, (err, hash) => {
    if (err) {
        console.error('Error hashing password:', err);
    } else {
        console.log('Generated hash:', hash);
    }
});