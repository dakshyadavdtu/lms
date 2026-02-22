import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { serverUrl } from '../App';
import { FaArrowLeftLong } from "react-icons/fa6";
import img from "../assets/empty.jpg"
import Card from "../components/Card.jsx"
import { setSelectedCourseData } from '../redux/courseSlice';
import { setUserData } from '../redux/userSlice';
import { FaLock, FaPlayCircle } from "react-icons/fa";
import { toast } from 'react-toastify';
import { FaStar } from "react-icons/fa6";


function ViewCourse() {
  const user = useSelector(state => state.user.userData)
  const authLoading = useSelector(state => state.user.authLoading)
  const { courseId } = useParams();
  const navigate = useNavigate()
  const { courseData } = useSelector(state => state.course)
  const { userData } = useSelector(state => state.user)
    const [creatorData , setCreatorData] = useState(null)
    const dispatch = useDispatch()
    const [selectedLecture, setSelectedLecture] = useState(null);
    const {lectureData} = useSelector(state=>state.lecture)
    const {selectedCourseData} = useSelector(state=>state.course)
  const [selectedCreatorCourse,setSelectedCreatorCourse] = useState([])
   const [isEnrolled, setIsEnrolled] = useState(false);
   const [rating, setRating] = useState(0);
   const [comment, setComment] = useState("");
   
   
  


  const handleReview = async () => {
    try {
      const result = await axios.post(serverUrl + "/api/review/givereview" , {rating , comment , courseId} , {withCredentials:true})
      toast.success("Review Added")
      console.log(result.data)
      setRating(0)
      setComment("")

    } catch (error) {
      console.log(error)
      toast.error(error.response.data.message)
    }
  }
  

  const ratingFromReviews = (reviews) => {
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) return 0;
    const total = reviews.reduce((sum, r) => sum + (typeof r?.rating === "number" ? r.rating : 0), 0);
    return Number((total / reviews.length).toFixed(1));
  };
  const avgRating = selectedCourseData?.averageRating != null && Number.isFinite(Number(selectedCourseData.averageRating))
    ? Number(selectedCourseData.averageRating)
    : ratingFromReviews(selectedCourseData?.reviews);
  const reviewCount = selectedCourseData?.reviewCount != null && Number.isFinite(Number(selectedCourseData.reviewCount))
    ? Number(selectedCourseData.reviewCount)
    : (Array.isArray(selectedCourseData?.reviews) ? selectedCourseData.reviews.length : 0);

  

  const fetchCourseData = () => {
    courseData.map((item) => {
      if (item._id === courseId) {
        dispatch(setSelectedCourseData(item))
        console.log(selectedCourseData);  
        return null;
      }

    })
  }
  const checkEnrollment = () => {
    const verify = userData?.enrolledCourses?.some(c => {
      const enrolledId = typeof c === 'string' ? c : c._id;
      return enrolledId?.toString() === courseId?.toString();
    });
    console.log("Enrollment verified:", verify);
    if (verify) setIsEnrolled(true);
    // Never set isEnrolled(false) here so optimistic true after payment isn't overwritten by stale userData.
  };

  // 1️⃣ Set selected course from Redux list when available
  useEffect(() => {
    fetchCourseData();
  }, [courseId, courseData]);

  // 2️⃣ On refresh, courseData is empty – fetch course by ID so image, price, name and lectures show
  useEffect(() => {
    if (!courseId) return;
    const alreadyHave = selectedCourseData?._id?.toString() === courseId?.toString();
    if (alreadyHave) return;
    const inList = courseData?.some((c) => c._id?.toString() === courseId?.toString());
    if (inList) return;

    const fetchCourseById = async () => {
      try {
        const res = await axios.get(serverUrl + `/api/course/getcourse/${courseId}`, { withCredentials: true });
        dispatch(setSelectedCourseData(res.data));
      } catch (err) {
        if (err?.response?.status === 401) {
          toast.error("Please log in to view this course.");
          return;
        }
        toast.error(err?.response?.data?.message ?? "Failed to load course.");
      }
    };
    fetchCourseById();
  }, [courseId, courseData, selectedCourseData?._id]);

// 2️⃣ Protected data – re-run when userData (enrolledCourses) or courseId changes
  useEffect(() => {
    if (!userData) return
    checkEnrollment()
  }, [userData, courseId])


    // Fetch creator info once course data is available
  useEffect(() => {
    if (!user || !selectedCourseData?.creator) return
    const getCreator = async () => {
      if (selectedCourseData?.creator) {
        try {
          const result = await axios.post(
            `${serverUrl}/api/course/getcreator`,
            { userId: selectedCourseData.creator },
            { withCredentials: true }
          );
          setCreatorData(result.data);
          console.log(result.data)
        } catch (error) {
          console.error("Error fetching creator:", error);
        }
      }
    };

    getCreator();

    
  }, [selectedCourseData]);


   


  useEffect(() => {
    // if (!user) return
  if (creatorData?._id && courseData.length > 0) {
    const creatorCourses = courseData.filter(
      (course) =>
        course.creator === creatorData._id && course._id !== courseId // Exclude current course
    );
    setSelectedCreatorCourse(creatorCourses);
  
  }
}, [creatorData, courseData]);

 
const handleEnroll = async (courseId, userId) => {
  try {
    // 1. Create Order
    const orderData = await axios.post(serverUrl + "/api/payment/create-order", {
      courseId,
      userId
    } , {withCredentials:true});
    console.log(orderData)

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID, // from .env
      amount: orderData.data.amount,
      currency: "INR",
      name: "Virtual Courses",
      description: "Course Enrollment Payment",
      order_id: orderData.data.id,
      handler: async function (response) {
        try {
          const verifyRes = await axios.post(serverUrl + "/api/payment/verify-payment", {
            ...response,
            courseId,
            userId
          }, { withCredentials: true });
          setIsEnrolled(true);
          toast.success(verifyRes.data.message);
          // Refresh userData so reload and other pages see enrolled state
          const userRes = await axios.get(serverUrl + "/api/user/currentuser", { withCredentials: true });
          dispatch(setUserData(userRes.data));
        } catch (verifyError) {
          toast.error("Payment verification failed.");
          console.error("Verification Error:", verifyError);
        }
      },
    };
    
    const rzp = new window.Razorpay(options)
    rzp.open()

  } catch (err) {
    toast.error("Something went wrong while enrolling.");
    console.error("Enroll Error:", err);
  }
};

  return (
     <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white shadow-md rounded-xl p-6 space-y-6 relative">

        {/* Top Section */}
        <div className="flex flex-col md:flex-row gap-6 ">
             
          {/* Thumbnail */}
          <div className="w-full md:w-1/2">
             <FaArrowLeftLong  className='text-[black] w-[22px] h-[22px] cursor-pointer' onClick={()=>navigate("/")}/>
            {selectedCourseData?.thumbnail ? <img
              src={selectedCourseData?.thumbnail}
              alt="Course Thumbnail"
              className="rounded-xl w-full object-cover"
            /> :  <img
              src={img}
              alt="Course Thumbnail"
              className="rounded-xl  w-full  object-cover"
            /> }
          </div>

          {/* Course Info */}
          <div className="flex-1 space-y-2 mt-[20px]">
            <h1 className="text-2xl font-bold">{selectedCourseData?.title}</h1>
            <p className="text-gray-600">{selectedCourseData?.subTitle}</p>

            {/* Rating & Price */}
            <div className="flex items-start flex-col justify-between">
              <div className="text-yellow-500 font-medium">
                ⭐ {avgRating} <span className="text-gray-500">({reviewCount} reviews)</span>
              </div>
              <div>
                <span className="text-lg font-semibold text-black">
                  {selectedCourseData?.price != null ? `₹${selectedCourseData.price}` : "—"}
                </span>
              </div>
            </div>

            {/* Highlights */}
            <ul className="text-sm text-gray-700 space-y-1 pt-2">
              <li>✅ 10+ hours of video content</li>
              <li>✅ Lifetime access to course materials</li>
              
            </ul>

            {/* Enroll Button – wait for auth before showing enrolled/unenrolled */}
            {authLoading ? (
              <div className="mt-3 px-6 py-2 rounded bg-gray-200 text-gray-500 text-sm">Checking enrollment...</div>
            ) : !isEnrolled ? (
              <button className="bg-[black] text-white px-6 py-2 rounded hover:bg-gray-700 mt-3" onClick={() => handleEnroll(courseId, userData?._id)}>
                Enroll Now
              </button>
            ) : (
              <button className="bg-green-200 text-green-600 px-6 py-2 rounded hover:bg-gray-100 hover:border mt-3" onClick={() => navigate(`/viewlecture/${courseId}`)}>
                Watch Now
              </button>
            )}
          </div>
        </div>

        {/* What You'll Learn */}
        <div>
          <h2 className="text-xl font-semibold mb-2">What You’ll Learn</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>Learn {selectedCourseData?.category} from Beginning</li>
            
          </ul>
        </div>

        {/* Requirements */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Requirements</h2>
          <p className="text-gray-700">Basic programming knowledge is helpful but not required.</p>
        </div>

        {/* Who This Course Is For */}
        <div>
          <h2 className="text-xl font-semibold mb-2">Who This Course is For</h2>
          <p className="text-gray-700">
            Beginners, aspiring developers, and professionals looking to upgrade skills.
          </p>
        </div>

        {/* course lecture – enrollment-driven; wait for auth before locking non-preview */}
        {/* Regression: when isEnrolled=true and lecture.isPreviewFree=false, button must be enabled and playable. */}
        <div className="flex flex-col md:flex-row gap-6">
  {/* Left Side - Curriculum */}
  <div className="bg-white w-full md:w-2/5 p-6 rounded-2xl shadow-lg border border-gray-200">
    <h2 className="text-xl font-bold mb-1 text-gray-800">Course Curriculum</h2>
    <p className="text-sm text-gray-500 mb-4">{selectedCourseData?.lectures?.length} Lectures</p>

    {authLoading ? (
      <p className="text-gray-500 text-sm">Loading curriculum...</p>
    ) : (
    <div className="flex flex-col gap-3">
      {selectedCourseData?.lectures?.map((lecture, index) => {
        const canAccessLecture = isEnrolled || lecture.isPreviewFree;
        return (
          <button
            key={index}
            disabled={!canAccessLecture}
            onClick={() => {
              if (canAccessLecture) setSelectedLecture(lecture);
            }}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all duration-200 text-left ${
              canAccessLecture
                ? "hover:bg-gray-100 cursor-pointer border-gray-300"
                : "cursor-not-allowed opacity-60 border-gray-200"
            } ${
              selectedLecture?.lectureTitle === lecture.lectureTitle
                ? "bg-gray-100 border-gray-400"
                : ""
            }`}
          >
            <span className="text-lg text-gray-700">
              {canAccessLecture ? <FaPlayCircle /> : <FaLock />}
            </span>
            <span className="text-sm font-medium text-gray-800">
              {lecture.lectureTitle}
            </span>
          </button>
        );
      })}
    </div>
    )}
  </div>

  {/* Right Side - Video + Info */}
  <div className="bg-white w-full md:w-3/5 p-6 rounded-2xl shadow-lg border border-gray-200">
    <div className="aspect-video w-full rounded-lg overflow-hidden mb-4 bg-black flex items-center justify-center">
      {selectedLecture?.videoUrl ? (
        <video
          src={selectedLecture.videoUrl}
          controls
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-white text-sm">
          {isEnrolled ? "Select a lecture to watch" : "Select a preview lecture to watch"}
        </span>
      )}
    </div>

    <h3 className="text-lg font-semibold text-gray-900 mb-1">
      {selectedLecture?.lectureTitle || "Lecture Title"}
    </h3>
    <p className="text-gray-600 text-sm">
      {selectedCourseData?.title}
    </p>
  </div>
</div>
<div className="mt-8 border-t pt-6">
    <h2 className="text-xl font-semibold mb-2">Write a Review</h2>
    <div className="mb-4">
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
         
            <FaStar  key={star}
            onClick={() => setRating(star)} className={star <= rating ? "fill-yellow-500" : "fill-gray-300"} />
         
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write your comment here..."
        className="w-full border border-gray-300 rounded-lg p-2"
        rows="3"
      />
      <button
        
        className="bg-black text-white mt-3 px-4 py-2 rounded hover:bg-gray-800" onClick={handleReview}
      >
        Submit Review
      </button>
    </div>

        {/* Instructor Info */}
        <div className="flex items-center gap-4 pt-4 border-t ">
          {creatorData?.photoUrl ?<img
            src={creatorData?.photoUrl}
            alt="Instructor"
            className="w-16 h-16 rounded-full object-cover"
          />: <img
            src={img}
            alt="Instructor"
            className="w-16 h-16 rounded-full object-cover"
          />
          }
          <div>
            <h3 className="text-lg font-semibold">{creatorData?.name}</h3>
            <p className="md:text-sm text-gray-600 text-[10px] ">{creatorData?.description}</p>
            <p className="md:text-sm text-gray-600 text-[10px] ">{creatorData?.email}</p>
            
          </div>
        </div>
        <div>
          <p className='text-xl font-semibold mb-2'>Other Published Courses by the Educator -</p>
        <div className='w-full transition-all duration-300 py-[20px]   flex items-start justify-center lg:justify-start flex-wrap gap-6 lg:px-[80px] '>
          
            {
                selectedCreatorCourse?.map((item,index)=>(
                    <Card key={index} thumbnail={item.thumbnail} title={item.title} id={item._id} price={item.price} category={item.category}/>
                ))
            }
        </div>
      </div>
    </div>
    </div>
    </div>
  )
}

export default ViewCourse
