// {
//     "_id": "uniqueUserId",
//     "name": "John Doe",
//     "email": "john@gmail.com",
//     "phone": "989092****",
//     "password": "hashed_password",
//     "role": "Member", // or "Manager"
//     "createdAt": "2025-01-19T12:00:00Z",
//     "updatedAt": "2025-01-19T12:00:00Z"
// }
const mongoose = require("mongoose");

const userSchema = mongoose.model("Users", {
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    phone:{
        type: String,
        required: true,
    },
    password:{
        type: String,
        required: true,
    },
    role:{
        type: String,
        required: true,
    },
    created_at:{
        type: Date,
        default: Date.now,
    },
    updated_at:{
        type: Date,
        default: Date.now,
    },
});



module.exports = userSchema;