import { useEffect } from "react"
import { serverUrl } from "../App"
import axios from "axios"
import { useDispatch, useSelector } from "react-redux"
import { setUserData, setAuthLoading } from "../redux/userSlice"

const getCurrentUser = ()=>{
    let dispatch = useDispatch()
    const userData = useSelector(state=>state.user?.userData)

    useEffect(()=>{
        const fetchUser = async () => {
            try {
                let result = await axios.get(serverUrl + "/api/user/currentuser" , {withCredentials:true})
                dispatch(setUserData(result.data))
            } catch (error) {
                const status = error?.response?.status
                if (status === 400 || status === 401) {
                    dispatch(setUserData(null))
                } else {
                    console.error('Unexpected error fetching current user:', error)
                    dispatch(setUserData(null))
                }
            } finally {
                dispatch(setAuthLoading(false))
            }
        }
        fetchUser()
    },[])
}

export default getCurrentUser