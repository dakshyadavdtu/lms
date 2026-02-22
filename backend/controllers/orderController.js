import Course from "../models/courseModel.js";
import razorpay from 'razorpay'
import User from "../models/userModel.js";
import crypto from "crypto"
import dotenv from "dotenv"
dotenv.config()
const razorpayInstance = new razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_SECRET,
})

export const createOrder = async (req, res) => {
  try {
    const { courseId } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const options = {
      amount: course.price * 100, // in paisa
      currency: 'INR',
      receipt: `${courseId}.toString()`,
    };

    const order = await razorpayInstance.orders.create(options);
    return res.status(200).json(order);
  } catch (err) {
    console.log(err)
    return res.status(500).json({ message: `Order creation failed ${err}` });

  }
};



export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId, userId } = req.body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !courseId || !userId) {
      return res.status(400).json({ 
        message: "Missing required fields: razorpay_order_id, razorpay_payment_id, razorpay_signature, courseId, userId" 
      });
    }

    // Verify Razorpay signature using HMAC SHA256
    const secret = process.env.RAZORPAY_SECRET;
    if (!secret) {
      console.error("RAZORPAY_SECRET not configured");
      return res.status(500).json({ message: "Payment verification configuration error" });
    }

    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error("Signature verification failed", { 
        expected: generatedSignature, 
        received: razorpay_signature 
      });
      return res.status(400).json({ message: "Payment verification failed: invalid signature" });
    }

    // Verify order status with Razorpay API
    let orderInfo;
    try {
      orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);
    } catch (razorpayError) {
      console.error("Razorpay API error:", razorpayError);
      return res.status(400).json({ message: "Invalid order ID or Razorpay API error" });
    }

    if (orderInfo.status !== 'paid') {
      return res.status(400).json({ message: `Payment not completed. Order status: ${orderInfo.status}` });
    }

    // Verify user and course exist before enrollment
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Only enroll after successful signature verification
    if (!user.enrolledCourses.includes(courseId)) {
      user.enrolledCourses.push(courseId);
      await user.save();
    }

    if (!course.enrolledStudents.includes(userId)) {
      course.enrolledStudents.push(userId);
      await course.save();
    }

    return res.status(200).json({ 
      message: "Payment verified and enrollment successful",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id
    });

  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({ 
      message: "Internal server error during payment verification",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
