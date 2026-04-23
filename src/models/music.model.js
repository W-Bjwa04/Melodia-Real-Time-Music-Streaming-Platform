import mongoose from "mongoose";

const musicCommentSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
    },
    { timestamps: true }
);

const musicSchema = new mongoose.Schema({
    uri: {
        type: String,
    },
    title: {
        type: String,
        required: true
    },
    artist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    poster: {
        type: String,
    },
    duration: {
        type: Number,
        default: 0,
    },
    trackNumber: {
        type: Number,
        default: 0,
    },
    genre: {
        type: String,
        default: "",
    },
    likes: {
        type: Number,
        default: 0,
    },
    likedBy: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    playCount: {
        type: Number,
        default: 0,
    },
    comments: [musicCommentSchema],
}, { timestamps: true })


const musicModel = await mongoose.model("Music", musicSchema)


export default musicModel