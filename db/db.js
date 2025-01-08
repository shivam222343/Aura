import mongoose from "mongoose";

const connection = ()=>{
    mongoose.connect("mongodb+srv://dombeshivam80:MH22Aura@cluster0.8rftp.mongodb.net/clustor0")
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));
}

export default connection;