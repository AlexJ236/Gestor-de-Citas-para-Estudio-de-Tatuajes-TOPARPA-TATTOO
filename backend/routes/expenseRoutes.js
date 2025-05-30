const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const authenticateToken = require('../middleware/authenticateToken');

router.use(authenticateToken);

router.post('/', expenseController.createExpense);
router.get('/', expenseController.getAllExpenses);
router.get('/:id', expenseController.getExpenseById);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;