import { addStock, getStock, deleteAllStocks } from "./db.js";

document.addEventListener("DOMContentLoaded", function () {

    const urlParams = new URLSearchParams(window.location.search);
    const ticker = urlParams.get('ticker');


    if (ticker) {
        console.log("Ticker received: ", ticker);
    }

    async function fetchStockdata(ticker) {
        try {
            const url = `https://finnhub.io/api/v1/stock/profile2?symbol=${ticker}&token=corf4r1r01qm70u12bh0corf4r1r01qm70u12bhg`;
            const response = await fetch(url);
            const data = await response.json();
            displayNerdData(data);
        } catch (error){
            console.error("Error fetching data for", ticker);
        }

    }

    async function fetchEarnings(ticker){
        try {
            const url = `https://finnhub.io/api/v1/stock/earnings?symbol=${ticker}&token=corf4r1r01qm70u12bh0corf4r1r01qm70u12bhg`;
            const response = await fetch(url);
            const data = await response.json();
            displayEarnings(data);
        }catch(err){
            console.error(err);
        }
    }

    async function fetchNews(ticker) {
        try{
            //Get api for name of stock and the news
            const url = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=2020-08-15&to=2024-05-02&token=corf4r1r01qm70u12bh0corf4r1r01qm70u12bhg`;
            const nameUrl = `https://finnhub.io/api/v1/search?q=${ticker}&token=corf4r1r01qm70u12bh0corf4r1r01qm70u12bhg`;
            //Extract data
            const nameResponse = await fetch(nameUrl);
            const nameData = await nameResponse.json();
            //Get company's first name, capitalize the first lettr
            const firstNameRaw = nameData.result[0].description.split(' ')[0];
            const companyName = firstNameRaw.charAt(0).toUpperCase() + firstNameRaw.slice(1).toLowerCase();
            const response = await fetch(url);
            const data = await response.json();
            //Filter all the news articles to find 3 articles with the companies name
            let filteredData = data.filter((news) => {
                return news.summary.toLowerCase().includes(companyName.toLowerCase());
            }).slice(0,3);
            //Checks ticker if company returns nothing
            if (filteredData.length === 0) {
                filteredData = data.filter((news) => {
                    return news.summary.toLowerCase().includes(ticker.toLowerCase());
                }).slice(0,3);
            }
            displayNews(filteredData);
        }catch(err){
            console.error(err);
        }
    }

    function displayNerdData(data) {
        const div = document.getElementById('stockDetails');
        const logo = document.getElementById('stockLogo');
        let logoImg = `<img src="${data.logo}" alt="${data.name} logo" style="width: 100px; height: auto;">`;
        let content = `<h2>Stock Data for ${data.ticker}</h2>`;
        content += `<p><strong>Exchange:</strong> ${data.exchange}</p>`;
        content += `<p><strong>Industry:</strong> ${data.finnhubIndustry}</p>`;
        content += `<p><strong>IPO Date:</strong> ${data.ipo}</p>`;
        content += `<p><strong>Market Cap:</strong> ${data.marketCapitalization.toLocaleString()} Million USD</p>`;
        content += `<p><strong>Shares Outstanding:</strong> ${data.shareOutstanding.toLocaleString()} Million Shares</p>`;
        logo.innerHTML = logoImg;
        div.innerHTML = content;
    }

    function displayNews(data) {
        const div = document.querySelector('.news');
        div.innerHTML = "<h2 style=\"color: #333333\">News</h2>";
        data.forEach((news) => {
            //Check if it image exists
            const imageHTML = news.image ? `<img src="${news.image}" class="newsImg">` : '';
            const content = `
                <div class="newsObj">
                    ${imageHTML}
                    <div class="newsText">
                        <h3 style="color: green">${news.headline}</h3>
                        <p>${news.summary}</p>
                        <p><a href="${news.url}" target="_blank">Read more...</a></p>
                    </div>
                </div>
            `;
            div.innerHTML += content;
        });
    }

    function displayEarnings(data) {
        const div = document.querySelector('.earnings');
        const mostRecentData = data[0];
        console.log(data)
        console.log(mostRecentData);
        div.innerHTML = "";
        const content = `
            <div class="report">
                <h3>Earnings Report for Q${mostRecentData.quarter} ${mostRecentData.year}</h3>
                <p><strong>Actual:</strong> ${mostRecentData.actual}</p>
                <p><strong>Estimate:</strong> ${mostRecentData.estimate}</p>
                <p><strong>Surprise:</strong> ${mostRecentData.surprise} (${mostRecentData.surprisePercent}%)</p>
            </div>
        `
        div.innerHTML += content;
    }

    function formatDate(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    async function fetchData(ticker){
        try {
            // Get current date and one month ago
            const today = new Date();
            const oneMonthAgo = new Date(today);
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

            // Format dates as YYYY-MM-DD strings
            const fromDate = formatDate(oneMonthAgo);
            const toDate = formatDate(today);

            const response = await fetch(`https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${fromDate}/${toDate}?adjusted=true&sort=asc&apiKey=tYHWJdiKKmPmS_7BRZ9Ixii0XHITWPbf`);
            if (!response.ok) {
                console.error("Failed to fetch data for:", ticker);
                return null;
            }
            const responseData = await response.json();
            return responseData.results;
        } catch (error) {
            console.error("Error fetching data for", ticker, error);
            return null;
        }
    }

    async function createChart(ticker) {
        try {
            const data = await fetchData(ticker);
            const chartData = {
                labels: [],
                datasets: [{
                    label: `${ticker} 1 Month Chart`,
                    data: [],
                    fill: false,
                    borderColor: 'rgb(0, 100, 30)',
                    tension: 0.1
                }]
            };

            for (const result of data) {
                chartData.labels.push(new Date(result.t).toLocaleDateString());
                chartData.datasets[0].data.push(result.c);
            }
            const canvas = document.getElementById('myChart');
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            new Chart(ctx, {
                type: 'line',
                data: chartData,
                options: {
                    scales: {
                        y: {
                            beginAtZero: false
                        }
                    },
                    plugins: {
                        tooltip: {
                            titleFont: {
                                color: 'black'
                            },
                            bodyFont: {
                                color: 'black'
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching chart data:', error);
        }
    }

    fetchEarnings(ticker);
    fetchStockdata(ticker);
    fetchNews(ticker);
    createChart(ticker);
    // Get all profiles
    const profiles = document.querySelectorAll("#team li");
    const btn = document.querySelector(".dropBtn");
    const side = document.querySelector(".side");
    const shadow = document.querySelector(".shadow");
    const search = document.querySelector(".search [type='text']");

    //Brings out the sidebar when the menu button is clicked
    if (btn) {
        btn.addEventListener("click", function () {
            side.classList.toggle("on");
            shadow.classList.toggle("on");
        });
    }

    //When the user clicks on any area that is not the side bar it will close the sidebar
    if (shadow) {
        shadow.addEventListener("click", function () {
            side.classList.remove("on");
            shadow.classList.remove("on");
        });
    }

    if (search) {
        search.addEventListener("keydown", async (event) => {
            if (event.key === "Enter") {
                const stock = search.value.trim();
                if (stock !== "" && stock !== "clear") {
                    await addStock(stock);
                    console.log( await getStock(stock));
                    search.value = "";
                } else if (stock === "clear") {
                    await deleteAllStocks();
                    search.value = "";
                }
            } else if (event.key === "Control") {
                const ticker = search.value.trim();
                search.value = "";
                window.location.href = `stock.html?ticker=${encodeURIComponent(ticker)}`;
            }
        });
    }
});
