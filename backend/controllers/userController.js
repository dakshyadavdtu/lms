import uploadOnCloudinary from "../configs/cloudinary.js";
import User from "../models/userModel.js";

export const getCurrentUser = async (req,res) => {
    try {
        const user = await User.findById(req.userId).select("-password").populate("enrolledCourses")
         if(!user){
            return res.status(400).json({message:"user does not found"})
        }
        return res.status(200).json(user)
    } catch (error) {
        console.log(error);
        return res.status(400).json({message:"get current user error"})
    }
}

export const UpdateProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { name, description } = req.body;
        const updateFields = {};
        if (name != null && name !== '') updateFields.name = name;
        if (description != null) updateFields.description = description;
        if (req.file) {
            const photoUrl = await uploadOnCloudinary(req.file.path);
            if (photoUrl) updateFields.photoUrl = photoUrl;
        }
        const user = await User.findByIdAndUpdate(
            userId,
            updateFields,
            { new: true, runValidators: true }
        ).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json(user);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: `Update Profile Error ${error?.message ?? error}` });
    }
};
