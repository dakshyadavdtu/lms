import React, { useState } from 'react'
import logo from '../assets/logo.jpg'
import google from '../assets/google.jpg'
import axios from 'axios'
import { serverUrl } from '../App'
import { MdOutlineRemoveRedEye } from "react-icons/md";

import { MdRemoveRedEye } from "react-icons/md";
import { useNavigate } from 'react-router-dom'
import { signInWithPopup } from 'firebase/auth'
import { auth, provider } from '../../utils/Firebase'
import { toast } from 'react-toastify'
import { ClipLoader } from 'react-spinners'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'

const DEBUG_LOG_ENDPOINT = 'http://127.0.0.1:7243/ingest/0af5a546-cdc8-4764-a797-7707372f27a3';

function Login() {
    const [email,setEmail]= useState("")
    const [password,setPassword]= useState("")
    const navigate = useNavigate()
    let [show,setShow] = useState(false)
     const [loading,setLoading]= useState(false)
     let dispatch = useDispatch()
    const handleLogin = async () => {
        setLoading(true)
        try {
            const result = await axios.post(serverUrl + "/api/auth/login" , {email , password} ,{withCredentials:true})
            dispatch(setUserData(result.data))
            navigate("/")
            setLoading(false)
            toast.success("Login Successfully")
        } catch (error) {
            console.log(error)
            setLoading(false)
            toast.error(error.response.data.message)
        }
        
    }
     const googleLogin = async () => {
            try {
                const response = await signInWithPopup(auth,provider)
                
                const user = response.user
                const name = user.displayName;
                const email = user.email
                const role = ""

                // #region agent log
                fetch(DEBUG_LOG_ENDPOINT,{
                    method:'POST',
                    headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({
                        sessionId:'debug-session',
                        runId:'google-login',
                        hypothesisId:'firebase-success',
                        location:'Login.jsx:googleLogin:afterSignIn',
                        message:'Google signInWithPopup success',
                        data:{uid:user?.uid,email:user?.email},
                        timestamp:Date.now()
                    })
                }).catch(()=>{});
                // #endregion
                
                const result = await axios.post(
                    serverUrl + "/api/auth/googlesignup",
                    {name , email , role},
                    {withCredentials:true}
                )

                // #region agent log
                fetch(DEBUG_LOG_ENDPOINT,{
                    method:'POST',
                    headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({
                        sessionId:'debug-session',
                        runId:'google-login',
                        hypothesisId:'backend-success',
                        location:'Login.jsx:googleLogin:afterAxios',
                        message:'Backend googlesignup success',
                        data:{status:result?.status, hasData:!!result?.data},
                        timestamp:Date.now()
                    })
                }).catch(()=>{});
                // #endregion

                dispatch(setUserData(result.data))
                navigate("/")
                toast.success("Login Successfully")
            } catch (error) {
                // #region agent log
                fetch(DEBUG_LOG_ENDPOINT,{
                    method:'POST',
                    headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({
                        sessionId:'debug-session',
                        runId:'google-login',
                        hypothesisId:'google-login-error',
                        location:'Login.jsx:googleLogin:catch',
                        message:'Google login failed',
                        data:{
                            name:error?.name,
                            message:error?.message,
                            code:error?.code,
                            status:error?.response?.status,
                            backendMessage:error?.response?.data?.message
                        },
                        timestamp:Date.now()
                    })
                }).catch(()=>{});
                // #endregion

                console.error("Google login failed:", error)

                const backendMessage = error?.response?.data?.message
                const firebaseMessage = error?.message
                const message = backendMessage || firebaseMessage || "Google login failed. Please try again."

                toast.error(message)
            }
        }
  return (
    <div className='bg-[#dddbdb] w-[100vw] h-[100vh] flex items-center justify-center flex-col gap-3'>
            <form className='w-[90%] md:w-200 h-150 bg-[white] shadow-xl rounded-2xl flex' onSubmit={(e)=>e.preventDefault()}>
                <div className='md:w-[50%] w-[100%] h-[100%] flex flex-col items-center justify-center gap-4 '>
                    <div><h1 className='font-semibold text-[black] text-2xl'>Welcome back</h1>
                    <h2 className='text-[#999797] text-[18px]'>Login to your account</h2>
                    </div>
                     <div className='flex flex-col gap-1 w-[85%] items-start justify-center px-3'>
                        <label htmlFor="email" className='font-semibold'>
                            Email
                        </label>
                        <input id='email' type="text" className='border-1 w-[100%] h-[35px] border-[#e7e6e6] text-[15px] px-[20px]' placeholder='Your email' onChange={(e)=>setEmail(e.target.value)} value={email} />
                    </div>
                     <div className='flex flex-col gap-1 w-[85%] items-start justify-center px-3 relative'>
                        <label htmlFor="password" className='font-semibold'>
                            Password
                        </label>
                        <input id='password' type={show?"text":"password"} className='border-1 w-[100%] h-[35px] border-[#e7e6e6] text-[15px] px-[20px]' placeholder='***********' onChange={(e)=>setPassword(e.target.value)} value={password} />
                        {!show && <MdOutlineRemoveRedEye className='absolute w-[20px] h-[20px] cursor-pointer right-[5%] bottom-[10%]' onClick={()=>setShow(prev => !prev)}/>}
                        {show && <MdRemoveRedEye className='absolute w-[20px] h-[20px] cursor-pointer right-[5%] bottom-[10%]' onClick={()=>setShow(prev => !prev)} />}
                    </div>
                     
                    <button className='w-[80%] h-[40px] bg-black text-white cursor-pointer flex items-center justify-center rounded-[5px]' disabled={loading} onClick={handleLogin}>{loading?<ClipLoader size={30} color='white' /> : "Login"}</button>
                    <span className='text-[13px] cursor-pointer text-[#585757]' onClick={()=>navigate("/forgotpassword")}>Forget your password?</span>
    
                    <div className='w-[80%] flex items-center gap-2'>
                        <div className='w-[25%] h-[0.5px] bg-[#c4c4c4]'></div>
                        <div className='w-[50%] text-[15px] text-[#999797] flex items-center justify-center '>Or continue with</div>
                        <div className='w-[25%] h-[0.5px] bg-[#c4c4c4]'></div>
                    </div>
                
                    <div className='w-[80%] h-[40px] border-1 border-[#d3d2d2] rounded-[5px] flex items-center justify-center ' onClick={googleLogin} ><img src={google} alt="" className='w-[25px]' /><span className='text-[18px] text-gray-500'>oogle</span> </div>
                     <div className='text-[#6f6f6f]'>Don't have an account? <span className='underline underline-offset-1 text-[black]' onClick={()=>navigate("/signup")}>Sign up</span></div>
    
                </div>
                <div className='w-[50%] h-[100%] rounded-r-2xl bg-[black] md:flex items-center justify-center flex-col hidden'><img src={logo} className='w-30 shadow-2xl' alt="" />
                <span className='text-[white] text-2xl'>VIRTUAL COURSES</span>
                </div>
            </form>
          
        </div>
      )
}

export default Login
