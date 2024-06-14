const axios = require('axios').default;
const CryptoJS = require('crypto-js');
const express = require('express');
const bodyParser = require('body-parser');
const moment = require('moment');
const cors = require('cors');

const app = express();

const config = {
  app_id: '2553',
  key1: 'PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL',
  key2: 'kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz',
  endpoint: 'https://sb-openapi.zalopay.vn/v2/create',
};

const corsOptions = {
  origin: 'https://airbnb-capstone.vercel.app',
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204
};
const corsOptionsLocal = {
  origin: 'http://localhost:3000',
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204
};


app.use(cors(corsOptions || corsOptionsLocal));
app.use(bodyParser.json());

app.post('/payment', async (req, res) => {
  const { amount, orderInfo, maPhong, ngayDen, ngayDi, soLuongKhach, maNguoiDung, redirectUrl } = req.body;

  const embed_data = {
    redirectUrl: redirectUrl,
  };

  const items = [];
  const transID = Math.floor(Math.random() * 1000000);

  const order = {
    app_id: config.app_id,
    app_trans_id: `${moment().format('YYMMDD')}_${transID}`,
    app_user: 'user123',
    app_time: Date.now(),
    item: JSON.stringify(items),
    embed_data: JSON.stringify(embed_data),
    amount,
    callback_url: 'https://your-ngrok-url/callback',
    description: orderInfo,
    bank_code: '',
  };

  const data = `${config.app_id}|${order.app_trans_id}|${order.app_user}|${order.amount}|${order.app_time}|${order.embed_data}|${order.item}`;
  order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

  try {
    const result = await axios.post(config.endpoint, null, { params: order });
    console.log(result)
    return res.status(200).json(result.data);
  } catch (error) {
    console.log(error);
    res.status(500).send('Payment creation failed');
  }
});

app.post('/callback', async (req, res) => {
  let result = {};
  try {
    let dataStr = req.body.data;
    let reqMac = req.body.mac;

    let mac = CryptoJS.HmacSHA256(dataStr, config.key2).toString();
    if (reqMac !== mac) {
      result.return_code = -1;
      result.return_message = 'mac not equal';
    } else {
      let dataJson = JSON.parse(dataStr, config.key2);

      // Gọi API đặt phòng
      try {
        const bookingResponse = await axios.post('https://your-booking-api-url/booking', {
          maPhong: dataJson['maPhong'],
          ngayDen: dataJson['ngayDen'],
          ngayDi: dataJson['ngayDi'],
          soLuongKhach: dataJson['soLuongKhach'],
          maNguoiDung: dataJson['maNguoiDung']
        });

        if (bookingResponse.status === 200) {
          result.return_code = 1;
          result.return_message = 'success';
        } else {
          result.return_code = 0;
          result.return_message = 'booking failed';
        }
      } catch (error) {
        console.error('Error booking:', error);
        result.return_code = 0;
        result.return_message = 'booking error';
      }
    }
  } catch (ex) {
    console.log('Error:', ex.message);
    result.return_code = 0;
    result.return_message = ex.message;
  }

  res.json(result);
});

app.listen(8888, function () {
  console.log('Server is listening at port 8888');
});
