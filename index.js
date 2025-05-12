import express from 'express';
import { Client } from 'pg';
import bodyParser from 'body-parser';

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

app.use(bodyParser.json());


// post route to create a book
app.post("/books", async (req, res) => {
    try {
        let title = req.body.title;
        let review = req.body.review;
        let rating = req.body.rating;
        let dateRead= new Date(req.body.dateRead);
        let authorLastName = req.body.authorLastName;
        await db.query("insert into books (title, review, rating, date_read, author_lastname) values ($1, $2, $3, $4, $5);", [title, review, rating, dateRead,  authorLastName]);
        res.status(200).send("Book created successfully!");
    } catch (error) {
        console.error("Error creating book:", error.detail);
        res.status(500).send("An error occurred while creating the book.");
    }
});

// get route to get all books
app.get("/books", async (_, res) => {
    try {
        const response = await db.query("select * from books");
        console.log(response.rows);
        res.status(200)
        .send(response.rows);
    } catch (error) {
        console.log(error);
        res.status(500).send("Error while fetching books.");
    }
});

// get a specific book using id
app.get("/books/:id", async (req, res) => {
    try {
        const response = await db.query("select * from books where id = $1", [req.params.id]);

        // check whether list of books is empty, i.e. no book was found
        if (response.rows.length == 0) {
            throw new Error("No book found.")
        }
        res.status(200).send(response.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(404).send(`Book with id ${req.params.id} not found.`);
    }
});

// update a specific book instance
app.patch("/books/:id", async (req, res) => {
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
        res.status(200).send("Book edited successfully!");
    } catch (error) {
        console.log(error);
        res.status(500).send("Error editing book instance.")
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
        let chapterId = req.body.chapterId;
        await db.query("insert into notes (text, book_id, chapter_id, created_at) values ($1, $2, $3, $4)", [text, req.params.bookId, chapterId, new Date()]);
        res.status(200).send("Note created successfully!");
    } catch (error) {
        console.log(error);
        res.status(500).send("Error while creating a new note.");
    }
});

// get route to get all notes from a book instance
// TODO

app.listen(port, () => {
    console.log(`Server is running on port ${port}...`)
});