import React, { useEffect } from 'react'
import { serverUrl } from '../App'
import axios from 'axios'
import { setCreatorCourseData } from '../redux/courseSlice'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'react-toastify'

const DEBUG_LOG_ENDPOINT = 'http://127.0.0.1:7243/ingest/0af5a546-cdc8-4764-a797-7707372f27a3';

const getCreatorCourseData = () => {
    const dispatch = useDispatch()
    const {userData} = useSelector(state=>state.user)
    
    useEffect(()=>{
    if (!userData) return
    // #region agent log
    fetch(DEBUG_LOG_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'getCreatorCourseData.jsx:useEffect',message:'effect run',data:{userDataPresent:!!userData},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    const getCreatorData = async () => {
      // #region agent log
      fetch(DEBUG_LOG_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'getCreatorCourseData.jsx:beforeAxios',message:'calling getcreatorcourses',data:{userDataPresent:!!userData},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
      try {
        const result = await axios.get(serverUrl + "/api/course/getcreatorcourses" , {withCredentials:true})
        
         await dispatch(setCreatorCourseData(result.data))

        console.log(result.data)
        
      } catch (error) {
        console.log(error)
        toast.error(error.response.data.message)
      }
      
    }
    getCreatorData()
  },[userData])
}

export default getCreatorCourseData
