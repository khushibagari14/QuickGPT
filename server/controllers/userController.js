import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

// generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" })
}

// API REGISTER TO USER
export const registerUser = async (req, res) => {
 
    const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.json({
        success: false,
        message: "User already exists",
      })
    }
    const user = await User.create({name,email, password})

    const token = generateToken(user._id);
    res.json({
      success: true,
      token
    })
  } catch (error) {
    return res.json({
      success: false,
      message: error.message,
    })
  }
}

// API TO LOGIN
export const loginUser = async (req, res) => {
  
    const { email, password } = req.body;
  try{
    const user = await User.findOne({email})
   if(user){
    const isMatch = await bcrypt.compare(password, user.password)

    if(isMatch){
      const token = generateToken(user._id);
      return res.json({
        success:true,
        token
      })
    }
   }
   return res.json({success:false, message:"Invalid email or password"})

   
  } catch (error) {
    return res.json({
      success: false,
      message: error.message,
    })
  }
}

// API TO GET USER DATA
export const getUser = async (req, res) => {
  try{
    const user = req.user;
    return res.json({success:true, user})
  } catch (error){
    return res.json({success: false, message: error.message})
  }
}

//API to get published images
export const getPublishedImages = async (req, res) => {
  try {
    const publishedImagesMessages = await Chat.aggregate([
      { $unwind : "$messages" },
      { 
        $match: {
          "messages.isImage": true,
          "messages.isPublished": true
        }
      },
      {
         $project: {
           _id: "$messages.content",
           userName : "$userNamme"
         }
      }
    ])

    res.json({success: true, images: publishedImagesMessages.reverse()})

  } catch (error){
    return res.json({success: false, message: error.message});

  }
}
 