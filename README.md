# Udemy-CapStone-BookReviews

Capstone Project in Udemy Full-Stack Course where I created a book review web app.

# Setup

## Git Repository

Run the command `git clone https://github.com/vichcruz/Udemy-CapStone-BookReviews.git` to clone the repository.

## NPM Packages

Run the command `npm install` to install all packages defined in the `package.json` file.

## Database

Create a PostgreSQL database and run the SQL code found in `BookReview.sql` to create the necessary tables and constraints.

## Environment Variables

Set the following environment variables as needed (you can use a `.env` file):

```
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=BookReview
```

# Project Structure

```
/views         # EJS templates
/public/css    # CSS file created by Tailwind
/src/css       # edited CSS file for Tailwind
/routes        # Express route handlers
index.js       # Main server file
```

# Usage

- Search for books by title.
- Add, edit, and delete books.
- Add notes and chapters to books.
- View book details and notes.

# Run the app

Using the `npm run dev` you start the application. The web app can be launched in the browser at `localhost:3000`.

# Testing

Currently, there are no automated tests. You can manually test the app by adding, editing, and deleting books and notes through the UI.

# Troubleshooting

- **Database connection errors:** Check your environment variables and ensure PostgreSQL is running.
- **Port conflicts:** Make sure nothing else is running on port 3000.

# Limitations and room for improvement

- The frontend is not optimised for screen-sizes smaller than 1024px.
- There are no automated tests.
