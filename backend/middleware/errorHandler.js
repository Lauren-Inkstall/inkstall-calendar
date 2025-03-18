const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' 
            ? 'Internal Server Error' 
            : err.message
    });
};

const notFound = (req, res) => {
    res.status(404).json({ error: 'Not Found' });
};

export { errorHandler, notFound };
