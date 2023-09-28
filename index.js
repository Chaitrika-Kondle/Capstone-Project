const express = require('express'); 
const app = express();
const session=require("express-session");
const bp=require("body-parser");
const ejs=require("ejs");
const axios=require("axios");
const ph = require("password-hash");
app.set('view engine','ejs');
app.use(express.static('public'));
app.use(bp.json());
app.use(bp.urlencoded({ extended: true }));
app.use(session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true
}));
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore} = require('firebase-admin/firestore');
var serviceAccount = require("./key.json");
 
initializeApp({
    credential: cert(serviceAccount)
  });
  
const db = getFirestore();
  
app.get('/', function (req, res) {  
    res.render("signup",{message:""})
})  

  
app.post('/signupSubmit', function (req, res) {  
    db.collection("Users")
            .where('Email', '==', req.body.email)
            .get()
            .then((docs) => {
                if (docs.size > 0) {
                    res.render('signup',{message : "A user already exists with the given email"});    
                } else {
                    db.collection("Users").add({
                        Name:req.body.name,
                        Email:req.body.email,
                        Password:ph.generate(req.body.password),
                    }).then(()=>{
                        res.redirect('/login');
                    })
                }
            });

    /*db.collection('Users').add({
        FullName:req.query.name,
        Email:req.query.email,
        Password:req.query.password,
    }).then(()=>{
      res.render("login")
    })
    */
})
app.get('/login', function (req, res){
    res.render("login");

})

app.post("/loginSubmit", function (req,res) {  
    console.log(req.query);
    db.collection('Users')
   .where("Email","==",req.body.email)
   .get()
   .then((docs)=>{
    let ver=false;
    docs.forEach(doc=>{
        ver=ph.verify(req.body.password,doc.data().Password);
    })
    if(ver){
        req.session.authenticated = true;
        res.redirect('/dashboard')
    }
    else{
        res.send("Fail")
    }
   })
})
app.get("/dashboard",function(req,res){
    if(req.session.authenticated){
        res.render("dashboard",{open:""})
    }
    else{
        res.redirect('/login');
    }
});
app.post('/dashboard',(req,res)=>{
    const x = req.body.loc;
  axios.get("http://api.weatherapi.com/v1/current.json?key=cf7305f478e14727831100827232308&q="+x+"&aqi=no").then((response)=>{
    res.render('dashboard.ejs',{open: response.data.current['temp_c']});
  }).catch(err=>console.log(err));
  });

app.listen(3000,(req,res)=>{
    console.log("app listening on port 3000");
});