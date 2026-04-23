import mongoose from "mongoose";

const albumSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    genre: {
        type: String,
        default: "",
    },
    releaseYear: {
        type: Number,
        default: null,
    },
    artist: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    uploadedDate: {
        type: Date,
        default: Date.now,
    },
    tracks: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Music",
        },
    ],

    albumCover: {
        type: String,
    }
});

const albumModel = await mongoose.model("Album", albumSchema);

export default albumModel;