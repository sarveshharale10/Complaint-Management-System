var express = require('express');
var app = express();
var nunjucks = require('nunjucks');
var bodyParser = require('body-parser');
var router = express.Router();

var mysql = require('mysql');
var conn = mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"sarvesh",
    database:"cms"
});

nunjucks.configure('views', {
    autoescape: true,
    express: app
});

app.use(bodyParser.urlencoded({extended:true}));

app.get("/form",function(req,res){
    res.render("form.njk");
});

/*app.post("/login",function(req,res){
    res.render("first_template.njk",{name:req.body.username});
});*/

app.use("/complaint",router);

router.get("/",function(req,res){
    conn.connect(function(err){
        if(err) throw err;
        conn.query("select * from complaint",function(err,result,fields){
            if(err) throw err;
            res.send(result);
        });
    });
});

router.post('/auth',function(request,response){
    var username = request.body.username;
	var password = request.body.password;
	var query = "select * from user where username='"+username+"' and password='"+password+"'";
	conn.connect(function(error){
		if(error) throw error;
		conn.query(query, function(err, result, fields){
            if(err) throw err;
            response.send(result);
		});
	});
});

router.put("/",function(req,res){

    conn.connect(function(err){
        if(err) throw err;
        var body = req.body;
        var query = "insert into complaint values("+body.id+",'"+body.description+"','"+body.dateFiled+"',0)";
        conn.query(query,function(err,result){
            if(err) throw err;
            res.json({status:1});
        });
    });
});


app.listen(80);