 import {User} from "../models/user.model.js";
 import bcrypt from "bcryptjs";
 import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

 export const register =async(req,res)=>{
    try {
        const {fullname,email,phoneNumber,password,role,location}=req.body;
        if(!fullname ||!email|| !phoneNumber ||!password ||!role||!location){
            return res.status(400).json({
                message:"something is missing",
                success:false
            });
        }
        const file =req.file; 
        let cloudResponse;
        if(file){
            const fileUri =getDataUri(file);
             cloudResponse =await cloudinary.uploader.upload(fileUri.content);
        } 
        const user =await User.findOne({email});
        if(user){
            return res.status(400).json({
                message:"user already exist with given email",
                success:false,
            });
        }
       
        const hashedPassword =await bcrypt.hash(password,10);

        await User.create({
            fullname,
            email,
            phoneNumber,
            password:hashedPassword,
            role, 
            location,
            profile:{
                profilePhoto:file?cloudResponse.secure_url:"", 
            }
        })

        return res.status(201).json({
            message:"Account created successfully.",
             success:true
        })
    } catch (error) {
         console.log(error);
    }
 }

 export const login =async (req,res)=>{
    try {
        const {email,password,role}=req.body;
        if(!password ||!role){
            return res.status(400).json({
                message:"something is missing",
                success:false
            });
        }
      let user =await User.findOne({email});
      if(!user){
        return res.status(400).json({
            message:"Incorrect email",
            success:false,
        });
      }
      const isPasswordMatch = await bcrypt.compare(password,user.password);
      if(!isPasswordMatch){
        return res.status(400).json({
            message:"Incorrect Password",
            success:false,
        });
      }
      //checking role is correct or not 
      if(role!=user.role){
        return res.status(400).json({
            message:"Account doesn't exist with current role",
            success:false,
        });
      }  

      const tokenData={
           userId:user._id
      }
      const token =await jwt.sign(tokenData,process.env.SECRET_KEY,{expiresIn:'1d'});
      user={
        _id:user._id,
        fullname:user.fullname,
        email:user.email,
        phoneNumber:user.phoneNumber,
        role:user.role,
        GPA:user.GPA,
        course:user.course,
        location:user.location,
        special_c:user.special_c,
        family_i:user.family_i,
        profile:user.profile
      }

      return res.status(200).cookie("token",token,{maxAge:1*24*60*60*1000, httpsOnly:true,sameSite:'strict'}).json({
          message:`Welcome back ${user.fullname}`,
          user,
          success:true
      })
      
    } catch (error) {
        console.log(error);
    }
 }

 export const logout =async (req,res)=>{
      try{
        return res.status(200).cookie("token","",{maxAge:0}).json({
            message:"loged out successfully",
            success:true
        });
      }catch(error){
        console.log(error);
      }
 }

 export const updateProfile =async(req,res) =>{
        try {
            const {fullname,email,phoneNumber,bio,special_c,GPA,location,course,family_i}=req.body;
           
            const userId =req.id;  // middleware authentication
            let user =await User.findById(userId);
            
            if(!user){
                return  res.status(400).json({
                    message:"user not found",
                    success:false
                });
            } 
            if(fullname) user.fullname=fullname
            if(email)  user.email=email
            if(phoneNumber)user.phoneNumber=phoneNumber
            if(bio) user.profile.bio=bio
            if(GPA)user.GPA=GPA
            if(location) user.location=location
            if(course)user.course=course
            if(family_i) user.family_i=family_i

            let specialcat;
            if(special_c){ 
                specialcat = special_c.split(","); 
                user.special_c =specialcat;
            }
            
            await user.save();
            user={ 
                _id:user._id,
                fullname:user.fullname,
                email:user.email,
                phoneNumber:user.phoneNumber,
                role:user.role,
                profile:user.profile,
                GPA:user.GPA,
                location:user.location,
                course:user.course,
                family_i:user.family_i,
                special_c:user.special_c
              }
            
            return res.status(200).json({
                message:"Profile updated successfully.",
                user,
                success:true
            })
        } catch (error) {
            console.log(error);
        }
 }