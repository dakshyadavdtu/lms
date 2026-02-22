import axios from 'axios'
import React, { useEffect, useState } from 'react'
import { FaArrowLeft } from "react-icons/fa"
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { serverUrl } from '../../App'
import { setLectureData } from '../../redux/lectureSlice'
import { setCourseData, setSelectedCourseData } from '../../redux/courseSlice'
import { toast } from 'react-toastify'
import { ClipLoader } from 'react-spinners'

function EditLecture() {
  const [loading, setLoading] = useState(false)
  const [loading1, setLoading1] = useState(false)
  const { courseId, lectureId } = useParams()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { lectureData } = useSelector(state => state.lecture)
  const { courseData, selectedCourseData } = useSelector(state => state.course)
  const selectedLecture = lectureData.find(lecture => lecture._id === lectureId)

  const [videoFile, setVideoFile] = useState(null)
  const [lectureTitle, setLectureTitle] = useState('')
  const [isPreviewFree, setIsPreviewFree] = useState(false)

  // Initialize form from selectedLecture when available
  useEffect(() => {
    if (selectedLecture) {
      setLectureTitle(selectedLecture.lectureTitle ?? '')
      setIsPreviewFree(selectedLecture.isPreviewFree ?? false)
    }
  }, [selectedLecture])

  // If no lecture list (e.g. refresh or deep link), fetch course lectures
  useEffect(() => {
    if (lectureId && lectureData.length === 0) {
      const fetchLectures = async () => {
        try {
          const result = await axios.get(serverUrl + `/api/course/getcourselecture/${courseId}`, { withCredentials: true })
          dispatch(setLectureData(result.data.lectures ?? []))
        } catch (err) {
          toast.error(err.response?.data?.message ?? 'Failed to load lectures')
          navigate(`/createlecture/${courseId}`)
        }
      }
      fetchLectures()
    }
  }, [courseId, lectureId, lectureData.length, dispatch, navigate])

  // Redirect if we have lectures but this lecture isn't in the list (invalid lectureId)
  useEffect(() => {
    if (lectureData.length > 0 && !selectedLecture) {
      toast.error('Lecture not found')
      navigate(`/createlecture/${courseId}`)
    }
  }, [lectureData.length, selectedLecture, courseId, navigate])

  const editLecture = async () => {
    if (!selectedLecture) {
      toast.error('Lecture not loaded')
      return
    }
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('lectureTitle', lectureTitle)
      formData.append('isPreviewFree', String(isPreviewFree))
      if (videoFile) {
        formData.append('videoUrl', videoFile)
      }

      const result = await axios.post(
        serverUrl + `/api/course/editlecture/${lectureId}`,
        formData,
        { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
      )
      const updated = result.data
      dispatch(setLectureData(lectureData.map(l => l._id === updated._id ? updated : l)))
      const courseRes = await axios.get(serverUrl + `/api/course/getcourse/${courseId}`, { withCredentials: true })
      const freshCourse = courseRes.data
      dispatch(setCourseData(courseData.map(c => c._id === courseId ? freshCourse : c)))
      if (selectedCourseData?._id === courseId) dispatch(setSelectedCourseData(freshCourse))
      toast.success('Lecture Updated')
      navigate(`/createlecture/${courseId}`)
    } catch (error) {
      const message = error.response?.data?.message ?? 'Failed to update lecture'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  const removeLecture = async () => {
    setLoading1(true)
    try {
      await axios.delete(serverUrl + `/api/course/removelecture/${lectureId}`, { withCredentials: true })
      dispatch(setLectureData(lectureData.filter(l => l._id !== lectureId)))
      toast.success('Lecture Removed')
      navigate(`/createlecture/${courseId}`)
      setLoading1(false)
    } catch (error) {
      toast.error(error.response?.data?.message ?? 'Lecture remove error')
      setLoading1(false)
    }
  }

  if (!selectedLecture) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-xl bg-white rounded-xl shadow-lg p-6 flex items-center justify-center">
          <ClipLoader size={40} color="#000" />
          <span className="ml-3">Loading lecture...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-lg p-6 space-y-6">

        <div className="flex items-center gap-2 mb-2">
          <FaArrowLeft className="text-gray-600 cursor-pointer" onClick={() => navigate(`/createlecture/${courseId}`)} />
          <h2 className="text-xl font-semibold text-gray-800">Update Your Lecture</h2>
        </div>

        <div>
          <button className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all text-sm" disabled={loading1} onClick={removeLecture}>
            {loading1 ? <ClipLoader size={30} color="white" /> : 'Remove Lecture'}
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[black] focus:outline-none"
              placeholder={selectedLecture?.lectureTitle}
              onChange={(e) => setLectureTitle(e.target.value)}
              value={lectureTitle}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Video (optional – leave empty to keep current)</label>
            <input
              type="file"
              accept="video/*"
              className="w-full border border-gray-300 rounded-md p-2 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-gray-700 file:text-[white] hover:file:bg-gray-500"
              onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isPreviewFree}
              className="accent-[black] h-4 w-4"
              onChange={() => setIsPreviewFree(prev => !prev)}
            />
            <label className="text-sm text-gray-700">Is this video FREE (preview)</label>
          </div>
        </div>

        <div>
          {loading ? <p className="text-sm text-gray-600">Uploading video... Please wait.</p> : null}
        </div>

        <div className="pt-4">
          <button className="w-full bg-black text-white py-3 rounded-md text-sm font-medium hover:bg-gray-700 transition" disabled={loading} onClick={editLecture}>
            {loading ? <ClipLoader size={30} color="white" /> : 'Update Lecture'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditLecture
