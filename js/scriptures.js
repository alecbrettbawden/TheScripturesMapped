/*============================================================================
 * FILE:    scriptures.js
 * AUTHOR:  Stephen W. Liddle
 * DATE:    Winter 2019
 *
 * DESCRIPTION: Front-end JavaScript code for The Scriptures, Mapped.
 *              IS 542, Winter 2019, BYU.
 */
/*property
    books, forEach, fullName, getElementById, gridName, hash, id, init,
    innerHTML, length, log, maxBookId, minBookId, numChapters, onHashChanged,
    onerror, onload, open, parse, push, responseText, send, slice, split,
    status, substring, tocName
*/
/*global console */
/*jslint
    browser: true
    long: true */

const Scriptures = (function () {
    /*------------------------------------------------------------------------
     *                      CONSTANTS
     */
    const LAT_LON_PARSER = /\((.*),'(.*)',(.*),(.*),(.*),(.*),(.*),(.*),(.*),(.*),'(.*)'\)/;
    const SCRIPTURES_URL = "https://scriptures.byu.edu/mapscrip/mapgetscrip.php";

    /*------------------------------------------------------------------------
     *                      PRIVATE VARIABLES
     */
    let books;
    let gmMarkers = [];
    let volumes;

    /*------------------------------------------------------------------------
     *                      PRIVATE METHOD DECLARATIONS
     */
    let addMarker;
    let ajax;
    let bookChapterValid;
    let cacheBooks;
    let clearMarkers;
    let encodedScriptureUrlParameters;
    let getScriptureCallback;
    let getScriptureFailed;
    let init;
    let navigateBook;
    let navigateChapter;
    let navigateHome;
    let nextChapter;
    let onHashChanged;
    let previousChapter;
    let setupMarkers;
    let titleForBookChapter;

    /*------------------------------------------------------------------------
     *                      PRIVATE METHODS
     */
    addMarker = function (placename, latitude, longitude) {
        // NEEDSWORK: check to see if we already have this latitude/longitude
        //   in the gmMarkers array; if so, merge this new placename
        // NEEDSWORK: create the marker and append it to gmMarkers
    };

    ajax = function (url, successCallback, failureCallback, skipParse) {
        let request = new XMLHttpRequest();

        request.open("GET", url, true);

        request.onload = function () {
            if (request.status >= 200 && request.status < 400) {
                let data;

                if (skipParse) {
                    data = request.responseText;
                } else {
                    data = JSON.parse(request.responseText);
                }

                if (typeof successCallback === "function") {
                    successCallback(data);
                }
            } else {
                if (typeof failureCallback === "function") {
                    failureCallback(request);
                }
            }
        };

        request.onerror = failureCallback;
        request.send();
    };

    bookChapterValid = function (bookId, chapter) {
        let book = books[bookId];

        if (book === undefined || chapter < 0 || chapter > book.numChapters) {
            return false;
        }

        if (chapter === 0 && book.numChapters > 0) {
            return false;
        }

        return true;
    };

    cacheBooks = function (callback) {
        volumes.forEach(function (volume) {
            let volumeBooks = [];
            let bookId = volume.minBookId;

            while (bookId <= volume.maxBookId) {
                volumeBooks.push(books[bookId]);
                bookId += 1;
            }

            volume.books = volumeBooks;
        });

        if (typeof callback === "function") {
            callback();
        }
    };

    clearMarkers = function () {
        gmMarkers.forEach(function (marker) {
            marker.setMap(null);
        });

        gmMarkers = [];
    };

    encodedScriptureUrlParameters = function (bookId, chapter, verses, isJst) {
        if (bookId !== undefined && chapter !== undefined) {
            let options = "";

            if (verses !== undefined) {
                options += verses;
            }

            if (isJst !== undefined && isJst) {
                options += "&jst=JST";
            }

            return SCRIPTURES_URL + "?book=" + bookId + "&chap=" + chapter + "&verses" + options;
        }
    };

    getScriptureCallback = function (chapterHtml) {
        document.getElementById("scriptures").innerHTML = chapterHtml;
        setupMarkers();
    };

    getScriptureFailed = function () {
        console.log("Warning: unable to receive scripture content from server.");
    };

    init = function (callback) {
        let booksLoaded = false;
        let volumesLoaded = false;

        ajax("https://scriptures.byu.edu/mapscrip/model/books.php", function (data) {
            books = data;
            booksLoaded = true;

            if (volumesLoaded) {
                cacheBooks(callback);
            }
        });
        ajax("https://scriptures.byu.edu/mapscrip/model/volumes.php", function (data) {
            volumes = data;
            volumesLoaded = true;

            if (booksLoaded) {
                cacheBooks(callback);
            }
        });
    };

    navigateBook = function (bookId) {
        document.getElementById("scriptures").innerHTML = "<div>" + bookId + "</div>";

        /*
         * NEEDSWORK: generate HTML that looks like this (to use Liddle's styles.css):
         *
         * <div id="scripnav">
         *     <div class="volume"><h5>book.fullName</h5></div>
         *     <a class="btn chapter" id="1" href="#0:bookId:1">1</a>
         *     <a class="btn chapter" id="2" href="#0:bookId:2">2</a>
         *     ...
         *     <a class="btn chapter" id="49" href="#0:bookId:49">49</a>
         *     <a class="btn chapter" id="50" href="#0:bookId:50">50</a>
         * </div>
         *
         * (plug in the right strings for book.fullName and bookId in the example above)
         *
         * Logic for this method:
         * 1. Get the book for the given bookId.
         * 2. If the book has no numbered chapters, call navigateChapter() for
         *    that book ID and chapter 0.
         * 3. Else if the book has exactly one chapter, call navigateChapter() for
         *    that book ID and chapter 1.
         * 4. Else generate the HTML to match the example above.
         */
    };

    navigateChapter = function (bookId, chapter) {
        if (bookId !== undefined) {
            console.log(nextChapter(bookId, chapter));
            console.log(previousChapter(bookId, chapter));

            ajax(encodedScriptureUrlParameters(bookId, chapter), getScriptureCallback, getScriptureFailed, true);
        }
    };

    navigateHome = function (volumeId) {
        let navContents = "<div id=\"scripnav\">";

        volumes.forEach(function (volume) {
            if (volumeId === undefined || volumeId === volume.id) {
                navContents += "<div class=\"volume\"><a name=\"v" + volume.id + "\"/><h5>" +
                volume.fullName + "</h5></div><div class=\"books\">";

                volume.books.forEach(function (book) {
                    navContents += "<a class=\"btn\" id\"" + book.id + "\" href=\"#" +
                    volume.id + ":" + book.id + "\">" + book.gridName + "</a>";
                });

                navContents += "</div>";
            }
        });

        navContents += "<br /><br /></div>";

        document.getElementById("scriptures").innerHTML = navContents;
    };

    // Book ID and chapter must be integers
    // Returns undefined if there is no next chapter
    // Otherwise returns an array with the next book ID, chapter, and title
    nextChapter = function (bookId, chapter) {
        let book = books[bookId];

        if (book !== undefined) {
            if (chapter < book.numChapters) {
                return [bookId, chapter + 1, titleForBookChapter(book, chapter + 1)];
            }

            let nextBook = books[bookId + 1];

            if (nextBook !== undefined) {
                let nextChapterValue = 0;

                if (nextBook.numChapters > 0) {
                    nextChapterValue = 1;
                }

                return [
                    nextBook.id,
                    nextChapterValue,
                    titleForBookChapter(nextBook, nextChapterValue)
                ];
            }
        }
    };

    onHashChanged = function () {
        let ids = [];

        if (location.hash !== "" && location.hash.length > 1) {
            ids = location.hash.substring(1).split(":");
        }

        if (ids.length <= 0) {
            navigateHome();
        } else if (ids.length === 1) {
            let volumeId = Number(ids[0]);

            if (volumeId < volumes[0].id || volumeId > volumes.slice(-1).id) {
                navigateHome();
            } else {
                navigateHome(volumeId);
            }
        } else if (ids.length >= 2) {
            let bookId = Number(ids[1]);

            if (books[bookId] === undefined) {
                navigateHome();
            } else {
                if (ids.length === 2) {
                    navigateBook(bookId);
                } else {
                    let chapter = Number(ids[2]);

                    if (bookChapterValid(bookId, chapter)) {
                        navigateChapter(bookId, chapter);
                    } else {
                        navigateHome();
                    }
                }
            }
        }
    };

    // Book ID and chapter must be integers
    // Returns undefined if there is no previous chapter
    // Otherwise returns an array with the next book ID, chapter, and title
    previousChapter = function (bookId, chapter) {
        /*
         * Get the book for the given bookId.  If it's not undefined:
         *      If chapter > 1, it's the easy case.  Just return same bookId,
         *          chapter - 1, and the title string for that book/chapter combo.
         *      Otherwise we need to see if there's a previous book:
         *          Get the book for bookId - 1.  If it's not undefined:
         *              Return bookId - 1, the last chapter of that book, and the
         *                      title string for that book/chapter combo.
         * If we didn't already return a 3-element array of bookId/chapter/title,
         *      at this point just drop through to the bottom of the function.  We'll
         *      return undefined by default, meaning there is no previous chapter.
         */
        console.log(bookId, chapter);
    };

    setupMarkers = function () {
        if (gmMarkers.length > 0) {
            clearMarkers();
        }

        document.querySelectorAll("a[onclick^=\"showLocation(\"]")
            .forEach(function (element) {
                let matches = LAT_LON_PARSER.exec(element.getAttribute("onclick"));

                if (matches) {
                    let placename = matches[2];
                    let latitude = matches[3];
                    let longitude = matches[4];
                    let flag = matches[11];

                    if (flag !== "") {
                        placename += " " + flag;
                    }

                    addMarker(placename, latitude, longitude);
                }
            });
    };

    titleForBookChapter = function (book, chapter) {
        if (chapter > 0) {
            return book.tocName + " " + chapter;
        }

        return book.tocName;
    };

    /*------------------------------------------------------------------------
     *                      PUBLIC API
     */
    return {
        init: init,
        onHashChanged: onHashChanged
    };
}());
