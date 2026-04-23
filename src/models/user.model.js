import mongoose from "mongoose";
import bcrypt from "bcryptjs";



const userSchema = new mongoose.Schema({

    name:{
        type: String,
        required: true
    },

    username: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        required: true,
        select: false,
    },

    role: {
        type: String,
        enum: ["listener", "artist"],
        default: "listener"
    }, 
    profilePicture: {
        type: String,
    },
    bio: {
        type: String,
        default: "",
    },
    notificationsEnabled: {
        type: Boolean,
        default: true,
    }
})

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};


const userModel = mongoose.model("User", userSchema)

export default userModel 