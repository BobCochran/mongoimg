/*************************************************************************
 * NODE.JS SCRIPT TO POPULATE A MONGODB 'demoimages' collection of images*
 * 2014-08-23                                                            *
 *                                                                       *
 * To start the script, use this command line in a shell window:         *
 * node populate_images_demo_mongodb_v1.js startline endline             *
 *                                                                       *
 * for example                                                           *
 *                                                                       *
 * node populate_images_demo_mongodb_v1.js 1 240                         *
 *                                                                       *
 * Tells the script to start processing at line 1 and terminate          *
 * processing at line 240. Depending on your system and available memory,*
 * 240 open file descriptors at one time may be too many to have, so     *
 * process fewer lines per pass.                                         *
 *                                                                       *
 * The script processes in small passes to account for system overhead in*
 * using up too many file descriptors.                                   *
 *-----------------------------------------------------------------------*
 * This version writes small pieces of the beginning and end of the input*
 * photos to the file system so that the data can be dumped and examined.*
 * ----------------------------------------------------------------------*
 * 2014-06-14                                                            *
 * ----------------------------------------------------------------------*
 * Read the fn_list.txt file as a readable stream.                       *
 * The input file has been reformatted from a Microsoft Windows formatted*
 * file containing carriage returns and line feed characters '\r\n' to a *
 * Unix style file with only '\n' terminating each line. Also, empty tab-*
 * separated lines in the format '\t\t\t\t\n' appended to the end of the *
 * original source input file were removed.                              *
 * The goal in this script is to extract the filename contained in each  *
 * row of the source file and append the extension .jpg (period,         *
 * character j, character p, character g) to this name.                  *
 *                                                                       *
 * Then read this *.jpg file with fs.read.                               *
 *                                                                       *
 * Next, add or update this document to the collection 'demoimages' of   *
 * the 'images' database.                                                *
 *                                                                       *
 *------------------------- S T E P S -----------------------------------*
 *                                                                       *
 * 1. Extract filename from the current input line of the                *
 *    'fn_list.txt' file.                                                *
 *    Example: IMG_1785                                                  *
 * 2. Save this filename prefix to a multidimensional array.             *
 * 3. Append a '.JPG' extension to the extracted filename.               *
 *   IMG_1785.JPG                                                        *
 * 4. Save the [filename].jpg element to the same multimensional array as*
 *    in step 2. The array element now looks like                        *
 *    [["IMG_1785", "IMG_1785.JPG",...]]                                 *
 * 5. Iterate to the next line of the fn_list.txt input file             *
 *    listed in Step 1. Repeat steps 1-4, building up the multi-         *
 *    dimensional array with the elements for the next line of the input *
 *    file. So element #1 will look like this:                           *
 *    [["IMG_1785", "IMG_1785.JPG",...],                                 *
 *     ["IMG_1784", "IMG_1784.JPG",...]...]                              *
 *    Do this in passes of 25 to 240 files.                              *
 *                                                                       *
 * 6. Now, working from the very beginning of the multidimensional array *
 *    that we have built, attempt to open a file matching the            *
 *    Filename.jpg string that is at that index in our array. Example:   *
 *    open 'IMG_1785.JPG'. This is a binary file and probably must       *
 *    be opened in base64 encoding.                                      *
 * 7. Attempt to read the file if the open succeeds.                     *
 *    read 'IMG_1785.JPG'                                                *
 * 8. Save the jpg file and the file name to a MongoDB collection named  *
 *    'demoimages'.                                                      *
 *                                                                       *
 * 9. With 25 to 240 images ready in the array, open a MongoDB           *
 *    connection to the 'demoimages' collection of the 'images'          *
 *    database.                                                          *
 *10. This script will attempt to update each matching document within   *
 *    the 'demoimages' collection of the 'images' database with the      *
 *    images just extracted from the jpg files.                          *
 *-----------------------------------------------------------------------*
 * Target database engine: MONGODB 2.6.3                                 *
 * Required node.js module: mongodb                                      *
 * It can take time for this script to complete all the inserts for the  *
 * demoimages collection. If you abort the script by pressing CTRL-D or  *
 * CTRL-C the database inserts will most likely not complete.            *
 *                                                                       *
 * Changes were made by Robert Cochran. Bob can be emailed on            *
 * r2cochran2@gmail.com.                                                 *
 *                                                                       *
 ************************************************************************/
var fs = require('fs');
var totalLines = 0
var j1 = 0              // first dimension of im_array
var j2 = 0              // second dimension of im_array
var stream              // for use in parsing for photographer name
var startLn = 0         // the starting line for this processing "pass"
var endLn = 0           // the ending line for this processing "pass"
var actLines = 0        // the actual number of text lines that readLines has found
var webRows = 0         // count of web page row numbers, starting from 1
var array_lines = 0     // the number of array iterations we need
//var the_image = ""      // content of image read by fs.ReadStream
var my_user = process.env['HOME']  //Mac OS X: the user's Home directory

var MongoClient = require('mongodb').MongoClient
    , format = require('util').format;

var MongoBin = require('mongodb').Binary;

var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : 27017;

/* Were any arguments passed in? Exit if none found */

if (process.argv.length < 3) {
    console.log('You must pass in the starting and ending line numbers as arguments to this script')
    console.log('The number of arguments found were ' + process.argv.length)
    console.log('Terminating processing')
    process.exit(1)
}

/* Get the command line arguments passed to this script */

process.argv.forEach(function(val, index, array) {
    console.log(index + ': ' + val);
    if (index === 2) {
        startLn = val
        webRows = val
    }
    if (index == 3) {
        endLn = val
    }
});

array_lines = ((endLn - startLn) + 1)      //compute number of iterations

console.log('startLn is ' + startLn)
console.log('endLn is ' + endLn)
console.log('Number of iterations in the array will be ' + array_lines + '\n')

/* Set up an [lines being processed] x 3 array */

var im_array = []             // multidimensional array of image names, file names, photographer names
for(i = 0; i < array_lines; i++) {
    im_array[i] = [];
    for (var y = 0; y < 3; y++) {
        im_array[i][y] = ""
    }
}

var input = fs.createReadStream(my_user + '/Downloads/mongoimg/fn_list.txt');

readLines(input, func);
get_credits()
/*
 * Wait 20 seconds to let other processes complete, then print some basic file
 * information to the console.
 * Then perform the database updates.
 *
 */
setTimeout(function () {
    do_array_print()
    do_db_updates()
},20000)


function readLines(input, func) {
      var remaining = '';

      input.on('data', function(data) {
      remaining += data;
      var index1 = remaining.indexOf('\n');
      while (index1 > -1) {
          var line = remaining.slice(0, index1);
          remaining = remaining.slice(index1 + 1);
          totalLines += 1
          // Skip the header line.
          if (totalLines === 1) {
             index1 = remaining.indexOf('\n')
             continue
          }
          actLines += 1                           // actual number of content lines minus header line

          //discover if the line we are on is the line to start processing
          if (actLines < startLn) {
              index1 = remaining.indexOf('\n')
              continue
          }

          //discover if the line we are on is past the ending line number
          //that we want to process for this pass
          if (actLines > endLn) {
              index1 = remaining.indexOf('\n')
              continue
          }

          index1 = remaining.indexOf('\n')        // recompute value of index1
          var tbbl = line.indexOf('\t')           // find the index of the tab character
          if (line[0] === '\"') {                 // check to see if the filename string is quoted
              var fn1 = line.slice(1,(tbbl-1))    //skip the quotes
          } else {
              var fn1 = line.slice(0, tbbl)        // save the file name string up to the tab character
          }
          debugger
          im_array[j1][j2] = fn1              // save the filename string without an extension

          fn1 = fn1 + '.JPG'                      // append the .jpg extension
          j2++                                    // bump to next element in j1
          im_array[j1][j2] = fn1                  // push this onto the array
          j2 = 0                                  // reset j2
          j1++                                    // set up the next array
          debugger

  }
})

  input.on('end', function() {
    if (remaining.length > 0) {
      func(remaining);
    }
    console.log('\nTotal number of lines processed including input header row: ' + totalLines + '\n')

  })
    }
/*
 * At this point, we have extracted all the filenames from the source TSV document and these
 * are waiting for us in the array im_array. The array now looks like this:
 *
 * [["IMG_1786", "IMG_1786.JPG", ...],["IMG_1785", "IMG_1786.JPG",...]...]
 *
 * For each file name in the array[j1][j2], we want to call a function that will
 * create a readstream of that images's contents. The image will be put into im_array[j1][2].
 *
 * After all the file names are processed, we can update the 'demoimages' collection documents with
 * corresponding images.
 *
 */
function get_credits() {

    setTimeout(function () {
        process.stdout.write('\nProcessing files...\n')
        for(var pj = 0; pj < im_array.length; pj++) {
            process.stdout.write(im_array[pj][0] + '... ')
            the_image = null
            get_photo_info(im_array[pj][1],pj)
            process.stdout.write('done!\n')
        }
    }, 35000)


}
/*
 This function accepts an input file name in the format filename.jpg from function
 get_credits() and attempts to create a readstream of the file. Then it attempts to
 parse out the photographer's name and save that to im_array[pj][2].
 */
function get_photo_info(fname,idx) {

    var the_image = ""


    stream = fs.createReadStream(my_user + '/Downloads/mongoimg/mongodb_presentation_images/' + fname, { flags: 'r', encoding: 'ascii' })

    stream.on("error", function(err) {

        return console.error("open file error " + err.message)

    })
    stream.on("open", function(fd) {
        fs.fstat(fd, function(err, stats) {
            var size
            if (err) {
                return console.error("fstat error: " + err.message)

            } else {
                size = stats.size

                if (size > 12582912) {
                    return console.error("File too large for one MongoDB document: " + fname + " " + size)
                }


            }
        })
    })
    stream.on("data", function(data1) {

        the_image += data1

        console.log("Got %d bytes of data ", data1.length)


    })

    stream.on("end", function() {
        //dump the streamed-in image into the console so we can see the
        //hex
        var my_image_length = the_image.length;
        //var my_image_start = the_image.slice(0,256)

        console.log('Length of this image\n' + my_image_length)
        var base64 = new Buffer(the_image, 'binary').toString('base64')

        im_array[idx][2] = base64


        //fs.writeFileSync(my_user + '/Downloads/mongoimg/mongodb_presentation_images/' + fname + '_chunk', buf2.toString('ascii',0,25));

    })
}

function func(data) {
  console.log('Line: ' + totalLines + ' ' + data);
 
}
function do_array_print() {
    console.log('Image name\tFilename\n')
    for (var i = 0; i < im_array.length; i++) {
        console.log(im_array[i][0] + '\t' + im_array[i][1])
    }
}
function do_db_updates() {
    /* At this point, we now have an array all ready to insert the collection 'demoimages' in the
     * images database. We will use db.demoimages.insert() to add a new document to the demoimages
     * collection. For each document, there will be a key "fn" with the value of the image filename
     * and another key "image" containing the base64 image.
     */

    /* wait 35 seconds and hope read operations are done */
    setTimeout(function () {
        console.log("\nUpdating database collection.");
        console.log("\nConnecting to database server on " + host + ":" + port +"\n");
        /* Connect to the 'images' database to test out the logic. Turn on journaling. */

        MongoClient.connect(format("mongodb://%s:%s/images?journal=true", host, port), function(err, db) {
            if (err) {
                throw err
                return
            }

            var collection = db.collection('demoimages')

            for (var i = 0; i < im_array.length; i++) {
                /* collection.insert  */
                var img1 = new MongoBin(im_array[i][2])


                collection.insert([
                    { "fn": im_array[i][0],
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
                /* wait 30 seconds and hope write operations are done */
                setTimeout(function () {
                    db.close()
                },30000)

            }
        })
    },35000)

   }
