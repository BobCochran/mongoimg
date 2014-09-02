/* This code attempts to test the GraphicsMagick for Node.js ('gm') utility in a simple way.
 * First, try to resize a file living on the file system, and write the output to a new file
 * which is also on the file system. Resizing a file in this way appears to work, but on Mac OS X
 * you may need to set the options to {ImageMagick: true} and hope that the Imagemagick binaries
 * can be found by the utility. At least for me, gm will fail with this message unless I set the
 * options to have ImageMagick process:
 *
 * { [Error: spawn ENOENT] code: 'ENOENT', errno: 'ENOENT', syscall: 'spawn' }
 *
 */
var MongoClient = require('mongodb').MongoClient  // Driver for connecting to MongoDB
    , format = require('util').format;

var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
var mongoport = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : 27017;

var fs = require('fs')
var gm = require('gm')
var my_user = process.env['HOME']  //Mac OS X: the user's Home directory

gm(my_user + '/Downloads/mongoimg/mongodb_presentation_images/IMG_1785.JPG')
.options({imageMagick: true})
.resize(850)
.write(my_user + '/Downloads/mongoimg/mongodb_presentation_images/IMG_1785_resized_850.JPG', function (err) {
        if (err) {

            console.log(err)
        }
        if (!err) {
            console.log("The image was resized.")
        }

    })
