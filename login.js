var mysql = require('mysql');
var express = require('express');
var app = express();
var session = require('express-session');
var bodyParser = require('body-parser');
var nunjucks = require('nunjucks');
var flash = require("express-flash");

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


app.get('/home', function(request, response) {
	if (request.session.loggedin) {
		response.send('Welcome back, ' + request.session.username + '!');
	} else {
		response.send('Please login to view this page!');
	}
	response.end();
});

app.get("/complaint",function(req,res){
	res.render("complaintform.njk",{username:req.session.username});
});

app.post("/complaint",function(req,res){
	var email = req.body.email;
	var contact = req.body.contact;
	var desc = req.body.desc;
	var query = "insert into complaint(username,email,contact,description) values('"+req.session.username+"','"+email+"','"+contact+"','"+desc+"')";
	connection.connect(function(error){
		connection.query(query,function(err,result){
			if(err) throw err;
			res.send("Complaint added");
		});
	});
});

app.get("/assigned",function(req,res){
	var query = "select complaint.complaintId,complaint.description from complaint,complaintAssignment where complaint.complaintId=complaintAssignment.id and assigned='"+req.session.username+"'";
	connection.connect(function(error){
		connection.query(query,function(err,result){
			if(err) throw err;
			res.render("table.njk",{rows:result});
		});
	});
});

app.get("/admin",function(req,res){
	var engineersQuery = "select username from user where type=1";

	var query = "select complaintId,username,description from complaint where complaintId not in(select id from complaintAssignment)";
	connection.connect(function(error){
		connection.query(query,function(err,complaints){
			if(err) throw err;
			connection.query(engineersQuery,function(err,engineers,fields){
				if(err) throw err;
				res.render("admin.njk",{rows:complaints,engineers:engineers});
			});
		});
	});
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

app.listen(80);