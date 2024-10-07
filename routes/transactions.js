const express = require('express');
const {   
    getTransactionsByMonth,
    getStatistics,
    getBarChartData,
    getPieChartData,
    setData,
    getCombinedData
} = require('../controllers/transactionController');

const router = express.Router();

router.get('/set-data', setData);
router.get('/list', getTransactionsByMonth);
router.get('/statistics', getStatistics);
router.get('/bar-chart', getBarChartData);
router.get('/pie-chart', getPieChartData);
router.get('/combined-data', getCombinedData); 

module.exports = router;
