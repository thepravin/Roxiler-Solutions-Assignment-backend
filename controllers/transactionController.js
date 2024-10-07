const Transaction = require("../models/Transaction");
const axios = require("axios");

// Initialize database with seed data
exports.setData = async (req, res) => {
  try {

    const response = await fetch(
      "https://s3.amazonaws.com/roxiler.com/product_transaction.json"
    );

   
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }


    const data = await response.json();

  
    // console.log("Data: ", data);


    await Transaction.insertMany(data);

    // Send a success response to the client
    res.status(200).json({ message: "Database seeded successfully" });
  } catch (error) {
    
    console.error("Error seeding data: ", error);
    res.status(500).json({ error: "Error seeding data" });
  }
};

// List all transactions
exports.getTransactionsByMonth = async (req, res) => {
  const { month } = req.query;

  // Convert month to a number and validate
  const monthNum = Number(month);
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return res
      .status(400)
      .json({
        error:
          "Invalid month provided. Please provide a month between 1 and 12.",
      });
  }

  try {
    // Fetch transactions for the specified month across all years
    const transactions = await Transaction.find({
      $expr: {
        $eq: [{ $month: "$dateOfSale" }, monthNum],
      },
    });

    // console.log('Fetched Transactions:', transactions); // Log the transactions fetched

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Error fetching transactions" });
  }
};

// Statistics for the selected month
exports.getStatistics = async (req, res) => {
  const { month } = req.query;

 
  const monthNum = Number(month);
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return res
      .status(400)
      .json({
        error:
          "Invalid month provided. Please provide a month between 1 and 12.",
      });
  }
  try {
   
    const data = await Transaction.find({
      $expr: {
        $eq: [{ $month: "$dateOfSale" }, monthNum],
      },
    });

    let sales = 0;
    let soldItems = 0;
    let notSoldItems = 0;

    data.forEach((transaction) => {
      if (transaction.sold) {
        sales += transaction.price;
        soldItems += 1;
      } else {
        notSoldItems += 1;
      }
    });

    res.status(200).json({sales,soldItems,notSoldItems});
  } catch (error) {
    console.error("Error fetching Statistics:", error);
    res.status(500).json({ error: "Error fetching Statistics" });
  }
};


// Bar chart data
exports.getBarChartData = async (req, res) => {
  const { month } = req.query;

  const priceRanges = [
    { range: '0 - 100', min: 0, max: 100 },
    { range: '101 - 200', min: 101, max: 200 },
    { range: '201 - 300', min: 201, max: 300 },
    { range: '301 - 400', min: 301, max: 400 },
    { range: '401 - 500', min: 401, max: 500 },
    { range: '501 - 600', min: 501, max: 600 },
    { range: '601 - 700', min: 601, max: 700 },
    { range: '701 - 800', min: 701, max: 800 },
    { range: '801 - 900', min: 801, max: 900 },
    { range: '901 and above', min: 901, max: Infinity },
  ];

  // Convert month to a number and validate
  const monthNum = Number(month);
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return res
      .status(400)
      .json({
        error:
          "Invalid month provided. Please provide a month between 1 and 12.",
      });
  }

  try {
    // Fetch transactions for the specified month across all years
    const response = await Transaction.find({
      $expr: {
        $eq: [{ $month: "$dateOfSale" }, monthNum],
      },
    });

    const transactions = response; // Assuming the response is an array of items

    const counts = Array(priceRanges.length).fill(0);

    transactions.forEach((item) => {
      const price = item.price;
      priceRanges.forEach((range, index) => {
        if (price >= range.min && price <= range.max) {
          counts[index]++;
        }
      });
    });

    const chartData = {
      labels: priceRanges.map(range => range.range),
      datasets: [
        {
          label: 'Number of Items',
          data: counts,
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
        },
      ],
    };
    

    res.status(200).json(chartData);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Error fetching transactions" });
  }
};


// *********** Pie chart data
const getCategoryCounts = (transactions) => {
  const categoryCounts = {};
  transactions.forEach(transaction => {
      const category = transaction.category;
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });
  return categoryCounts;
};
const prepareChartData = (categoryCounts) => {
  const labels = Object.keys(categoryCounts);
  const data = Object.values(categoryCounts);

  return {
      labels: labels,
      datasets: [{
          label: 'Transaction Categories',
          data: data,
          backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40',
          ],
      }],
  };
};
exports.getPieChartData = async (req, res) => {
  const { month } = req.query;

 
  const monthNum = Number(month);
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return res
      .status(400)
      .json({
        error:
          "Invalid month provided. Please provide a month between 1 and 12.",
      });
  }

  try {
    
    const data = await Transaction.find({
      $expr: {
        $eq: [{ $month: "$dateOfSale" }, monthNum],
      },
    });

    const categoryCounts = getCategoryCounts(data);
    const preparedData = prepareChartData(categoryCounts);   

    res.status(200).json(preparedData);
  } catch (error) {
    console.error("Error fetching Pi-chart:", error);
    res.status(500).json({ error: "Error fetching Pi-chart" });
  }
};



// Combined API to fetch data from multiple sources
exports.getCombinedData = async (req, res) => {
  const { month } = req.query;

  // Convert month to a number and validate
  const monthNum = Number(month);
  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return res.status(400).json({
      error: "Invalid month provided. Please provide a month between 1 and 12.",
    });
  }

  try {
   
    const transactionsPromise = axios.get(`${process.env.URL}/list?month=${month}`);
    const statisticsPromise = axios.get(`${process.env.URL}/statistics?month=${month}`);
    const barChartDataPromise = axios.get(`${process.env.URL}/bar-chart?month=${month}`);
    const paiChartDataPromise = axios.get(`${process.env.URL}/pie-chart?month=${month}`);

 
    const [transactionsResponse, statisticsResponse, paiChartDataResponse,barChartDataResponse] = await Promise.all([
      transactionsPromise,
      statisticsPromise,
      paiChartDataPromise,
      barChartDataPromise,
    ]);

   
    const combinedData = {
      transactions: transactionsResponse.data,
      statistics: statisticsResponse.data,
      barChartData: barChartDataResponse.data,
      paiChartData: paiChartDataResponse.data,
    };

    // console.log(combinedData)

   
    res.status(200).json(combinedData);
  } catch (error) {
    console.error("Error fetching combined data:", error);
    res.status(500).json({ error: "Error fetching combined data" });
  }
};
