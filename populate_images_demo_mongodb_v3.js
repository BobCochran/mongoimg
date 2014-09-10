/*************************************************************************
 * NODE.JS SCRIPT TO POPULATE A MONGODB 'demoimages' collection of images*
 * 2014-09-06                                                            *
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
var gm = require('gm')  // enable image resizing. Requires "ImageMagick" option.

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

var im_array = []             // multidimensional array of image names, file names, image content
var im_array_750 = []         // same as above but for images resized to 750 px
var im_array_650 = []         // same as above but for images resized to 650 px
var im_array_550 = []         // same as above but for images resized to 550 px

for(i = 0; i < array_lines; i++) {
    im_array[i] = [];
    im_array_750[i] = []
    im_array_650[i] = []
    im_array_550[i] = []
    for (var y = 0; y < 3; y++) {
        im_array[i][y] = ""
        im_array_750[i][y] = ""
        im_array_650[i][y] = ""
        im_array_550[i][y] = ""
    }
}

/* ReadableStream objects for text files do seem to work. ReadableStream objects
 * for binary files such as images are a ton of trouble.
 */
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
          im_array_550[j1][j2] = fn1          // for all defined arrays
          im_array_650[j1][j2] = fn1
          im_array_750[j1][j2] = fn1

          fn1 = fn1 + '.JPG'                      // append the .jpg extension
          j2++                                    // bump to next element in j1
          im_array[j1][j2] = fn1                  // push this onto the array
          im_array_550[j1][j2] = fn1              // for all defined arrays
          im_array_650[j1][j2] = fn1
          im_array_750[j1][j2] = fn1
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

    setTimeout(function credits_tmout() {
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
 get_credits() and attempts to create a Buffer of the file. Then it attempts to
 save that Buffer to im_array[pj][2].

 The buffer of this image is then resized to 3 different resolutions:
     750px
     650px
     550px
 Using the 'gm' utility for resizing. The resized images are written by the utility
 to a new buffer. These buffers are then saved to the array which was created for that
 image size, e.g. if we resize the image to 750px, we save the resized buffer to
 im_array_750[idx][2]. In this way we will have an entire list of images which have
 been resized to 750px. We invoke gm twice more for a total of 3 times, to resize images
 to the desired resolutions.

 */
function get_photo_info(fname,idx) {

    var the_image = ""


    stream = fs.readFileSync(my_user + '/Downloads/mongoimg/mongodb_presentation_images/' + fname)

    im_array[idx][2] = stream

    /* Resize the image to 750px. */

    gm(stream, my_user + '/Downloads/mongoimg/mongodb_presentation_images/' + fname)
        .options({imageMagick: true})
        .resize(750)
        .toBuffer('JPG', function (err1, buffer1) {
            if (err1) {
                console.log(err1)
            }
            if (!err1) {
                console.log('\nThe image ' + fname + ' was resized to 750px successfully.')
                im_array_750[idx][2] = buffer1
            }
        }
    )

     /* Let us resize stream to 650 inside the callback. */

      gm(stream, my_user + '/Downloads/mongoimg/mongodb_presentation_images/' + fname)
          .options({imageMagick: true})
          .resize(650)
          .toBuffer('JPG', function (err2, buffer2) {
              if (err2) {
                  console.log(err2)
              }
              if (!err2) {
                  console.log('The image ' + fname + ' was resized to 650px successfully.')
                  im_array_650[idx][2] = buffer2
              }
         }
      )

      /* Let us resize stream to 550 px inside this callback. */

      gm(stream, my_user + '/Downloads/mongoimg/mongodb_presentation_images/' + fname)
          .options({imageMagick: true})
          .resize(550)
          .toBuffer('JPG', function (err3, buffer3) {
              if (err3) {
                  console.log(err3)
              }
              if (!err3) {
                  console.log('The image ' + fname + ' was resized to 550px successfully.')
                  im_array_550[idx][2] = buffer3
              }
          }
      )
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
    /* At this point, we now have an array all ready to insert data into the collection 'demoimages' in the
     * images database. We will use db.demoimages.insert() to add a new document to the demoimages
     * collection. For each document, there will be a key "fn" with the value of the image filename
     * and another key "image" containing the base64 image.
     */

    /* wait 35 seconds and hope read operations are done */
    setTimeout(function db_updates_tmout() {
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
                setTimeout(function demoimg_tmout() {
                    console.log('\nSuccessfully updated demoimages collection. Now doing d750 collection...')

                },30000)

            }

            var collection2 = db.collection('d750')

            for (var i = 0; i < im_array_750.length; i++) {
                /* collection.insert  */
                var img2 = new MongoBin(im_array_750[i][2])


                collection2.insert([
                    { "fn": im_array_750[i][0],
                        "image": img2
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
                setTimeout(function d750_tmout() {
                    console.log('\nSuccessfully updated d750 collection. Now doing d650 collection...')

                },10000)

            }

            var collection3 = db.collection('d650')

            for (var i = 0; i < im_array_650.length; i++) {
                /* collection.insert  */
                var img3 = new MongoBin(im_array_650[i][2])


                collection3.insert([
                    { "fn": im_array_650[i][0],
                        "image": img3
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
                setTimeout(function d650_tmout() {
                    console.log('\nSuccessfully updated d650 collection. Now doing d550 collection...')

                },10000)

            }

            var collection4 = db.collection('d550')

            for (var i = 0; i < im_array_550.length; i++) {
                /* collection.insert  */
                var img4 = new MongoBin(im_array_550[i][2])


                collection4.insert([
                    { "fn": im_array_550[i][0],
                        "image": img4
                    }
                ], { w: 1 }, function (err, result) {
                    if (err && err.name === "MongoError" && err.code === 11000) {
                        console.log(err)
                        return
                    } else if (err) {
                        throw err
                    }
                })
                /* wait 35 seconds and hope write operations are done */
                setTimeout(function d550_tmout() {
                    console.log('\nSuccessfully updated d550 collection.')
                    db.close()
                },35000)

            }

        })
    },35000)

   }
