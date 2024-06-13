//demo payment momo by "collection link"
const { urlencoded } = require('body-parser');
const express = require('express');
const app = express();
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');


const config = require('./config');

const corsOptions = {
  origin: 'https://airbnb-capstone.vercel.app',
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(urlencoded({ extended: true }));
app.use(express.static('./public'));

app.post("/payment", async (req, res) => {
  const { amount, orderInfo, redirectUrl } = req.body;

  // URL webhook mới từ Webhook.site
  const ipnUrl = 'https://webhook.site/5254fac2-369f-4f25-b13b-0ad3a1f1e5e0';

  // Kiểm tra đầu vào
  if (!amount || !orderInfo || !redirectUrl || !ipnUrl) {
      return res.status(400).json({
          statusCode: 400,
          messageError: "Dữ liệu đầu vào không hợp lệ",
          errorDetails: {
              amount: !amount ? "Yêu cầu nhập số tiền" : undefined,
              orderInfo: !orderInfo ? "Yêu cầu nhập thông tin đơn hàng" : undefined,
              redirectUrl: !redirectUrl ? "Yêu cầu nhập URL chuyển hướng" : undefined,
              ipnUrl: !ipnUrl ? "Yêu cầu nhập URL IPN" : undefined
          }
      });
  }

  const accessKey = 'F8BBA842ECF85';
  const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
  const partnerCode = 'MOMO';
  const requestType = "payWithMethod";
  const orderId = partnerCode + new Date().getTime();
  const requestId = orderId;
  const extraData = '';
  const orderGroupId = '';
  const autoCapture = true;
  const lang = 'vi';
  const expireTime = new Date(new Date().getTime() + 15 * 60 * 1000).toISOString(); // 15 phút từ thời điểm hiện tại

  console.log(expireTime)

  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
  const signature = crypto.createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

  const requestBody = JSON.stringify({
      partnerCode: partnerCode,
      partnerName: "Test",
      storeId: "MomoTestStore",
      requestId: requestId,
      amount: amount,
      orderId: orderId,
      orderInfo: orderInfo,
      redirectUrl: redirectUrl,
      ipnUrl: ipnUrl,
      lang: lang,
      requestType: requestType,
      autoCapture: autoCapture,
      extraData: extraData,
      orderGroupId: orderGroupId,
      signature: signature,
      expireTime: expireTime,
  });

  const options = {
      method: "POST",
      url: "https://test-payment.momo.vn/v2/gateway/api/create",
      headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(requestBody)
      },
      data: requestBody
  };

  console.log('Request Body:', requestBody);

  try {
      const result = await axios(options);
      console.log('Response:', result.data);
      return res.status(200).json(result.data);
  } catch (err) {
      console.error('Chi tiết lỗi:', err.response ? err.response.data : err.message);
      return res.status(500).json({
          statusCode: 500,
          messageError: "Lỗi server",
          errorDetails: err.response ? err.response.data : err.message
      });
  }
});


app.post('/callback', async (req, res) => {
  /**
    resultCode = 0: giao dịch thành công.
    resultCode = 9000: giao dịch được cấp quyền (authorization) thành công .
    resultCode <> 0: giao dịch thất bại.
   */
  console.log('callback: ');
  console.log(req.body);
  /**
   * Dựa vào kết quả này để update trạng thái đơn hàng
   * Kết quả log:
   * {
        partnerCode: 'MOMO',
        orderId: 'MOMO1712108682648',
        requestId: 'MOMO1712108682648',
        amount: 10000,
        orderInfo: 'pay with MoMo',
        orderType: 'momo_wallet',
        transId: 4014083433,
        resultCode: 0,
        message: 'Thành công.',
        payType: 'qr',
        responseTime: 1712108811069,
        extraData: '',
        signature: '10398fbe70cd3052f443da99f7c4befbf49ab0d0c6cd7dc14efffd6e09a526c0'
      }
   */

  return res.status(204).json(req.body);
});

app.post('/check-status-transaction', async (req, res) => {
  const { orderId } = req.body;

  // const signature = accessKey=$accessKey&orderId=$orderId&partnerCode=$partnerCode
  // &requestId=$requestId
  var secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
  var accessKey = 'F8BBA842ECF85';
  const rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=MOMO&requestId=${orderId}`;

  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');

  const requestBody = JSON.stringify({
    partnerCode: 'MOMO',
    requestId: orderId,
    orderId: orderId,
    signature: signature,
    lang: 'vi',
  });

  // options for axios
  const options = {
    method: 'POST',
    url: 'https://test-payment.momo.vn/v2/gateway/api/query',
    headers: {
      'Content-Type': 'application/json',
    },
    data: requestBody,
  };

  const result = await axios(options);

  return res.status(200).json(result.data);
});

app.listen(3003, () => {
  console.log('Server is running at port 3003');
});
