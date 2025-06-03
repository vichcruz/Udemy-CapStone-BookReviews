import express from 'express';
import { Client } from 'pg';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';

const db = new Client({
    user: "postgres",
    host: "localhost",
    database: "BookReview",
    password: "aNjykJxJnbU9@_DL-TRN8Y7mtDCe9YCcHXVTeWJ_fgV@cRtgQH",
    port: 5433,
});

try {
    await db.connect();
    console.log("Connected to the database.")
} catch (error) {
    console.error("Error connecting to the database.")
}

const app = express();
const port = 3000;

app.use(methodOverride('_method'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"))


// get route to render book creation page
app.get("/add-book", (_, res) => {
    res.render('bookCreation.ejs', {
        showOrderButton: false,
        showSearchBar: false,
        showAddBookButton: false
    });
});

// get route to render book detail page
app.get("/book-detail/:id", async (req, res) => {
    try {
        const response = await db.query("select * from books where id = $1", [req.params.id]);

        // check whether list of books is empty, i.e. no book was found
        if (response.rows.length == 0) {
            throw new Error("No book found.")
        }

        const notes = await db.query("select * from notes where book_id = $1 order by created_at", [req.params.id]);
        console.log(notes.rows);

        const chapters = await db.query("select * from chapters where book_id = $1 order by position_in_book", [req.params.id]);
        console.log(chapters.rows);

        res.status(200)
            .render('bookDetailView.ejs', {
                showAddBookButton: false,
                showOrderButton: false,
                showSearchBar: false,
                bookDetail: response.rows[0],
                notes: notes.rows,
                chapters: chapters.rows
            });
    } catch (error) {
        console.log(error);
        res.status(404).send(`Book with id ${req.params.id} not found.`);
    }
});

// get route to render note creation page
app.get("/add-note/:bookId", async (req, res) => {
    try {
        const result = await db.query(`select * from chapters where book_id = ${req.params.bookId} order by position_in_book`);
        res.render('noteCreation.ejs', {
            showAddBookButton: false,
            showOrderButton: false,
            showSearchBar: false,
            chapters: result.rows,
            bookId: parseInt(req.params.bookId, 10)
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Error while rendering note creation page.')
    }
});

// get route to render edit book page
app.get("/edit-book/:bookId", async (req, res) => {
    try {
        const response = await db.query("select * from books where id = $1", [req.params.bookId]);
        res.render('editBook.ejs', {
            showAddBookButton: false,
            showOrderButton: false,
            showSearchBar: false,
            book: response.rows[0]
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occurred while redering book edit page.");
    }
});

// post route to create a book
app.post("/books", async (req, res) => {
    try {
        let title = req.body.title;
        let review = req.body.review;
        let rating = req.body.rating;
        let dateRead= new Date(req.body.dateRead);
        let authorLastName = req.body.author;
        let isbn = req.body.isbn;
        console.log(req.body);
        
        const newBook = await db.query("insert into books (title, review, rating, date_read, author_lastname, isbn) values ($1, $2, $3, $4, $5, $6) returning id;", [title, review, rating, dateRead,  authorLastName, isbn]);

        let position = 1;
        for (const chapter of req.body.chapters) {
            await db.query("insert into chapters (position_in_book, title, book_id) values ($1, $2, $3);", [position, chapter, newBook.rows[0].id]);
            position++;
        };

        res.status(200).redirect('/')
    } catch (error) {
        console.error("Error creating book:", error);
        res.status(500).send("An error occurred while creating the book.");
    }
});

// update a specific book instance
app.put("/books/:id", async (req, res) => {
    try {
        const oldReponse = await db.query("select * from books where id = $1", [req.params.id]);
        const oldBook = oldReponse.rows[0];

        // throw error if nothing was sent to the server
        if (!req.body) {
            throw Error("Need to make at least one change.");
        }

        let title = req.body.title;
        let review = req.body.review;
        let rating = req.body.rating;
        let dateRead= req.body.dateRead;
        let authorLastName = req.body.authorLastName;

        // only update field if request had that field
        await db.query("update books set title = $1, review = $2, rating = $3, date_read = $4, author_lastname = $5 where id = $6", [
            title ? title : oldBook.title,
            review ? review : oldBook.review,
            rating ? rating : oldBook.rating,
            dateRead ? new Date(dateRead) : oldBook.date_read,
            authorLastName ? authorLastName : oldBook.author_lastname,
            req.params.id
        ]);
        res.status(200).redirect(`/book-detail/${req.params.id}`);
    } catch (error) {
        console.log(error);
        res.status(500).send("Error editing book instance.");
    }
});

// delete a specific book instance
app.delete("/books/:id", async (req, res) => {
    try {
        const response = await db.query("Select * from books where id = $1", [req.params.id]);

        console.log(response.rows.length);

        if (response.rows.length == 0) {
            res.status(404).send("Book to be deleted doesn't exist.");
        }

        await db.query("delete from books where id = $1", [req.params.id]);
        res.status(200).send("Book deleted successfully.");
    } catch (error) {
        console.log(error);
        res.status(500).send("Error while deleting book instance.");
    }
});

// post route to create a new note
app.post("/notes/:bookId", async (req, res) => {
    try {
        let text = req.body.text;
        let chapterId = req.body.chapter;
        await db.query("insert into notes (text, book_id, chapter_id, created_at) values ($1, $2, $3, $4)", [text, req.params.bookId, chapterId, new Date()]);
        res.status(200).redirect(`/book-detail/${req.params.bookId}`);
    } catch (error) {
        console.log(error);
        res.status(500).send("Error while creating a new note.");
    }
});

// patch route to update specific note
app.patch("/notes/:noteId", async (req, res) => {
    try {
        const oldResponse = await db.query("select * from notes where id = $1", [req.params.noteId]);
        const oldNote = oldResponse.rows[0];

        let text = req.body.text ? req.body.text : oldNote.text;

        const result = await db.query("update notes set text = $1 where id = $2", [text, req.params.noteId]);

        res.status(200).send("Note edited successfully!");
    } catch (error) {
        console.log(error);
        res.status(500).send("An error occurred while updating note.")
    }
});

// delete route for note
app.delete("/notes/:noteId", async (req, res) => {
    try {
        await db.query("delete from notes where id = $1", [req.params.noteId]);

        res.status(200).send("Note deleted successfully!");
    } catch (error) {
        res.status(500).send("An error occurred while deleting note.");
    }
});

// delete route for chapters
app.delete("/chapters/:chapterId", async (req, res) => {
    try {
        const response = await db.query("select * from chapters where id = $1", [req.params.chapterId]);

        // first check whether that chapter exists
        // otherwise no error will be thrown even if chapter doesn't exist
        if (response.rows.length === 0) {
            res.status(404).send("Chapter not found.");
        }

        await db.query("delete from chapters where id = $1", [req.params.chapterId]);

        res.status(200).send("Chapter deleted successfully!");
    } catch (error) {
        console.log(error);
        res.status(500).send("Error occurred while deleting chapter.");
    }
});

// home route
app.get("/", async (_, res) => {
    try {
        const response = await db.query("select * from books");
        console.log(response.rows);
        res.status(200)
        .render("overview", {
            showOrderButton: true,
            showSearchBar: true,
            showAddBookButton: true,
            allBooks: response.rows
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Error while fetching books.");
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}...`);
});