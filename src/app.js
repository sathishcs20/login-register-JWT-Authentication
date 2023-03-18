const express=require('express')
const sharp=require('sharp')
const auth=require('../config/auth')
const em=require("../config/email")
const bodyparser =require('body-parser')
const db=require('./db/db.js')
require('dotenv').config()
const multer =require('multer')
const app=express()

const cookieParser =require('cookie-parser')
app.use(cookieParser())

const expressLayouts =require('express-ejs-layouts')
app.use(expressLayouts)
const bcrypt=require("bcryptjs")
const jwt=require("jsonwebtoken")
app.use(bodyparser.urlencoded({extended:false}))
app.use(bodyparser.json())
app.use(express.json())
app.set('view engine','ejs')
app.set('views','../views')

const upload = multer({
    storage:multer.memoryStorage() ,// uploaded file will be stored in this location
    limits:{
        fileSize:6000000
    } ,//1000000 bytes = 1 mb
    fileFilter(req,file,cb)
    {
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)) //!file.originalname.match(/\.(jpg|jpeg|pdf)$/) --> wiil accept only these formats
        {
            return cb("Upload only JPEG or JPG or PNG File")
        }
        cb(undefined,true)
    },
    
})
app.get('/',(req,res)=>
{
    res.render("index")
})
app.get('/login',(req,res)=>
{
    res.render("login")
})
app.get('/register',(req,res)=>
{
    res.render("register")
})
app.get('/profile',auth,(req,res)=>
{
    console.log(req.user[0]['name'])
    res.render('profile',{name:req.user[0]['name'],image:req.user[0]['image']})
})
app.get('/logout',auth,async(req,res)=>
{
    await db.query(`update user set token=? where email=?`,[0,req.user[0]['email']])
    res.redirect("/login")
})


app.post('/api/register',upload.single('im'),async (req,res)=>
{
  
   
   const buffer = await sharp(req.file.buffer).resize({width:250,height:250}).toBuffer()
   console.log(buffer)
   const encoded=buffer.toString('base64')
  
    const{name,email,password}=req.body 
    let errors=[]
   
    if(!name || !email || !password)
    {
        errors.push({msg:'please fill in all fields',colour:'red'})
    }
    if(password.length<6)
    {
        errors.push({msg:'password should be atleast 6 characters',colour:"red"})
    }
    if(errors.length>0)
    {
        res.render('register',{errors,name,email,password})
    }
    else 
    {
        await  db.query(`select count(email) from user where email=?`,req.body.email,async (errr,ans)=>
        {
            if(errr)
            {
                console.log(errr)
            }
            else 
            {
                
                if(ans[0]['count(email)']== 0)
                {

                    var params = {
                        name:req.body.name,
                        email:req.body.email,
                        password:req.body.password,
                        image:encoded
                    }
                    const p=params.password
                    params.password= await bcrypt.hash(params.password,8)
                    const m=await bcrypt.compare(p,params.password)
                    console.log(params.password)
                    console.log(m)
                    await db.query(`insert into user set ?`,params,(error,rows)=>
                    {
                    if(error)
                    {
                        console.log(error)
                        console.log("cannot insert to database")
                    }
                    else 
                    {
                        
                        errors.push({msg:'Registeration Successfull',colour:"green"})
                        res.render('register',{errors,name,email,password})
                        em.sendEmail(params.email,params.name)
                    }
            })
                 }
                else 
                {
                    errors.push({msg:'Email already exists',colour:"red"})
                    res.render('register',{errors,name,email,password})
                }
            }
        })
    }
     
   
    
},(error,req,res,next)=>
{
    
    let e=[]
    e.push({msg:error.message,colour:"red"})
    res.render('register',{e})
    
})



app.post('/api/login',async (req,res)=>
{
    console.log(req.body)
    const{email,password}=req.body
    let errors=[]
        await db.query(`select password from user where email=?`,email,async (e,rows)=>
                {
                    if(e)
                    {
                        console.log("error in match finding")
                    }
                    else 
                    {
                        console.log(rows.length)
                        if(rows.length== 0)
                        {
                            errors.push({msg:'Invalid email and password',colour:"red"})
                            res.render('login',{errors,email,password})
                        }
                        else 
                        {
                            const hpass=rows[0]["password"]
                           
                            const match =  await bcrypt.compare(password,hpass)
                            console.log(match)
                            if(match)
                            {
                                const token=await jwt.sign({email:email},process.env.SECRET_KEY)
                              
                                

                                await db.query(`update user set token=? where email=?`,[token,email],(errrrr,ans)=>
                                {
                                    if(errrrr)
                                    {
                                        console.log("error in token insertion")
                                        console.log(errrrr)
                                    }
                                    else 
                                    {
                                        res.cookie('cookiename',token,{
                                            expires:new Date(Date.now()+25892000000),
                                            httpOnly:true
                                        })
                                       
                                        errors.push({msg:'Login Successfull',colour:"green"})
                                        
                                        res.redirect('/profile')
                                    }
                                })
                            }
                            else 
                            {
                                        errors.push({msg:'Invalid email and password',colour:"red"})
                                        res.render('login',{errors,email,password})
                            }
                        }
                    }
                })
    
        
    
  
})



app.post("/upload",upload.single('im'),(req,res)=> //this middleware checks weather the request is having a key named profile_pic
{
    console.log(req.file)
    
    res.send("uploaded")
},(error,req,res,next)=>
{
    res.send({"error":error.message})
})


app.listen(3000,()=>
{
    console.log(3000)
})  
