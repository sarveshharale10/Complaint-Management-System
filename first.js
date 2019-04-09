var http = require('http');
var fs = require('fs');
var url = require('url');

http.createServer(function(req,res){
    var q = url.parse(req.url,true);
    var fileName = "."+q.pathname;
    fs.readFile(fileName,function(err,data){
        if(err){
            res.writeHead(404,{"Content-Type":"text/html"});
            res.write("<h1>404 Not Found</h1>");
            res.end();
        }
        else{
            res.writeHead(200,{"Content-Type":"text/html"});
            res.write(data);
            res.end();
        }
    });
}).listen(8080);