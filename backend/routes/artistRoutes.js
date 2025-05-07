const express = require('express');
const router = express.Router();
const artistController = require('../controllers/artistController');
const authenticateToken = require('../middleware/authenticateToken');

router.use(authenticateToken);

router.get('/', artistController.getAllArtists);
router.post('/', artistController.createArtist);
router.get('/:id', artistController.getArtistById);
router.put('/:id', artistController.updateArtist);
router.delete('/:id', artistController.deleteArtist);

module.exports = router;