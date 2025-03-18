const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://inkstall.in']
        : '*',
    methods: ['GET', 'POST', 'PUT','PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400,
};

export default corsOptions;