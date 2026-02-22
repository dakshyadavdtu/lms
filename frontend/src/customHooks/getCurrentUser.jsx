import { useEffect } from "react"
import { serverUrl } from "../App"
import axios from "axios"
import { useDispatch, useSelector } from "react-redux"
import { setUserData } from "../redux/userSlice"

const DEBUG_LOG_ENDPOINT = 'http://127.0.0.1:7243/ingest/0af5a546-cdc8-4764-a797-7707372f27a3';

const getCurrentUser = ()=>{
    let dispatch = useDispatch()
    const userData = useSelector(state=>state.user?.userData)

    useEffect(()=>{
        // Session restore only: call currentuser once on mount. 400 when no auth cookie is expected; catch dispatches null.
        // #region agent log
        fetch(DEBUG_LOG_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'getCurrentUser.jsx:useEffect',message:'effect started',data:{userDataPresent:!!userData},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H4'})}).catch(()=>{});
        // #endregion
        const fetchUser = async () => {
            // #region agent log
            fetch(DEBUG_LOG_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'getCurrentUser.jsx:beforeAxios',message:'calling currentuser API',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H5'})}).catch(()=>{});
            // #endregion
            try {
                let result = await axios.get(serverUrl + "/api/user/currentuser" , {withCredentials:true})
                // #region agent log
                fetch(DEBUG_LOG_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'getCurrentUser.jsx:success',message:'currentuser success',data:{hasData:!!result?.data},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
                // #endregion
                dispatch(setUserData(result.data))

            } catch (error) {
                // #region agent log
                fetch(DEBUG_LOG_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'getCurrentUser.jsx:catch',message:'currentuser failed',data:{status:error?.response?.status,message:error?.response?.data?.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1,H5'})}).catch(()=>{});
                // #endregion
                // Silently handle 400 (expected when no auth cookie) - don't log or break app
                const status = error?.response?.status
                if (status === 400 || status === 401) {
                    // Expected: no auth token/cookie present - silently set user to null
                    dispatch(setUserData(null))
                    return
                }
                // Log only unexpected errors (500, network errors, etc.)
                console.error('Unexpected error fetching current user:', error)
                dispatch(setUserData(null))
            }
        }
        fetchUser()
    },[])
}

export default getCurrentUser