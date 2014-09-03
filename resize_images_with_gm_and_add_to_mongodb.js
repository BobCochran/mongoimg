/* This code attempts to test the GraphicsMagick for Node.js ('gm') utility in a simple way.
 *
 *  If you get this error:
 *
 * { [Error: spawn ENOENT] code: 'ENOENT', errno: 'ENOENT', syscall: 'spawn' }
 *
 * You may need to use this option statement to the gm utility:
 *
 * .options({imageMagick: true})
 *
 */
var MongoClient = require('mongodb').MongoClient  // Driver for connecting to MongoDB
    , format = require('util').format;

var MongoBin = require('mongodb').Binary;

var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
var mongoport = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : 27017;

var fs = require('fs')
var gm = require('gm')
var my_user = process.env['HOME']  //Mac OS X: the user's Home directory

/* Let us see if we can read (with readFileSync) an image file, then resize that file, then
save the file to a MongoDB collection named 'd750' (for a size of 750 pixels).

 *
 */

// Connect to the 'images' database. We eventually want to create or add to a collection named 'd750'.

MongoClient.connect(format("mongodb://%s:%s/images?journal=true", host, mongoport), function (err, db) {

    if (err) {
        throw err
        return
    }

    console.log("Connected to database server on host " + host + ":" + mongoport)

    /* Let's read in a test file. */

    var buf = fs.readFileSync(my_user + '/Downloads/mongoimg/mongodb_presentation_images/IMG_1843.JPG')

    /* This gives us a Buffer we can work with. It is named 'buf' */

    gm(buf, my_user + '/Downloads/mongoimg/mongodb_presentation_images/IMG_1843.JPG')
        .options({imageMagick: true})
        .resize(750)
        .toBuffer('JPG', function (err, buffer1) {
            if (err) {
                console.log(err)
            }
            if (!err) {
                console.log('\nThe image was resized to 750px successfully. Beginning database operations.')

                /* Do all our database work inside gm's callback.
                 * Convert the buffer1 that gm returned to us to a MongoDB bson image */

                var img1 = new MongoBin(buffer1)

                /* Save the filename plus the image into a collection named 'd750' */

                db.collection("d750", function (err, collection) {
                    collection.insert([
                        { "fn": "IMG_1843_resized_750",
                            "image": img1
                        }
                    ], { w: 1 }, function (err, result) {
                        if (err && err.name === "MongoError" && err.code === 11000) {
                            console.log(err)
                            return
                        } else if (err) {
                            throw err
                        }
                    })
                })

                /* To save a little time, let save the image to the 'demoimages' collection
                 * because file app3.js has an Express.js "route" for displaying every image
                 * in this collection to a web page, and we know the route does work. So this
                 * will allow us to quickly verify if the image is corrupted or not.
                 *
                 *
                db.collection("demoimages", function (err,collection) {
                    collection.insert([
                        { "fn": "IMG_1843_resized_750",
                            "image": img1
                        }
                    ], { w: 1 }, function (err, result) {
                        if (err && err.name === "MongoError" && err.code === 11000) {
                            console.log(err)
                            return
                        } else if (err) {
                            throw err
                        }
                    })
                })

                */
            }
        })

 setTimeout( function() {
     db.close()
     console.log('\nTest database operations have been successfully completed\n')
 }, 15000)

})