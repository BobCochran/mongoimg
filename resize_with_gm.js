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

var fs = require('fs')
var gm = require('gm')
var my_user = process.env['HOME']  //Mac OS X: the user's Home directory

gm(my_user + '/Downloads/mongoimg/mongodb_presentation_images/IMG_1785.JPG')
.options({imageMagick: true})
.resize(650)
.write(my_user + '/Downloads/mongoimg/mongodb_presentation_images/IMG_1785_resized_650.JPG', function (err) {
        if (err) {

            console.log(err)
        }
        if (!err) {
            console.log("The image was resized to 650px successfully.")
        }

    })
/* See if we can use readsFileSync, which reads the image into a Buffer, and then
 * resize the image contained in the buffer first to 750px, and then to 650px, in separate
 * processing with the gm utility. It seems best to wait 2 seconds for the above resize to process
 *
 */

setTimeout(function() {
    console.log("\nNow attempting to resize an image contained in a buffer which is then passed to gm")
    var buf = fs.readFileSync(my_user + '/Downloads/mongoimg/mongodb_presentation_images/IMG_1786.JPG')
    gm(buf, my_user + '/Downloads/mongoimg/mongodb_presentation_images/IMG_1786.JPG')
     .options({imageMagick: true})
     .resize(750)
     .write(my_user + '/Downloads/mongoimg/mongodb_presentation_images/IMG_1786_resized_750.JPG', function (err) {
            if (err) {
                console.log(err)
            }
            if (!err) {
                console.log('\nThe image was resized to 750px successfully.')
            }
        })

    /* Now try a second resize action on the same buffer, but resize to 650px */

    gm(buf, my_user + '/Downloads/mongoimg/mongodb_presentation_images/IMG_1786.JPG')
        .options({imageMagick: true})
        .resize(650)
        .write(my_user + '/Downloads/mongoimg/mongodb_presentation_images/IMG_1786_resized_650.JPG', function (err) {
            if (err) {
                console.log(err)
            }
            if (!err) {
                console.log('\nThe image was resized to 650px successfully.')
            }
        })

}, 2000)
