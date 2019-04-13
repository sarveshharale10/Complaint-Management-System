var mysql = require('mysql');
var express = require('express');
var app = express();
var session = require('express-session');
var bodyParser = require('body-parser');
var nunjucks = require('nunjucks');
var flash = require("express-flash");
var path = require("path");

var connection = mysql.createConnection({
	host     : 'localhost',
	user     : 'root',
	password : 'sarvesh',
	database : 'cms'
});

nunjucks.configure('views', {
    autoescape: true,
    express: app
});

app.use(flash());

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));

app.use(express.static(path.join(__dirname,"/public")));

app.get('/', function(request, response) {
	response.render("login.njk",{req:request});
});

app.post('/auth', function(request, response) {
	var username = request.body.username;
	var password = request.body.password;
	var query = "select * from user where username='"+username+"' and password='"+password+"'";
	connection.connect(function(error){
		connection.query(query, function(err, result, fields){
			if(err) throw err;
			if (result.length > 0) {
				request.session.loggedin = true;
				request.session.username = username;
				var userType = result[0].type;
				if(userType == 0){
					response.redirect("/admin");
				}
				else if(userType == 1){
					response.redirect("/assigned");
				}
				else if(userType == 2){
					response.redirect("/complaint");
				}
			} else {
				request.flash("invalid","Invalid Username and/or Password");
				response.redirect("/");
			}
		});
	});
});

app.get("/complaint",function(req,res){
	if(req.session.username){
		res.render("complaintform.njk",{username:req.session.username});
	}
	else{
		res.redirect("/");
	}
});

app.post("/complaint",function(req,res){
	var email = req.body.email;
	var contact = req.body.contact;
	var desc = req.body.desc;
	var query = "insert into complaint(username,email,contact,description,status) values('"+req.session.username+"','"+email+"','"+contact+"','"+desc+"',"+0+")";
	connection.connect(function(error){
		connection.query(query,function(err,result){
			if(err) throw err;
			req.flash("successful","Complaint Successfully Added");
			res.redirect("/complaint");
		});
	});
});

app.get("/assigned",function(req,res){
	var query = "select complaint.complaintId,complaint.description from complaint,complaintAssignment where complaint.complaintId=complaintAssignment.id and complaint.status=0 and assigned='"+req.session.username+"'";
	connection.connect(function(error){
		connection.query(query,function(err,result){
			if(err) throw err;
			res.render("table.njk",{rows:result});
		});
	});
});

app.post("/assigned",function(req,res){
	var complaintId = req.body.complaintId;
	var query = "delete from complaintAssignment where id="+complaintId+" and assigned='"+req.session.username+"'";
	connection.connect(function(error){
		connection.query(query,function(err,result){
			if(err) throw err;
		});
		query = "update complaint set status=1 where complaintId="+complaintId;
		connection.query(query,function(err,result){
			if(err) throw err;
			res.redirect("/assigned");
		});
	});
});

app.get("/admin",function(req,res){
	if(req.session.username){
		var engineersQuery = "select username from user where type=1";

		var query = "select complaintId,username,description from complaint where complaintId not in(select id from complaintAssignment) and status=0";
		connection.connect(function(error){
			connection.query(query,function(err,complaints){
				if(err) throw err;
				connection.query(engineersQuery,function(err,engineers,fields){
					if(err) throw err;
					res.render("admin.njk",{rows:complaints,engineers:engineers});
				});
			});
		});
	}
	else{
		res.redirect("/");
	}
});

app.post("/assign",function(req,res){
	var complaintId = req.body.complaintId;
	var enggId = req.body.enggId;
	var query = "insert into complaintAssignment values("+complaintId+",'"+enggId+"')";
	connection.connect(function(error){
		connection.query(query,function(err,result){
			if(err) throw err;
			res.redirect("/admin");
		});
	});
});

app.get("/logout",function(req,res){
	if(req.session){
		req.session.destroy(function(err){
			res.redirect("/")
		});
	}
});

app.listen(80);