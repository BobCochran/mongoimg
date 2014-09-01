/* This code was taken from Paul Robert's blog entry at
 * http://coding.paulandkana.com/p=12
 *
 * This code tries to resize images obtained from the
 * database on the fly and then display them on a web page.
 *
 * Changes were made by Robert Cochran. Bob can be emailed on
 * r2cochran2@gmail.com.
 *
 */
// Some basic boilerplate stuff
var express = require('express'),
    app = module.exports = express(),
    multiparty = require('multiparty'),
    os = require('os'),
    fs = require('fs'),
    gm = require('gm'),
    ourcss2 = undefined,
    Article = require('./Article3');   // I encapsulated my data objects in a dedicated class

var application_port = process.env.PORT || 3000

app.use(express["static"](__dirname + "/static"));

// Routes
// Display all the images with accompanying file names (We only store 2
// fields plus the _id in each document)

app.get("/articles", function (req, res) {

    //Step 1: read in the css that applies

    fs.readFile(__dirname + '/static/mdb3.css', function (err, ourcss) {
        if (err) console.log(err);

        ourcss2 = ourcss
    });
    Article.findAll(function (error, results) {
        if (error) {
            res.status(400).json('A database related error has happened. Perhaps the server is down?' + '\n' + error);

        } else if (!results) {
            res.status(404).json('The record set was not found. Very strange. Perhaps the server is down?' + '\n');
        } else {
            /* Write the headers, document head, and required tags including the h1 */

            res.writeHead(200, {'Content-Type': 'text/html'})
            res.write('<!DOCTYPE html><html><head><title>MongoDB Demo Images</title>')
            res.write('<style media="screen" type="text/css">' + ourcss2 + '</style></head>')
            res.write('<body><h1>MongoDB Demo Images</h1>')

            /* Process the rest of the page using a for loop to place 1 through n documents of
             * database content in the remainder of the web page.
             */
            for (var i = 0; i < results.length; i++) {
                res.write('<p>File name\: ' + results[i].fn + '<br>')
                res.write('<img src="data:image/jpeg;base64,')
                res.write(results[i].image.toString('base64') + '"/>')

            }

            res.end("<p>This code accesses images stored by the script named populate_images_demo_mongodb_v3.js " +
                "and the method of storing the images appears to work. It is based on using the Node api readFileSync. " +
                "Query logic in Article3.js returns images to the Article.findAll function sorted in ascending " +
                "filename order.</p></body></html>")

            // Send the web page to the browser.

        }
    });
});

// Display all the images where the field "im_name" in each document begins with
// the string 'resized'

app.get("/resized", function (req, res) {

    //Step 1: read in the css that applies

    fs.readFile(__dirname + '/static/mdb3.css', function (err, ourcss) {
        if (err) console.log(err);

        ourcss2 = ourcss
    });
    Article.findRes(function (error, results) {
        if (error) {
            res.status(400).json('A database related error has happened. Perhaps the server is down?' + '\n' + error);

        } else if (!results) {
            res.status(404).json('The record set was not found. Very strange. Perhaps the server is down?' + '\n');
        } else {
            /* Write the headers, document head, and required tags including the h1 */

            res.writeHead(200, {'Content-Type': 'text/html'})
            res.write('<!DOCTYPE html><html><head><title>MongoDB Demo Images</title>')
            res.write('<style media="screen" type="text/css">' + ourcss2 + '</style></head>')
            res.write('<body><h1>MongoDB Demo Images</h1>')

            /* Process the rest of the page using a for loop to place 1 through n documents of
             * database content in the remainder of the web page.
             */
            for (var i = 0; i < results.length; i++) {
                res.write('<p>Comments\: ' + results[i].content + '<br>')
                res.write('By\: ' + results[i].author + '<br>' + 'Image name\: ' + results[i].im_name + '</p><br><img src="data:image/jpeg;base64,')
                res.write(results[i].img.toString('base64') + '"/>')

            }

            res.end("<p>Code taken from <a href=\"http://coding.paulandkana.com/?p=12\">Paul Roberts Blog</a> and " +
                "then heavily edited for Express version 4.x so it will work.</p></body></html>")

            // Send the web page to the browser.

        }
    });
});

// Display just one image

app.get("/articles/:id", function (req, res) {

    //Step 1: read in the css that applies

    fs.readFile(__dirname + '/static/mdb3.css', function (err, ourcss) {
        if (err) console.log(err);

        ourcss2 = ourcss
    })
    Article.findById(req.params.id, function (error, results) {
        if (error) {
            res.status(400).json('A database related error has happened. Perhaps the server is down?' + '\n' + error);
        } else if (!results) {
            res.status(404).json('The record set was not found. Very strange. Perhaps the server is down?' + '\n');
        } else {

            /* Write the headers, document head, and required tags including the h1 */

            res.writeHead(200, {'Content-Type': 'text/html'})
            res.write('<!DOCTYPE html><html><head><title>MongoDB Demo Images</title>')
            res.write('<style media="screen" type="text/css">' + ourcss2 + '</style></head>')
            res.write('<body><h1>MongoDB Demo Images</h1>')

            /* Process the rest of the page using a for loop to place 1 through n documents of
             * database content in the remainder of the web page.
             */
            for (var i = 0; i < results.length; i++) {
                res.write('<p>File name\: ' + results[i].fn + '<br>')
                res.write('<img src="data:image/jpeg;base64,')
                res.write(results[i].image.toString('base64') + '"/>')

            }

            res.end("<p>This code accesses images stored by the script named populate_images_demo_mongodb_v3.js " +
                "and the method of storing the images appears to work. It is based on using the Node api readFileSync. " +
                "Query logic in Article3.js returns images to the Article.findAll function sorted in ascending " +
                "filename order.</p></body></html>")

            // Send the web page to the browser.
        }
    });
});


// save/update a new article
app.post("/articles", function (req, res, next) {
    var form = new multiparty.Form();
    var the_author = undefined
    var the_content = undefined
    var the_image = undefined
    var the_path = undefined
    var the_size = undefined
    var the_id = new Date()

    form.parse(req, function (err, fields, files) {
        if (err) {
            res.end("invalid request " + err.message, 400)
            return
        }
        Object.keys(fields).forEach(function(name) {
            console.log('Got field named ' + name)
            console.log('The value of the field is ' + fields[name])

            // Extract the field contents from the POST'ed response

            if (name === 'author') {
                the_author = fields[name]
                console.log('\nProcessing and saving fields...the value of the_author is ' + the_author)
            }
            if (name === 'content') {
                the_content = fields[name]
                console.log('\nProcessing and saving fields...the value of the_content is ' + the_content)
            }
        })

        Object.keys(files).forEach(function (name) {

            console.log('\nGot field named ' + name)
            console.log('\nThe value of the files field is ' + files[name][0].originalFilename)
            the_image = files[name][0].originalFilename
            console.log('\nThe path of the file is ' + files[name][0].path)
            the_path = files[name][0].path
            console.log('\nThe size of the file is ' + files[name][0].size)
            the_size = files[name][0].size
            debugger

        })

        //Determine if an author name exists

        if (the_author === undefined || the_author == "" || null === the_author) {
            res.status(400).json("Author field must be specified when saving a new article")
            return
        }

        //Determine if comments exist

        if (the_content === undefined || the_content == "" || null === the_content) {
            res.status(400).json("Content field must be specified when saving a new article")
            return
        }

        //Save it to the database

        Article.save(the_id, the_author, the_content, the_path, the_size, the_image, function (err, objects) {
            if (err) {
                res.status(400).json(err);
            } else if (objects === 1) {     //update

                res.status(200).json("Article has been updated");
            } else {                        //insert
                res.status(201).json("Image and comment has been added as a new article entry in the collection");
            }
        });

    })
    /*


    */
});

app.listen(3000);
console.log("MongoDb Images application adapted from Paul Roberts listening on localhost port %d", application_port)