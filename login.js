var mysql = require('mysql');
var express = require('express');
var app = express();
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var nunjucks = require('nunjucks');

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

app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(bodyParser.urlencoded({extended : true}));


app.get('/', function(request, response) {
	response.render("login.njk");
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
				response.redirect('/home');
			} else {
				response.send('Incorrect Username and/or Password!');
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
	var query = "select complaintId,username,description from complaint where complaintId not in(select id from complaintAssignment)";
	connection.connect(function(error){
		connection.query(query,function(err,result){
			if(err) throw err;
			res.render("admin.njk",{rows:result});
		});
	});
});

app.listen(8000);