const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.post('/booking', async (req, res) => {
  const { maPhong, ngayDen, ngayDi, soLuongKhach, maNguoiDung } = req.body;

  // Giả sử bạn có một hàm để lưu thông tin đặt phòng vào cơ sở dữ liệu
  try {
    const booking = await saveBookingToDatabase(maPhong, ngayDen, ngayDi, soLuongKhach, maNguoiDung);
    res.status(200).json({ message: 'Booking successful', booking });
  } catch (error) {
    console.error('Error booking:', error);
    res.status(500).json({ message: 'Booking failed', error });
  }
});

const saveBookingToDatabase = async (maPhong, ngayDen, ngayDi, soLuongKhach, maNguoiDung) => {
  // Logic để lưu thông tin đặt phòng vào cơ sở dữ liệu của bạn
  // Trả về thông tin đặt phòng đã lưu
  return {
    id: 1,
    maPhong,
    ngayDen,
    ngayDi,
    soLuongKhach,
    maNguoiDung
  };
};

app.listen(8889, function () {
  console.log('Booking server is listening at port 8889');
});
