import express from 'express';
import broadcastRoutes from './broadcast.routes.js';

const router = express.Router();

router.get('/', (req, res) => {
    res.send('Hello World!');
});

router.use('/broadcast', broadcastRoutes);

export default router;
