import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import { ToastContainer } from 'react-toastify'
import ForgotPassword from './pages/ForgotPassword'
import getCurrentUser from './customHooks/getCurrentUser'
import { useSelector } from 'react-redux'
import Profile from './pages/Profile'
import EditProfile from './pages/EditProfile'
import Dashboard from './pages/admin/Dashboard'
import Courses from './pages/admin/Courses'
import AllCouses from './pages/AllCouses'
import AddCourses from './pages/admin/AddCourses'
import CreateCourse from './pages/admin/CreateCourse'
import CreateLecture from './pages/admin/CreateLecture'
import EditLecture from './pages/admin/EditLecture'
import getCouseData from './customHooks/getCouseData'
import ViewCourse from './pages/ViewCourse'
import ScrollToTop from './components/ScrollToTop'
import getCreatorCourseData from './customHooks/getCreatorCourseData'
import EnrolledCourse from './pages/EnrolledCourse'
import ViewLecture from './pages/ViewLecture'
import SearchWithAi from './pages/SearchWithAi'
import getAllReviews from './customHooks/getAllReviews'
import ProtectedRoute, { FullPageLoader } from './components/ProtectedRoute'

export const serverUrl = import.meta.env.VITE_API_URL || "https://novalearn-00ie.onrender.com"

function App() {
  const { userData, authLoading } = useSelector((state) => state.user)

  getCurrentUser()
  getCouseData()
  getCreatorCourseData()
  getAllReviews()

  if (authLoading) {
    return <FullPageLoader />
  }

  return (
    <>
      <ToastContainer />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={!userData ? <SignUp /> : <Navigate to="/" />} />
        <Route path="/profile" element={userData ? <Profile /> : <Navigate to="/signup" />} />
        <Route path="/allcourses" element={userData ? <AllCouses /> : <Navigate to="/signup" />} />
        <Route path="/viewcourse/:courseId" element={userData ? <ViewCourse /> : <Navigate to="/signup" />} />
        <Route path="/editprofile" element={userData ? <EditProfile /> : <Navigate to="/signup" />} />
        <Route path="/enrolledcourses" element={userData ? <EnrolledCourse /> : <Navigate to="/signup" />} />
        <Route path="/viewlecture/:courseId" element={userData ? <ViewLecture /> : <Navigate to="/signup" />} />
        <Route path="/searchwithai" element={userData ? <SearchWithAi /> : <Navigate to="/signup" />} />
        <Route path="/dashboard" element={<ProtectedRoute authLoading={authLoading} userData={userData} requiredRole="educator"><Dashboard /></ProtectedRoute>} />
        <Route path="/courses" element={<ProtectedRoute authLoading={authLoading} userData={userData} requiredRole="educator"><Courses /></ProtectedRoute>} />
        <Route path="/addcourses/:courseId" element={<ProtectedRoute authLoading={authLoading} userData={userData} requiredRole="educator"><AddCourses /></ProtectedRoute>} />
        <Route path="/createcourses" element={<ProtectedRoute authLoading={authLoading} userData={userData} requiredRole="educator"><CreateCourse /></ProtectedRoute>} />
        <Route path="/createlecture/:courseId" element={<ProtectedRoute authLoading={authLoading} userData={userData} requiredRole="educator"><CreateLecture /></ProtectedRoute>} />
        <Route path="/editlecture/:courseId/:lectureId" element={<ProtectedRoute authLoading={authLoading} userData={userData} requiredRole="educator"><EditLecture /></ProtectedRoute>} />
        <Route path="/forgotpassword" element={<ForgotPassword />} />
      </Routes>
    </>
  )
}

export default App
