const mysql=require('mysql')
require("dotenv").config()

const db=mysql.createConnection(
    {
        connectionLimit:10,
        host:'localhost',
        user:process.env.USER,
        password:"",
        database:process.env.DB_NAME
    }
)
module.exports=db