const areaName = document.querySelector("#areaName");
const selectTime = document.querySelector("#selectTime");
const aqiValue = document.querySelector("#aqiValue");
const airStatus = document.querySelector("#airStatus");
const airPm25 = document.querySelector("#airPm25");
const airPm10 = document.querySelector("#airPm10");
const airO3 = document.querySelector("#airO3");
const airCo = document.querySelector("#airCo");
const airSo2 = document.querySelector("#airSo2");
const airNo2 = document.querySelector("#airNo2");
const svgPath = document.querySelectorAll("svg path"); //svg地圖對所有path宣告(ALL)

let groupData = {};
let areaArr = [];
let avgAirData = {}; //儲存城市各項數據平均值

fetch(
  "https://data.moenv.gov.tw/api/v2/aqx_p_488?api_key=58f5fc65-e6f6-4c1e-a2e1-2a5a69fbaef8"
)
  .then((res) => res.json())
  .then((data) => {
    areaArr = data.records;
    console.log(areaArr);

    //reduce(累加器,當前數組元素)
    groupData = areaArr.reduce((acc, element) => {
      //宣告一個變數，該變數為所有數據的城市
      let countyName = element.county;
      //api測量時間轉成Date對象
      let measureDate = new Date(element.datacreationdate);
      //獲取年、月、日、時間去對api時間。getMonth從0開始算，所以+1。.toString()數字轉字符.padStart(2,"0")，2是期望字符長度，"0"不足2位時添加字符。
      let dateKey = `${measureDate.getFullYear()}-${(measureDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${measureDate
        .getDate()
        .toString()
        .padStart(2, "0")} ${measureDate
        .getHours()
        .toString()
        .padStart(2, "0")}:${measureDate
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
      //若累加器中沒有該城市名，則初始化累加器
      if (!acc[countyName]) {
        acc[countyName] = {}; //這邊必須初始化為obj，這樣可以確保每個縣市下有不同的時間鍵，並在這些鍵下進行數據存儲。若這邊初始化為數組(陣列)[]，就不能再進一步對不同時間進行分組。
      }

      //篩選對應城市的時間，城市內各測量站的時間分開排列
      if (!acc[countyName][dateKey]) {
        acc[countyName][dateKey] = [];
      }

      //將測量站數據加到對應縣市的數組中
      acc[countyName][dateKey].push(element);
      return acc; //必須更新累加器，供下次迭代使用
    }, {}); //初始化累加器
    console.log(groupData); //用來監控數據，拿掉無妨

    // 遍歷 groupData 中的每個縣市
    for (let countyName in groupData) {
      // 初始化存儲平均值的對象
      avgAirData[countyName] = {};

      // 遍歷每個縣市下的時間分組
      for (let dateKey in groupData[countyName]) {
        // 初始化指標的總和和計數
        let sumAQI = 0,
          countAQI = 0;
        // let sumPm25 = 0,
        //   countPm25 = 0;
        let sumPm10 = 0,
          countPm10 = 0;
        let sumO3 = 0,
          countO3 = 0;
        let sumCo = 0,
          countCo = 0;
        let sumSo2 = 0,
          countSo2 = 0;
        let sumNo2 = 0,
          countNo2 = 0;

        //每個時間分組下的數據
        for (let countyData of groupData[countyName][dateKey]) {
          // 累加各指標的值
          sumAQI += parseFloat(countyData.aqi);
          countAQI++;
          // sumPm25 += parseFloat(countyData.obj["pm2.5_avg"]);
          // countPm25++;
          sumPm10 += parseFloat(countyData.pm10);
          countPm10++;
          sumO3 += parseFloat(countyData.o3);
          countO3++;
          sumCo += parseFloat(countyData.co);
          countCo++;
          sumSo2 += parseFloat(countyData.so2);
          countSo2++;
          sumNo2 += parseFloat(countyData.no2);
          countNo2++;
        }
        // 計算平均值
        let avgAQI = Math.round(sumAQI / countAQI);
        // let avgPm25 = sumPm25 / countPm25;
        let avgPm10 = Math.round(sumPm10 / countPm10);
        let avgO3 = Math.round(sumO3 / countO3);
        let avgCo = Math.round((sumCo / countCo) * 100) / 100;
        let avgSo2 = Math.round((sumSo2 / countSo2) * 100) / 100;
        let avgNo2 = Math.round(sumNo2 / countNo2);

        // 將計算的平均值存入 avgAirData 中
        avgAirData[countyName][dateKey] = {
          avgAQI,
          // "avgPm25:": avgPm25,
          avgPm10,
          avgO3,
          avgCo,
          avgSo2,
          avgNo2,
        };
      }
    }

    //長出option
    let uniDate = new Set();
    for (let countyName in groupData) {
      for (let dateKey in groupData[countyName]) {
        uniDate.add(dateKey);
      }
    }
    uniDate.forEach((date) => {
      let option = document.createElement("option");
      option.value = date;
      option.textContent = date;
      selectTime.appendChild(option);
    });
  });

//用forEach對所有path做事件監聽
svgPath.forEach((path) => {
  path.addEventListener("click", (event) => {
    let countyName = event.target.getAttribute("data-name");
    if (countyName && avgAirData[countyName]) {
      areaName.textContent = countyName;
      let selectedTime = selectTime.value;
      updateAirData(countyName, selectedTime);
    }
  });
});
selectTime.addEventListener("change", function () {
  let countyName = areaName.textContent;
  if (countyName && avgAirData[countyName]) {
    let selectedTime = selectTime.value;
    updateAirData(countyName, selectedTime);
  }
});

function updateAirData(countyName, selectedTime) {
  let airData = avgAirData[countyName][selectedTime];
  if (airData) {
    aqiValue.innerHTML = `AQI:${airData.avgAQI}`;
    airPm10.innerHTML = `PM<sub>10</sub>:${airData.avgPm10}`;
    airO3.innerHTML = `O<sub>3</sub>:${airData.avgO3}`;
    airCo.innerHTML = `CO:${airData.avgCo}`;
    airSo2.innerHTML = `SO<sub>2</sub>:${airData.avgSo2}`;
    airNo2.innerHTML = `NO<sub>2</sub>:${airData.avgNo2}`;
  } else {
    aqiValue.textContent = "設備異常";
    airPm10.textContent = "設備異常";
    airO3.textContent = "設備異常";
    airCo.textContent = "設備異常";
    airSo2.textContent = "設備異常";
    airNo2.textContent = "設備異常";
  }
  if (`${airData.avgAQI}`<=50){
    airStatus.textContent="良好"
  }else if(`${airData.avgAQI}`>50 && `${airData.avgAQI}`<=100){
    airStatus.textContent="普通"
  }else if(`${airData.avgAQI}`>100 && `${airData.avgAQI}`<=150){
    airStatus.textContent="橘警"
  }else{
    airStatus.textContent="紅害"
  }
}

console.log(avgAirData); //監控數據
