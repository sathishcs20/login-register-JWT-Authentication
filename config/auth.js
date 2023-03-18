const db=require('../src/db/db')
const jwt=require('jsonwebtoken')
const e = require('express')
require("dotenv").config()
module.exports=(req,res,next)=>
{
    console.log("middleware")
    try 
    {
        const token =req.cookies.cookiename
        const decoded=jwt.verify(token,process.env.SECRET_KEY)
        console.log(decoded.email)
        db.query(`select * from user where email=? and token=?`,[decoded.email,token],(err,rows)=>
        {
            console.log(rows)
            if(rows.length >0 )
            {
                console.log("yes")
                req.user=rows
                next()
            }
            else 
            {
                res.send("please authenticate")
            }
            
        })
    }
    catch(e)
    {
        res.send("please authenticate")
    }
}