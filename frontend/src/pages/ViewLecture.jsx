import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPlayCircle } from 'react-icons/fa';
import { FaArrowLeftLong } from "react-icons/fa6";
import axios from 'axios';
import { serverUrl } from '../App';

function ViewLecture() {
  const { courseId } = useParams();
  const { courseData } = useSelector((state) => state.course);
  const navigate = useNavigate();
  const selectedCourse = courseData?.find((course) => course._id === courseId);

  const [selectedLecture, setSelectedLecture] = useState(
    selectedCourse?.lectures?.[0] || null
  );
  const [creatorData, setCreatorData] = useState(null);

  // Fetch course creator profile (photo, bio) so instructor shows for all viewers
  useEffect(() => {
    if (!selectedCourse?.creator) return;
    const fetchCreator = async () => {
      try {
        const result = await axios.post(
          `${serverUrl}/api/course/getcreator`,
          { userId: selectedCourse.creator },
          { withCredentials: true }
        );
        setCreatorData(result.data);
      } catch (err) {
        console.error('Error fetching instructor:', err);
      }
    };
    fetchCreator();
  }, [selectedCourse?.creator]);

  const courseCreator = creatorData;
  
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col md:flex-row gap-6">
     
      {/* Left - Video & Course Info */}
      <div className="w-full md:w-2/3 bg-white rounded-2xl shadow-md p-6 border border-gray-200">
        {/* Course Details */}
        <div className="mb-6" >
           
          <h1 className="text-2xl font-bold flex items-center justify-start gap-[20px]  text-gray-800"><FaArrowLeftLong  className=' text-black w-[22px] h-[22px] cursor-pointer' onClick={() => navigate(`/viewcourse/${courseId}`)} />{selectedCourse?.title}</h1>
          
          <div className="mt-2 flex gap-4 text-sm text-gray-500 font-medium">
            <span>Category: {selectedCourse?.category}</span>
            <span>Level: {selectedCourse?.level}</span>
          </div>
        </div>

        {/* Video Player */}
        <div className="aspect-video bg-black rounded-xl overflow-hidden mb-4 border border-gray-300">
          {selectedLecture?.videoUrl ? (
            <video
              src={selectedLecture.videoUrl}
              controls
              className="w-full h-full object-cover"
              crossOrigin="anonymous"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              Select a lecture to start watching
            </div>
          )}
        </div>

        {/* Selected Lecture Info */}
        <div className="mt-2">
          <h2 className="text-lg font-semibold text-gray-800">{selectedLecture?.lectureTitle}</h2>
          
        </div>
      </div>

      {/* Right - All Lectures + Creator Info */}
      <div className="w-full md:w-1/3 bg-white rounded-2xl shadow-md p-6 border border-gray-200 h-fit">
        <h2 className="text-xl font-bold mb-4 text-gray-800">All Lectures</h2>
        <div className="flex flex-col gap-3 mb-6">
          {selectedCourse?.lectures?.length > 0 ? (
            selectedCourse.lectures.map((lecture, index) => (
              <button
                key={index}
                onClick={() => setSelectedLecture(lecture)}
                className={`flex items-center justify-between p-3 rounded-lg border transition text-left ${
                  selectedLecture?._id === lecture._id
                    ? 'bg-gray-200 border-gray-500'
                    : 'hover:bg-gray-50 border-gray-300'
                }`}
              >
                <div>
                  <h4 className="text-sm font-semibold text-gray-800">{lecture.lectureTitle}</h4>
                  
                </div>
                <FaPlayCircle className="text-black text-xl" />
              </button>
            ))
          ) : (
            <p className="text-gray-500">No lectures available.</p>
          )}
        </div>

        {/* Instructor – always show when we have creator id; data loaded from API */}
        {(selectedCourse?.creator || courseCreator) && (
          <div className="mt-4 border-t pt-4">
            <h3 className="text-md font-semibold text-gray-700 mb-3">Instructor</h3>
            <div className="flex items-center gap-4">
              {courseCreator?.photoUrl ? (
                <img
                  src={courseCreator.photoUrl}
                  alt={courseCreator.name || 'Instructor'}
                  className="w-14 h-14 rounded-full object-cover border"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold text-lg border shrink-0">
                  {(courseCreator?.name || '?').trim().charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h4 className="text-base font-medium text-gray-800">{courseCreator?.name || 'Instructor'}</h4>
                <p className="text-sm text-gray-600">
                  {courseCreator?.description?.trim() || 'No bio available.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewLecture;
